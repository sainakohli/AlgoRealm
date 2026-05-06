import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import styles from './TSPHeist.module.css'

// Waypoints on the escape route
const WAYPOINTS = [
  { id: 1, name: 'VAULT', x: 50, y: 50, visited: false },
  { id: 2, name: 'SECURITY', x: 150, y: 80, visited: false },
  { id: 3, name: 'SERVER', x: 200, y: 150, visited: false },
  { id: 4, name: 'COMMS', x: 120, y: 200, visited: false },
  { id: 5, name: 'EXIT', x: 50, y: 180, visited: false },
]

const calculateDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

const calculateTotalDistance = (route) => {
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1])
  }
  return total
}

// Greedy nearest neighbor approximation
const solveGreedyTSP = (points) => {
  const unvisited = [...points]
  const route = [unvisited.shift()]

  while (unvisited.length > 0) {
    const current = route[route.length - 1]
    let nearestIdx = 0
    let minDist = Infinity

    unvisited.forEach((point, idx) => {
      const dist = calculateDistance(current, point)
      if (dist < minDist) {
        minDist = dist
        nearestIdx = idx
      }
    })

    route.push(unvisited.splice(nearestIdx, 1)[0])
  }

  return route
}

export default function TSPHeist({ heist, onClose, onComplete }) {
  const [phase, setPhase] = useState('planning') // planning | executing | results
  const [visitedWaypoints, setVisitedWaypoints] = useState([WAYPOINTS[0]])
  const [availableWaypoints, setAvailableWaypoints] = useState(WAYPOINTS.slice(1))

  const optimalRoute = useMemo(() => solveGreedyTSP(WAYPOINTS), [])
  const optimalDistance = useMemo(() => calculateTotalDistance(optimalRoute), [])

  const currentDistance = calculateTotalDistance(visitedWaypoints)
  const efficiency = Math.max(0, Math.round((optimalDistance / currentDistance) * 100))
  const isOptimal = efficiency >= 95

  const handleWaypointClick = (waypoint) => {
    setVisitedWaypoints([...visitedWaypoints, waypoint])
    setAvailableWaypoints(availableWaypoints.filter(w => w.id !== waypoint.id))
  }

  const handleUndo = () => {
    if (visitedWaypoints.length > 1) {
      const removed = visitedWaypoints[visitedWaypoints.length - 1]
      setVisitedWaypoints(visitedWaypoints.slice(0, -1))
      setAvailableWaypoints([...availableWaypoints, removed].sort((a, b) => a.id - b.id))
    }
  }

  const handleExecute = () => {
    if (availableWaypoints.length === 0) {
      setPhase('executing')
      setTimeout(() => setPhase('results'), 2000)
    }
  }

  return (
    <motion.div
      className={styles.modal}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>{heist.name}</div>
            <div className={styles.subtitle}>TRAVELLING SALESMAN ESCAPE</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {phase === 'planning' && (
          <>
            {/* Canvas visualization */}
            <div className={styles.canvasSection}>
              <svg className={styles.canvas} viewBox="0 0 300 300">
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0,245,255,0.1)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="300" height="300" fill="url(#grid)" />

                {/* Current route */}
                {visitedWaypoints.length > 1 && (
                  <>
                    {visitedWaypoints.map((point, idx) => {
                      if (idx === visitedWaypoints.length - 1) return null
                      const next = visitedWaypoints[idx + 1]
                      return (
                        <line
                          key={`line-${idx}`}
                          x1={point.x}
                          y1={point.y}
                          x2={next.x}
                          y2={next.y}
                          stroke="#00f5ff"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      )
                    })}
                  </>
                )}

                {/* Visited waypoints */}
                {visitedWaypoints.map((point, idx) => (
                  <g key={`visited-${point.id}`}>
                    <circle cx={point.x} cy={point.y} r="8" fill="#00f5ff" opacity="0.3" />
                    <circle cx={point.x} cy={point.y} r="6" fill="#00f5ff" stroke="#00f5ff" strokeWidth="2" />
                    <text x={point.x} y={point.y - 12} textAnchor="middle" fill="#00f5ff" fontSize="10" fontFamily="monospace">
                      {idx + 1}
                    </text>
                  </g>
                ))}

                {/* Available waypoints */}
                {availableWaypoints.map((point) => (
                  <g key={`available-${point.id}`} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      fill="rgba(168,85,247,0.2)"
                      stroke="#a855f7"
                      strokeWidth="2"
                      onClick={() => handleWaypointClick(point)}
                      style={{ transition: 'all 0.2s' }}
                      onMouseEnter={(e) => {
                        e.target.setAttribute('r', '10')
                        e.target.setAttribute('fill', 'rgba(168,85,247,0.4)')
                      }}
                      onMouseLeave={(e) => {
                        e.target.setAttribute('r', '8')
                        e.target.setAttribute('fill', 'rgba(168,85,247,0.2)')
                      }}
                    />
                    <text x={point.x} y={point.y + 16} textAnchor="middle" fill="#a855f7" fontSize="9" fontFamily="monospace">
                      {point.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Stats */}
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>CURRENT DISTANCE</div>
                  <div className={styles.statValue} style={{ color: '#00f5ff' }}>
                    {currentDistance.toFixed(0)} units
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>WAYPOINTS VISITED</div>
                  <div className={styles.statValue}>
                    {visitedWaypoints.length} / {WAYPOINTS.length}
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>ROUTE EFFICIENCY</div>
                  <div className={styles.statValue} style={{ color: isOptimal ? '#00ff88' : '#ff9500' }}>
                    {efficiency}%
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className={styles.progressContainer}>
                <motion.div
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${(visitedWaypoints.length / WAYPOINTS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: isOptimal ? '#00ff88' : '#ff9500',
                    boxShadow: isOptimal ? '0 0 12px #00ff88' : '0 0 12px #ff9500',
                  }}
                />
              </div>
            </div>

            {/* Algorithm hint */}
            <motion.div className={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.hintLabel}>⟳ ALGORITHM</div>
              <div className={styles.hintText}>
                Find the shortest path visiting all waypoints. This NP-hard problem requires strategic thinking—choose your route wisely to minimize total distance!
              </div>
            </motion.div>

            {/* Waypoint list */}
            <div className={styles.waypointList}>
              <div className={styles.listHeader}>ESCAPE ROUTE</div>
              <div className={styles.routeDisplay}>
                {visitedWaypoints.map((wp, idx) => (
                  <motion.div key={wp.id} className={styles.routeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <span className={styles.stepNum}>{idx + 1}</span>
                    <span className={styles.stepName}>{wp.name}</span>
                    {idx < visitedWaypoints.length - 1 && (
                      <span className={styles.stepDist}>
                        {calculateDistance(visitedWaypoints[idx], visitedWaypoints[idx + 1]).toFixed(0)}u
                      </span>
                    )}
                  </motion.div>
                ))}
                {availableWaypoints.length > 0 && (
                  <motion.div className={styles.routeStep} style={{ opacity: 0.5 }} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}>
                    <span className={styles.stepNum}>?</span>
                    <span className={styles.stepName}>SELECT NEXT...</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              <motion.button
                className={styles.undoBtn}
                onClick={handleUndo}
                disabled={visitedWaypoints.length <= 1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ↶ UNDO
              </motion.button>
              <motion.button
                className={styles.executeBtn}
                onClick={handleExecute}
                disabled={availableWaypoints.length > 0}
                whileHover={availableWaypoints.length === 0 ? { scale: 1.02 } : {}}
                whileTap={availableWaypoints.length === 0 ? { scale: 0.98 } : {}}
              >
                ESCAPE
              </motion.button>
            </div>
          </>
        )}

        {phase === 'executing' && (
          <motion.div className={styles.executingPhase} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.executing}>
              <div className={styles.loader} />
              <div className={styles.executingText}>EXECUTING ESCAPE ROUTE...</div>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div className={styles.resultsPhase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={styles.resultsHeader}>
              {isOptimal ? (
                <>
                  <div className={styles.resultTitle} style={{ color: '#00ff88' }}>PERFECT ESCAPE!</div>
                  <div className={styles.resultSubtitle}>Optimal route executed.</div>
                </>
              ) : (
                <>
                  <div className={styles.resultTitle} style={{ color: '#ff9500' }}>ESCAPE SUCCESSFUL</div>
                  <div className={styles.resultSubtitle}>But not optimal...</div>
                </>
              )}
            </div>

            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>YOUR ROUTE</div>
                <div className={styles.comparisonValue}>{currentDistance.toFixed(0)}u</div>
                <div className={styles.comparisonMeta}>{visitedWaypoints.length} waypoints</div>
              </div>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>OPTIMAL ROUTE</div>
                <div className={styles.comparisonValue}>{optimalDistance.toFixed(0)}u</div>
                <div className={styles.comparisonMeta}>{WAYPOINTS.length} waypoints</div>
              </div>
            </div>

            <div className={styles.explanation}>
              <div className={styles.explanationLabel}>WHY THIS MATTERS</div>
              <p>
                The Travelling Salesman Problem is a classic optimization challenge. Finding the absolute optimal route is computationally expensive (NP-hard), 
                but heuristics like nearest-neighbor can provide good solutions quickly. Real-world applications include logistics, chip design, and DNA sequencing!
              </p>
            </div>

            <motion.button
              className={styles.completeBtn}
              onClick={() => {
                onComplete?.({
                  efficiency,
                  isOptimal,
                  reward: Math.round(1000 * (efficiency / 100)),
                })
                onClose()
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              COLLECT REWARD
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
