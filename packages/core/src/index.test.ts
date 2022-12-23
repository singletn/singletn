import {
  getSingletone,
  singletonesMap,
  deleteSingletone,
  Singletone,
  emittersMap,
  Emitter,
} from '.'

describe('@singletn/core tests', () => {
  beforeAll(() => {
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: any) => window.setTimeout(cb as () => void, 0))

    jest.useFakeTimers()
  })

  beforeEach(() => {
    singletonesMap.clear()
  })

  it('should create singletone on map when getting singletone', () => {
    class Test extends Singletone {
      state = {
        test: '',
      }
    }

    expect(Array.from(singletonesMap.keys()).length).toBe(0)

    getSingletone(Test)

    expect(Array.from(singletonesMap.keys()).length).toBe(1)
  })

  it('should remove singletone from singletonesMap when deleting', () => {
    class Test extends Singletone {
      state = {
        test: '',
      }
    }

    class Test2 extends Singletone {
      state = {
        test: '',
      }
    }

    const cont = getSingletone(Test)
    getSingletone(Test2)

    expect(singletonesMap.get(Test)).not.toBeUndefined()

    deleteSingletone(cont)

    expect(singletonesMap.get(Test)).toBeUndefined()
  })
})
