import { expect, test } from '@playwright/test'

// INTEGRACIÓN: le hablamos directo a la API de QA, con su base Postgres de verdad atrás.
// Sin navegador y sin dobles. La dirección es la de la API, no la del front. Sin barra final.
const API = process.env.API_BASE_URL || 'http://localhost:5080'

const hoy = () => new Date().toISOString().slice(0, 10)

// Pide la lista de registros a la API (o sea, a la base) y la devuelve ya convertida.
async function listar (request) {
  const r = await request.get(`${API}/api/records`)
  expect(r.status()).toBe(200)
  return await r.json()
}

function registro (title, extra = {}) {
  return { category: 'Otro', title, notes: null, dateCompleted: hoy(), recommendedIntervalMonths: 12, ...extra }
}

test('el alta se guarda en la base, y el borrado la saca', async ({ request }) => {
  const titulo = `api ${Date.now()}`                       // único: no choca con otra corrida

  const alta = await request.post(`${API}/api/records`, { data: registro(titulo) })
  expect(alta.status()).toBe(201)                          // la API dice "creado"
  const creado = await alta.json()

  expect((await listar(request)).some(r => r.title === titulo)).toBe(true)   // y la BASE lo devuelve

  const borrado = await request.delete(`${API}/api/records/${creado.id}`)
  expect(borrado.status()).toBe(204)                       // "borrado, no hay nada que devolver"

  expect((await listar(request)).some(r => r.title === titulo)).toBe(false)  // y el borrado, comprobado
})

test('un título vacío lo rechaza la API con 400, y no crea nada', async ({ request }) => {
  const antes = await listar(request)

  const alta = await request.post(`${API}/api/records`, { data: registro('') })
  expect(alta.status()).toBe(400)                          // el contrato del error
  const cuerpo = await alta.json()
  expect(cuerpo.errores).toContain('El título es obligatorio.')

  const despues = await listar(request)
  expect(despues.length).toBe(antes.length)                // y de verdad no se creó nada
})

// La tercera, elegida por mí: lo que el usuario usa TODOS los días es el PANEL.
// Una tarea hecha hace 13 meses con intervalo de 12 tiene que aparecer como "Vencido".
// Si esto se rompe, la app pierde su razón de ser: nadie se entera de lo que tiene vencido.
test('una tarea vencida aparece en el panel de sugerencias, y al borrarla desaparece', async ({ request }) => {
  const titulo = `api vencida ${Date.now()}`
  const fecha = new Date()
  fecha.setUTCMonth(fecha.getUTCMonth() - 13)

  const alta = await request.post(`${API}/api/records`, {
    data: registro(titulo, { dateCompleted: fecha.toISOString().slice(0, 10) })
  })
  expect(alta.status()).toBe(201)
  const creado = await alta.json()

  const sug = await request.get(`${API}/api/suggestions`)
  expect(sug.status()).toBe(200)
  const encontrada = (await sug.json()).find(s => s.title === titulo)
  expect(encontrada?.status).toBe('Vencido')               // la regla del panel, calculada con datos de la base

  expect((await request.delete(`${API}/api/records/${creado.id}`)).status()).toBe(204)
  const despues = await (await request.get(`${API}/api/suggestions`)).json()
  expect(despues.some(s => s.title === titulo)).toBe(false)
})
