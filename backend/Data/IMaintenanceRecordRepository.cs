using HomeMaintenanceApi.Models;

namespace HomeMaintenanceApi.Data;

// El "contrato" para leer registros. Quien lo usa no sabe (ni le importa) si atrás hay
// PostgreSQL, una lista en memoria o un doble de test: por eso se puede reemplazar en los tests.
public interface IMaintenanceRecordRepository
{
    Task<List<MaintenanceRecord>> GetAllAsync();
}
