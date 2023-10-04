import { SingletnType, createSingletnInstance, isIntanceOfSingletnState } from '@singletn/core'
import React, { PropsWithChildren, createContext, useContext, useRef } from 'react'
import { Class, Config } from './types'
import { useSingletn } from './hooks/use-singletn'

const SingletnContext = createContext(
  new Map<Class<SingletnType<any>> | SingletnType<any>, SingletnType<any>>(),
)

export const useSingletnContext = <State, S extends SingletnType<State>>(
  singletn?: S | Class<S>,
) => {
  const context = useContext(SingletnContext)

  if (singletn) {
    return context.get(singletn)
  }

  return context
}

/**
 * Create a context to store your singletn state
 */
export function SingletnProvider<State, S extends SingletnType<State>>({
  singletn,
  config,
  children,
}: PropsWithChildren<{
  singletn: S | Class<S>
  config?: Config<State>
}>) {
  const singletnInstance = Array.isArray(singletn) ? singletn[0] : singletn
  const params = Array.isArray(singletn) ? singletn.slice(1) : []

  const instance = useRef(
    isIntanceOfSingletnState(singletnInstance)
      ? (singletnInstance as S)
      : createSingletnInstance(singletnInstance as Class<S>, ...params),
  )

  const upperContext = useContext(SingletnContext)
  const context = useRef(new Map(upperContext))

  if (!context.current.has(singletn)) {
    context.current.set(singletn, instance.current)
  }

  useSingletn(singletn, config)

  return <SingletnContext.Provider value={context.current}>{children}</SingletnContext.Provider>
}
