type Class<T> = new (...args: any[]) => T

type Listener = (obj: { nextState: any; prevState: any }) => void

export class Emitter {
  private listeners: {
    id: Symbol
    listener: Listener
  }[] = []

  subscribe = (listener: Listener) => {
    const id = Symbol()
    this.listeners.push({ id, listener })

    return { unsubscribe: () => this.unsubscribe(id) }
  }

  emit: Listener = data => this.listeners.forEach(({ listener }) => listener(data))

  private unsubscribe = (listenerId: Symbol) =>
    (this.listeners = this.listeners.filter(({ id }) => id !== listenerId))
}

export interface SingletnType<T = any> {
  setState: (updater: Partial<T> | ((prevState: T) => Partial<T> | null), silent?: boolean) => void
  getState: () => T
  destroy: () => void
  __destroyInternalCleanup?: () => void
}

export const isIntanceOfSingletnState = <C extends SingletnType>(singletn: C | Class<C>): boolean =>
  (singletn as SingletnType)?.setState !== undefined &&
  (singletn as SingletnType)?.getState() !== undefined

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

export const createSingletnInstance = <C>(c: Class<SingletnType<any>>): SingletnType<C> => {
  const cont = new c()

  if (!isIntanceOfSingletnState(cont)) {
    throw new Error('SingletnState used does not meet the required implementation')
  }

  return cont
}

export const findSingletn = <C>(c: Class<SingletnType<any>>): SingletnType<C> => {
  if (!singletnsMap.has(c)) {
    const cont = createSingletnInstance(c)
    singletnsMap.set(c, cont)
  }

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
  const { unsubscribe } = emitter.subscribe(listener)

  return () => {
    unsubscribe()

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
  protected state!: State
  protected className: string = ''
  private instanceId: string = ''

  constructor() {
    this.className = this.constructor.name
  }

  public getState = () => this.state

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
    }
  }

  public destroy = () => {}
}
