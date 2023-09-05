export type Class<T> = new (...args: any[]) => T

export type MaybeArray<T> = T | T[]
