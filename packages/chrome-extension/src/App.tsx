import { useEffect, useState } from 'react'
import app from './App.module.css'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer'
import { Chevron } from './Chevron'

type Emission = {
  id: string
  prevState: unknown
  nextState: unknown
  singletnName: string
  methodName: string
}

const handleRevertToState = async (message: { revertToState: unknown; id: string }) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (typeof tab.id === 'number') {
      chrome.tabs.sendMessage(tab.id, message)
    }
  })
}

function App() {
  const [emissions, setEmissions] = useState<Emission[]>([])
  const [inspecting, setInspecting] = useState<Emission | null>()

  useEffect(() => {
    const listener = (req: Emission) => {
      setEmissions(e => [req, ...e])
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  return (
    <div className={app.app}>
      <h1 style={{ paddingLeft: 16 }}>Singletn</h1>

      <ul className={app.emissionsList}>
        {emissions.length === 0 ? (
          <p>Waiting for changes to your states.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p>State changes:</p>
            <button onClick={() => setEmissions([])}>Clear</button>
          </div>
        )}
        {emissions.map(e => (
          <>
            <li
              className={app.emission}
              key={e.id}
              onClick={() => setInspecting(inspecting?.id === e.id ? null : e)}
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {e.singletnName} <Chevron style={{ fill: 'white', width: 20, height: 20 }} />{' '}
                {e.methodName}
              </div>
              <div
                className={`${app.chevron} ${inspecting?.id === e.id ? app['chevron--open'] : ''}`}
              >
                <Chevron style={{ fill: 'white', width: 40, height: 40 }} />
              </div>
            </li>
            {inspecting?.id === e.id && (
              <>
                <li
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <button
                    style={{
                      zIndex: 100,
                      padding: '2px 4px',
                      fontSize: '0.75rem',
                      fontWeight: 'normal',
                    }}
                    onClick={ev => {
                      handleRevertToState({
                        id: e.id,
                        revertToState: inspecting?.prevState,
                      })
                      ev.stopPropagation()
                    }}
                  >
                    Revert to previous state
                  </button>
                  <button
                    style={{
                      zIndex: 100,
                      padding: '2px 4px',
                      fontSize: '0.75rem',
                      fontWeight: 'normal',
                    }}
                    onClick={ev => {
                      handleRevertToState({
                        id: e.id,
                        revertToState: inspecting?.nextState,
                      })

                      ev.stopPropagation()
                    }}
                  >
                    Revert to next state
                  </button>
                </li>

                <li
                  className={app.emission}
                  style={{ height: 'auto', paddingBottom: 16, borderTop: 'none' }}
                >
                  <ReactDiffViewer
                    oldValue={JSON.stringify(inspecting?.prevState, null, 2)}
                    newValue={JSON.stringify(inspecting?.nextState, null, 2)}
                    splitView
                    useDarkTheme
                    compareMethod={DiffMethod.WORDS_WITH_SPACE}
                    styles={{
                      variables: {
                        dark: {
                          diffViewerTitleColor: 'white',
                        },
                      },
                      gutter: {
                        boxSizing: 'border-box',
                        minWidth: 16,
                      },
                    }}
                    leftTitle={<div className="diff-header">Previous State </div>}
                    rightTitle={<div className="diff-header">New State </div>}
                  />
                </li>
              </>
            )}
          </>
        ))}
      </ul>
    </div>
  )
}

export default App
