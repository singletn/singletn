import { SingletnType } from '@singletn/core'
import React, { ReactNode, useState } from 'react'
import { useSingletn } from './hooks/use-singletn'

function Comp<State>({ fn, singletn }: { fn: () => ReactNode; singletn: SingletnType<State> }) {
  const [resolved, setResolved] = useState(fn())

  useSingletn(singletn, {
    shouldUpdate: () => resolved !== fn(),
    onUpdate: () => setResolved(fn()),
  })

  return <>{resolved}</>
}

export function asSignal<State>(
  fn: (...args: Array<any>) => ReactNode,
  singletn: SingletnType<State>,
) {
  return (...args: Array<any>) => <Comp fn={() => fn(...args)} singletn={singletn} />
}
