import { describe, it, expect, vi } from 'vitest'
import { formatDaysLabel, splitByStatus, loadSuggestions } from './suggestions.js'

const vencida = { category: 'Plomería', title: 'Cañerías', daysUntilDue: -5, status: 'Vencido' }
const proxima = { category: 'Techo', title: 'Canaletas', daysUntilDue: 10, status: 'Próximo' }

describe('formatDaysLabel', () => {
  // Parametrizado: la misma regla (qué texto ve el usuario) con varios datos, incluidos los bordes.
  it.each([
    [-5, 'Venció hace 5 días'],
    [-1, 'Venció hace 1 día'],    // singular
    [0, 'Vence hoy'],             // el borde: ni "vencido" ni "en 0 días"
    [1, 'Vence en 1 día'],        // singular
    [10, 'Vence en 10 días']
  ])('con %i días muestra "%s"', (dias, esperado) => {
    // Act + Assert (no hay nada que preparar: el dato es el parámetro)
    expect(formatDaysLabel(dias)).toBe(esperado)
  })
})

describe('splitByStatus', () => {
  it('separa las vencidas de las próximas', () => {
    // Arrange: mezcladas a propósito
    const sugerencias = [proxima, vencida]

    // Act
    const { overdue, upcoming } = splitByStatus(sugerencias)

    // Assert
    expect(overdue).toEqual([vencida])
    expect(upcoming).toEqual([proxima])
  })
})

describe('loadSuggestions', () => {
  it('pide las sugerencias a la API una vez y las devuelve agrupadas (con mock)', async () => {
    // Arrange: un doble del cliente de la API. No sale a la red: devuelve esto.
    const apiFalsa = { getSuggestions: vi.fn().mockResolvedValue([vencida, proxima]) }

    // Act
    const resultado = await loadSuggestions(apiFalsa)

    // Assert sobre el resultado...
    expect(resultado.overdue).toEqual([vencida])
    expect(resultado.upcoming).toEqual([proxima])
    // ...y sobre la interacción con el doble
    expect(apiFalsa.getSuggestions).toHaveBeenCalledTimes(1)
  })

  it('si la API falla, el error llega a quien llamó (caso de error)', async () => {
    // Arrange: el doble simula un 500 del backend
    const apiFalsa = { getSuggestions: vi.fn().mockRejectedValue(new Error('Error 500: caído')) }

    // Act + Assert
    await expect(loadSuggestions(apiFalsa)).rejects.toThrow('Error 500')
  })

  it('si la API responde algo que no es una lista, lo rechaza (caso de error)', async () => {
    // Arrange: respuesta rota (por ejemplo, el backend devolvió null)
    const apiFalsa = { getSuggestions: vi.fn().mockResolvedValue(null) }

    // Act + Assert
    await expect(loadSuggestions(apiFalsa)).rejects.toThrow('Respuesta inválida')
  })
})
