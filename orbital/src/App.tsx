import './App.css'
import { useRef, useState } from 'react'
import FeedList from './FeedList'

function App() {
  const [feedUrls, setFeedUrls] = useState<string[]>([])
  const [showOverlay, setShowOverlay] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [inputMode, setInputMode] = useState<'opml' | 'url'>('opml')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleOPML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true)
      setError('')
      try {
        const { parseOPML } = await import('./feedUtils')
        const urls = await parseOPML(e.target.files[0])
        if (!urls.length) throw new Error('No feeds found in OPML')
        setFeedUrls(urls)
        setShowOverlay(false)
      } catch (err: any) {
        setError(err.message || 'Failed to parse OPML')
      }
      setLoading(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!urlInput) return
    setLoading(true)
    setFeedUrls([urlInput])
    setShowOverlay(false)
    setLoading(false)
  }

  return (
    <div className="App">
      {showOverlay ? (
        <div className="bauhaus-overlay-ui">
          <h1>Bauhaus Newsreader</h1>
          <div className="bauhaus-overlay-tabs">
            <button
              className={inputMode === 'opml' ? 'bauhaus-tab-active' : 'bauhaus-tab'}
              onClick={() => setInputMode('opml')}
            >OPML Upload</button>
            <button
              className={inputMode === 'url' ? 'bauhaus-tab-active' : 'bauhaus-tab'}
              onClick={() => setInputMode('url')}
            >Feed URL</button>
          </div>
          {inputMode === 'opml' && <>
            <button onClick={handleUploadClick} className="bauhaus-upload-btn">Upload OPML</button>
            <input
              type="file"
              accept=".opml,.xml"
              ref={fileInputRef}
              onChange={handleOPML}
              style={{ display: 'none' }}
            />
          </>}
          {inputMode === 'url' && <>
            <form onSubmit={handleUrlSubmit} className="bauhaus-url-form">
              <input
                type="url"
                placeholder="https://example.com/feed.xml"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="bauhaus-url-input"
                required
              />
              <button type="submit" className="bauhaus-upload-btn">Load Feed</button>
            </form>
          </>}
          {loading && <div className="feed-loading">Loading...</div>}
          {error && <div className="bauhaus-error">{error}</div>}
        </div>
      ) : (
        <FeedList feedUrls={feedUrls} />
      )}
    </div>
  )
}

export default App
