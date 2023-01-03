import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

chrome.devtools.panels.create('Singletn', 'FontPicker.png', 'index.html', function(panel) {})
