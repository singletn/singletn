type Class<T> = new (...args: any[]) => T

export type Listener<T> = (obj: { nextState: T; prevState: T }) => void

export class Emitter<T> {
  private listeners: {
    id: Symbol
    listener: Listener<T>
  }[] = []

  subscribe = (listener: Listener<T>) => {
    const id = Symbol()
    this.listeners.push({ id, listener })

    return () => this.unsubscribe(id)
  }

  emit: Listener<T> = data => this.listeners.forEach(({ listener }) => listener(data))

  private unsubscribe = (listenerId: Symbol) =>
    (this.listeners = this.listeners.filter(({ id }) => id !== listenerId))
}

export interface SingletnType<T = any> {
  setState: (updater: Partial<T> | ((prevState: T) => Partial<T> | null), silent?: boolean) => void
  getState: () => T
  destroy: () => void
  subscribe: (listener: Listener<T>, deleteOnUnsubscribe?: boolean) => () => void
  __destroyInternalCleanup?: () => void
}

export const isIntanceOfSingletnState = <C extends SingletnType>(
  singletn: C | Class<C> | [Class<C>, ...ConstructorParameters<Class<C>>],
): boolean => {
  const sngltn = singletn as SingletnType

  return (
    sngltn?.setState !== undefined &&
    sngltn?.getState !== undefined &&
    sngltn?.subscribe !== undefined
  )
}

/** @private */
export const singletnsMap = new Map<Class<SingletnType<any>>, SingletnType<any>>()

export const createSingletnInstance = <C extends SingletnType>(
  c: Class<C>,
  ...constructorParams: ConstructorParameters<Class<C>>
): C => {
  console.log(constructorParams)
  const cont = new c(...constructorParams)

  if (!isIntanceOfSingletnState(cont)) {
    throw new Error('SingletnState used does not meet the required implementation')
  }

  return cont
}

export const findSingletn = <C extends SingletnType>(
  c: Class<C> | [Class<C>, ...ConstructorParameters<Class<C>>],
): C => {
  const clazz = Array.isArray(c) ? c[0] : c
  const params = Array.isArray(c) ? c.slice(1) : []

  if (!singletnsMap.has(clazz)) {
    const cont = createSingletnInstance(clazz, ...params)
    singletnsMap.set(clazz, cont)
  }

  return singletnsMap.get(clazz)! as C
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

const destroySingletn = <C extends SingletnType>(singletn: C) => {
  singletn.destroy()
  singletn.__destroyInternalCleanup?.()
}

export const getSingletn = <C extends SingletnType>(singletn: C | Class<C>): C =>
  isIntanceOfSingletnState(singletn) ? (singletn as C) : findSingletn(singletn as Class<C>)

export class SingletnState<State = any> {
  protected state!: State
  protected emitter = new Emitter<State>()

  public subscribe = (listener: Listener<State>, deleteOnUnsubscribe?: boolean) => {
    const unsubscribe = this.emitter.subscribe(listener)

    return () => {
      unsubscribe()

      if (deleteOnUnsubscribe) {
        deleteSingletn(this as SingletnType)
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
