import { SingletnType } from '@singletn/core'
import React, { ReactNode, useState } from 'react'
import { useSingletn } from '.'

function Comp<State>({ fn, singletn }: { fn: () => ReactNode; singletn: SingletnType<State> }) {
  const [resolved, setResolved] = useState(fn())

  useSingletn(singletn, {
    shouldUpdate: () => resolved !== fn(),
    onUpdate: () => setResolved(fn()),
  })

  return <>{resolved}</>
}

export function asSignal<State>(fn: () => ReactNode, singletn: SingletnType<State>) {
  return () => <Comp fn={fn} singletn={singletn} />
}
