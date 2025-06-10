import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { parseOPML, fetchAllFeeds } from './feedUtils'
import './App.css'

function FeedCard({ story, position }: { story: any, position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2, 1.2, 0.1]} />
        <meshStandardMaterial color={'#fff'} />
      </mesh>
      <Html center style={{ width: 320 }}>
        <div className="feed-card">
          <a href={story.link} target="_blank" rel="noopener noreferrer"><b>{story.title}</b></a>
          <div className="desc">{story.contentSnippet || story.content || ''}</div>
        </div>
      </Html>
    </group>
  )
}

function App() {
  const [feedUrls, setFeedUrls] = useState<string[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleOPML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true)
      const urls = await parseOPML(e.target.files[0])
      setFeedUrls(urls)
      setLoading(false)
    }
  }

  const loadFeeds = async () => {
    if (!feedUrls.length) return
    setLoading(true)
    try {
      const feeds = await fetchAllFeeds(feedUrls)
      setStories(feeds.flatMap(feed => feed.items.map((item: any) => ({ ...item, feedTitle: feed.title }))))
    } catch (e) {
      // handle error
    }
    setLoading(false)
  }

  useEffect(() => {
    if (feedUrls.length) {
      loadFeeds()
      if (timer.current) clearInterval(timer.current)
      timer.current = setInterval(loadFeeds, 15000)
      return () => { if (timer.current) clearInterval(timer.current) }
    }
    return undefined
  }, [feedUrls])

  // 3D card layout
  const radius = 6
  const cardPositions = stories.map((_, i) => {
    const angle = (i / stories.length) * Math.PI * 2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number]
  })

  return (
    <div className="App">
      <h1>Orbital RSS Reader</h1>
      <input type="file" accept=".opml,.xml" onChange={handleOPML} />
      {loading && <div>Loading...</div>}
      <div style={{ height: '80vh', width: '100%' }}>
        <Canvas camera={{ position: [0, 5, 12], fov: 60 }} shadows>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <OrbitControls enablePan enableZoom enableRotate />
          <AnimatePresence>
            {stories.map((story, i) => (
              <motion.div
                key={story.link}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.7 }}
                style={{ position: 'absolute', left: 0, top: 0 }}
              >
                <FeedCard story={story} position={cardPositions[i]} />
              </motion.div>
            ))}
          </AnimatePresence>
        </Canvas>
      </div>
    </div>
  )
}

export default App
