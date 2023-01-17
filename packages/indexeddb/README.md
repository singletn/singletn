# @singletn/indexeddb  &#8194;[![npm version](https://img.shields.io/npm/v/@singletn/indexeddb.svg?style=flat)](https://www.npmjs.com/package/@singletn/indexeddb)

## Persist your data

If you'd like to have a persistent state in `indexeddb`, you can do so by having your state extend `IndexedDBSingletn`.

The implementation is the same as using the `SingletnState` from [@singletn/core](../singletn-core).

```js
import { IndexedDBSingletn } from '@singletn/indexeddb'

interface UserState {
  name: string
  email: string
  phoneNumber: string
}

export class User extends IndexedDBSingletn<UserState> {
  state = {
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

## Cleanup remark

Anytime that you use `clearSingletns` from [@singletn/core](../singletn-core), the databases created will be all cleared, and the data will, obviously, no longer persist.

If, however, you'd like to manually trigger a deletion of the database for any given singletn, you can call the `clearDB` method:

```js
export class User extends IndexedDBSingletn<UserState> {
  // ...

  public cleanup = () => this.clearDB()

  // ...
}
```

## Other ways to store your state

`singletn` also allows you to use different base states to store your data in other ways. Read more about it in the subprojects:

- [@singletn/core](../singletn-core)
- [@singletn/local-storage](../local-storage)
