import { IndexedDBSingletn } from '.'
import 'fake-indexeddb/auto'
import { createInstance } from 'localforage'

interface ObjectContainerState {
  name: string
  age: number
  items: Array<string>
}

const defaultState = {
  name: '',
  age: 0,
  items: [] as string[],
}

class ObjectContainerIndexedDb extends IndexedDBSingletn<ObjectContainerState> {
  state = defaultState

  public setName = (name: string) => this.setState({ name })

  public setAge = (age: number) => this.setState({ age })

  public addItem = (item: string) => this.setState(s => ({ items: [...s.items, item] }))
}

const flushPromises = () => new Promise(setImmediate)

describe('Test `IndexedDBSingletn` class', () => {
  it('Should create container with default state', () => {
    const container = new ObjectContainerIndexedDb('container')

    expect(container.state).toEqual(defaultState)
  })

  it('Should set container state values and store on localStorage', async () => {
    const container = new ObjectContainerIndexedDb('container')
    const dbInstance = createInstance({ name: 'ObjectContainerIndexedDb' })

    // Age
    const newAge = 25
    container.setAge(25)
    await flushPromises()
    const storedAge = await dbInstance.getItem('age')

    expect(container.state.age).toEqual(newAge)
    expect(storedAge).toBe(newAge)

    // Name
    const newName = 'Nic'
    container.setName(newName)
    await flushPromises()
    const storedName = await dbInstance.getItem('name')

    expect(container.state.name).toEqual(newName)
    expect(storedName).toEqual(newName)

    // Items
    const newItem = 'Ball'
    container.addItem(newItem)
    await flushPromises()
    const storedItems = await dbInstance.getItem('items')

    expect(container.state.items).toEqual([newItem])
    expect(storedItems).toEqual([newItem])
  })
})
