using HomeMaintenanceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeMaintenanceApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MaintenanceRecord>(entity =>
        {
            entity.Property(r => r.Category).HasMaxLength(100).IsRequired();
            entity.Property(r => r.Title).HasMaxLength(200).IsRequired();
            entity.Property(r => r.Notes).HasMaxLength(1000);
        });
    }
}
