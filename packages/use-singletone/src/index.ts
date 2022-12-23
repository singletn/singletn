import { Class } from 'utility-types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  subscribeListener,
  findSingletone,
  SingletoneType,
  isInstanceOfSingletone,
} from '@singletn/core'

interface BaseConfig<T> {
  deleteOnUnmount?: boolean
  onUpdate?: (nextState: T) => void
}

interface ConfigWithUpdater<T> extends BaseConfig<T> {
  shouldTriggerUpdate?: (
    nextState: SingletoneType['state'],
    prevState: SingletoneType['state'],
  ) => boolean
}

interface ConfigWithKeysToObserve<T> extends BaseConfig<T> {
  watchKeys?: Array<keyof T>
}

type Config<T> = ConfigWithKeysToObserve<T> | ConfigWithUpdater<T>

export function useSingletone<T, C extends SingletoneType<T>>(
  singletone: C | Class<C>,
  config?: Config<T>,
): C {
  const [, forceUpdate] = useState(false)
  const instance = useMemo(
    () =>
      isInstanceOfSingletone(singletone)
        ? (singletone as C)
        : (findSingletone(singletone as Class<C>) as C),
    [],
  )

  if (!isInstanceOfSingletone(instance)) {
    throw new Error('Singletone used does not meet the required implementation')
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
        if (isInstanceOfSingletone((nextState as never) || {}) || !nextState) {
          forceUpdate(c => !c)
          return
        }
        if (!config || !('shouldTriggerUpdate' in config || 'watchKeys' in config)) {
          update(nextState)
          return
        }

        // Detect if should update when using shouldTriggerUpdate resolver
        if (
          'shouldTriggerUpdate' in config &&
          config.shouldTriggerUpdate?.(nextState || {}, prevState || {})
        ) {
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

export * from '@singletn/core'
