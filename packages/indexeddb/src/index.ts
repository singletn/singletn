import { Listener, Emitter, deleteSingletn, SingletnType } from '@singletn/core'
import { createInstance, dropInstance, INDEXEDDB, WEBSQL, LOCALSTORAGE } from 'localforage'

export class IndexedDBSingletn<State = any> {
  public state!: State

  private emitter = new Emitter<State>()
  private instanceName: string
  private instance: LocalForage

  constructor(name: string) {
    const prevState = { ...this.state }

    this.instanceName = name

    this.instance = createInstance({
      name,
      driver: [INDEXEDDB, WEBSQL, LOCALSTORAGE],
    })

    this.instance.keys(async (_, keys) => {
      // when there are new values not yet stored, store default value
      if (keys.length !== Object.keys(this.state || {}).length) {
        this.setItems(
          Object.keys(this.state || {})
            .filter(key => !keys.some(k => k === key))
            .reduce(
              (acc, key) => ({
                ...acc,
                [key]: this.state[key as keyof State],
              }),
              {},
            ),
        )
      }

      // when first time singletn is created, no need to load state
      if (keys.length === 0) {
        return
      }

      const storedState = {} as any
      await Promise.all(
        keys.map(key =>
          this.instance.getItem(key).then(item => {
            storedState[key] = item
          }),
        ),
      )

      this.state = Object.assign({}, this.state, storedState) as State
      this.emitter.emit({ nextState: this.state, prevState })
    })
  }

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

  public setState = (updater: Partial<State> | ((prevState: State) => Partial<State> | null)) => {
    const prevState = { ...this.state }

    const nextState = updater instanceof Function ? updater(this.state) : updater
    if (nextState) {
      this.state =
        nextState instanceof Object ? Object.assign({}, this.state, nextState) : nextState

      this.setItems(nextState)

      this.emitter.emit({ nextState: this.state, prevState })
    }
  }

  private setItems = (state: Partial<State>) =>
    Object.keys(state).forEach(key => {
      this.instance.setItem(key, state[key as keyof State])
    })

  public destroy = () => {}

  public __destroyInternalCleanup = () => this.clearDB()

  public clearDB = () =>
    dropInstance({
      name: this.instanceName,
    })
}
