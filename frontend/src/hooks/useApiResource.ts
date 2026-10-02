import { useCallback, useEffect, useEffectEvent, useState } from 'react'

export interface ApiResourceOptions {
  errorMessage: string
  keepDataOnError?: boolean
}

export interface ApiResource<T> {
  data: T | null
  loading: boolean
  // Loading while the previous result is still on screen: views keep it,
  // dimmed, instead of flashing a skeleton.
  refreshing: boolean
  error: string | null
  reload: () => void
}

interface Result<T> {
  key: string | null
  data: T | null
  error: string | null
}

// Loads `fetcher` whenever `deps` change or `reload()` is called, aborting the
// previous request. `loading` is derived during render (pending key vs last
// settled key) so the effect never sets state synchronously.
export function useApiResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: ApiResourceOptions,
): ApiResource<T> {
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState<Result<T>>({
    key: null,
    data: null,
    error: null,
  })

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const key = JSON.stringify([...deps, tick])
  const { errorMessage, keepDataOnError = false } = options

  const load = useEffectEvent((requestKey: string, signal: AbortSignal) => {
    fetcher(signal)
      .then((data) => {
        if (!signal.aborted) {
          setResult({ key: requestKey, data, error: null })
        }
      })
      .catch((err: unknown) => {
        if (signal.aborted) return
        const message = err instanceof Error ? err.message : errorMessage
        setResult((prev) => ({
          key: requestKey,
          data: keepDataOnError ? prev.data : null,
          error: message,
        }))
      })
  })

  useEffect(() => {
    const controller = new AbortController()
    load(key, controller.signal)
    return () => controller.abort()
  }, [key])

  const loading = result.key !== key
  return {
    data: result.data,
    loading,
    refreshing: loading && result.data !== null,
    error: loading ? null : result.error,
    reload,
  }
}
