namespace HomeMaintenanceApi.Models;

// Un registro de mantenimiento del hogar ya realizado.
// Ej: Category="Plomería", Title="Revisión de cañerías", DateCompleted=2025-03-10, RecommendedIntervalMonths=12
public class MaintenanceRecord
{
    public int Id { get; set; }

    public required string Category { get; set; }

    public required string Title { get; set; }

    public string? Notes { get; set; }

    public DateOnly DateCompleted { get; set; }

    // Cada cuántos meses se recomienda repetir esta tarea (lo carga el usuario al crear el registro)
    public int RecommendedIntervalMonths { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
