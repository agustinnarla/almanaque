import type { CampaignSummary } from '../types/api'

// Spec 059: compare a range with the one of the same length right before it
// (a week with the previous week; 15/09→30/09 with 30/08→14/09).

const DAY_MS = 24 * 60 * 60 * 1000

const toTime = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime()
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10)

export function previousRange(from: string, to: string): { from: string; to: string } {
  const length = Math.round((toTime(to) - toTime(from)) / DAY_MS) + 1
  const end = toTime(from) - DAY_MS
  return { from: toIso(end - (length - 1) * DAY_MS), to: toIso(end) }
}

export interface KpiDeltas {
  // Points (pp) for rates and shares; percent change for the call volume.
  agentAnswerPp: number | null
  attendablePp: number | null
  totalCallsPct: number | null
  machineSharePp: number | null
  rejectedSharePp: number | null
}

const share = (part: number, total: number) => (total > 0 ? part / total : null)

function pp(current: number | null, previous: number | null): number | null {
  return current == null || previous == null ? null : (current - previous) * 100
}

// null when the previous period has no calls: there is nothing to compare with.
export function kpiDeltas(summary: CampaignSummary, previous: CampaignSummary | null): KpiDeltas | null {
  if (previous == null || previous.total_calls <= 0) return null
  return {
    agentAnswerPp: pp(summary.agent_answer_rate, previous.agent_answer_rate),
    attendablePp: pp(summary.attendable_answer_rate, previous.attendable_answer_rate),
    totalCallsPct: ((summary.total_calls - previous.total_calls) / previous.total_calls) * 100,
    machineSharePp: pp(
      share(summary.machine_answers, summary.total_calls),
      share(previous.machine_answers, previous.total_calls),
    ),
    rejectedSharePp: pp(
      share(summary.rejected_calls, summary.total_calls),
      share(previous.rejected_calls, previous.total_calls),
    ),
  }
}
