import { useRef, useSyncExternalStore } from 'react'

import { SingletnType, findSingletn, isIntanceOfSingletnState } from '@singletn/core'

import { Class, Config, ConfigWithKeysToObserve, ConfigWithUpdater } from '../types'

function singletnSubscription<State>(
  instance: SingletnType<State>,
  config: Config<State> = {},
  deleteOnUnmount = false,
) {
  return (listener: () => void) => {
    const onChange = (nextState: State) => {
      config.onUpdate?.(nextState)
      listener()
    }

    const unsubscribe = instance.subscribe(({ nextState, prevState }) => {
      if (!config || ['shouldUpdate', 'watchKeys'].every(key => !(key in config))) {
        onChange(nextState)
      } else if ('shouldUpdate' in config) {
        const { shouldUpdate } = config as ConfigWithUpdater<State>
        if (shouldUpdate?.(prevState || ({} as State), nextState || ({} as State))) {
          onChange(nextState)
        }
      } else if ('watchKeys' in config) {
        const { watchKeys } = config as ConfigWithKeysToObserve<State>
        const watchKeysArray = Array.isArray(watchKeys)
          ? watchKeys
          : ([watchKeys] as (keyof State)[])

        if (
          watchKeysArray.reduce(
            (acc: boolean, dep) =>
              acc || !deepEquals(nextState?.[dep] || {}, prevState?.[dep] || {}),
            false,
          )
        ) {
          onChange(nextState)
        }
      }
    }, deleteOnUnmount)

    return unsubscribe
  }
}

export function useBaseSingletn<State, S extends SingletnType<State>>(
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>],
  configurationParams: Config<State> = {},
  deleteOnUnmount = false,
): S {
  const singletnInstance = Array.isArray(singletn) ? singletn[0] : singletn

  const instance = useRef(
    isIntanceOfSingletnState(singletnInstance)
      ? (singletn as S)
      : findSingletn(singletn as Class<S>),
  )

  useSyncExternalStore(
    singletnSubscription(instance.current, configurationParams, deleteOnUnmount),
    instance.current.getState,
    instance.current.getState,
  )

  return instance.current as S
}

function deepEquals(
  value: object | string | number | boolean,
  comparer: object | string | number | boolean,
) {
  if (typeof value !== typeof comparer) return false
  if (typeof value !== 'object') {
    if (Number.isNaN(value) && Number.isNaN(comparer)) return true
    return value === comparer
  }
  if (value === null || comparer === null) return value === comparer
  if (value === comparer) return true
  if (Array.isArray(value) && Array.isArray(comparer)) {
    if (value.length !== comparer.length) return false
    for (let i = 0; i < value.length; i += 1) {
      if (!deepEquals(value[i], comparer[i])) return false
    }
    return true
  }

  if (Array.isArray(value) || Array.isArray(comparer)) return false

  if (typeof value !== 'object' && typeof comparer !== 'object') return false

  const valueKeys = Object.keys(value)
  const comparerKeys = Object.keys(comparer || {})
  if (valueKeys.length !== comparerKeys.length) return false

  for (let i = 0; i < valueKeys.length; i += 1) {
    const key = valueKeys[i]
    // @ts-expect-error
    if (!(comparer || {}).hasOwnProperty(key) || !deepEquals(value[key], (comparer || {})[key]))
      return false
  }
  return true
}
