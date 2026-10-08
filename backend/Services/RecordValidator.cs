using HomeMaintenanceApi.Dtos;

namespace HomeMaintenanceApi.Services;

// Reglas que tiene que cumplir un registro antes de guardarse.
// Antes del TP5 la API aceptaba cualquier cosa: un intervalo de 0 o -5 meses rompía el cálculo
// del panel (una tarea "vencida para siempre"), y un título vacío dejaba una tarjeta sin nombre.
// Devuelve la lista de errores: vacía = el registro es válido.
public static class RecordValidator
{
    public const int IntervaloMinimoMeses = 1;
    public const int IntervaloMaximoMeses = 120; // 10 años: más que eso no es mantenimiento periódico

    public static List<string> Validate(RecordUpsertDto dto, DateOnly today)
    {
        var errores = new List<string>();

        if (string.IsNullOrWhiteSpace(dto.Category))
            errores.Add("La categoría es obligatoria.");

        if (string.IsNullOrWhiteSpace(dto.Title))
            errores.Add("El título es obligatorio.");

        if (dto.RecommendedIntervalMonths < IntervaloMinimoMeses || dto.RecommendedIntervalMonths > IntervaloMaximoMeses)
            errores.Add($"El intervalo tiene que estar entre {IntervaloMinimoMeses} y {IntervaloMaximoMeses} meses.");

        if (dto.DateCompleted > today)
            errores.Add("La fecha de realización no puede ser futura.");

        return errores;
    }
}
