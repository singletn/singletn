import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  subscribeListener,
  findSingletn,
  SingletnType,
  isIntanceOfSingletnState,
} from '@singletn/core'

type Class<T> = new (...args: any[]) => T
type MaybeArray<T> = T | T[]

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
  shouldUpdate?: (prevState: SingletnType['state'], nextState: SingletnType['state']) => boolean
}

type ConfigWithKeysToObserve<State, S extends SingletnType<State>> = BaseConfig<State> & {
  /**
   * An array of keys to watch. The keys should be a keyof typeof State
   */
  watchKeys?: MaybeArray<keyof S['state']>
}

type Config<State, S extends SingletnType<State>> =
  | ConfigWithKeysToObserve<State, S>
  | ConfigWithUpdater<State>

function useBaseSingletn<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  configurationParams: Config<State, S> = {},
  onUpdate: () => void,
  deleteOnUnmount = false,
): S {
  const instance = useRef(
    isIntanceOfSingletnState(singletn)
      ? (singletn as S)
      : (findSingletn(singletn as Class<S>) as S),
  )
  const configs = useRef(configurationParams)

  const update = useCallback(nextState => {
    onUpdate()
    configs.current.onUpdate?.(nextState)
  }, [])

  useEffect(() => {
    if (!isIntanceOfSingletnState(instance.current)) {
      throw new Error('SingletnState used does not meet the required implementation')
    }

    const config = configs.current || {}

    const unsubscribe = subscribeListener(
      instance.current,
      ({ nextState, prevState }) => {
        if (!config || ['shouldUpdate', 'watchKeys'].every(key => !(key in config))) {
          update(nextState)
        } else if ('shouldUpdate' in config) {
          const { shouldUpdate } = config as ConfigWithUpdater<State>
          if (shouldUpdate?.(prevState || {}, nextState || {})) {
            update(nextState)
          }
        } else if ('watchKeys' in config) {
          const { watchKeys } = config as ConfigWithKeysToObserve<State, S>
          const watchKeysArray = Array.isArray(watchKeys)
            ? watchKeys
            : ([watchKeys] as (keyof S['state'])[])

          if (
            watchKeysArray.reduce(
              (acc: boolean, dep) =>
                acc || !deepEquals(nextState?.[dep] || {}, prevState?.[dep] || {}),
              false,
            )
          ) {
            update(nextState)
          }
        }
      },
      deleteOnUnmount,
    )

    return unsubscribe
  }, [])

  return instance.current!
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
  config?: Config<State, S>,
): S {
  const [, forceUpdate] = useState(Number.MIN_SAFE_INTEGER)

  return useBaseSingletn(singletn, config, () => forceUpdate(d => ++d))
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
  config?: Config<State, S>,
): S {
  const [, forceUpdate] = useState(Number.MIN_SAFE_INTEGER)

  const instance = useRef(
    isIntanceOfSingletnState(singletn) ? (singletn as S) : new (singletn as Class<S>)(),
  )

  return useBaseSingletn(instance.current, config, () => forceUpdate(d => ++d), true)
}

/**
 *
 * @param singletn  The class or its instance that will be accessed
 * @param config Configuration object
 * @returns
 */
export function useSingletnState<State, S extends SingletnType<State>>(
  singletn: S | Class<S>,
  config?: Config<State, S>,
): S['state'] {
  return useSingletn(singletn, config).state
}

type SingletnProps<State, S extends SingletnType<State>> = ConfigWithKeysToObserve<State, S> & {
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
