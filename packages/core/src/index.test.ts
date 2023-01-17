import { getSingletn, singletnsMap, deleteSingletn, SingletnState } from '.'

describe('@singletn/core tests', () => {
  beforeAll(() => {
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: any) => window.setTimeout(cb as () => void, 0))

    jest.useFakeTimers()
  })

  beforeEach(() => {
    singletnsMap.clear()
  })

  it('should create singletn on map when getting singletn', () => {
    class Test extends SingletnState {
      state = {
        test: '',
      }
    }

    expect(Array.from(singletnsMap.keys()).length).toBe(0)

    getSingletn(Test)

    expect(Array.from(singletnsMap.keys()).length).toBe(1)
  })

  it('should remove singletn from singletnsMap when deleting', () => {
    class Test extends SingletnState {
      state = {
        test: '',
      }
    }

    class Test2 extends SingletnState {
      state = {
        test: '',
      }
    }

    const cont = getSingletn(Test)
    getSingletn(Test2)

    expect(singletnsMap.get(Test)).not.toBeUndefined()

    deleteSingletn(cont)

    expect(singletnsMap.get(Test)).toBeUndefined()
  })
})
