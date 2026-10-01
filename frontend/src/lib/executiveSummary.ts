import type {
  CampaignSummary,
  DiagnosticEvent,
  Recommendation,
  SummaryKpi,
} from '../types/api'
import { formatDeltaPp, formatNumber, formatRatePct } from './format'

export type SummaryKind = 'context' | 'change' | 'problem' | 'strength' | 'action'

export interface SummaryItem {
  kind: SummaryKind
  label: string
  text: string
}

export interface PeerSummary {
  campaign: string
  total_calls: number
  agent_answers: number
}

interface Insights {
  rootCauses: DiagnosticEvent[]
  positiveDrivers: DiagnosticEvent[]
  recommendations: Recommendation[]
}

const LABELS: Record<SummaryKind, string> = {
  context: 'Contexto',
  change: 'Cambio detectado',
  problem: 'Principal problema',
  strength: 'Punto fuerte',
  action: 'Qué hacer',
}

function item(kind: SummaryKind, text: string): SummaryItem {
  return { kind, label: LABELS[kind], text }
}

// First sentence of a recommendation; a period followed by a digit ("3.65%")
// is a decimal, not the end of the sentence.
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/)
  return (match ? match[0] : text).trim()
}

export function pooledRate(peers: PeerSummary[]): number | null {
  const calls = peers.reduce((sum, peer) => sum + peer.total_calls, 0)
  const agents = peers.reduce((sum, peer) => sum + peer.agent_answers, 0)
  return calls > 0 ? agents / calls : null
}

function insightItems({ rootCauses, positiveDrivers, recommendations }: Insights): SummaryItem[] {
  const items: SummaryItem[] = []
  if (rootCauses[0]) items.push(item('problem', rootCauses[0].message))
  if (positiveDrivers[0]) items.push(item('strength', positiveDrivers[0].message))
  if (recommendations[0]) items.push(item('action', firstSentence(recommendations[0].text)))
  return items
}

export function rangeSummaryItems(
  input: Insights & {
    summary: CampaignSummary
    segment: string | null
    peers: PeerSummary[] | null
    routingChange?: string | null
  },
): SummaryItem[] {
  const { summary, segment, peers } = input
  let context = `AA ${formatRatePct(summary.agent_answer_rate)} sobre ${formatNumber(summary.total_calls)} llamadas`
  const peerRate = peers && peers.length > 0 ? pooledRate(peers) : null
  if (segment && peerRate != null && summary.agent_answer_rate != null) {
    const delta = formatDeltaPp(summary.agent_answer_rate - peerRate)
    context += ` · ${delta} vs el resto de ${segment} (${formatRatePct(peerRate)})`
  }
  const change = input.routingChange ? [item('change', input.routingChange)] : []
  return [item('context', context), ...change, ...insightItems(input)]
}

export function compareSummaryItems(
  input: Insights & { summary: SummaryKpi | null; dateA: string; dateB: string },
): SummaryItem[] {
  const { summary, dateA, dateB } = input
  const items: SummaryItem[] = []
  if (summary) {
    items.push(
      item(
        'context',
        `AA ${formatRatePct(summary.agent_answer_rate_a)} → ${formatRatePct(summary.agent_answer_rate_b)} ` +
          `(${formatDeltaPp(summary.delta_rate)}) entre ${dateA} y ${dateB}`,
      ),
    )
  }
  return [...items, ...insightItems(input)]
}

export function crossSummaryItems(
  input: Insights & {
    summary: SummaryKpi | null
    campaignA: string
    campaignB: string
    segment: string | null
  },
): SummaryItem[] {
  const { summary, campaignA, campaignB, segment } = input
  const items: SummaryItem[] = []
  if (summary) {
    const scope = segment ? ` · ${segment}` : ''
    items.push(
      item(
        'context',
        `Campaña ${campaignB} ${formatRatePct(summary.agent_answer_rate_b)} vs campaña ${campaignA} ` +
          `${formatRatePct(summary.agent_answer_rate_a)} (${formatDeltaPp(summary.delta_rate)})${scope}`,
      ),
    )
  }
  return [...items, ...insightItems(input)]
}
