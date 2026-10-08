using HomeMaintenanceApi.Data;
using HomeMaintenanceApi.Models;
using HomeMaintenanceApi.Services;
using Moq;

namespace HomeMaintenanceApi.Tests;

public class SuggestionsProviderTests
{
    [Fact]
    public async Task PanelDeHoy_SeArmaConLosRegistrosDelRepositorioYLaFechaDelReloj()
    {
        // Arrange
        // 1) Doble del repositorio: en vez de ir a PostgreSQL, devuelve esta lista fija.
        var registros = new List<MaintenanceRecord>
        {
            new() { Category = "Plomería", Title = "Revisión de cañerías",
                    DateCompleted = new DateOnly(2025, 9, 1), RecommendedIntervalMonths = 12 }
        };
        var repositorio = new Mock<IMaintenanceRecordRepository>();
        repositorio.Setup(r => r.GetAllAsync()).ReturnsAsync(registros);

        // 2) Doble del reloj: "hoy" es siempre el 1/10/2026, corra el test el día que corra.
        var reloj = new Mock<TimeProvider>();
        reloj.Setup(c => c.GetUtcNow())
             .Returns(new DateTimeOffset(2026, 10, 1, 12, 0, 0, TimeSpan.Zero));

        var provider = new SuggestionsProvider(repositorio.Object, reloj.Object);

        // Act
        var resultado = await provider.GetCurrentAsync();

        // Assert
        // Sobre el RESULTADO: el panel se calculó con esos registros y esa fecha.
        var sugerencia = Assert.Single(resultado);
        Assert.Equal("Vencido", sugerencia.Status);
        Assert.Equal(-30, sugerencia.DaysUntilDue);

        // Sobre la INTERACCIÓN: el provider le pidió los registros al repositorio una sola vez.
        repositorio.Verify(r => r.GetAllAsync(), Times.Once);
    }
}
