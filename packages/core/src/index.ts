type Class<T> = new (...args: any[]) => T

type Listener = (obj: { nextState: any; prevState: any }) => void

export class Emitter {
  public listeners: {
    id: Symbol
    listener: Listener
  }[] = []

  subscribe = (listener: Listener) => {
    const id = Symbol()
    this.listeners.push({ id, listener })

    return { unsubscribe: () => this.unsubscribe(id) }
  }

  emit: Listener = data => this.listeners.forEach(({ listener }) => listener(data))

  unsubscribe = (listenerId: Symbol) =>
    (this.listeners = this.listeners.filter(({ id }) => id !== listenerId))
}

export interface SingletnType<T = any> {
  setState: (updater: Partial<T> | ((prevState: T) => Partial<T> | null), silent?: boolean) => void
  state: T
  destroy: () => void
  __destroyInternalCleanup?: () => void
}

export const isIntanceOfSingletnState = <C extends SingletnType>(singletn: C | Class<C>): boolean =>
  (singletn as SingletnType).setState !== undefined &&
  (singletn as SingletnType).state !== undefined

const emittersMap = new Map<SingletnType<any>, Emitter>()

export const getEmitter = (singletn: SingletnType<any>): Emitter => {
  if (!emittersMap.has(singletn)) {
    const emitter = new Emitter()
    emittersMap.set(singletn, emitter)
    return emitter
  }

  return emittersMap.get(singletn)!
}

/** @private */
export const singletnsMap = new Map<Class<SingletnType<any>>, SingletnType<any>>()

export const findSingletn = <C>(c: Class<SingletnType<any>>): SingletnType<C> => {
  if (!singletnsMap.has(c)) singletnsMap.set(c, new c())

  return singletnsMap.get(c)!
}

export const clearSingletns = () => {
  Array.from(singletnsMap.keys()).forEach(key => {
    const singletn = getSingletn(key)
    singletn.destroy()
    singletn.__destroyInternalCleanup?.()
  })

  singletnsMap.clear()
  emittersMap.clear()
}

export const subscribeListener = <T>(
  singletn: SingletnType<T>,
  listener: (_: { nextState: T; prevState: T }) => void,
  deleteOnUnsubscribe?: boolean,
) => {
  const emitter = getEmitter(singletn)
  const sub = emitter.subscribe(listener)

  return () => {
    sub.unsubscribe()

    if (deleteOnUnsubscribe) {
      deleteSingletn(singletn)
    }
  }
}

export const deleteSingletn = <C extends SingletnType>(singletn: C | Class<C>) => {
  const c = getSingletn(singletn)

  Array.from(singletnsMap.keys()).forEach(key => {
    const cnt = getSingletn(key)

    if (cnt === c) {
      singletnsMap.delete(key)
    }
  })

  emittersMap.delete(c)

  c.destroy()
  c.__destroyInternalCleanup?.()
}

export const getSingletn = <C extends SingletnType>(singletn: C | Class<C>): C =>
  isIntanceOfSingletnState(singletn) ? (singletn as C) : (findSingletn(singletn as Class<C>) as C)

export class SingletnState<State = any> {
  public state!: State
  protected className: string = ''

  constructor() {
    this.className = this.constructor.name
  }

  public setState = (
    updater: Partial<State> | ((prevState: State) => Partial<State> | null),
    silent?: boolean,
  ) => {
    const nextState = updater instanceof Function ? updater(this.state) : updater
    if (nextState) {
      const prevState = { ...this.state }
      this.state =
        nextState instanceof Object ? Object.assign({}, this.state, nextState) : nextState

      if (!silent) {
        getEmitter(this).emit({ nextState: this.state, prevState })
      }

      if (isDevtools && getTraces) {
        const trace = getTraces()[2]

        devtoolsEmitter.emit({
          methodName: trace.function,
          singletnName: this.className,
          prevState,
          nextState: this.state,
          id: `${Math.random() * Math.random()}`.replace('0.', ''),
        } as any)
      }
    }
  }

  public destroy = () => {}
}

/**
 * ┌─────────────────────────────────┐
 * │ From this line onwards, all you │
 * │ can see is devtools junk        │
 * └─────────────────────────────────┘
 */
let devtoolsEmitter: Emitter
const isDevtools = process.env.NODE_ENV === 'development' && window
let getTraces: (() => any[]) | null = null

if (isDevtools) {
  devtoolsEmitter = new Emitter()

  import('./tracers').then(imported => {
    getTraces = imported.default
  })

  // @ts-ignore
  window.$singletn = {
    emitter: devtoolsEmitter,
  }
}
