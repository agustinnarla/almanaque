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
  // The one headline figure of the view: larger, proportional figures.
  hero?: boolean
  // Placement in the parent grid (spans), when the default is not enough.
  className?: string
  // Spec 059: a delta that is neither good nor bad (call volume) stays gray.
  neutral?: boolean
  // Tooltip of the delta (e.g. which period it compares with).
  deltaTitle?: string
  // Small chart under the value (sparkline).
  trend?: ReactNode
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
  hero = false,
  className = '',
  neutral = false,
  deltaTitle,
  trend,
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
  const isGood = !neutral && (goodWhenNegative ? rawNegative : rawPositive)
  const isBad = !neutral && (goodWhenNegative ? rawPositive : rawNegative)

  const primarySuffix = resolvePrimarySuffix(deltaIsPercent, deltaSuffix)

  return (
    <article
      data-testid="stat-card"
      data-hero={hero || undefined}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
        hero ? 'sm:col-span-2 lg:col-span-1' : ''
      } ${className}`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p
        className={`mt-2 font-semibold text-slate-900 ${hero ? 'text-4xl lg:text-5xl' : 'text-2xl'}`}
        data-testid="stat-value"
      >
        {value}
      </p>
      {showDelta && (
        <p
          data-testid="stat-delta"
          title={deltaTitle}
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
      {trend ? <div className="mt-2">{trend}</div> : null}
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </article>
  )
}
