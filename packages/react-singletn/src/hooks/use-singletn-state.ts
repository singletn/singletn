import { SingletnType } from '@singletn/core'
import { Class, Config } from '../types'
import { useSingletn } from './use-singletn'

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
