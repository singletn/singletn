import { SingletnType, createSingletnInstance, isIntanceOfSingletnState } from '@singletn/core'
import React, { PropsWithChildren, createContext, useContext, useRef } from 'react'
import { Class, Config } from './types'
import { useSingletn } from './hooks/use-singletn'

const SingletnContext = createContext(
  new Map<Class<SingletnType<any>> | SingletnType<any>, SingletnType<any>>(),
)

export const useSingletnContext = <State, S extends SingletnType<State>>(
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>],
  config?: Config<S>,
): S => {
  const key = Array.isArray(singletn) ? singletn[0] : singletn
  const context = useContext(SingletnContext)

  const instance = context.get(key)

  if (!instance) {
    throw new Error('Singletn instance not found')
  }

  return useSingletn(instance, config) as S
}

/**
 * Create a context to store your singletn state
 */
export function SingletnProvider<State, S extends SingletnType<State>>({
  singletn,
  children,
}: PropsWithChildren<{
  singletn: S | Class<S> | [Class<S>, ...ConstructorParameters<Class<S>>]
}>) {
  const [singletnInstance, params] = Array.isArray(singletn)
    ? [singletn[0], singletn.slice(1)]
    : [singletn, []]

  const instance = useRef(
    isIntanceOfSingletnState(singletnInstance)
      ? (singletnInstance as S)
      : createSingletnInstance(singletnInstance as Class<S>, ...params),
  )

  const parentContext = useContext(SingletnContext)
  const context = useRef(new Map(parentContext).set(singletnInstance, instance.current))

  return <SingletnContext.Provider value={context.current}>{children}</SingletnContext.Provider>
}
