# @singletn/container-indexeddb

## Persist your data

If you'd like to have a persistent state in `indexeddb`, you can do so by having your container extend `IndexedDBSingletone`.

The implementation is the same as using the `Singletone` from [@singletn/core](../singletn-core).

```js
import { IndexedDBSingletone } from '@singletn/container-indexeddb'

interface User {
  name: string
  email: string
  phoneNumber: string
}

export class UserContainer extends IndexedDBSingletone<User> {
  state = {
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

## Cleanup remark

Anytime that you use `clearSingletones` from [@singletn/core](../singletn-core), the databases created will be all cleared, and the data will, obviously, no longer persist.

If, however, you'd like to manually trigger a deletion of the database for any given container, you can call the `clearDB` method:

```js
export class UserContainer extends IndexedDBSingletone<User> {
  // ...

  public cleanup = () => this.clearDB()

  // ...
}
```

## Other ways to store your state

`singletn` also allows you to use different base `Containers` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/core](../singletn-core)
- [@singletn/container-local-storage](../singletn-container-local-storage)
