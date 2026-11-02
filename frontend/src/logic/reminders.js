// Mensaje de recordatorio para mostrar arriba del panel, según cuántas tareas
// vencidas y próximas hay. (Entra SIN tests a propósito: es el Pull Request que
// demuestra que el umbral de cobertura del frontend frena el merge.)
export function buildReminder(overdueCount, upcomingCount) {
  if (overdueCount < 0 || upcomingCount < 0) {
    throw new Error('Las cantidades no pueden ser negativas')
  }
  if (overdueCount === 0 && upcomingCount === 0) {
    return 'Todo al día. ¡Bien ahí!'
  }
  if (overdueCount > 0) {
    const tareas = overdueCount === 1 ? 'tarea vencida' : 'tareas vencidas'
    return `Tenés ${overdueCount} ${tareas}. Empezá por esas.`
  }
  const tareas = upcomingCount === 1 ? 'tarea' : 'tareas'
  return `${upcomingCount} ${tareas} vencen en los próximos 30 días.`
}
