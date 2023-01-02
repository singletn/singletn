# @singletn/react-singletn

`react-singletn` is a tiny library to help you manage your global and local states (based on [`@singletn/core`](../core)) without any need for configuration and no dependency on context.

## How to use it

In order to use `react-singletn`, you need to create a class that extends `Singletone`, provided on the package.

```js
import { Singletone } from '@singletn/react-singletn'

interface UserState {
  name: string
  email: string
  phoneNumber: string
}

export class User extends Singletone<UserState> {
  public state = {
    name: '',
    email: '',
    phoneNumber: '',
  }

  public setUser = (user: UserState) => this.setState(user)

  public setName = (name) => this.setState({ name })

  public setEmail = (email) => this.setState({ email })

  // ...
}
```

Once you have your singletone, you can now start sharing its state:

```js
import * as React from 'react'
import { useSingletone } from '@singletn/react-singletn'
import { User } from './User'

export const App = () => {
  const user = useSingletone(User)

  React.useEffect(() => {
    fetch('/user')
      .then(response => response.json)
      .then(data => user.setUser(data))
  }, [])

  return <input value={user.state.name} onChange={e => user.setName(e.target.value)} />
}
```

## Share globally and locally

If your intention is to share the state globally, you can then use simply the reference to the class inside the `useSingletone` call. However, you can create local states by creating instances of those classes.

```js
export const App = () => {
  // uses the global state for User
  const user = useSingletone(User)

  return (
    // ...
  )
}

export const App = () => {
  // creates a local state for User
  const localUser = React.useRef(new User())
  const user = useSingletone(localUser.current)

  return (
    // ...
  )
}

```

In order to configure the behaviour of your local singletone instance, you can make use of a configuration object as a second parameter.

```js
export const App = () => {
  const user = useSingletone(User, {
    // whether or not you want the singletone to be deleted when component unmounts.
    // Use `true` when the singletone used is for a local state.
    deleteOnUnmount: false,
    // receive a callback with the new state when there's a change
    onUpdate: (nextState) => {},
    // a function to resolve whether or not the changes to the state should trigger a rerender
    shouldUpdate: (prevState, nextState) => false,
    // An array of keys of the state object that, when changed, triggers a rerender
    // If it's an empty array, it never rerenders.
    watchKeys: ['name'],
  })

  return (
    // ...
  )
}

```

Note that the options object only acept one option between `shouldUpdate` and `watchKeys`.

## `Singletn` component
This package also exports a `Singletn` component. This allows you to avoid re-rendering your whole component when your state changes.

```js
import { Singletone, Singletn, getSingletone } from '@singletn/react-singletn'

interface State {
  count: number
}

class Counter extends Singletone<State> {
  state = {
    count: 0,
  } as State

  increase = () => this.setState(s => ({ count: s.count + 1 }))
  decrease = () => this.setState(s => ({ count: s.count - 1 }))
}

function App() {
  return (
    <div>
      <h1>Singletn Playground</h1>
      <div>
        <Singletn singletone={Counter} watch="count">
          {({ state }) => <h2>Count is {state.count}</h2>}
        </Singletn>

        <button onClick={getSingletone(Counter).decrease}>-</button>
        <button onClick={getSingletone(Counter).increase}>+</button>
      </div>
    </div>
  )
}

```

`Singletn` component makes use of [render props pattern](https://reactjs.org/docs/render-props.html) in order to allow you to re-render only specific parts of the components, so that you don't have to do a complete re-render every time a small part of the state changes.

## Prevent rerenders

If your component will only use the methods from the singletone instance, in order to avoid re-rendering it every time the state changes, you can follow some of the following approaches:

```js
function App() {
  // simply tell the hook never to update
  const { increase, decrease } = useSingletone(Counter, { shouldUpdate: () => false });

  // the hook would only trigger a rerender if a key that's being 
  // watched changes, which will never happen in this case.
  const { increase, decrease } = useSingletone(Counter, { watchKeys: [] });

  // instead of using the hook, you can just get the 
  // instance from the original singletone instances map.
  const { increase, decrease } = getSingletone(Counter)

  // in essence, same approach as above, but with memo.
  const { increase, decrease } = React.useMemo(() => getSingletone(Counter), [])
}
```

## Other ways to store your state

`singletn` also allows you to use different base `Singletone` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/local-storage](../local-storage)
- [@singletn/indexeddb](../indexeddb)
