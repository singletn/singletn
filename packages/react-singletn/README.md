# @singletn/react-singletn &#8194;[![npm version](https://img.shields.io/npm/v/@singletn/react-singletn.svg?style=flat)](https://www.npmjs.com/package/@singletn/react-singletn)

`react-singletn` is a tiny library to help you manage your global and local states (based on [`@singletn/core`](../core)) without any need for configuration and no dependency on context.

## Installing

```sh
yarn add @singletn/react-singletn
```

or

```sh
npm i @singletn/react-singletn
```

## Basic usage

To quickly demonstrate how to start using `singletn` with your react app, we'll simply show how to convert a basic counter managed via `React.useState` hook into a `Singletn` state that can use hooks or our components.

### The React.useState way

Let's say we have a simple component:

```js
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count => count + 1)}>count is {count}</button>
    </div>
  )
}
```

So, to convert this to a `singletn` state, first step is to create a class that extends `SingletnState`:

```js
import { SingletnState } from '@singletn/react-singletn'

// SingletnState takes a generic type to type the state
class CounterState extends SingletnState<{ counter: number }> {
  // initialize the state
  state = {
    counter: 0,
  }

  // expose a method that changes the state.
  increase = () => this.setState(s => ({ counter: s.counter + 1 }))
}
```

Ok! This should be enough for us to start working with our new `Sigletn` state. Let's see how to do that:

First, we should import the hook we'll use

```js
import { useSingletn } from '@singletn/react-singletn'
```

After that, we can replace the React.setState hook with `useSingletn` hook.
```diff
- const [count, setCount] = useState(0)
+ const { state, increase } = useSingletn(CounterState)
```

Now, we can make the adjustment to the button:

```diff
- <button onClick={() => setCount(count => count + 1)}>count is {count}</button>
+ <button onClick={increase}>count is {state.count}</button>
```

That's all you need to do to convert your local state to use `Singletn` state. 🎉

Next, let's see some other usages

### Starting anew

In order to use `react-singletn`, you need to create a class that extends `SingletnState`, provided on the package.

```js
import { SingletnState } from '@singletn/react-singletn'

interface UserState {
  name: string
  email: string
  phoneNumber: string
}

export class User extends SingletnState<UserState> {
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

Once you have your singletn, you can now start sharing its state:

```js
import * as React from 'react'
import { useSingletn } from '@singletn/react-singletn'
import { User } from './User'

export const App = () => {
  const user = useSingletn(User)

  React.useEffect(() => {
    fetch('/user')
      .then(response => response.json)
      .then(data => user.setUser(data))
  }, [])

  return <input value={user.state.name} onChange={e => user.setName(e.target.value)} />
}
```

## Share globally and locally

If your intention is to share the state globally, you can then use simply the reference to the class inside the `useSingletn` call. However, you can create local states by creating instances of those classes.

```js
export const App = () => {
  // uses the global state for User
  const user = useSingletn(User)

  return (
    // ...
  )
}

export const App = () => {
  // creates a local state for User
  const localUser = React.useRef(new User())
  const user = useSingletn(localUser.current)

  return (
    // ...
  )
}

```

In order to configure the behaviour of your local singletn instance, you can make use of a configuration object as a second parameter.

```js
export const App = () => {
  const user = useSingletn(User, {
    // whether or not you want the singletn to be deleted when component unmounts.
    // Use `true` when the singletn used is for a local state.
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
import { SingletnState, Singletn, getSingletn } from '@singletn/react-singletn'

interface State {
  count: number
}

class Counter extends SingletnState<State> {
  state = {
    count: 0,
  } as State

  increase = () => this.setState(s => ({ count: s.count + 1 }))
  decrease = () => this.setState(s => ({ count: s.count - 1 }))
}

function App() {
  const { increase, decrease } = React.useMemo(() => getContainer(Counter), [])

  return (
    <div>
      <h1>Singletn Playground</h1>
      <div>
        <Singletn singletn={Counter} watch="count">
          {({ state }) => (
            <h2>Count is {state.count}</h2>
          )}
        </Singletn>
        <button onClick={decrease}>-</button>
        <button onClick={increase}>+</button>
      </div>
    </div>
  )
}

```

`Singletn` component makes use of [render props pattern](https://reactjs.org/docs/render-props.html) in order to allow you to re-render only specific parts of the components, so that you don't have to do a complete re-render every time a small part of the state changes.

## Prevent rerenders

If your component will only use the methods from the singletn instance, in order to avoid re-rendering it every time the state changes, you can follow some of the following approaches:

```js
// simply tell the hook never to update
const { increase, decrease } = useSingletn(Counter, { shouldUpdate: () => false });

// the hook would only trigger a rerender if a key that's being 
// watched changes, which will never happen in this case.
const { increase, decrease } = useSingletn(Counter, { watchKeys: [] });

// instead of using the hook, you can just get the 
// instance from the original singletn instances map.
const { increase, decrease } = getSingletn(Counter)

// in essence, same approach as above, but with memo.
const { increase, decrease } = React.useMemo(() => getSingletn(Counter), [])

// if using the Singletn component, we can pass an empty array as `watch` prop
<Singletn singletn={Counter} watch={[]}></Singletn>
```

## Other ways to store your state

`singletn` also allows you to use different base `SingletnState` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/local-storage](../local-storage)
- [@singletn/indexeddb](../indexeddb)
