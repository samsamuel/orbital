import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Text, RoundedBox } from '@react-three/drei'
import { parseOPML, fetchAllFeeds } from './feedUtils'
import * as THREE from 'three'
import './App.css'
import { a, useSpring, useSprings } from '@react-spring/three'
import { useEffect, useRef, useState } from 'react'

function AnimatedFeedCard({ story, position, isLeaving, onRemove }: { story: any, position: [number, number, number], isLeaving: boolean, onRemove?: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })
  // Animate scale and opacity: pop in from 0, pop out to 0
  const { scale, opacity } = useSpring({
    scale: isLeaving ? 0 : 1,
    opacity: isLeaving ? 0 : 1,
    from: { scale: 1, opacity: 1 },
    config: { mass: 1, tension: 180, friction: 18 },
    onRest: () => { if (isLeaving && onRemove) onRemove() },
  })
  const bevelSize = 0.08
  const bevelSegments = 6
  // Handle click to open link in new tab
  const handlePointerDown = () => {
    if (story.link) {
      window.open(story.link, '_blank', 'noopener,noreferrer')
    }
  }
  return (
    <a.group ref={groupRef} position={position} scale={scale}>
      {/* Extruded and beveled card using Drei's RoundedBox */}
      <RoundedBox
        args={[2, 1.2, 0.25]}
        radius={bevelSize}
        smoothness={bevelSegments}
        onPointerDown={handlePointerDown}
        onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={e => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
      >
        {/* Frosted glass effect using Drei's MeshTransmissionMaterial */}
        <a.meshPhysicalMaterial
          color={'#fff'}
          metalness={0.15}
          roughness={0.18}
          transmission={0.92}
          thickness={0.45}
          ior={1.5}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
          reflectivity={0.18}
          attenuationColor="#a000ff"
          attenuationDistance={1.8}
          transparent
          opacity={opacity}
        />
      </RoundedBox>
      {/* Beveled border as a slightly larger transparent RoundedBox */}
      <RoundedBox
        args={[2.08, 1.28, 0.27]}
        radius={bevelSize}
        smoothness={bevelSegments}
      >
        <a.meshStandardMaterial color={'#2a5cff'} transparent opacity={opacity.to(o => o * 0.18)} />
      </RoundedBox>
      <Text
        position={[0, 0.05, 0.14]} // Lowered for better vertical centering
        fontSize={0.18}
        color="#fff"
        maxWidth={1.7}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        textAlign="center"
        font="/assets/Inter_28pt-Regular.ttf"
      >
        {story.title.length > 60 ? story.title.slice(0, 57) + '...' : story.title}
      </Text>
      {story.contentSnippet || story.content ? (
        <Text
          position={[0, -0.22, 0.14]} // Raised for better balance
          fontSize={0.12}
          color="#fff"
          maxWidth={1.7}
          anchorX="center"
          anchorY="top"
          outlineWidth={0}
          textAlign="center"
          font="/assets/Inter_28pt-Regular.ttf"
        >
          {(story.contentSnippet || story.content).length > 120
            ? (story.contentSnippet || story.content).slice(0, 117) + '...'
            : (story.contentSnippet || story.content)}
        </Text>
      ) : null}
    </a.group>
  )
}

// Add a sci-fi earth texture to the globe
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

function Globe() {
  // Use a stylized sci-fi earth texture and a bump map (public/earth-sci-fi.jpg and public/earth-bump.jpg)
  const [texture, bump] = useLoader(TextureLoader, ['/earth-sci-fi.jpg', '/earth-bump.jpg'])
  const globeRef = useRef<THREE.Mesh>(null)
  useFrame((_state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.12 // slow spin
    }
  })
  return (
    <mesh ref={globeRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2.2, 48, 48]} />
      <meshStandardMaterial
        map={texture}
        bumpMap={bump}
        bumpScale={1.2}
        metalness={0.7}
        roughness={0.4}
        emissive="#a000ff"
        emissiveIntensity={0.25}
        emissiveMap={texture}
      />
      {/* Glowing effect using a slightly larger, transparent sphere */}
      <mesh>
        <sphereGeometry args={[2.25, 48, 48]} />
        <meshBasicMaterial color="#ff006a" transparent opacity={0.18} />
      </mesh>
    </mesh>
  )
}

