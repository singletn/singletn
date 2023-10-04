import { SingletnType } from '@singletn/core'
import { Class, Config } from '../types'
import { useBaseSingletn } from './use-base-singletn'

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
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>],
  config?: Config<State>,
): S {
  return useBaseSingletn(singletn, config)
}
