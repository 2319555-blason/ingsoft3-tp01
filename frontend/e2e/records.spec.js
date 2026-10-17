import { expect, test } from '@playwright/test'

// E2E: un navegador de verdad usando el front de QA (E2E_BASE_URL), que a su vez le habla
// a la API y a la base de QA. Nada de mocks: si el navegador no le pega a la API, no es e2e.

const hoy = () => new Date().toISOString().slice(0, 10)

// Llena el formulario "Nuevo registro" como lo haría una persona: buscando cada campo por su etiqueta.
async function cargar (page, titulo, { fecha = hoy(), meses = '12' } = {}) {
  await page.goto('/records/new')
  await page.getByLabel('Tarea', { exact: true }).fill(titulo)
  await page.getByLabel('Fecha realizada').fill(fecha)
  await page.getByLabel('Repetir cada (meses)').fill(meses)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
}

// Borra desde la lista, como el usuario (el botón pide confirmación: la aceptamos).
async function borrarDesdeLaLista (page, titulo) {
  await page.goto('/records')
  page.once('dialog', d => d.accept())
  await page.getByRole('button', { name: `Borrar ${titulo}` }).click()
  await expect(page.getByRole('cell', { name: titulo, exact: true })).toHaveCount(0)   // el borrado, comprobado
}

test('crear un registro lo muestra en la lista, y borrarlo lo saca', async ({ page }) => {
  const titulo = `e2e ${Date.now()}`                      // único: no choca con otra corrida
  await cargar(page, titulo)

  await expect(page).toHaveURL(/\/records$/)                // volvió a la lista
  await expect(page.getByRole('cell', { name: titulo, exact: true })).toBeVisible()   // el dato que ESTE test creó

  await borrarDesdeLaLista(page, titulo)
})

test('un intervalo fuera de rango muestra el error y no crea nada', async ({ page }) => {
  const titulo = `e2e invalido ${Date.now()}`
  await cargar(page, titulo, { meses: '200' })              // el máximo es 120: la API lo rechaza

  await expect(page.getByRole('alert')).toContainText('entre 1 y 120')   // el usuario ve el error...

  await page.goto('/records')
  await expect(page.getByRole('heading', { name: 'Registros de mantenimiento' })).toBeVisible()
  await expect(page.getByRole('cell', { name: titulo, exact: true })).toHaveCount(0)  // ...y no se creó nada
})

// El flujo de todos los días: abrir la app y ver en el PANEL lo que está vencido.
test('una tarea hecha hace 13 meses aparece como vencida en el panel', async ({ page }) => {
  const titulo = `e2e vencida ${Date.now()}`
  const fecha = new Date()
  fecha.setUTCMonth(fecha.getUTCMonth() - 13)
  await cargar(page, titulo, { fecha: fecha.toISOString().slice(0, 10), meses: '12' })
  await expect(page).toHaveURL(/\/records$/)

  await page.goto('/')
  const tarjeta = page.locator('article', { hasText: titulo })
  await expect(tarjeta).toBeVisible()
  await expect(tarjeta).toContainText('Venció hace')       // la tarjeta dice que está vencida

  await borrarDesdeLaLista(page, titulo)
  await page.goto('/')
  await expect(page.locator('article', { hasText: titulo })).toHaveCount(0)
})
