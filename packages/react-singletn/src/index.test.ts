import { renderHook, act } from '@testing-library/react-hooks'
import { singletnsMap, SingletnState, getSingletn } from '@singletn/core/src'
import { useLocalSingletn, useSingletn, useSingletnState } from '.'

/**
 *  Tests for simple container
 */
interface State {
  num: number
}

class Num extends SingletnState<State> {
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

class ObjectContainer extends SingletnState<ObjectContainerState> {
  state = {
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

describe('`useSingletn` tests', () => {
  beforeEach(() => {
    singletnsMap.clear()
  })

  it("Throws if given parameter isn't a SingletnState", () => {
    expect(() => {
      renderHook(() => useSingletn(Date as any))
    }).toThrowError('SingletnState used does not meet the required implementation')
  })

  it('Sets num', () => {
    const { result } = renderHook(() => useSingletn(Num))
    const container = result.current

    expect(container.state.num).toBe(0)

    act(() => container.setNum(12))
    expect(container.state.num).toBe(12)
  })

  it('Updates state with complex object', () => {
    const { result } = renderHook(() => useSingletn(ObjectContainer))
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
      useSingletn(ObjectContainer, { watchKeys: ['age'], onUpdate }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when changed prop is observed', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletn(ObjectContainer, { watchKeys: ['name'], onUpdate }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should not rerender when rerenderer returns false', () => {
    const updater = jest.fn()
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletn(ObjectContainer, {
        shouldUpdate: updater.mockImplementation(() => false),
        onUpdate,
      }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(updater).toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when rerenderer returns true', () => {
    const updater = jest.fn()
    const onUpdate = jest.fn()
    const { result } = renderHook(() =>
      useSingletn(ObjectContainer, {
        shouldUpdate: updater.mockImplementation(() => true),
        onUpdate,
      }),
    )
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(updater).toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should not rerender when dependencies array is empty', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => useSingletn(ObjectContainer, { onUpdate, watchKeys: [] }))
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('Should rerender when no dependencies are set', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => useSingletn(ObjectContainer, { onUpdate }))
    const container = result.current

    onUpdate.mockReset()
    act(() => container.setName('Nic'))

    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should be able to useSigneltoneState', () => {
    const { result } = renderHook(() => useSingletnState(ObjectContainer))
    const state = result.current

    expect(state).toBe(getSingletn(ObjectContainer).state)
  })

  it('Should be able to useSigneltoneState', () => {
    const { result } = renderHook(() => useSingletnState(ObjectContainer))
    const state = result.current

    expect(state).toBe(getSingletn(ObjectContainer).state)
  })

  it('Should create a new instance when using useLocalSingletn', () => {
    const { result: globalResult } = renderHook(() => useSingletn(ObjectContainer))
    const { result: localResult } = renderHook(() => useLocalSingletn(ObjectContainer))

    // even though the values of the states are the same, the object differs
    expect(localResult.current.state).toEqual(globalResult.current.state)
    expect(localResult.current.state).not.toBe(globalResult.current.state)

    const { result: localResult2 } = renderHook(() => useLocalSingletn(ObjectContainer))

    // even though the values of the states are the same, the object differs for each local instance
    expect(localResult.current.state).toEqual(localResult2.current.state)
    expect(localResult.current.state).not.toBe(localResult2.current.state)
  })
})
