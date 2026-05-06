import { useEffect, useRef, useState } from 'react'
import { socket } from '../../socket'
import styles from './WorldCanvas.module.css'

const WORLD_WIDTH = 674
const WORLD_HEIGHT = 394
const PLAYER_SIZE = 16
const HEIST_ZONE_SIZE = 32

// Heist zones scattered on the map
const HEIST_ZONES = [
  { id: 'heist_knapsack', name: 'VAULT ALPHA', x: 150, y: 100, type: 'knapsack', color: '#00f5ff' },
  { id: 'heist_tsp', name: 'FORTRESS BETA', x: 450, y: 80, type: 'tsp', color: '#a855f7' },
  { id: 'heist_graph', name: 'CACHE GAMMA', x: 300, y: 250, type: 'graph', color: '#ff3366' },
]

export default function WorldCanvas({ players, movePlayer, onHeistZoneClick, selectedHeistId }) {
  const canvasRef = useRef(null)
  const [hoveredZone, setHoveredZone] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef(null)
  const playerAnimationsRef = useRef({})

  // Get current player ID
  const currentPlayerId = socket.id

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentPlayerId || !players[currentPlayerId]) return
      
      let dx = 0, dy = 0, direction = null

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -10
          direction = 'UP'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 10
          direction = 'DOWN'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -10
          direction = 'LEFT'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 10
          direction = 'RIGHT'
          break
        default:
          return
      }

      e.preventDefault()
      movePlayer(dx, dy, direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [players, currentPlayerId, movePlayer])

  // Handle canvas mouse interactions for heist zones
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = WORLD_WIDTH / rect.width
      const scaleY = WORLD_HEIGHT / rect.height
      
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      setMousePos({ x, y })

      // Check for heist zone hover
      let hovered = null
      for (const zone of HEIST_ZONES) {
        const dist = Math.hypot(zone.x - x, zone.y - y)
        if (dist < HEIST_ZONE_SIZE) {
          hovered = zone.id
          break
        }
      }
      setHoveredZone(hovered)
    }

    const handleMouseClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = WORLD_WIDTH / rect.width
      const scaleY = WORLD_HEIGHT / rect.height
      
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      for (const zone of HEIST_ZONES) {
        const dist = Math.hypot(zone.x - x, zone.y - y)
        if (dist < HEIST_ZONE_SIZE) {
          onHeistZoneClick(zone)
          break
        }
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleMouseClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleMouseClick)
    }
  }, [onHeistZoneClick])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas resolution
    canvas.width = WORLD_WIDTH
    canvas.height = WORLD_HEIGHT

    const animate = () => {
      // Clear canvas with slight fade for trails
      ctx.fillStyle = 'rgba(4, 4, 10, 0.95)'
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

      // Draw grid background
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < WORLD_WIDTH; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, WORLD_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y < WORLD_HEIGHT; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(WORLD_WIDTH, y)
        ctx.stroke()
      }

      // Draw heist zones
      HEIST_ZONES.forEach((zone) => {
        const isSelected = selectedHeistId === zone.id
        const isHovered = hoveredZone === zone.id

        // Zone outer glow
        const glowAlpha = isHovered ? 0.4 : isSelected ? 0.3 : 0.15
        ctx.fillStyle = `rgba(0, 245, 255, ${glowAlpha})`
        ctx.beginPath()
        ctx.arc(zone.x, zone.y, HEIST_ZONE_SIZE * 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Zone core
        ctx.fillStyle = zone.color
        ctx.beginPath()
        ctx.arc(zone.x, zone.y, HEIST_ZONE_SIZE, 0, Math.PI * 2)
        ctx.fill()

        // Zone border
        ctx.strokeStyle = zone.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(zone.x, zone.y, HEIST_ZONE_SIZE, 0, Math.PI * 2)
        ctx.stroke()

        // Zone shadow/glow
        if (isSelected) {
          ctx.shadowColor = zone.color
          ctx.shadowBlur = 20
          ctx.strokeStyle = zone.color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(zone.x, zone.y, HEIST_ZONE_SIZE + 8, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Zone label
        ctx.fillStyle = zone.color
        ctx.font = 'bold 8px "Share Tech Mono"'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(zone.name, zone.x, zone.y)
      })

      // Draw players
      Object.entries(players).forEach(([playerId, player]) => {
        if (!player || player.x === undefined || player.y === undefined) return

        const isCurrentPlayer = playerId === currentPlayerId
        
        // Initialize animation tracking
        if (!playerAnimationsRef.current[playerId]) {
          playerAnimationsRef.current[playerId] = {
            displayX: player.x,
            displayY: player.y,
            targetX: player.x,
            targetY: player.y,
          }
        }

        const anim = playerAnimationsRef.current[playerId]
        anim.targetX = player.x
        anim.targetY = player.y

        // Smooth interpolation
        anim.displayX += (anim.targetX - anim.displayX) * 0.15
        anim.displayY += (anim.targetY - anim.displayY) * 0.15

        const x = anim.displayX
        const y = anim.displayY

        // Player glow
        const glowColor = isCurrentPlayer ? '#00f5ff' : '#a855f7'
        ctx.fillStyle = `rgba(0, 245, 255, 0.2)`
        ctx.beginPath()
        ctx.arc(x, y, PLAYER_SIZE * 1.8, 0, Math.PI * 2)
        ctx.fill()

        // Player body
        ctx.fillStyle = glowColor
        ctx.beginPath()
        ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2)
        ctx.fill()

        // Player border
        ctx.strokeStyle = glowColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2)
        ctx.stroke()

        // Direction indicator
        if (player.direction) {
          const directionMap = {
            UP: { dx: 0, dy: -1 },
            DOWN: { dx: 0, dy: 1 },
            LEFT: { dx: -1, dy: 0 },
            RIGHT: { dx: 1, dy: 0 },
          }
          const dir = directionMap[player.direction] || { dx: 0, dy: 0 }
          const arrowLen = PLAYER_SIZE + 4
          ctx.strokeStyle = glowColor
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + dir.dx * arrowLen, y + dir.dy * arrowLen)
          ctx.stroke()
        }

        // Player name label
        ctx.fillStyle = glowColor
        ctx.font = 'bold 7px "Share Tech Mono"'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(player.name, x, y + PLAYER_SIZE + 6)

        // Current player indicator
        if (isCurrentPlayer) {
          const pulse = (Date.now() % 1000) / 1000
          const pulseScale = 1 + Math.sin(pulse * Math.PI * 2) * 0.15
          ctx.strokeStyle = `rgba(0, 245, 255, ${0.6 * pulseScale})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x, y, PLAYER_SIZE * 2.2, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [players, currentPlayerId, selectedHeistId, hoveredZone])

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${hoveredZone ? styles.interactive : ''}`}
      />
      <div className={styles.overlay}>
        <div className={styles.info}>
          <span className={styles.label}>ARROW KEYS / WASD</span>
          <span className={styles.label}>CLICK ZONES TO START HEIST</span>
        </div>
      </div>
    </div>
  )
}