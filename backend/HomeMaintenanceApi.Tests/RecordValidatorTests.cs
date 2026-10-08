using HomeMaintenanceApi.Dtos;
using HomeMaintenanceApi.Services;

namespace HomeMaintenanceApi.Tests;

public class RecordValidatorTests
{
    private static readonly DateOnly Hoy = new(2026, 10, 1);

    // Un registro válido de base: cada test cambia SÓLO el campo que quiere probar.
    private static RecordUpsertDto RegistroValido() =>
        new("Plomería", "Revisión de cañerías", null, Hoy, 12);

    // ── Camino feliz, en los bordes de lo permitido ──────────────────────────
    [Theory]
    [InlineData(1)]     // el mínimo permitido
    [InlineData(120)]   // el máximo permitido
    public void IntervaloEnElLimitePermitido_EsAceptado(int meses)
    {
        // Arrange
        var dto = RegistroValido() with { RecommendedIntervalMonths = meses };

        // Act
        var errores = RecordValidator.Validate(dto, Hoy);

        // Assert
        Assert.Empty(errores);
    }

    // ── Caso de error: intervalo fuera de rango ──────────────────────────────
    [Theory]
    [InlineData(0)]     // justo debajo del mínimo
    [InlineData(-5)]    // negativo
    [InlineData(121)]   // justo arriba del máximo
    public void IntervaloFueraDeRango_EsRechazado(int meses)
    {
        // Arrange
        var dto = RegistroValido() with { RecommendedIntervalMonths = meses };

        // Act
        var errores = RecordValidator.Validate(dto, Hoy);

        // Assert
        var error = Assert.Single(errores);
        Assert.Contains("intervalo", error);
    }

    // ── Caso de error: título sin contenido ──────────────────────────────────
    [Theory]
    [InlineData("")]
    [InlineData("   ")]   // sólo espacios también cuenta como vacío
    public void TituloSinContenido_EsRechazado(string titulo)
    {
        // Arrange
        var dto = RegistroValido() with { Title = titulo };

        // Act
        var errores = RecordValidator.Validate(dto, Hoy);

        // Assert
        var error = Assert.Single(errores);
        Assert.Contains("título", error);
    }

    // ── Caso de error: fecha futura (y su borde: hoy sí vale) ───────────────
    [Fact]
    public void FechaDeMañana_EsRechazada_PeroLaDeHoyNo()
    {
        // Arrange
        var deHoy = RegistroValido() with { DateCompleted = Hoy };
        var deMañana = RegistroValido() with { DateCompleted = Hoy.AddDays(1) };

        // Act
        var erroresHoy = RecordValidator.Validate(deHoy, Hoy);
        var erroresMañana = RecordValidator.Validate(deMañana, Hoy);

        // Assert
        Assert.Empty(erroresHoy);
        var error = Assert.Single(erroresMañana);
        Assert.Contains("futura", error);
    }
}
