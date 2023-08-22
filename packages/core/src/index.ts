type Class<T> = new (...args: any[]) => T

export type Listener<T = any> = (obj: { nextState: T; prevState: T }) => void

export class Emitter {
  private listeners: {
    id: Symbol
    listener: Listener
  }[] = []

  subscribe = (listener: Listener) => {
    const id = Symbol()
    this.listeners.push({ id, listener })

    return () => this.unsubscribe(id)
  }

  emit: Listener = data => this.listeners.forEach(({ listener }) => listener(data))

  private unsubscribe = (listenerId: Symbol) =>
    (this.listeners = this.listeners.filter(({ id }) => id !== listenerId))
}

export interface SingletnType<T = any> {
  setState: (updater: Partial<T> | ((prevState: T) => Partial<T> | null), silent?: boolean) => void
  getState: () => T
  destroy: () => void
  subscribe: (listener: Listener, deleteOnUnsubscribe?: boolean) => () => void
  __destroyInternalCleanup?: () => void
}

export const isIntanceOfSingletnState = <C extends SingletnType>(singletn: C | Class<C>): boolean =>
  (singletn as SingletnType)?.setState !== undefined &&
  (singletn as SingletnType)?.getState !== undefined &&
  (singletn as SingletnType)?.subscribe !== undefined

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

    destroySingletn(singletn)
  })

  singletnsMap.clear()
}

export const deleteSingletn = <C extends SingletnType>(singletn: C | Class<C>) => {
  const c = getSingletn(singletn)

  Array.from(singletnsMap.keys()).forEach(key => {
    const cnt = getSingletn(key)

    if (cnt === c) {
      singletnsMap.delete(key)
    }
  })

  destroySingletn(c)
}

const destroySingletn = (singletn: SingletnType) => {
  singletn.destroy()
  singletn.__destroyInternalCleanup?.()
}

export const getSingletn = <C extends SingletnType>(singletn: C | Class<C>): C =>
  isIntanceOfSingletnState(singletn) ? (singletn as C) : (findSingletn(singletn as Class<C>) as C)

export class SingletnState<State = any> {
  protected state!: State
  protected emitter: Emitter = new Emitter()

  public subscribe = (listener: Listener<State>, deleteOnUnsubscribe?: boolean) => {
    const unsubscribe = this.emitter.subscribe(listener)

    return () => {
      unsubscribe()

      if (deleteOnUnsubscribe) {
        deleteSingletn(this)
      }
    }
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
        this.emitter.emit({ nextState: this.state, prevState })
      }
    }
  }

  public destroy = () => {}
}
