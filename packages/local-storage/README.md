# @singletn/container-local-storage  &#8194;[![npm version](https://img.shields.io/npm/v/@singletn/local-storage.svg?style=flat)](https://www.npmjs.com/package/@singletn/local-storage)

## Persist your data

If you'd like to have a persistent state in your `localStorage`, you can do so by having your container extend `LocalStorageSingletone`.

When extending `LocalStorageSingletone`, there's a small requirement you need to follow: you need to have a `constructor` method in your container, that calls `super()` with the initial state. Here's how your state would look like with `LocalStorageSingletone`:

```js
import { LocalStorageSingletone } from '@singletn/container-local-storage'

interface UserState {
  name: string
  email: string
  phoneNumber: string
}

export class User extends LocalStorageSingletone<UserState> {
  constructor() {
    // First parameter is used to prefix all the keys for this singletone.
    // Make sure this key is unique to avoid having broken data.
    super('userData', {
      name: '',
      email: '',
      phoneNumber: '',
    })
  }

  public setUser = (user: UserState) => this.setState(user)

  public setName = (name) => this.setState({ name })

  public setEmail = (email) => this.setState({ email })

  // ...
}
```

The `constructor` is necessary so that the initial state can use the stored data keys and have the default values as fallbacks. The constructor params are:


| Name          | Description |
| ------------- | ----------- |
| `singletoneKey` | Unique key to be used to prefix all keys on local storage that refers to this singletone |
| `initialState`  | A state to be used as a fallback for when the local storage does not contain any definition for the keys expected from the state |

