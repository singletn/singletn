import { getEmitter } from '@singletn/core'

export class LocalStorageSingletone<State = any> {
  public state!: State

  constructor(state: State) {
    if (!localStorage) {
      this.state = state
      return
    }

    const keys = Object.keys(localStorage).filter(key => {
      const keyVal = localStorage.getItem(key)

      return (
        key.startsWith(`${this.constructor.name}-`) && ![null, 'undefined', ''].includes(keyVal)
      )
    })

    const storedState = keys.reduce(
      (acc, key: string) => ({
        ...acc,
        [key.split('-')[1]]: JSON.parse(
          // @ts-ignore
          localStorage.getItem(key) !== 'undefined' ? localStorage.getItem(key) : 'null',
        ),
      }),
      {},
    ) as State

    this.state = Object.assign({}, state, storedState)
  }

  public setState = (updater: Partial<State> | ((prevState: State) => Partial<State> | null)) => {
    const prevState = { ...this.state }
    const nextState = updater instanceof Function ? updater(this.state) : updater
    if (nextState) {
      this.state =
        nextState instanceof Object ? Object.assign({}, this.state, nextState) : nextState

      if (!localStorage) {
        getEmitter(this).emit({ nextState: this.state, prevState })
        return
      }

      Object.keys(nextState).forEach(key => {
        localStorage.setItem(
          `${this.constructor.name}-${key}`,
          JSON.stringify(nextState[key as keyof State] || null),
        )
      })

      getEmitter(this).emit({ nextState: this.state, prevState })
    }
  }

  public destroy = () => {
    Object.keys(this.state).forEach(key => {
      localStorage.removeItem(`${this.constructor.name}-${key}`)
    })
  }
}
