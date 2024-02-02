import {
  getSingletn,
  singletnsMap,
  deleteSingletn,
  SingletnState,
  findSingletn,
  getSingletnKey,
} from '.'

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

  it("Throws if given parameter isn't a SingletnState", () => {
    expect(() => {
      findSingletn(Date as any)
    }).toThrowError('SingletnState used does not meet the required implementation')
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

    const key = getSingletnKey(Test)

    expect(singletnsMap.get(key)).not.toBeUndefined()

    deleteSingletn(cont)

    expect(singletnsMap.get(getSingletnKey(key))).toBeUndefined()
  })
})
