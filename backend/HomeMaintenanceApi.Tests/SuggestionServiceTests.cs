using HomeMaintenanceApi.Models;
using HomeMaintenanceApi.Services;

namespace HomeMaintenanceApi.Tests;

public class SuggestionServiceTests
{
    // Fecha fija: el test da el mismo resultado hoy y dentro de un año.
    private static readonly DateOnly Hoy = new(2026, 10, 1);

    // Hecho hace 12 meses (corrido N días), con intervalo de 12 → vence exactamente en "Hoy + N días"
    private static MaintenanceRecord RegistroQueVenceEn(int dias, string titulo = "Revisión de cañerías") =>
        new()
        {
            Category = "Plomería",
            Title = titulo,
            DateCompleted = Hoy.AddMonths(-12).AddDays(dias),
            RecommendedIntervalMonths = 12
        };

    // ── Regla 1: si la fecha ya pasó, la tarea está vencida ──────────────────
    [Fact]
    public void TareaCuyaFechaYaPaso_QuedaVencida()
    {
        // Arrange: una tarea hecha hace 13 meses, que se repite cada 12
        var registros = new List<MaintenanceRecord>
        {
            new() { Category = "Plomería", Title = "Revisión de cañerías",
                    DateCompleted = new DateOnly(2025, 9, 1), RecommendedIntervalMonths = 12 }
        };

        // Act
        var resultado = SuggestionService.BuildSuggestions(registros, Hoy);

        // Assert
        var sugerencia = Assert.Single(resultado);
        Assert.Equal("Vencido", sugerencia.Status);
        Assert.Equal(new DateOnly(2026, 9, 1), sugerencia.NextDue);
        Assert.Equal(-30, sugerencia.DaysUntilDue);
    }

    // ── Regla 2: el estado depende de los días que faltan (con sus bordes) ──
    [Theory]
    [InlineData(-1, "Vencido")]   // venció ayer
    [InlineData(0,  "Próximo")]   // vence HOY: todavía no se pasó → borde de "< 0"
    [InlineData(30, "Próximo")]   // último día de la ventana → borde de "> 30"
    public void EstadoDeLaTarea_DependeDeLosDiasQueFaltan(int diasQueFaltan, string estadoEsperado)
    {
        // Arrange
        var registros = new List<MaintenanceRecord> { RegistroQueVenceEn(diasQueFaltan) };

        // Act
        var resultado = SuggestionService.BuildSuggestions(registros, Hoy);

        // Assert
        var sugerencia = Assert.Single(resultado);
        Assert.Equal(estadoEsperado, sugerencia.Status);
        Assert.Equal(diasQueFaltan, sugerencia.DaysUntilDue);
    }

    // ── Regla 3: si falta más de 30 días, está al día y no se muestra ───────
    [Fact]
    public void TareaQueVenceEn31Dias_NoApareceEnElPanel()
    {
        // Arrange: un día después de la ventana
        var registros = new List<MaintenanceRecord> { RegistroQueVenceEn(31) };

        // Act
        var resultado = SuggestionService.BuildSuggestions(registros, Hoy);

        // Assert
        Assert.Empty(resultado);
    }

    // ── Regla 4: de cada tarea cuenta sólo el registro más reciente ──────────
    [Fact]
    public void TareaRepetida_SeCalculaDesdeElRegistroMasReciente()
    {
        // Arrange: la misma tarea hecha dos veces. La vieja, sola, daría "Vencido".
        var viejo = new MaintenanceRecord
        {
            Category = "Plomería", Title = "Revisión de cañerías",
            DateCompleted = new DateOnly(2024, 1, 15), RecommendedIntervalMonths = 12
        };
        var reciente = RegistroQueVenceEn(10);
        var registros = new List<MaintenanceRecord> { viejo, reciente };

        // Act
        var resultado = SuggestionService.BuildSuggestions(registros, Hoy);

        // Assert: una sola sugerencia, calculada desde el registro nuevo
        var sugerencia = Assert.Single(resultado);
        Assert.Equal(reciente.DateCompleted, sugerencia.LastDone);
        Assert.Equal("Próximo", sugerencia.Status);
        Assert.Equal(10, sugerencia.DaysUntilDue);
    }

    // ── Regla 5: el panel sale ordenado por urgencia ─────────────────────────
    [Fact]
    public void Sugerencias_SalenOrdenadasDeLaMasUrgenteALaMenos()
    {
        // Arrange: tres tareas distintas, cargadas desordenadas a propósito
        var registros = new List<MaintenanceRecord>
        {
            RegistroQueVenceEn(20, "Limpiar filtros"),
            RegistroQueVenceEn(-5, "Revisar termotanque"),
            RegistroQueVenceEn(3,  "Revisión de cañerías")
        };

        // Act
        var resultado = SuggestionService.BuildSuggestions(registros, Hoy);

        // Assert
        Assert.Equal(new[] { -5, 3, 20 }, resultado.Select(s => s.DaysUntilDue));
    }

    // ── Borde: sin historial, el panel queda vacío (y no explota) ────────────
    [Fact]
    public void SinRegistros_NoHaySugerencias()
    {
        // Act
        var resultado = SuggestionService.BuildSuggestions(new List<MaintenanceRecord>(), Hoy);

        // Assert
        Assert.Empty(resultado);
    }
}