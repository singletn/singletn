import React, { useSyncExternalStore, useRef } from 'react'
import {
  findSingletn,
  SingletnType,
  isIntanceOfSingletnState,
  createSingletnInstance,
} from '@singletn/core'
import { Class, MaybeArray } from './types'

type BaseConfig<State> = {
  /**
   * Callback for when the state changes.
   *
   * @param nextState  the state that caused the update
   * @returns void
   */
  onUpdate?: (nextState: State) => void
}

type ConfigWithUpdater<State> = BaseConfig<State> & {
  /**
   * A function that should return a `boolean` to determine whether or not the hook should update,
   * based on the change that happened on the state.
   *
   * @param nextState the state that caused the update
   * @param prevState the state prior to being updated
   * @returns boolean
   */
  shouldUpdate?: (prevState: State, nextState: State) => boolean
}

type ConfigWithKeysToObserve<State> = BaseConfig<State> & {
  /**
   * An array of keys to watch. The keys should be a keyof typeof State
   */
  watchKeys?: MaybeArray<keyof State>
}

type Config<State> = ConfigWithKeysToObserve<State> | ConfigWithUpdater<State>

function singletnSubscription<State, S extends SingletnType<State>>(
  instance: S,
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

function useBaseSingletn<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  configurationParams: Config<State> = {},
  deleteOnUnmount = false,
): S {
  const instance = useRef(
    isIntanceOfSingletnState(singletn)
      ? (singletn as S)
      : (findSingletn(singletn as Class<S>) as S),
  )

  useSyncExternalStore(
    singletnSubscription(instance.current, configurationParams, deleteOnUnmount),
    instance.current.getState,
    instance.current.getState,
  )

  return instance.current
}

/**
 *
 * `useSingletn` will either use an existing singletn or create one if
 * there's none registered with current SingletnState based singletn.
 *
 * @param singletn The class or its instance that will be accessed
 * @param config Configuration object
 *
 * @returns
 */
export function useSingletn<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  config?: Config<State>,
): S {
  return useBaseSingletn(singletn, config)
}

/**
 *
 * `useLocalSingletn` will create a new instance of the SingletnState
 * class. This hook is to be used for local states, as the state will
 * not persist after the component unmounts.
 *
 * @param singletn The class or its instance that will be accessed
 * @param config Configuration object
 *
 * @returns Instance of SingletnState class
 */
export function useLocalSingletn<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  config?: Config<State>,
): S {
  const instance = useRef(
    isIntanceOfSingletnState(singletn)
      ? (singletn as S)
      : (createSingletnInstance(singletn as Class<S>) as S),
  )

  return useBaseSingletn(instance.current, config, true)
}

/**
 *
 * @param singletn  The class or its instance that will be accessed
 * @param config Configuration object
 * @returns State of SingletnState instance
 */
export function useSingletnState<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  config?: Config<State>,
): State {
  return (useSingletn(singletn, config) as S).getState() as State
}

type SingletnProps<State, S extends SingletnType<State>> = ConfigWithKeysToObserve<State> & {
  children: (singletn: S) => React.ReactElement | null
  singletn: S | Class<S>
}

/**
 * Controller to use state updates only on parts of the JSX
 */
export function SingletnController<State, S extends SingletnType<State>>({
  children,
  singletn,
  ...config
}: SingletnProps<State, S>) {
  const s = useSingletn(singletn, config)

  return children(s)
}

export * from '@singletn/core'

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
