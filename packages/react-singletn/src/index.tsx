import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  subscribeListener,
  findSingletn,
  SingletnType,
  isIntanceOfSingletnState,
} from '@singletn/core'

type Class<T> = new (...args: any[]) => T

interface BaseConfig<T> {
  deleteOnUnmount?: boolean
  onUpdate?: (nextState: T) => void
}

interface ConfigWithUpdater<T> extends BaseConfig<T> {
  shouldUpdate?: (nextState: SingletnType['state'], prevState: SingletnType['state']) => boolean
}

interface ConfigWithKeysToObserve<T> extends BaseConfig<T> {
  watchKeys?: Array<keyof T>
}

type Config<T> = ConfigWithKeysToObserve<T> | ConfigWithUpdater<T>

export function useSingletn<T, C extends SingletnType<T>>(
  singletn: C | Class<C>,
  config?: Config<T>,
): C {
  const [, forceUpdate] = useState(false)
  const instance = useMemo(
    () =>
      isIntanceOfSingletnState(singletn)
        ? (singletn as C)
        : (findSingletn(singletn as Class<C>) as C),
    [],
  )

  if (!isIntanceOfSingletnState(instance)) {
    throw new Error('SingletnState used does not meet the required implementation')
  }

  const update = useCallback(
    nextState => {
      forceUpdate(c => !c)
      config?.onUpdate?.(nextState)
    },
    [config?.onUpdate],
  )

  useEffect(() => {
    const unsubscribe = subscribeListener(
      instance,
      ({ nextState, prevState }) => {
        if (isIntanceOfSingletnState((nextState as never) || {}) || !nextState) {
          forceUpdate(c => !c)
          return
        }
        if (!config || !('shouldUpdate' in config || 'watchKeys' in config)) {
          update(nextState)
          return
        }

        // Detect if should update when using shouldUpdate resolver
        if ('shouldUpdate' in config && config.shouldUpdate?.(nextState || {}, prevState || {})) {
          update(nextState)
        }
        // Detect if should update when using watchKeys array
        else if ('watchKeys' in config) {
          if (config.watchKeys?.length === 0) {
            return
          }

          if (
            config.watchKeys?.reduce(
              (acc, dep) =>
                acc ||
                ((Boolean(nextState?.[dep]) &&
                  JSON.stringify(nextState?.[dep]) !== JSON.stringify(prevState?.[dep])) as never),
              false as never,
            )
          ) {
            update(nextState)
          }
        }
      },
      config?.deleteOnUnmount || false,
    )

    return unsubscribe
  }, [instance, update])

  return instance
}

export function useSingletnState<T, C extends SingletnType<T>>(
  singletn: C | Class<C>,
  config?: Config<T>,
): C['state'] {
  const { state } = useSingletn(singletn, config)

  return state
}

interface SingletnProps<T, S extends SingletnType<T>> {
  children: (singletn: S) => React.ReactElement | null
  watch: keyof S['state'] | (keyof S['state'])[]
  singletn: S | Class<S>
  deleteOnUnmount?: boolean
  onUpdate?: (nextState: T) => void
}

export function Singletn<T, S extends SingletnType<T>>({
  children,
  watch,
  singletn,
  deleteOnUnmount,
  onUpdate,
}: SingletnProps<T, S>) {
  const s = useSingletn(singletn, {
    watchKeys: Array.isArray(watch) ? watch : [watch],
    deleteOnUnmount,
    onUpdate,
  })

  return children(s)
}

export * from '@singletn/core'
