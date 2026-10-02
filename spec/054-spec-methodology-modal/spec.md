# Spec 054: Modal «¿Cómo se calcula?»

## Usuario

Agustin y quienes lean el dashboard. Hoy no hay forma de saber, desde la app, de dónde sale cada número:
*   qué cuenta como «agente» o «contestador»;
*   cómo se calcula el health score y qué significa «Aceptable»;
*   cuándo un diagnóstico es crítico;
*   por qué una troncal es «confiable»;
*   qué hace falta para ser el «mejor dispositivo».

Esas reglas están repartidas entre `backend/config.py`, `frontend/src/lib/rangeThresholds.ts` y 50 specs. Pedido del usuario (2026-10-02): un botón que abra un modal con toda esa información.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — fuente única de los valores]:** ningún umbral del modal se escribe a mano.
    *   `GET /api/methodology` devuelve los valores de `backend/config.py` agrupados así: `segments`, `health`, `diagnostics`, `range_diagnostics`, `recommendations`, `patterns` y `routing`.
    *   El modal usa ese endpoint para los valores del backend e importa los del frontend desde `rangeThresholds.ts` y `healthStyle.ts`.
    *   Los cortes de las etiquetas del health score pasan a constantes: `HEALTH_HEALTHY_MIN = 0` y `HEALTH_ACCEPTABLE_MIN = -25`.
    *   *Por qué:* los umbrales cambian (Specs 050 y 053), y un texto fijo quedaría desactualizado sin que nadie lo note.
*   **RF2 [UI — botón]:**
    *   Botón «¿Cómo se calcula?» (ícono `BookOpen`) en el encabezado, al lado del selector de tema, visible en todos los modos.
    *   No se imprime.
*   **RF3 [UI — modal]:** `MethodologyModal`, con `role="dialog"`, `aria-modal` y título.
    *   Se cierra con Esc, con el botón «Cerrar» o con un clic fuera del modal.
    *   Al abrir, el foco va al modal; al cerrar, vuelve al botón.
    *   Pestañas (`role="tablist"`): **Métricas · Health score · Diagnóstico · Destacados · Patrones · Recomendaciones · Ruteo y volumen · Datos**.
    *   Mientras carga el endpoint muestra «Cargando…». Si falla, avisa con el error; las secciones que solo usan valores del frontend se siguen viendo.
*   **RF4 [Contenido]:** cada pestaña explica, en español, la regla y su porqué.
    *   **Métricas:**
        *   qué es agente (`ESTADO = ANSWER` y `SUB_ESTADO = AGENT`), contestador (`SUB_ESTADO = ANSWERING_MACHINE`), ocupado, congestión y no contesta;
        *   AA = agentes ÷ total (Spec 012);
        *   AA sobre atendibles;
        *   segmentos, y que solo se compara dentro de cada segmento.
    *   **Health score:**
        *   fórmula `(AA − ocupado × peso − congestión × peso) × 100`;
        *   etiquetas;
        *   un ejemplo calculado con esos mismos valores.
    *   **Diagnóstico:**
        *   caída o mejora de base (aviso y crítico, en pp);
        *   mezcla de tráfico;
        *   congestión y recuperación;
        *   límite de causas;
        *   reglas del rango: congestión, horas con mucho ocupado, horas pico y troncal confiable.
    *   **Destacados:** mínimos absolutos y relativos de mejor y peor día, hora y dispositivo; días de poco volumen; tope de puntos destacados.
    *   **Patrones:** combinación fecha × hora × base × dispositivo con N llamadas o más y AA por debajo del F% del promedio de su campaña.
    *   **Recomendaciones:** ruteo, ritmo de marcación (ocupado), hora pico, contestadores y caída de volumen, con sus umbrales y el tope.
    *   **Ruteo y volumen:** detector de cambios de ruteo (concentración, troncal activa, mínimo por día, día aislado, nota de contestadores) y volumen por troncal (top 5 + «Otras»).
    *   **Datos:**
        *   `/data` es de solo lectura;
        *   nombres `NN_DD-MM`;
        *   se leen todas las hojas;
        *   los IDs repetidos cuentan una vez;
        *   la ingesta es incremental y existe `--full`.
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   El endpoint es de solo lectura y no toca la base.
    *   Sin cambios en los cálculos, los otros endpoints ni `/data`.
    *   Sin librerías nuevas; la cobertura no baja.
*   **RF6 [Testing]:**
    *   pytest: `/api/methodology` devuelve exactamente los valores de `config.py`.
    *   vitest:
        *   botón, apertura y cierre (Esc, «Cerrar», clic afuera) y foco;
        *   pestañas;
        *   los números se muestran a partir de las constantes y del endpoint (si cambia un valor en el fixture, cambia el texto);
        *   estado de error;
        *   `healthScoreLabel` con las constantes nuevas.

## Specs superadas por esta revisión

Ninguna. Aditiva.

## Datos de entrada

`backend/config.py`, `frontend/src/lib/rangeThresholds.ts` y `frontend/src/components/common/healthStyle.ts`.

## Contrato JSON

```json
GET /api/methodology
{
  "segments": {"35": "Galicia Empresas", "...": "..."},
  "health": {"busy_weight": 0.5, "congestion_weight": 1.5},
  "diagnostics": {"base_drop_warning": -0.006, "base_drop_critical": -0.012, "base_improvement_info": 0.006,
                  "base_improvement_success": 0.012, "mix_share": 0.05, "congestion_delta": 0.02,
                  "congestion_critical": 0.05, "congestion_recovery_info": -0.02,
                  "congestion_recovery_success": -0.04, "root_causes_limit": 5},
  "range_diagnostics": {"congestion": 0.05, "busy": 0.35, "peak": 0.06},
  "recommendations": {"volume_drop_pct": -10.0, "amd_ratio": 4.0, "min_volume_share": 0.1, "limit": 5},
  "patterns": {"relative_factor": 0.6, "min_calls": 50},
  "routing": {"concentration_share": 0.8, "active_share": 0.1, "min_day_calls": 50, "amd_note_share": 0.4}
}
```

## Fuera de Alcance

*   Ayuda contextual en cada tarjeta (íconos «?» por sección).
*   Editar umbrales desde la interfaz.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/054-spec-methodology-modal/{spec,plan,task}.md`; `task.md` en `[x]`.
*   El endpoint real devuelve los valores de `config.py`.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
*   Revisión visual: el usuario.
