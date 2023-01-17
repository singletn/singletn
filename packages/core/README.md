# singletn  &#8194;[![npm version](https://img.shields.io/npm/v/@singletn/core.svg?style=flat)](https://www.npmjs.com/package/@singletn/core) [![gzip size](http://img.badgesize.io/https://unpkg.com/@singletn/core/dist/index.js?compression=gzip&label=gzip)](https://unpkg.com/@singletn/core/dist/index.js)


`@singletn/core` is a zero dependency, minimal, simple and reactive way to store your data, in any type of javascript/typescript application.

## How to use it

In order to use `@singletn/core`, you need to create a class that extends `SingletnState`, provided on the package.

```js
import { SingletnState } from '@singletn/core'

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

  public setName = (name: string) => this.setState({ name })

  public setEmail = (email: string) => this.setState({ email })

  // ...
}
```

Once you have your singletn, you can now start sharing its state by accessing it's singleton:

```js
const userInstance = getSingletn(User)
```

The way `getSingletn` works is: if there's already an instance of `User`, it'll return that instance. If not, it'll create a new one, that will then be returned everytime `getSingletn` is called.

## Act when it matters

In order to detect everytime that the state is changed, you can use the `subscribeListener` function.

```js
const userInstance = getSingletn(User)

const unsubscribe = subscribeListener(userInstance, () => {
  // do something with the new state!
})

// Whenever the state changes are no longer relevant, just stop listening
unsubscribe()
```

Note that the `subscribeListener` function returns another function for unsubscribing. Call it whenever the state is no longer relevant, or on unmount.

## Prevent emitting changes

In order to prevent emitting changes, all you need to do is pass a second param to `setState` calls as true. 
The `setState` function accepts two parameters:

| Parameter | Description |
| --------- | ----------- |
| `updater`   | This parameter can either be a function that receives current state as a parameter and returns a new state or a partial/complete new state to be merged to current state. |
| `silent` | Optional boolean parameter that defaults to `false`. When set to `true`, prevents emitting event to listeners |

## Can my singletn be, well, not a singletn? 🤓

Well, yes! Although we must advise to use this carefully, here's one possible approach to do so:

```js
const johnInstance = getSingletn(new User())
const maryInstance = getSingletn(new User())

john.setName("John");
mary.setName("Mary");

console.log(john.state.name) // John
console.log(mary.state.name) // Mary
```

Notice that `getSingletn` accepts both the class itself and an instance of a class. You can see that by following the code bellow:

```js
const user = getSingletn(new User())

console.log(getSingletn(user) === user) // true
```

This happens because `getSingletn` detects if the parameter sent is an instance of a class, and, if so, returns that class straight away. Otherwise, it makes a lookup to a map that holds the instances of the singletns, returning the one with the key being the class passed as parameter. 

## Clear everything

If at any point you need to clear all your data (commonly due to a user sign out, for instance), you can simply call `clearSingletns` function.
This will remove all the singletns stored and managed by `@singletn/core`.

### .destroy()

While clearing the singletns, a `destroy` function will be called. This is so that you can cleanup any backgroud task you may have running.

```js
export class User extends SingletnState<UserState> {
  constructor() {
    super()
    this.interval = setInterval(() => {
      // do things.
    }, 5000)
  }

  destroy = () => {
    clearInterval(this.interval)
  }
}
```

## Other ways to store your state

`singletn` also allows you to use different base `SingletnState` to store your states in other ways. Read more about it in the subprojects:

- [@singletn/local-storage](../local-storage)
- [@singletn/ndexeddb](../indexeddb)
