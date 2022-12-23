import { renderHook, act } from '@testing-library/react-hooks'
import { clearSingletones, Singletone } from '../../core/src'
import { useSingletone } from './'
import * as React from 'react'

/**
 *  Tests for simple container
 */
interface State {
  num: number
}

class Num extends Singletone<State> {
  state = {
    num: 0,
  }

  public setNum = (num: number) => this.setState({ num })
}

/**
 *  Tests for complex state
 */
interface ObjectContainerState {
  name: string
  age: number
  items: Array<string>
}

class ObjectContainer extends Singletone<ObjectContainerState> {
  public state = {
    name: '',
    age: 0,
    items: [] as string[],
  }

  public setName = (name: string) => this.setState({ name })

  public setAge = (age: number) => this.setState({ age })

  public addItem = (item: string) => this.setState(s => ({ items: [...s.items, item] }))
}

jest.mock('@singletn/core', () => {
  const singletn = require('../../core/src')
  return singletn
})

describe('`useSingletone` tests', () => {
  beforeAll(() => {
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: any) => window.setTimeout(cb as () => void, 0))

    jest.useFakeTimers()
  })

  beforeEach(() => {
    clearSingletones()
  })

  it('Sets num', () => {
    const { result } = renderHook(() => useSingletone(Num))
    const container = result.current

    expect(container.state.num).toBe(0)

    act(() => container.setNum(12))
    expect(container.state.num).toBe(12)
  })

  it('Updates state with complex object', () => {
    const { result } = renderHook(() => useSingletone(ObjectContainer))
    const container = result.current

    act(() => container.setAge(12))
    expect(container.state.age).toBe(12)

    act(() => container.setName('Nic'))
    expect(container.state.name).toBe('Nic')

    act(() => container.addItem('Ball'))
    expect(container.state.items.length).toBe(1)
  })

  it('Should not rerender when changed prop is not observed', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletone(ObjectContainer, { watchKeys: ['age'], onUpdate }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when changed prop is observed', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletone(ObjectContainer, { watchKeys: ['name'], onUpdate }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should not rerender when rerenderer returns false', () => {
    const updater = jest.fn()
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletone(ObjectContainer, {
        shouldTriggerUpdate: updater.mockImplementation(() => false),
        onUpdate,
      }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(updater).toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when rerenderer returns true', () => {
    const updater = jest.fn()
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletone(ObjectContainer, {
        shouldTriggerUpdate: updater.mockImplementation(() => true),
        onUpdate,
      }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(updater).toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should not rerender when dependencies array is empty', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => useSingletone(ObjectContainer, { onUpdate, watchKeys: [] }))
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when no dependencies are set', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => useSingletone(ObjectContainer, { onUpdate }))
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    jest.runAllTimers()

    expect(onUpdate).toHaveBeenCalled()
  })
})