---
name: smoke
description: Smoke test real del dashboard — levanta el backend FastAPI (y opcionalmente Vite), consulta los endpoints de los 3 modos (campaña completa, comparar 2 días, comparar campañas) para una campaña y rango, y compara los números contra los esperados en la spec. Usar para validar criterios de finalización con datos reales, después de una ingesta, o cuando el usuario pida probar la API/app.
argument-hint: "[campaña] [desde] [hasta]"
---

# Smoke real

Los criterios de finalización de las specs piden valores concretos con datos reales (p. ej. «peor hora 16h 4.91%, 120 de 2446»). Esta skill los obtiene de la API corriendo.

Rutas relativas a la raíz del proyecto; en PowerShell usar `.\.venv\Scripts\python.exe`.

## 1. Parámetros

- De `$ARGUMENTS` o de la spec activa («Datos de entrada» / «Criterios de Finalización»).
- Defaults del dashboard: campaña `35`, rango `2026-09-01 → 2026-09-15`, `min_calls` 50; días A/B `2026-09-01` / `2026-09-02`; campaña B `38`.
- Campañas cargadas: ver `.claude/skills/ingesta/scripts/db_summary.py` si hay dudas.

## 2. Backend

1. ¿Ya está corriendo? `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs` (o `Invoke-WebRequest`). Si responde 200, usarlo y **no** detenerlo al final.
2. Si no, levantarlo en background y anotar que lo levantó esta skill:
   ```bash
   .venv/Scripts/python -m uvicorn main_api:app --app-dir backend --port 8000
   ```
   (con `run_in_background`, o `Start-Process … -PassThru` en PowerShell para guardar el PID). Esperar a que `/docs` responda 200.
3. Solo si hace falta validar el proxy de la UI: `npm run dev` en `frontend/` (puerto 5173) en background.

## 3. Ejecutar

```bash
.venv/Scripts/python .claude/skills/smoke/scripts/smoke.py --campaign 35 --start 2026-09-01 --end 2026-09-15 \
    [--date-a 2026-09-01 --date-b 2026-09-02] [--campaign-b 38] [--min-calls 50] [--proxy-url http://localhost:5173]
```

Imprime, por modo:
- **Campaña completa**: summary (llamadas, agentes, AA), daily/hourly/devices con mejor y peor segmento (≥ 50 intentos, mismo criterio que `buildBest*`/`buildWorst*` del front), diagnostics (congestión, burn, pico), recomendaciones (tipo, entidad, excluidos AMD), rankings de bases/dispositivos/horas y cantidad de alertas de patrones.
- **Comparar 2 días** (`--date-a/--date-b`): AA A → B, delta relativo, causas/positivos, recomendaciones.
- **Comparar campañas** (`--campaign-b`): AA A vs B, gateways/bases comunes, causas/positivos, recomendaciones.
- **Proxy** (`--proxy-url`): que Vite devuelva lo mismo que el backend.

Exit 1 si algún endpoint falla.

## 4. Comparar y reportar

Tabla **esperado (spec) vs obtenido** para cada valor que la spec menciona. Diferencias → reportarlas tal cual; no «ajustar» la spec ni el código para que coincidan sin consultarlo.

Limitaciones: el script valida la API, no el render. Lo que depende solo del front (cantidad de tarjetas, textos, CSV) se valida con los tests de vitest; si el usuario quiere verlo en pantalla, usar la skill `run` o `claude-in-chrome` con Vite levantado.

## 5. Limpieza

Detener **solo** los procesos que levantó esta skill (uvicorn / vite). No tocar la DB ni `/data`.
