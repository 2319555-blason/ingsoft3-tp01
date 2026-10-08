using System.Diagnostics.CodeAnalysis;
namespace HomeMaintenanceApi.Dtos;

// Lo que el cliente manda para crear o editar un registro
// Excluido de la cobertura: DTO, sólo datos.
[ExcludeFromCodeCoverage]
public record RecordUpsertDto(
    string Category,
    string Title,
    string? Notes,
    DateOnly DateCompleted,
    int RecommendedIntervalMonths
);

// Lo que devuelve /api/suggestions: una tarea pendiente o próxima a vencer
// Excluido de la cobertura: DTO, sólo datos.
[ExcludeFromCodeCoverage]
public record MaintenanceSuggestionDto(
    string Category,
    string Title,
    DateOnly LastDone,
    DateOnly NextDue,
    int DaysUntilDue,
    string Status // "Vencido" | "Próximo"
);
