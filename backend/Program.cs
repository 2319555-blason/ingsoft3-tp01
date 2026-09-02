using NoExiste;
using HomeMaintenanceApi.Data;
using HomeMaintenanceApi.Dtos;
using HomeMaintenanceApi.Models;
using HomeMaintenanceApi.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// La connection string se lee de configuración. En local (appsettings.Development.json)
// apunta a localhost; en Docker se pisa con la variable de entorno ConnectionStrings__Default
// (ver docker-compose.yml del TP2).
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Falta ConnectionStrings:Default en la configuración.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Crea las tablas si no existen. Simple y suficiente para este TP (sin migraciones).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// ---- CRUD de registros ----

app.MapGet("/api/records", async (AppDbContext db) =>
    await db.MaintenanceRecords
        .OrderByDescending(r => r.DateCompleted)
        .ToListAsync());

app.MapGet("/api/records/{id:int}", async (int id, AppDbContext db) =>
    await db.MaintenanceRecords.FindAsync(id) is { } record
        ? Results.Ok(record)
        : Results.NotFound());

app.MapPost("/api/records", async (RecordUpsertDto dto, AppDbContext db) =>
{
    var record = new MaintenanceRecord
    {
        Category = dto.Category,
        Title = dto.Title,
        Notes = dto.Notes,
        DateCompleted = dto.DateCompleted,
        RecommendedIntervalMonths = dto.RecommendedIntervalMonths
    };

    db.MaintenanceRecords.Add(record);
    await db.SaveChangesAsync();

    return Results.Created($"/api/records/{record.Id}", record);
});

app.MapPut("/api/records/{id:int}", async (int id, RecordUpsertDto dto, AppDbContext db) =>
{
    var record = await db.MaintenanceRecords.FindAsync(id);
    if (record is null) return Results.NotFound();

    record.Category = dto.Category;
    record.Title = dto.Title;
    record.Notes = dto.Notes;
    record.DateCompleted = dto.DateCompleted;
    record.RecommendedIntervalMonths = dto.RecommendedIntervalMonths;

    await db.SaveChangesAsync();
    return Results.Ok(record);
});

app.MapDelete("/api/records/{id:int}", async (int id, AppDbContext db) =>
{
    var record = await db.MaintenanceRecords.FindAsync(id);
    if (record is null) return Results.NotFound();

    db.MaintenanceRecords.Remove(record);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---- Sugerencias ----

app.MapGet("/api/suggestions", async (AppDbContext db) =>
{
    var records = await db.MaintenanceRecords.ToListAsync();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    return Results.Ok(SuggestionService.BuildSuggestions(records, today));
});

app.Run();
