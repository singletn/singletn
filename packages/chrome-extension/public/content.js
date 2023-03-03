window.addEventListener('load', () => {
  if (!!window.$singletn) {
    try {
      window.$singletn.emitter.subscribe(message => {
        window.postMessage({ from: 'content.js', message })
      })
    } catch (e) {
      console.error(e)
    }

    window.addEventListener('message', event => {
      if (event.data.from === 'inject.js') {
        if (!!window.$singletn) {
          window.$singletn.emit(event.data.message)
        }
      }
    })
  }
})
