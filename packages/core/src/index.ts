import { Class } from 'utility-types'

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

export interface SingletoneType<T = any> {
  setState: (updater: Partial<T> | ((prevState: T) => Partial<T> | null)) => void
  state: T
  destroy: () => void
  __destroyInternalCleanup?: () => void
}

export const isInstanceOfSingletone = <C extends SingletoneType>(
  singletone: C | Class<C>,
): boolean =>
  (singletone as SingletoneType).setState !== undefined &&
  (singletone as SingletoneType).state !== undefined

export const emittersMap = new Map<SingletoneType<any>, Emitter>()

export const getEmitter = (singletone: SingletoneType<any>): Emitter => {
  if (!emittersMap.has(singletone)) {
    const emitter = new Emitter()
    emittersMap.set(singletone, emitter)
    return emitter
  }

  return emittersMap.get(singletone)!
}

export const singletonesMap = new Map<Class<SingletoneType<any>>, SingletoneType<any>>()

export const findSingletone = <C>(c: Class<SingletoneType<any>>): SingletoneType<C> => {
  if (!singletonesMap.has(c)) singletonesMap.set(c, new c())

  return singletonesMap.get(c)!
}

export const clearSingletones = () => {
  Array.from(singletonesMap.keys()).forEach(key => {
    const singletone = getSingletone(key)
    singletone.destroy()
    singletone.__destroyInternalCleanup && singletone.__destroyInternalCleanup()
  })

  singletonesMap.clear()
  emittersMap.clear()
}

export const subscribeListener = <T>(
  singletone: SingletoneType<T>,
  listener: (_: { nextState: T; prevState: T }) => void,
  deleteOnUnsubscribe?: boolean,
) => {
  const emitter = getEmitter(singletone)
  const sub = emitter.subscribe(listener)

  return () => {
    sub.unsubscribe()

    if (deleteOnUnsubscribe) {
      deleteSingletone(singletone)
    }
  }
}

export const deleteSingletone = <C extends SingletoneType>(singletone: C | Class<C>) => {
  const c = getSingletone(singletone)

  Array.from(singletonesMap.keys()).forEach(key => {
    const cnt = getSingletone(key)

    if (cnt === c) {
      singletonesMap.delete(key)
    }
  })

  emittersMap.delete(c)

  c.destroy()
  c.__destroyInternalCleanup && c.__destroyInternalCleanup()
}

export const getSingletone = <C extends SingletoneType>(singletone: C | Class<C>): C =>
  isInstanceOfSingletone(singletone)
    ? (singletone as C)
    : (findSingletone(singletone as Class<C>) as C)

export class Singletone<State = any> {
  public state!: State

  public setState = (updater: Partial<State> | ((prevState: State) => Partial<State> | null)) => {
    const nextState = updater instanceof Function ? updater(this.state) : updater
    if (nextState) {
      const prevState = this.state
      this.state =
        nextState instanceof Object ? Object.assign({}, this.state, nextState) : nextState
      getEmitter(this).emit({ nextState: this.state, prevState })
    }
  }

  public destroy = () => {}
}
