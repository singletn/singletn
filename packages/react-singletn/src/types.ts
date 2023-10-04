export type Class<T> = { new (...args: any[]): T }

export type MaybeArray<T> = T | T[]

export type BaseConfig<State> = {
  /**
   * Callback for when the state changes.
   *
   * @param nextState  the state that caused the update
   * @returns void
   */
  onUpdate?: (nextState: State) => void
}

export type ConfigWithUpdater<State> = BaseConfig<State> & {
  /**
   * A function that should return a `boolean` to determine whether or not the hook should update,
   * based on the change that happened on the state.
   *
   * @param nextState the state that caused the update
   * @param prevState the state prior to being updated
   * @returns boolean
   */
  shouldUpdate?: (prevState: State, nextState: State) => boolean
}

export type ConfigWithKeysToObserve<State> = BaseConfig<State> & {
  /**
   * An array of keys to watch. The keys should be a keyof typeof State
   */
  watchKeys?: MaybeArray<keyof State>
}

export type Config<State> = ConfigWithKeysToObserve<State> | ConfigWithUpdater<State>
