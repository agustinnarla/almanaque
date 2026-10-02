# Spec 056: Cobertura de días en el modal de metodología

## Usuario

Agustin. La Spec 055 sumó el aviso de cobertura de días, pero el modal «¿Cómo se calcula?» (Spec 054) no explica esa regla. El acuerdo de la 054 es que el modal describe todas las reglas que aplica el dashboard.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — contenido]:** la pestaña «Datos» de `MethodologyModal` suma la regla «Cobertura de días»:
    *   se cuentan los días hábiles (lunes a viernes) desde el primer día de cada campaña hasta el último día con datos de cualquier campaña;
    *   una campaña está atrasada si su último día es anterior;
    *   un día hábil sin datos puede ser un feriado, porque no hay calendario de feriados;
    *   dónde se avisa: la línea de cobertura bajo las pestañas, el badge «Faltan N días» y el aviso en Comparar campañas.
*   **RF2 [Unwanted behavior — aislamiento]:** sin cambios en el cálculo de cobertura, en el backend ni en `/data`; sin librerías nuevas.
*   **RF3 [Testing]:** el test del modal verifica la regla en la pestaña «Datos».

## Specs superadas por esta revisión

Ninguna. Completa la Spec 054.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Calendario de feriados.

## Criterios de Finalización

*   Docs `spec/056-spec-methodology-coverage/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
