import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  deltaLabel?: string
  delta?: number | null
  deltaIsPercent?: boolean
  deltaSuffix?: string | null
  deltaSecondary?: number | null
  deltaSecondarySuffix?: string
  goodWhenNegative?: boolean
  subtitle?: ReactNode
}

function formatSigned(value: number, suffix: string): string {
  const abs = Math.abs(value)
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  const sep = suffix !== '' && suffix !== '%' ? ' ' : ''
  return `${sign}${abs.toFixed(2)}${sep}${suffix}`
}

function resolvePrimarySuffix(
  deltaIsPercent: boolean,
  deltaSuffix: string | null | undefined,
): string {
  if (deltaSuffix != null) return deltaSuffix
  return deltaIsPercent ? '%' : ''
}

export function StatCard({
  title,
  value,
  deltaLabel,
  delta,
  deltaIsPercent = true,
  deltaSuffix,
  deltaSecondary,
  deltaSecondarySuffix = '%',
  goodWhenNegative = false,
  subtitle,
}: StatCardProps) {
  const primaryOk = delta != null && Number.isFinite(delta)
  const secondaryOk =
    deltaSecondary != null && Number.isFinite(deltaSecondary)
  const showDelta = primaryOk || secondaryOk

  const effective =
    primaryOk && delta != null
      ? delta
      : secondaryOk && deltaSecondary != null
        ? deltaSecondary
        : 0

  const rawPositive = showDelta && effective > 0
  const rawNegative = showDelta && effective < 0
  const isGood = goodWhenNegative ? rawNegative : rawPositive
  const isBad = goodWhenNegative ? rawPositive : rawNegative

  const primarySuffix = resolvePrimarySuffix(deltaIsPercent, deltaSuffix)

  return (
    <article
      data-testid="stat-card"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900" data-testid="stat-value">
        {value}
      </p>
      {showDelta && (
        <p
          data-testid="stat-delta"
          data-good={isGood || undefined}
          data-bad={isBad || undefined}
          className={`mt-1 inline-flex flex-wrap items-center gap-1 text-sm font-semibold ${
            isGood ? 'text-emerald-600' : isBad ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {rawNegative ? (
            <ArrowDownRight className="h-4 w-4" aria-hidden />
          ) : rawPositive ? (
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          ) : (
            <Minus className="h-4 w-4" aria-hidden />
          )}
          {primaryOk && delta != null
            ? formatSigned(delta, primarySuffix)
            : secondaryOk && deltaSecondary != null
              ? formatSigned(deltaSecondary, deltaSecondarySuffix)
              : null}
          {primaryOk &&
          secondaryOk &&
          delta != null &&
          deltaSecondary != null ? (
            <span className="font-normal">
              ({formatSigned(deltaSecondary, deltaSecondarySuffix)})
            </span>
          ) : null}
          {deltaLabel ? (
            <span className="font-normal text-slate-500">{deltaLabel}</span>
          ) : null}
        </p>
      )}
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </article>
  )
}
