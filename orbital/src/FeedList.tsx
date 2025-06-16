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

function FeedList({ feedUrls, settingsOnly, settings, setSettings }: {
  feedUrls: string[],
  settingsOnly?: boolean,
  settings: typeof defaultSettings,
  setSettings: React.Dispatch<React.SetStateAction<typeof defaultSettings>>
}) {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLoad, setFirstLoad] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const timer = useRef<NodeJS.Timeout | null>(null)

  // Helper to compare arrays of stories by link
  function storiesAreEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i].link !== b[i].link) return false
    }
    return true
  }

  // Fetch and update stories every 15 seconds, but only update if changed
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
    if (settingsOnly) return
    setLoading(true)
    loadFeeds(true)
    timer.current = setInterval(() => loadFeeds(), 15000)
    return () => timer.current && clearInterval(timer.current)
  }, [feedUrls, settingsOnly])

  // Animate feed list
  const transitions = useTransition(stories, {
    keys: story => story.link,
    from: { opacity: 0, transform: 'translateY(20px)' },
    enter: { opacity: 1, transform: 'translateY(0)' },
    leave: { opacity: 0, transform: 'translateY(-20px)' },
    trail: 40,
  })

  return settingsOnly ? (
    <div className="bauhaus-header" style={{ position: 'relative' }}>
      <button className="bauhaus-gear" aria-label="Settings" onClick={() => setSettingsOpen(v => !v)}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="7" width="20" height="3" rx="1.5" fill="#222"/>
          <rect x="4" y="13" width="20" height="3" rx="1.5" fill="#222"/>
          <rect x="4" y="19" width="20" height="3" rx="1.5" fill="#222"/>
        </svg>
      </button>
      {settingsOpen && (
        <div className="bauhaus-settings-menu" style={{ right: 0, left: 'auto' }}>
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
  ) : (
    <main className={"bauhaus-main" }>
      <div className="bauhaus-header" style={{ position: 'relative' }}>
        <div style={{ flex: 1 }} />
      </div>
      <div className="bauhaus-feed-list scroll-hide">
        {loading && firstLoad && <div className="feed-loading">Loading...</div>}
        {transitions((style, story) => (
          <animated.a
            className="bauhaus-headline-row"
            href={story.link}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            role="link"
            style={{ ...style, textAlign: 'left', width: '100%' }}
            key={story.link}
          >
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div className="headline" style={{ fontSize: '3.2em', textAlign: 'left' }}>{story.title}</div>
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
      if (diff < 60) {
        age = `${diff} seconds ago`
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60)
        age = mins === 1 ? '1min ago' : `${mins}mins ago`
      } else if (diff < 86400) {
        const hrs = Math.floor(diff / 3600)
        age = hrs === 1 ? '1hr ago' : `${hrs}hrs ago`
      } else {
        age = `${Math.floor(diff / 86400)} days ago`
      }
      parts.push(age)
    }
  }
  if (settings.source && story.feedTitle) {
    parts.push(story.feedTitle)
  }
  return (
    <div className="bauhaus-subtitle" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.8em', color: '#555' }}>
      {parts.map((part, index) => (
        <span key={index} className="bauhaus-subtitle-part" style={{ whiteSpace: 'nowrap' }}>
          {index > 0 && <span style={{ margin: '0 0.4em' }}>•</span>}
          {part}
        </span>
      ))}
    </div>
  )
}

export default FeedList
