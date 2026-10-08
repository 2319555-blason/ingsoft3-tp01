using HomeMaintenanceApi.Data;
using HomeMaintenanceApi.Dtos;

namespace HomeMaintenanceApi.Services;

// Arma el panel "de hoy": trae los registros y le pregunta la fecha al reloj.
// Antes esto vivía adentro del endpoint de Program.cs, pegado a AppDbContext y a DateTime.UtcNow:
// no había forma de testearlo sin una base real y sin depender del día en que corre el test.
// Ahora las dos dependencias entran por el constructor, y un test puede pasarle dobles.
public class SuggestionsProvider
{
    private readonly IMaintenanceRecordRepository _repository;
    private readonly TimeProvider _clock;

    public SuggestionsProvider(IMaintenanceRecordRepository repository, TimeProvider clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<List<MaintenanceSuggestionDto>> GetCurrentAsync()
    {
        var records = await _repository.GetAllAsync();
        var today = DateOnly.FromDateTime(_clock.GetUtcNow().UtcDateTime);
        return SuggestionService.BuildSuggestions(records, today);
    }
}
