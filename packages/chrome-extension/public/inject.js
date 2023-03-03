/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {type} file_path Local path of the internal script.
 * @param  {type} tag The tag as string, where the script will be append (default: 'body').
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0]
  var script = document.createElement('script')
  script.setAttribute('type', 'text/javascript')
  script.setAttribute('src', file_path)
  node.appendChild(script)
}

window.addEventListener('load', () => {
  window.addEventListener('message', event => {
    if (event.data.from === 'content.js') {
      chrome.runtime.sendMessage(event.data.message)
    }
  })

  const listener = message => {
    window.postMessage({ from: 'inject.js', message })
  }

  chrome.runtime.onMessage.addListener(listener)
})

injectScript(chrome.extension.getURL('content.js'), 'body')
