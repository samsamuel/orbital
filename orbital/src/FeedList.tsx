import React, { useEffect, useState, useRef } from 'react'
import { fetchAllFeeds } from './feedUtils'
import './App.css'
import { useTransition, animated } from '@react-spring/web'

const defaultSettings = {
  date: true,
  time: true,
  age: true,
  source: true,
}

function FeedList({ feedUrls }: { feedUrls: string[] }) {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLoad, setFirstLoad] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('bauhaus-settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })
  const timer = useRef<NodeJS.Timeout | null>(null)

  function storiesAreEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i].link !== b[i].link) return false
    }
    return true
  }

  const loadFeeds = async (isFirst = false) => {
    if (!feedUrls.length) return
    if (isFirst) setLoading(true)
    const feeds = await fetchAllFeeds(feedUrls)
    const allStories = feeds.flatMap(feed => feed.items.map((item: any) => ({ ...item, feedTitle: feed.title })))
    const sortedStories = allStories.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
    const newStories = sortedStories.slice(0, 30)
    setStories(prev => storiesAreEqual(prev, newStories) ? prev : newStories)
    if (isFirst) {
      setLoading(false)
      setFirstLoad(false)
    }
  }

  useEffect(() => {
    setFirstLoad(true)
    loadFeeds(true)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => loadFeeds(false), 15000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [feedUrls])

  useEffect(() => {
    localStorage.setItem('bauhaus-settings', JSON.stringify(settings))
  }, [settings])

  const transitions = useTransition(stories, {
    keys: story => story.link,
    from: { opacity: 0, transform: 'translateY(-32px)' },
    enter: { opacity: 1, transform: 'translateY(0)' },
    leave: { opacity: 0, transform: 'translateY(32px)' },
    config: { tension: 220, friction: 22 },
    trail: 0,
    sort: (a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime(),
  })

  return (
    <main className="bauhaus-main">
      <div className="bauhaus-header">
        <button className="bauhaus-gear" aria-label="Settings" onClick={() => setSettingsOpen(v => !v)}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="4" width="4" height="20" rx="2" fill="#222"/>
            <rect x="4" y="12" width="20" height="4" rx="2" fill="#222"/>
          </svg>
        </button>
        {settingsOpen && (
          <div className="bauhaus-settings-menu">
            <h2>Subtitle Info</h2>
            {Object.entries(defaultSettings).map(([key, label]) => (
              <label key={key} className="bauhaus-settings-option">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="bauhaus-feed-list scroll-hide">
        {loading && firstLoad && <div className="feed-loading">Loading...</div>}
        {transitions((style, story, t, index) => (
          <animated.a
            className="bauhaus-headline-row"
            href={story.link}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            role="link"
            style={{
              ...style,
              textAlign: 'left',
              width: '100%',
            }}
            key={story.link}
          >
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div
                className="headline"
                style={{
                  fontSize: index === 0 ? '4.3em' : '3.2em',
                  fontWeight: 900,
                  textAlign: 'left',
                  lineHeight: 1.18,
                  transition: 'font-size 0.18s cubic-bezier(.7,0,.3,1)',
                }}
              >
                {story.title}
              </div>
              <BauhausSubtitle story={story} settings={settings} />
              {story.contentSnippet && (
                <div className="subheadline" style={{ textAlign: 'left' }}>{story.contentSnippet}</div>
              )}
            </div>
          </animated.a>
        ))}
      </div>
    </main>
  )
}

function BauhausSubtitle({ story, settings }: { story: any, settings: typeof defaultSettings }) {
  const parts: string[] = []
  if ((settings.date || settings.time || settings.age) && story.pubDate) {
    const dateObj = new Date(story.pubDate)
    if (settings.date) parts.push(dateObj.toLocaleDateString())
    if (settings.time) parts.push(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    if (settings.age) {
      const now = new Date()
      const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
      let age = ''
      if (diff < 60) age = `${diff}s ago`
      else if (diff < 3600) age = `${Math.floor(diff/60)}m ago`
      else if (diff < 86400) age = `${Math.floor(diff/3600)}h ago`
      else age = `${Math.floor(diff/86400)}d ago`
      parts.push(age)
    }
  }
  if (settings.source && story.feedTitle) parts.push(story.feedTitle)
  if (!parts.length) return null
  return <div className="bauhaus-subtitle">{parts.join(' · ')}</div>
}

export default FeedList
