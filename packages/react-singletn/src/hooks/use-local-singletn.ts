import { useRef } from 'react'

import { SingletnType, createSingletnInstance, isIntanceOfSingletnState } from '@singletn/core'

import { Class, Config } from '../types'
import { useBaseSingletn } from './use-base-singletn'

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
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>],
  config?: Config<State>,
): S {
  const singletnInstance = Array.isArray(singletn) ? singletn[0] : singletn
  const params = Array.isArray(singletn) ? singletn.slice(1) : []

  const instance = useRef(
    isIntanceOfSingletnState(singletnInstance)
      ? (singletnInstance as S)
      : createSingletnInstance(singletnInstance as Class<S>, ...params),
  )

  return useBaseSingletn(instance.current, config, true)
}
