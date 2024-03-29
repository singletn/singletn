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
  const { getState, setName, setUser } = useSingletn(User)

  React.useEffect(() => {
    fetch('/user')
      .then(response => response.json)
      .then(data => setUser(data))
  }, [])

  return <input value={getState().name} onChange={e => setName(e.target.value)} />
}
```

## Share globally and locally

If your intention is to share the state globally, you can then use simply the reference to the class inside the `useSingletn` call. However, you can create local states by using `useLocalSingletn` instead.

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
  // This state will be deleted when component unmounts
  const user = useLocalSingletn(User)

  return (
    // ...
  )
}

```

In order to configure the behaviour of your local singletn instance, you can make use of a configuration object as a second parameter.

```js
export const App = () => {
  const user = useSingletn(User, {
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

## `SingletnController` component

This package also exports a `SingletnController` component. This allows you to avoid re-rendering your whole component when your state changes.

```js
import { SingletnState, SingletnController, getSingletn } from '@singletn/react-singletn'

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
        <SingletnController singletn={Counter} watchKeys="count">
          {({ state }) => (
            <h2>Count is {state.count}</h2>
          )}
        </SingletnController>
        <button onClick={decrease}>-</button>
        <button onClick={increase}>+</button>
      </div>
    </div>
  )
}

```

`SingletnController` component makes use of [render props pattern](https://reactjs.org/docs/render-props.html) in order to allow you to re-render only specific parts of the components, so that you don't have to do a complete re-render every time a small part of the state changes.

## Prevent rerenders

If your component will only use the methods from the singletn instance, in order to avoid re-rendering it every time the state changes, you can follow some of the following approaches:

```js
// simply tell the hook never to update
const { increase, decrease } = useSingletn(Counter, { shouldUpdate: () => false });

// similar to react effect dependencies
const { increase, decrease } = useSingletn(Counter, { watchKeys: [] });

// instead of using the hook, you can just get the instance from the original singletn instances map.
const { increase, decrease } = getSingletn(Counter)

// if using the SingletnController component, we can pass an empty array as `watch` prop
<SingletnController singletn={Counter} watch={[]}>{singletn => ( /* component */)}</SingletnController>
```

### `asSignal`

Using the `asSignal` decorator on your states allow you to skip the components re-render altogether. Here's how this can be done in order with the counter example:

```ts
import { SingletnState, SingletnController, getSingletn, asSignal } from '@singletn/react-singletn'

interface State {
  count: number
}

class Counter extends SingletnState<State> {
  state = {
    count: 0,
  } as State

  increase = () => this.setState(s => ({ count: s.count + 1 }))
  decrease = () => this.setState(s => ({ count: s.count - 1 }))

  displayCount = asSignal(() => this.state.count)
}

function App() {
  const { increase, decrease, displayCount } = getContainer(Counter)

  return (
    <div>
      <h1>Singletn Playground</h1>
      <div>
        <h2>Count is {state.displayCount()}</h2>

        <button onClick={decrease}>-</button>
        <button onClick={increase}>+</button>
      </div>
    </div>
  )
}
```

The code above wouldn't trigger a re-render of the `App` component. Instead, it will only update the DOM specifically where the counter is being displayed.

## Context

Although react-singletn isn't reliant on context, there are cases in which the context could be useful. In these cases, you can use `SingletnProvider`

```ts
const App = () => {
  return [1, 2, 3].map((id) => (
    <SingletnProvider singletn={Counter} key={id}>
      <Countdown />
    </SingletnProvider>
  ))
}

const Countdown = () => {
  const { increase, decrease, getState } = useSingletnContext(Counter)

  const { count } = getState()

  return (
    <div>
      <div>
        <h2>Count is {count}</h2>
        <button onClick={decrease}>-</button>
        <button onClick={increase}>+</button>
      </div>
    </div>
  )
}
```

## Other ways to store your state

`singletn` also allows you to use different base `SingletnState` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/local-storage](../local-storage)
- [@singletn/indexeddb](../indexeddb)
