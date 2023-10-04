import { SingletnType } from '@singletn/core'

import { Class, Config } from './types'
import { useSingletn } from './hooks/use-singletn'

type SingletnProps<State, S extends SingletnType<State>> = Config<State> & {
  children: (singletn: S) => React.ReactElement | null
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>]
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