function AnimatedRing({ stories, ringSize, children }: { stories: any[], ringSize: number, children: (positions: [number, number, number][]) => React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.07 // slow orbit
    }
  })
  // Always use the max of stories.length and ringSize for the number of positions
  const count = Math.max(stories.length, ringSize)
  const radius = 6
  const cardPositions = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number]
  })

  // Map each story to its intended position index
  const positionsByKey: Record<string, [number, number, number]> = {}
  stories.forEach((story, i) => {
    // For leaving stories, use their _prevIndex if available
    const idx = story._prevIndex !== undefined && story._prevIndex >= 0 && story._prevIndex < count ? story._prevIndex : i
    positionsByKey[story.link + (story.isLeaving ? '-leaving' : '')] = cardPositions[idx]
  })

  // Use stable dependency for useSprings
  const [springs, api] = useSprings(
    stories.length,
    index => ({
      position: positionsByKey[stories[index].link + (stories[index].isLeaving ? '-leaving' : '')],
      config: { mass: 1, tension: 120, friction: 18 },
    }),
    [stories.length, count]
  )

  return (
    <group ref={group}>
      {children(springs.map(s => s.position.get()))}
    </group>
  )
}

// Helper: assign previous index to leaving stories
function attachPrevIndex(leavingStories: any[], prevVisible: any[]) {
  return leavingStories.map(story => {
    const prevIdx = prevVisible.findIndex(v => v.link === story.link)
    return { ...story, _prevIndex: prevIdx }
  })
}

