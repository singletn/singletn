# @singletn/use-singletone

`@singletn/use-singletone` is a simpe hook to help you manage your global and local states without any need for configuration and no dependency on context.

## How to use it

In order to use `@singletn/use-singletone`, you need to create a class that extends `Singletone`, provided on the package.

```js
import { Singletone } from '@singletn/use-singletone'

interface User {
  name: string
  email: string
  phoneNumber: string
}

export class UserContainer extends Singletone<User> {
  public state = {
    name: '',
    email: '',
    phoneNumber: '',
  }

  public setUser = (user: User) => this.setState(user)

  public setName = (name) => this.setState({ name })

  public setEmail = (email) => this.setState({ email })

  // ...
}
```

Once you have your container, you can now start sharing its state:

```js
import * as React from 'react'
import { useSingletone } from 'singletn'
import { UserContainer } from './UserContainer'

export const App = () => {
  const user = useSingletone(UserContainer)

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
  // uses the global state for UserContainer
  const user = useSingletone(UserContainer)

  return (
    // ...
  )
}

export const App = () => {
  // creates a local state for UserContainer
  const[localUser] = React.useState(new UserContainer())
  const user = useSingletone(localUser)

  return (
    // ...
  )
}

```

In order to configure the behaviour of your local container instance, you can make use of a configuration object as a second parameter.

```js
export const App = () => {
  const [localUser] = React.useState(new UserContainer())
  const user = useSingletone(localUser, {
    // whether or not you want the container to be deleted when component unmounts.
    deleteOnUnmount: true,
    // receive a callback with the new state when there's a change
    onUpdate: (nextState) => {},
    // a function to resolve whether or not the changes to the state should trigger a rerender
    shouldTriggerUpdate: (prevState, nextState) => false,
    // An array of keys of the state object that, when changed, triggers a rerender
    // If it's an empty array, it never rerenders.
    watchKeys: ['name'],
  })

  return (
    // ...
  )
}

```

Note that the options object only acept one option between `shouldTriggerUpdate` and `watchKeys`.

## Other ways to store your state

`singletn` also allows you to use different base `Containers` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/container-local-storage](../singletn-container-local-storage)
- [@singletn/container-indexeddb](../singletn-container-indexeddb)
