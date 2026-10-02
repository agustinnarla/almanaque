import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useMethodology } from '../../hooks/useMethodology'
import {
  AMD_RATIO,
  BEST_DAY_MIN_CALLS,
  BEST_DEVICE_MIN_CALLS,
  BEST_HOUR_MIN_CALLS,
  HEATMAP_MIN_CELL_CALLS,
  HIGHLIGHT_MIN_SHARE,
  LOW_VOLUME_DAY_SHARE,
  LOW_VOLUME_MIN_DAYS,
  NEGATIVE_DRIVERS_MAX,
  PEAK_WINDOW_MIN_RATE,
  POSITIVE_DRIVERS_MAX,
  TRUNK_MAX_BUSY,
  TRUNK_MAX_CONGESTION,
  TRUNK_MIN_SHARE,
} from '../../lib/rangeThresholds'
import { HEAT_BINS } from '../../lib/heatmap'
import { TRUNK_CHART_TOP } from '../../lib/trunkVolume'
import type { Methodology } from '../../types/api'
import {
  HEALTH_ACCEPTABLE_MIN,
  HEALTH_HEALTHY_MIN,
  healthScoreLabel,
} from '../common/healthStyle'

// Every number below comes from rangeThresholds.ts / healthStyle.ts or from
// GET /api/methodology (backend/config.py): nothing is typed in by hand.
const pct = (value: number) =>
  `${(value * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
const pp = (value: number) =>
  `${Math.abs(value * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} pp`
const num = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 })

function Rule({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <dt className="text-sm font-semibold text-slate-900">{term}</dt>
      <dd className="mt-0.5 text-sm text-slate-600">{children}</dd>
    </div>
  )
}

function Rules({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-slate-100">{children}</dl>
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm text-slate-600">{children}</p>
}

function Metrics({ data }: { data: Methodology | null }) {
  const segments = new Map<string, string[]>()
  for (const [campaign, segment] of Object.entries(data?.segments ?? {})) {
    segments.set(segment, [...(segments.get(segment) ?? []), campaign])
  }
  return (
    <Rules>
      <Rule term="Intento">Cada fila del exporte del discador: una llamada que se intentó hacer.</Rule>
      <Rule term="Agente">
        La llamada terminó con <code>ESTADO = ANSWER</code> y <code>SUB_ESTADO = AGENT</code>: la
        atendió una persona y llegó a un agente.
      </Rule>
      <Rule term="Contestador">
        <code>SUB_ESTADO = ANSWERING_MACHINE</code>: la atendió un contestador automático.
      </Rule>
      <Rule term="Ocupado y congestión">
        <code>ESTADO = BUSY</code> (línea ocupada) y <code>ESTADO = CONGESTION</code> (la red o la
        troncal no pudo cursar la llamada).
      </Rule>
      <Rule term="No contesta / fallidas">Intentos − agentes − contestadores.</Rule>
      <Rule term="Agent Answer (AA)">
        Agentes ÷ intentos. Es la métrica principal y se calcula siempre sobre el total de intentos.
      </Rule>
      <Rule term="AA sobre atendibles">
        Agentes ÷ (intentos − contestadores). Separa la calidad de la troncal (cuántas personas que
        atienden llegan a un agente) de la calidad de la lista (cuántos contestadores hay).
      </Rule>
      <Rule term="Segmentos">
        {segments.size === 0 ? (
          'Cargando…'
        ) : (
          <>
            {[...segments].map(([segment, campaigns]) => `${segment}: ${campaigns.join(', ')}`).join(' · ')}.
            Las campañas solo se comparan dentro de su segmento.
          </>
        )}
      </Rule>
    </Rules>
  )
}

function Health({ data }: { data: Methodology }) {
  const { busy_weight: busy, congestion_weight: congestion } = data.health
  const example = (0.06 - 0.2 * busy - 0.02 * congestion) * 100
  return (
    <>
      <Intro>
        Resume en un número qué tan bien rinde un segmento (troncal, hora o día): premia el AA y
        castiga el ocupado y, sobre todo, la congestión.
      </Intro>
      <p className="my-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-900">
        Health = (AA − ocupado × {num(busy)} − congestión × {num(congestion)}) × 100
      </p>
      <Rules>
        <Rule term="Etiquetas">
          {num(HEALTH_HEALTHY_MIN)} o más: «{healthScoreLabel(HEALTH_HEALTHY_MIN)}» · desde{' '}
          {num(HEALTH_ACCEPTABLE_MIN)}: «{healthScoreLabel(HEALTH_ACCEPTABLE_MIN)}» · menos de{' '}
          {num(HEALTH_ACCEPTABLE_MIN)}: «{healthScoreLabel(HEALTH_ACCEPTABLE_MIN - 1)}».
        </Rule>
        <Rule term="Ejemplo">
          AA 6%, ocupado 20% y congestión 2%: (0,06 − 0,20 × {num(busy)} − 0,02 × {num(congestion)}) ×
          100 = <strong>{num(Math.round(example * 100) / 100)}</strong> → «{healthScoreLabel(example)}».
        </Rule>
        <Rule term="Dónde se usa">Rankings de dispositivos y horas, y el día B en «Comparar 2 días».</Rule>
      </Rules>
    </>
  )
}

function Diagnostics({ data }: { data: Methodology }) {
  const d = data.diagnostics
  const r = data.range_diagnostics
  return (
    <>
      <Intro>Al comparar dos días o dos campañas (A contra B), se buscan estas causas:</Intro>
      <Rules>
        <Rule term="Caída de una base">
          Su AA baja {pp(d.base_drop_warning)} o más: aviso · {pp(d.base_drop_critical)} o más: crítico.
        </Rule>
        <Rule term="Mejora de una base">
          Su AA sube {pp(d.base_improvement_info)} o más: informativo · {pp(d.base_improvement_success)}{' '}
          o más: positivo.
        </Rule>
        <Rule term="Mezcla de tráfico">
          Una base gana {pp(d.mix_share)} o más de participación en el volumen. Es negativo si su AA está
          por debajo del promedio y positivo si está por encima.
        </Rule>
        <Rule term="Congestión">
          La congestión total sube {pp(d.congestion_delta)} o más: aviso; es crítico si la troncal que
          más empeora sube {pp(d.congestion_critical)} o más.
        </Rule>
        <Rule term="Recuperación de congestión">
          La troncal que más mejora baja su congestión {pp(d.congestion_recovery_info)} o más:
          informativo · {pp(d.congestion_recovery_success)} o más: positivo.
        </Rule>
        <Rule term="Cuántas se muestran">
          Hasta {d.root_causes_limit}, de la más grave a la menos grave y, a igual gravedad, por impacto.
        </Rule>
      </Rules>
      <Intro>En «Campaña completa» y «Por semana» se mira el rango entero:</Intro>
      <Rules>
        <Rule term="Congestión de red">Troncales con congestión de {pct(r.congestion)} o más.</Rule>
        <Rule term="Horas con mucho ocupado">Horas con ocupado de {pct(r.busy)} o más.</Rule>
        <Rule term="Horas pico">
          Horas con AA de {pct(r.peak)} o más; las consecutivas con AA de {pct(PEAK_WINDOW_MIN_RATE)} o más
          se agrupan en una ventana.
        </Rule>
        <Rule term="Troncal confiable">
          Lleva {pct(TRUNK_MIN_SHARE)} o más del volumen, congestión menor a {pct(TRUNK_MAX_CONGESTION)},
          ocupado de hasta {pct(TRUNK_MAX_BUSY)} y menos de {num(AMD_RATIO)} contestadores por cada agente.
        </Rule>
      </Rules>
    </>
  )
}

function Highlights() {
  return (
    <>
      <Intro>
        Mejor y peor día, hora y dispositivo. Una tasa alta con pocas llamadas suele ser azar, por eso
        cada candidato necesita volumen real:
      </Intro>
      <Rules>
        <Rule term="Hora y dispositivo">
          {BEST_HOUR_MIN_CALLS} llamadas o más (dispositivos: {BEST_DEVICE_MIN_CALLS}) y, además, al
          menos el {pct(HIGHLIGHT_MIN_SHARE)} de las llamadas del rango.
        </Rule>
        <Rule term="Día">
          {BEST_DAY_MIN_CALLS} llamadas o más, y no ser un día de poco volumen.
        </Rule>
        <Rule term="Día de poco volumen">
          Menos del {pct(LOW_VOLUME_DAY_SHARE)} de la mediana diaria del rango (solo con{' '}
          {LOW_VOLUME_MIN_DAYS} días o más). En la serie diaria se ve con la barra atenuada y el punto
          hueco.
        </Rule>
        <Rule term="Desempate">
          A igual tasa, el mejor es el de más agentes y el peor, el de menos; después, por nombre o
          fecha.
        </Rule>
        <Rule term="Cuántos se muestran">
          Hasta {POSITIVE_DRIVERS_MAX} puntos destacados y {NEGATIVE_DRIVERS_MAX} causas negativas.
        </Rule>
      </Rules>
    </>
  )
}

function Patterns({ data }: { data: Methodology }) {
  const p = data.patterns
  return (
    <>
      <Intro>
        Alertas sobre combinaciones puntuales de fecha × hora × base × dispositivo que rinden muy por
        debajo de lo normal para su campaña.
      </Intro>
      <Rules>
        <Rule term="Cuándo hay alerta">
          La combinación tiene {p.min_calls} llamadas o más y su AA queda por debajo del{' '}
          {pct(p.relative_factor)} del AA promedio de su campaña en el rango.
        </Rule>
        <Rule term="Por qué relativo">
          Cada campaña tiene su propio nivel de AA: el umbral se adapta a cada una en vez de usar un
          valor fijo.
        </Rule>
      </Rules>
    </>
  )
}

function Recommendations({ data }: { data: Methodology }) {
  const rec = data.recommendations
  return (
    <Rules>
      <Rule term="Ruteo">
        Entre las troncales con {pct(rec.min_volume_share)} o más del volumen, se recomienda la de mejor
        AA. Se descartan las que tienen {num(rec.amd_ratio)} contestadores o más por cada agente (se
        listan aparte).
      </Rule>
      <Rule term="Ritmo de marcación">
        Troncales con ocupado de {pct(data.range_diagnostics.busy)} o más: conviene bajar la cadencia.
      </Rule>
      <Rule term="Hora pico">La hora con más agentes (con el mínimo de llamadas del filtro) y sus vecinas.</Rule>
      <Rule term="Contestadores">Troncales con {num(rec.amd_ratio)} contestadores o más por cada agente.</Rule>
      <Rule term="Caída de volumen">
        Al comparar, cuando el volumen cae {num(Math.abs(rec.volume_drop_pct))}% o más.
      </Rule>
      <Rule term="Cuántas se muestran">Hasta {rec.limit}.</Rule>
    </Rules>
  )
}

function Routing({ data }: { data: Methodology }) {
  const r = data.routing
  return (
    <Rules>
      <Rule term="Cambio de ruteo">
        Un día está «concentrado» si una sola troncal lleva el {pct(r.concentration_share)} o más del
        volumen. Se avisa cuando la campaña pasa de repartir a concentrar, o al revés.
      </Rule>
      <Rule term="Troncal activa">La que lleva el {pct(r.active_share)} o más del volumen del día.</Rule>
      <Rule term="Días que cuentan">
        Los de {r.min_day_calls} llamadas o más. Un día aislado que difiere de sus dos vecinos toma el
        estado de ellos, para no avisar por un día raro.
      </Rule>
      <Rule term="Nota de contestadores">
        Si en la troncal dominante el {pct(r.amd_note_share)} o más de las llamadas las atiende un
        contestador, el aviso lo menciona.
      </Rule>
      <Rule term="Volumen por troncal">
        El gráfico apila las {TRUNK_CHART_TOP} troncales con más volumen del rango; el resto se suma en
        «Otras».
      </Rule>
      <Rule term="Mapa de calor troncal × hora">
        Muestra las troncales con el {pct(HIGHLIGHT_MIN_SHARE)} o más del volumen del rango. Una celda
        con menos de {HEATMAP_MIN_CELL_CALLS} llamadas queda sin color («·») y no entra en la escala, que
        va del valor más bajo al más alto del mapa en {HEAT_BINS} tramos de un mismo azul.
      </Rule>
    </Rules>
  )
}

function Data() {
  return (
    <Rules>
      <Rule term="Origen">
        Los exportes del discador (<code>.xls</code>/<code>.xlsx</code>) en <code>/data</code>. Son de
        solo lectura: la app nunca los modifica.
      </Rule>
      <Rule term="Nombres">
        <code>NN_DD-MM</code>: la campaña se toma del prefijo <code>NN</code>. Si un día viene partido en
        varios archivos, se unen.
      </Rule>
      <Rule term="Hojas y repetidos">
        Se leen todas las hojas de cada archivo. Una llamada con el mismo «Id. llamada» en dos archivos
        del mismo día se cuenta una sola vez.
      </Rule>
      <Rule term="Ingesta">
        Incremental: solo se leen los archivos nuevos o modificados, y los días afectados se recalculan
        con todos sus archivos. <code>--full</code> reprocesa todo.
      </Rule>
      <Rule term="Cobertura de días">
        Se cuentan los días hábiles (lunes a viernes) desde el primer día de cada campaña hasta el
        último día con datos de cualquier campaña. Si a una campaña le faltan días, o su último día es
        anterior, se avisa debajo de las pestañas, con el badge «Faltan N días» en el rango elegido y
        en «Comparar campañas». No hay calendario de feriados: un día hábil sin datos puede ser uno.
      </Rule>
    </Rules>
  )
}

const TABS = [
  { id: 'metrics', label: 'Métricas', needsData: false },
  { id: 'health', label: 'Health score', needsData: true },
  { id: 'diagnostics', label: 'Diagnóstico', needsData: true },
  { id: 'highlights', label: 'Destacados', needsData: false },
  { id: 'patterns', label: 'Patrones', needsData: true },
  { id: 'recommendations', label: 'Recomendaciones', needsData: true },
  { id: 'routing', label: 'Ruteo y volumen', needsData: true },
  { id: 'data', label: 'Datos', needsData: false },
] as const

type TabId = (typeof TABS)[number]['id']

function renderTab(tab: TabId, data: Methodology | null): ReactNode {
  switch (tab) {
    case 'metrics':
      return <Metrics data={data} />
    case 'highlights':
      return <Highlights />
    case 'data':
      return <Data />
  }
  if (data == null) return null
  switch (tab) {
    case 'health':
      return <Health data={data} />
    case 'diagnostics':
      return <Diagnostics data={data} />
    case 'patterns':
      return <Patterns data={data} />
    case 'recommendations':
      return <Recommendations data={data} />
    case 'routing':
      return <Routing data={data} />
  }
}

interface MethodologyModalProps {
  onClose: () => void
}

export function MethodologyModal({ onClose }: MethodologyModalProps) {
  const [tab, setTab] = useState<TabId>('metrics')
  const { data, loading, error } = useMethodology()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const current = TABS.find((item) => item.id === tab)!

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      data-testid="methodology-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 print:hidden sm:p-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              ¿Cómo se calcula?
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Métricas, reglas y umbrales que usa el dashboard, con los valores vigentes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Cerrar
          </button>
        </div>
        <div role="tablist" aria-label="Secciones" className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`methodology-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="methodology-panel"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                tab === item.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          id="methodology-panel"
          role="tabpanel"
          aria-labelledby={`methodology-tab-${tab}`}
          className="max-h-[60vh] overflow-y-auto px-5 py-4"
        >
          {current.needsData && loading && <p className="text-sm text-slate-500">Cargando…</p>}
          {current.needsData && error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              No se pudieron cargar los umbrales del backend: {error}
            </p>
          )}
          {renderTab(tab, data)}
        </div>
      </div>
    </div>
  )
}
