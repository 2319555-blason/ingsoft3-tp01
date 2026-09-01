using HomeMaintenanceApi.Data;
using HomeMaintenanceApi.Dtos;
using HomeMaintenanceApi.Models;

namespace HomeMaintenanceApi.Services;

// Analiza el historial de registros y arma la lista de "mantenimiento pendiente o próximo".
// Regla simple, sin IA: para cada (Categoria, Titulo) toma el registro más reciente y calcula
// cuándo vuelve a tocar según el intervalo que el usuario cargó. Si esa fecha ya pasó -> "Vencido".
// Si falta 30 días o menos -> "Próximo". El resto no se muestra: está al día.
public static class SuggestionService
{
    private const int DiasVentanaProximo = 30;

    public static List<MaintenanceSuggestionDto> BuildSuggestions(IEnumerable<MaintenanceRecord> records, DateOnly today)
    {
        var suggestions = new List<MaintenanceSuggestionDto>();

        var lastByTask = records
            .GroupBy(r => (r.Category, r.Title))
            .Select(g => g.OrderByDescending(r => r.DateCompleted).First());

        foreach (var record in lastByTask)
        {
            var nextDue = record.DateCompleted.AddMonths(record.RecommendedIntervalMonths);
            var daysUntilDue = nextDue.DayNumber - today.DayNumber;

            if (daysUntilDue > DiasVentanaProximo)
                continue; // todavía está al día, no se muestra

            var status = daysUntilDue < 0 ? "Vencido" : "Próximo";

            suggestions.Add(new MaintenanceSuggestionDto(
                record.Category,
                record.Title,
                record.DateCompleted,
                nextDue,
                daysUntilDue,
                status
            ));
        }

        return suggestions
            .OrderBy(s => s.DaysUntilDue)
            .ToList();
    }
}
