namespace HomeMaintenanceApi.Services;

// Prioridad de una tarea del panel según cuántos días faltan para que venza
// (negativo = ya venció). Sirve para ordenar o resaltar tarjetas en el panel.
public static class PriorityService
{
    public static string GetPriority(int daysUntilDue)
    {
        if (daysUntilDue < -30)
            return "Urgente";   // vencida hace más de un mes

        if (daysUntilDue < 0)
            return "Alta";      // vencida

        if (daysUntilDue <= 7)
            return "Media";     // vence esta semana

        return "Baja";          // falta más de una semana
    }
}