function App() {
  const [feedUrls, setFeedUrls] = useState<string[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [visibleStories, setVisibleStories] = useState<any[]>([])
  const [leavingStories, setLeavingStories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [inputMode, setInputMode] = useState<'opml' | 'url'>('opml')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevVisibleStories = useRef<any[]>([])
  const [ringSize, setRingSize] = useState(0)

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleOPML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true)
      const urls = await parseOPML(e.target.files[0])
      setFeedUrls(urls)
      setShowOverlay(false)
      setLoading(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput) return
    setLoading(true)
    setFeedUrls([urlInput])
    setShowOverlay(false)
    setLoading(false)
  }

  const loadFeeds = async () => {
    if (!feedUrls.length) return
    setLoading(true)
    try {
      const feeds = await fetchAllFeeds(feedUrls)
      // Flatten, sort by pubDate descending, and take the 25 most recent stories
      const allStories = feeds.flatMap(feed => feed.items.map((item: any) => ({ ...item, feedTitle: feed.title })))
      const sortedStories = allStories.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
      setStories(sortedStories.slice(0, 25))
      // Debug: log stories
      console.log('Stories:', sortedStories.slice(0, 25))
    } catch (e) {
      // handle error
      console.error('Error loading feeds:', e)
    }
    setLoading(false)
  }

  // Animate visible stories: pop in new, fade out old
  useEffect(() => {
    // Find new and removed stories
    const newStories = stories.filter(s => !visibleStories.some(v => v.link === s.link))
    const removedStories = visibleStories.filter(v => !stories.some(s => s.link === v.link))

    // On first load, set ring size
    if (ringSize === 0 && stories.length > 0) setRingSize(stories.length)

    // Add new stories
    if (newStories.length > 0) {
      setVisibleStories(prev => [...prev, ...newStories])
      // Delay ringSize update to next tick to ensure animation triggers
      setTimeout(() => {
        setRingSize(stories.length + removedStories.length)
      }, 10)
    }
    // Animate out removed stories, attach previous index
    if (removedStories.length > 0) {
      setLeavingStories(prev => [
        ...prev,
        ...attachPrevIndex(removedStories, prevVisibleStories.current)
      ])
      setTimeout(() => {
        setLeavingStories(prev => prev.filter(l => !removedStories.some(r => r.link === l.link)))
        setVisibleStories(current => current.filter(v => !removedStories.some(r => r.link === v.link)))
        // After all leaving cards are gone, update ring size
        setRingSize(stories.length)
      }, 600)
    }
    // If no change, just sync (but do not reorder to avoid flash)
    if (newStories.length === 0 && removedStories.length === 0 && stories.length === visibleStories.length) {
      setVisibleStories(prev => prev.map(v => stories.find(s => s.link === v.link) || v))
      setRingSize(stories.length)
    }
    // Store previous visible stories for next update
    prevVisibleStories.current = [...visibleStories]
  }, [stories])

  useEffect(() => {
    if (feedUrls.length) {
      loadFeeds()
      if (timer.current) clearInterval(timer.current)
      timer.current = setInterval(loadFeeds, 15000)
      return () => { if (timer.current) clearInterval(timer.current) }
    }
    return undefined
  }, [feedUrls])

  // Debug: log state on every render
  useEffect(() => {
    console.log('VISIBLE:', visibleStories.map(s => s.title))
    console.log('LEAVING:', leavingStories.map(s => s.title))
    console.log('RINGSIZE:', ringSize)
    console.log('STORIES:', stories.map(s => s.title))
  }, [visibleStories, leavingStories, ringSize, stories])

  return (
    <div className="App">
      <Canvas camera={{ position: [0, 5, 12], fov: 60 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <OrbitControls enablePan enableZoom enableRotate />
        <Globe />
        {/* AnimatedRing now always gets visible + leaving stories, and a stable ringSize */}
        {/* Each leaving card is rendered at its previous index */}
        <AnimatedRing stories={visibleStories.concat(leavingStories.map(s => ({ ...s, isLeaving: true })))} ringSize={ringSize}>
          {(cardPositions) => {
            const visibleCount = visibleStories.length;
            return (
              <>
                {visibleStories.map((story, i) => (
                  <AnimatedFeedCard
                    key={story.link}
                    story={story}
                    position={cardPositions[i]}
                    isLeaving={false}
                  />
                ))}
                {leavingStories.map((story, i) => {
                  const prevIdx = story._prevIndex !== undefined && story._prevIndex >= 0 && story._prevIndex < cardPositions.length ? story._prevIndex : (visibleCount + i < cardPositions.length ? visibleCount + i : cardPositions.length - 1)
                  return (
                    <AnimatedFeedCard
                      key={story.link + '-leaving'}
                      story={story}
                      position={cardPositions[visibleCount + i]}
                      isLeaving={true}
                    />
                  )
                })}
              </>
            )
          }}
        </AnimatedRing>
        {showOverlay && (
          <Html center style={{ pointerEvents: 'auto', zIndex: 10 }}>
            <div className="overlay-ui">
              <h1>Orbital RSS Reader</h1>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <button
                  className={inputMode === 'opml' ? 'upload-btn' : ''}
                  onClick={() => setInputMode('opml')}
                >OPML Upload</button>
                <button
                  className={inputMode === 'url' ? 'upload-btn' : ''}
                  onClick={() => setInputMode('url')}
                >Feed URL</button>
              </div>
              {inputMode === 'opml' && <>
                <button onClick={handleUploadClick} className="upload-btn">Upload OPML</button>
                <input
                  type="file"
                  accept=".opml,.xml"
                  ref={fileInputRef}
                  onChange={handleOPML}
                  style={{ display: 'none' }}
                />
              </>}
              {inputMode === 'url' && <>
                <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <input
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    style={{ padding: '0.5em', fontSize: '1em', width: 260, borderRadius: 6, border: '1px solid #bbb' }}
                    required
                  />
                  <button type="submit" className="upload-btn">Load Feed</button>
                </form>
              </>}
              {loading && <div>Loading...</div>}
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  )
}

export default App
