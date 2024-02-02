import React, { PropsWithChildren } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react-hooks'
import { singletnsMap, SingletnState, getSingletn, createSingletnInstance } from '@singletn/core'
import { useLocalSingletn } from './hooks/use-local-singletn'
import { useSingletn } from './hooks/use-singletn'
import { useSingletnState } from './hooks/use-singletn-state'
import { SingletnProvider, useSingletnContext } from './context'
import { SingletnSignalState } from './as-signal'

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
  constructor(name = '', age = 0, items = []) {
    super()
    this.state = {
      name,
      age,
      items,
    }
  }

  public setName = (name: string) => this.setState({ name })

  public setAge = (age: number) => this.setState({ age })

  public addItem = (item: string) => this.setState(s => ({ items: [...s.items, item] }))
}

class ClassWithConstructor extends SingletnState<{ test: number }> {
  anotherVal: string

  constructor(initialVal: number, anotherVal: string) {
    super()
    this.state = {
      test: initialVal,
    }

    this.anotherVal = anotherVal
  }
}

jest.mock('@singletn/core', () => {
  const singletn = require('../../core/src')
  return singletn
})

describe('`useSingletn` tests', () => {
  beforeEach(() => {
    singletnsMap.clear()
  })

  it('Instantiate with constructor value', () => {
    const { result } = renderHook(() => useSingletn([ClassWithConstructor, 123]))
    const container = result.current

    expect(container.getState().test).toBe(123)
  })

  it('Instantiate with constructor multiple values', () => {
    const { result } = renderHook(() => useSingletn([ClassWithConstructor, 123, 'val']))
    const container = result.current

    expect(container.getState().test).toBe(123)
    expect(container.anotherVal).toBe('val')
  })

  it('Sets num', () => {
    const { result } = renderHook(() => useSingletn(Num))
    const container = result.current

    expect(container.getState().num).toBe(0)

    act(() => container.setNum(12))
    expect(container.getState().num).toBe(12)
  })

  it('Updates state with complex object', () => {
    const { result } = renderHook(() => useSingletn(ObjectContainer))
    const container = result.current

    act(() => container.setAge(12))
    expect(container.getState().age).toBe(12)

    act(() => container.setName('Nic'))
    expect(container.getState().name).toBe('Nic')

    act(() => container.addItem('Ball'))
    expect(container.getState().items.length).toBe(1)
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

  it('Should be able to useSingletnState', () => {
    const { result } = renderHook(() => useSingletnState(ObjectContainer))
    const state = result.current

    expect(state).toEqual(getSingletn(ObjectContainer).getState())
  })

  it('Should create a new instance when using useLocalSingletn', () => {
    const { result: globalResult } = renderHook(() => useSingletn(ObjectContainer))
    const { result: localResult } = renderHook(() => useLocalSingletn(ObjectContainer))

    expect(localResult.current.getState()).toEqual(globalResult.current.getState())

    const { result: localResult2 } = renderHook(() => useLocalSingletn(ObjectContainer))

    expect(localResult.current.getState()).toEqual(localResult2.current.getState())
  })

  it('Should have access to singletn instance from context', () => {
    const instance = createSingletnInstance(ObjectContainer)

    const wrapper = ({ children }: PropsWithChildren) => (
      <SingletnProvider singletn={instance}>{children}</SingletnProvider>
    )

    const { result } = renderHook(() => useSingletnContext(instance), { wrapper })

    expect(result.current).toEqual(instance)
  })

  it('Should create singletn instance in context with constructor params', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <SingletnProvider singletn={[ClassWithConstructor, 123, 'test']}>{children}</SingletnProvider>
    )

    const { result } = renderHook(() => useSingletnContext(ClassWithConstructor), { wrapper })

    expect(result.current.getState().test).toEqual(123)
  })

  it('Should return all instances that exist in nested contexts', () => {
    const objectInstance = createSingletnInstance(ObjectContainer)
    const numInstance = createSingletnInstance(Num)

    const wrapper = ({ children }: PropsWithChildren) => (
      <SingletnProvider singletn={objectInstance}>
        <SingletnProvider singletn={numInstance}>{children}</SingletnProvider>
      </SingletnProvider>
    )

    const { result: resultObject } = renderHook(() => useSingletnContext(objectInstance), {
      wrapper,
    })
    const { result: resultNum } = renderHook(() => useSingletnContext(numInstance), { wrapper })

    expect(resultObject.current).toEqual(objectInstance)
    expect(resultNum.current).toEqual(numInstance)
  })

  it('Should return closest instance when multiple contexts with same Singletn', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <SingletnProvider singletn={[ObjectContainer, 'Test 1']}>
        <SingletnProvider singletn={[ObjectContainer, 'Test 2']}>{children}</SingletnProvider>
      </SingletnProvider>
    )

    const { result: resultObject } = renderHook(() => useSingletnContext(ObjectContainer), {
      wrapper,
    })

    expect(resultObject.current.getState().name).toEqual('Test 2')
  })

  it('Should re-render when state of contextual singletn changes', () => {
    const onUpdate = jest.fn()

    const wrapper = ({ children }: PropsWithChildren) => (
      <SingletnProvider singletn={[ObjectContainer, 'Test 1']}>{children}</SingletnProvider>
    )

    const { result: resultObject } = renderHook(
      () => useSingletnContext([ObjectContainer, 'Test 1'], { onUpdate }),
      {
        wrapper,
      },
    )

    expect(resultObject.current.getState().name).toEqual('Test 1')

    act(() => {
      resultObject.current.setName('Test 2')
    })

    expect(resultObject.current.getState().name).toEqual('Test 2')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Should create a signal to update specific DOM nodes', async () => {
    class Test extends SingletnSignalState<{ test: string }> {
      state = { test: 'This is a test' }

      renderTest = this.asSignal(() => this.state.test)
    }

    const testInstance = getSingletn(Test)

    render(<div>{testInstance.renderTest()}</div>)

    expect(screen.getByText('This is a test')).not.toBeNull()

    act(() => {
      testInstance.setState({ test: 'This is a new test' })
    })

    await waitFor(() => expect(screen.queryByText('This is a test')).toBeNull())
    expect(screen.getByText('This is a new test')).not.toBeNull()
  })
})
