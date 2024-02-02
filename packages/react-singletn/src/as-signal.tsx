import { SingletnState, SingletnType } from '@singletn/core'
import React, { FC, ReactNode, useState } from 'react'
import { useSingletn } from './hooks/use-singletn'

type CompProps<State> = {
  fn: () => ReactNode
  singletn: SingletnType<State>
}

function Comp<State>({ fn, singletn }: CompProps<State>) {
  const [resolved, setResolved] = useState(fn())

  useSingletn(singletn, {
    shouldUpdate: () => resolved !== fn(),
    onUpdate: () => setResolved(fn()),
  })

  return (resolved ?? null) as React.ReactElement
}

export class SingletnSignalState<State> extends SingletnState<State> {
  asSignal = (fn: (...args: Array<any>) => ReactNode) => (...args: Array<any>) => (
    <Comp fn={() => fn(...args)} singletn={this} />
  )
}
