import { SingletnType } from '@singletn/core'
import { Class, Config } from '../types'
import { useBaseSingletn } from './use-base-singletn'

/**
 *
 * @param singletn  The class or its instance that will be accessed
 * @param config Configuration object
 * @returns State of SingletnState instance
 */
export function useSingletnState<State, S extends SingletnType<State>>(
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>],
  config?: Config<State>,
): State {
  return (useBaseSingletn(singletn, config) as S).getState() as State
}
