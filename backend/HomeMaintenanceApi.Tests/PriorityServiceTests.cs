using HomeMaintenanceApi.Services;

namespace HomeMaintenanceApi.Tests;

// Agregado DESPUÉS de que el pipeline frenara el PR: PriorityService había entrado sin tests
// y la cobertura del backend cayó por debajo del umbral de 90%.
public class PriorityServiceTests
{
    // Un dato a cada lado de cada límite: así, si alguien corre un borde (< por <=), algo se pone rojo.
    [Theory]
    [InlineData(-31, "Urgente")]  // vencida hace más de un mes
    [InlineData(-30, "Alta")]     // borde: justo un mes, todavía no es urgente
    [InlineData(-1,  "Alta")]     // venció ayer
    [InlineData(0,   "Media")]    // borde: vence hoy, todavía no venció
    [InlineData(7,   "Media")]    // borde: último día de "esta semana"
    [InlineData(8,   "Baja")]     // primer día fuera de la semana
    public void Prioridad_DependeDeLosDiasQueFaltan(int diasQueFaltan, string prioridadEsperada)
    {
        // Act
        var prioridad = PriorityService.GetPriority(diasQueFaltan);

        // Assert
        Assert.Equal(prioridadEsperada, prioridad);
    }
}
