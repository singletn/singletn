if (!!window.$singletn) {
  try {
    const unsubscribe = window.$singletn.emitter.subscribe(message => {
      window.postMessage({ from: 'content.js', message })
    })
  } catch (e) {
    console.error(e)
  }
}
