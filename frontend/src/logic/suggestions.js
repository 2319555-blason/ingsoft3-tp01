// Lógica del panel, separada del componente React para poder testearla sin navegador (sin DOM).
// Dashboard.jsx sólo dibuja: los cálculos viven acá.

// Texto que se muestra en cada tarjeta según los días que faltan.
// Antes del TP5 esto estaba dentro de SuggestionCard y tenía dos bugs visibles:
// "Vence en 0 días" para una tarea que vence hoy, y "Vencido hace 1 días" (plural con 1).
export function formatDaysLabel(daysUntilDue) {
  if (daysUntilDue === 0) return 'Vence hoy'
  const n = Math.abs(daysUntilDue)
  const dias = n === 1 ? 'día' : 'días'
  return daysUntilDue < 0 ? `Venció hace ${n} ${dias}` : `Vence en ${n} ${dias}`
}

// Separa las sugerencias en los dos grupos que muestra el panel.
export function splitByStatus(suggestions) {
  return {
    overdue: suggestions.filter((s) => s.status === 'Vencido'),
    upcoming: suggestions.filter((s) => s.status === 'Próximo')
  }
}

// Pide las sugerencias a la API y las agrupa.
// El cliente de la API entra como PARÁMETRO: en la app es el real (api/client.js),
// en los tests es un doble que no sale a la red.
export async function loadSuggestions(apiClient) {
  const suggestions = await apiClient.getSuggestions()
  if (!Array.isArray(suggestions)) {
    throw new Error('Respuesta inválida del servidor')
  }
  return splitByStatus(suggestions)
}
