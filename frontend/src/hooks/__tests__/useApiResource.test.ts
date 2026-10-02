import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useApiResource } from '../useApiResource'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function controlledFetcher<T>() {
  const calls: { signal: AbortSignal; request: Deferred<T> }[] = []
  const fetcher = (signal: AbortSignal): Promise<T> => {
    const request = deferred<T>()
    calls.push({ signal, request })
    return request.promise
  }
  return { calls, fetcher }
}

const OPTIONS = { errorMessage: 'No se pudo cargar el recurso' }

describe('useApiResource', () => {
  it('arranca en loading desde el primer render y expone el dato al resolver', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(calls).toHaveLength(1)

    await act(async () => calls[0].request.resolve('dato'))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('dato')
    expect(result.current.error).toBeNull()
  })

  it('usa el mensaje del Error y descarta el dato ante un fallo', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))

    await act(async () => calls[0].request.reject(new Error('Error de API: 500')))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Error de API: 500')
    expect(result.current.data).toBeNull()
  })

  it('usa options.errorMessage cuando el rechazo no es un Error', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))

    await act(async () => calls[0].request.reject('falla sin Error'))

    expect(result.current.error).toBe('No se pudo cargar el recurso')
  })

  it('keepDataOnError conserva el dato previo; por defecto se descarta', async () => {
    const kept = controlledFetcher<string>()
    const keeping = renderHook(() =>
      useApiResource(kept.fetcher, ['a'], { ...OPTIONS, keepDataOnError: true }),
    )
    const dropped = controlledFetcher<string>()
    const dropping = renderHook(() =>
      useApiResource(dropped.fetcher, ['a'], OPTIONS),
    )

    await act(async () => {
      kept.calls[0].request.resolve('v1')
      dropped.calls[0].request.resolve('v1')
    })
    act(() => {
      keeping.result.current.reload()
      dropping.result.current.reload()
    })
    await act(async () => {
      kept.calls[1].request.reject(new Error('falla'))
      dropped.calls[1].request.reject(new Error('falla'))
    })

    expect(keeping.result.current.error).toBe('falla')
    expect(keeping.result.current.data).toBe('v1')
    expect(dropping.result.current.error).toBe('falla')
    expect(dropping.result.current.data).toBeNull()
  })

  it('reload() vuelve a pedir y conserva el dato anterior mientras carga', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))
    await act(async () => calls[0].request.resolve('v1'))

    act(() => result.current.reload())

    expect(calls).toHaveLength(2)
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe('v1')

    await act(async () => calls[1].request.resolve('v2'))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('v2')
  })

  it('un cambio de deps aborta el pedido previo y descarta su respuesta tardía', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => useApiResource(fetcher, [dep], OPTIONS),
      { initialProps: { dep: 'a' } },
    )

    rerender({ dep: 'b' })

    expect(calls).toHaveLength(2)
    expect(calls[0].signal.aborted).toBe(true)
    expect(calls[1].signal.aborted).toBe(false)

    await act(async () => calls[0].request.resolve('tarde-a'))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await act(async () => calls[1].request.resolve('b'))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('b')
  })

  it('limpia el error mientras se recarga después de un fallo', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))
    await act(async () => calls[0].request.reject(new Error('falla')))
    expect(result.current.error).toBe('falla')

    act(() => result.current.reload())

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })
  it('marca refreshing al recargar con un dato previo, y no en la primera carga', async () => {
    const { calls, fetcher } = controlledFetcher<string>()
    const { result } = renderHook(() => useApiResource(fetcher, ['a'], OPTIONS))

    expect(result.current.refreshing).toBe(false)
    await act(async () => calls[0].request.resolve('primero'))

    act(() => result.current.reload())
    expect(result.current.loading).toBe(true)
    expect(result.current.refreshing).toBe(true)
    expect(result.current.data).toBe('primero')

    await act(async () => calls[1].request.resolve('segundo'))
    expect(result.current.refreshing).toBe(false)
    expect(result.current.data).toBe('segundo')
  })
})
