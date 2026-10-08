using HomeMaintenanceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeMaintenanceApi.Data;

// La implementación real del contrato: lee de PostgreSQL con Entity Framework.
// Es la que usa la app; los tests usan un doble en su lugar.
public class EfMaintenanceRecordRepository : IMaintenanceRecordRepository
{
    private readonly AppDbContext _db;

    public EfMaintenanceRecordRepository(AppDbContext db) => _db = db;

    public Task<List<MaintenanceRecord>> GetAllAsync() => _db.MaintenanceRecords.ToListAsync();
}
