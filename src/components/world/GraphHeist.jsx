import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import styles from './GraphHeist.module.css'

// Graph nodes and edges (maze-like structure)
const GRAPH_NODES = [
  { id: 'start', name: 'ENTRY', x: 50, y: 150, type: 'start' },
  { id: 'a', name: 'CORRIDOR A', x: 100, y: 100, type: 'path' },
  { id: 'b', name: 'CHAMBER B', x: 100, y: 200, type: 'path' },
  { id: 'c', name: 'VAULT C', x: 150, y: 150, type: 'objective' },
  { id: 'd', name: 'GUARD D', x: 200, y: 100, type: 'danger' },
  { id: 'e', name: 'SERVER E', x: 200, y: 200, type: 'path' },
  { id: 'exit', name: 'EXIT', x: 250, y: 150, type: 'end' },
]

const GRAPH_EDGES = [
  { from: 'start', to: 'a', cost: 1 },
  { from: 'start', to: 'b', cost: 1 },
  { from: 'a', to: 'c', cost: 1 },
  { from: 'b', to: 'c', cost: 1 },
  { from: 'a', to: 'd', cost: 2 },
  { from: 'c', to: 'd', cost: 1 },
  { from: 'c', to: 'e', cost: 1 },
  { from: 'd', to: 'exit', cost: 3 },
  { from: 'e', to: 'exit', cost: 1 },
  { from: 'b', to: 'e', cost: 2 },
]

// BFS implementation
const bfsPath = (startId, endId, edges) => {
  const adj = {}
  edges.forEach(e => {
    if (!adj[e.from]) adj[e.from] = []
    adj[e.from].push(e.to)
  })

  const queue = [startId]
  const visited = { [startId]: true }
  const parent = {}

  while (queue.length > 0) {
    const node = queue.shift()
    if (node === endId) break

    adj[node]?.forEach(neighbor => {
      if (!visited[neighbor]) {
        visited[neighbor] = true
        parent[neighbor] = node
        queue.push(neighbor)
      }
    })
  }

  const path = []
  let current = endId
  while (current !== undefined) {
    path.unshift(current)
    current = parent[current]
  }

  return path.length > 1 ? path : []
}

// Dijkstra's algorithm for shortest path
const dijkstraPath = (startId, endId, nodes, edges) => {
  const distances = {}
  const parent = {}
  const unvisited = new Set()

  nodes.forEach(n => {
    distances[n.id] = Infinity
    unvisited.add(n.id)
  })
  distances[startId] = 0

  while (unvisited.size > 0) {
    let current = null
    let minDist = Infinity

    unvisited.forEach(id => {
      if (distances[id] < minDist) {
        minDist = distances[id]
        current = id
      }
    })

    if (current === null || current === endId) break

    unvisited.delete(current)

    edges
      .filter(e => e.from === current)
      .forEach(e => {
        const newDist = distances[current] + e.cost
        if (newDist < distances[e.to]) {
          distances[e.to] = newDist
          parent[e.to] = current
        }
      })
  }

  const path = []
  let current = endId
  while (current !== undefined) {
    path.unshift(current)
    current = parent[current]
  }

  return path.length > 1 ? path : []
}

export default function GraphHeist({ heist, onClose, onComplete }) {
  const [phase, setPhase] = useState('planning')
  const [selectedPath, setSelectedPath] = useState([])
  const [algorithm, setAlgorithm] = useState('bfs') // bfs or dijkstra

  const optimalPath = useMemo(() => dijkstraPath('start', 'exit', GRAPH_NODES, GRAPH_EDGES), [])
  const bfsPath_ = useMemo(() => bfsPath('start', 'exit', GRAPH_EDGES), [])

  const calculatePathCost = (path) => {
    let cost = 0
    for (let i = 0; i < path.length - 1; i++) {
      const edge = GRAPH_EDGES.find(e => e.from === path[i] && e.to === path[i + 1])
      if (edge) cost += edge.cost
    }
    return cost
  }

  const optimalCost = calculatePathCost(optimalPath)
  const selectedCost = calculatePathCost(selectedPath)
  const efficiency = selectedPath.length > 0 ? Math.round((optimalCost / selectedCost) * 100) : 0

  const handleNodeClick = (nodeId) => {
    if (selectedPath.length === 0 && nodeId !== 'start') return
    if (selectedPath.length > 0) {
      const lastNode = selectedPath[selectedPath.length - 1]
      const edge = GRAPH_EDGES.find(e => e.from === lastNode && e.to === nodeId)
      if (!edge) return
    }

    setSelectedPath([...selectedPath, nodeId])
  }

  const handleUndo = () => {
    setSelectedPath(selectedPath.slice(0, -1))
  }

  const isPathComplete = selectedPath.length > 0 && selectedPath[selectedPath.length - 1] === 'exit'

  const handleExecute = () => {
    if (isPathComplete) {
      setPhase('executing')
      setTimeout(() => setPhase('results'), 2000)
    }
  }

  const usedOptimalPath = selectedPath.length === optimalPath.length && selectedPath.every((n, i) => n === optimalPath[i])

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
            <div className={styles.subtitle}>GRAPH PATHFINDING MAZE</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {phase === 'planning' && (
          <>
            {/* Algorithm selector */}
            <div className={styles.algSelector}>
              <div className={styles.algLabel}>SELECT ALGORITHM</div>
              <div className={styles.algButtons}>
                <button
                  className={`${styles.algBtn} ${algorithm === 'bfs' ? styles.active : ''}`}
                  onClick={() => setAlgorithm('bfs')}
                >
                  <div className={styles.algName}>BFS</div>
                  <div className={styles.algDesc}>Breadth-First Search</div>
                </button>
                <button
                  className={`${styles.algBtn} ${algorithm === 'dijkstra' ? styles.active : ''}`}
                  onClick={() => setAlgorithm('dijkstra')}
                >
                  <div className={styles.algName}>DIJKSTRA</div>
                  <div className={styles.algDesc}>Shortest Path (Weighted)</div>
                </button>
              </div>
            </div>

            {/* Graph visualization */}
            <div className={styles.graphSection}>
              <svg className={styles.graph} viewBox="0 0 300 300">
                {/* Edges */}
                {GRAPH_EDGES.map((edge, idx) => {
                  const from = GRAPH_NODES.find(n => n.id === edge.from)
                  const to = GRAPH_NODES.find(n => n.id === edge.to)
                  const isInPath = selectedPath.some((n, i) => i < selectedPath.length - 1 && selectedPath[i] === edge.from && selectedPath[i + 1] === edge.to)

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isInPath ? '#00f5ff' : 'rgba(0,245,255,0.2)'}
                        strokeWidth={isInPath ? 3 : 1}
                        markerEnd={isInPath ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                      />
                      <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 5} textAnchor="middle" fill="rgba(168,85,247,0.6)" fontSize="10" fontFamily="monospace">
                        {edge.cost}
                      </text>
                    </g>
                  )
                })}

                {/* Arrow markers */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="rgba(0,245,255,0.2)" />
                  </marker>
                  <marker id="arrowhead-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#00f5ff" />
                  </marker>
                </defs>

                {/* Nodes */}
                {GRAPH_NODES.map((node) => {
                  const isInPath = selectedPath.includes(node.id)
                  const isLast = selectedPath.length > 0 && selectedPath[selectedPath.length - 1] === node.id
                  const isReachable = selectedPath.length === 0 ? node.id === 'start' : GRAPH_EDGES.some(e => e.from === selectedPath[selectedPath.length - 1] && e.to === node.id)

                  const nodeColors = {
                    start: '#00ff88',
                    end: '#00ff88',
                    objective: '#ff9500',
                    danger: '#ff3366',
                    path: '#a855f7',
                  }

                  return (
                    <g key={node.id} style={{ cursor: isReachable ? 'pointer' : 'default' }}>
                      {/* Glow for reachable/in-path */}
                      {(isReachable || isInPath) && (
                        <circle cx={node.x} cy={node.y} r="18" fill={`${nodeColors[node.type]}40`} />
                      )}

                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="12"
                        fill={isLast ? nodeColors[node.type] : 'rgba(0,0,0,0.6)'}
                        stroke={nodeColors[node.type]}
                        strokeWidth={isInPath ? 3 : 2}
                        onClick={() => isReachable && handleNodeClick(node.id)}
                        style={{
                          opacity: isReachable || isInPath ? 1 : 0.4,
                          filter: isLast ? 'drop-shadow(0 0 8px ' + nodeColors[node.type] + ')' : 'none',
                        }}
                      />

                      {/* Node label */}
                      <text x={node.x} y={node.y + 24} textAnchor="middle" fill={nodeColors[node.type]} fontSize="9" fontFamily="monospace" fontWeight="bold">
                        {node.name}
                      </text>

                      {/* Path order number */}
                      {isInPath && (
                        <text x={node.x} y={node.y + 3} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          {selectedPath.indexOf(node.id) + 1}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Stats */}
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>CURRENT COST</div>
                  <div className={styles.statValue} style={{ color: '#00f5ff' }}>
                    {selectedPath.length > 0 ? selectedCost : '—'}
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>NODES VISITED</div>
                  <div className={styles.statValue}>{selectedPath.length}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>EFFICIENCY</div>
                  <div className={styles.statValue} style={{ color: usedOptimalPath ? '#00ff88' : '#ff9500' }}>
                    {efficiency}%
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm hint */}
            <motion.div className={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.hintLabel}>⟳ ALGORITHM</div>
              <div className={styles.hintText}>
                {algorithm === 'bfs'
                  ? 'BFS explores all neighbors before going deeper. Good for unweighted graphs. Click nodes to build your path.'
                  : 'Dijkstra finds the shortest path in weighted graphs. Lower edge costs are better! Click nodes to navigate.'}
              </div>
            </motion.div>

            {/* Controls */}
            <div className={styles.controls}>
              <motion.button
                className={styles.undoBtn}
                onClick={handleUndo}
                disabled={selectedPath.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ↶ UNDO
              </motion.button>
              <motion.button
                className={styles.executeBtn}
                onClick={handleExecute}
                disabled={!isPathComplete}
                whileHover={isPathComplete ? { scale: 1.02 } : {}}
                whileTap={isPathComplete ? { scale: 0.98 } : {}}
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
              <div className={styles.executingText}>NAVIGATING MAZE...</div>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div className={styles.resultsPhase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={styles.resultsHeader}>
              {usedOptimalPath ? (
                <>
                  <div className={styles.resultTitle} style={{ color: '#00ff88' }}>PERFECT NAVIGATION!</div>
                  <div className={styles.resultSubtitle}>Used the optimal path.</div>
                </>
              ) : (
                <>
                  <div className={styles.resultTitle} style={{ color: '#ff9500' }}>ESCAPED SUCCESSFULLY</div>
                  <div className={styles.resultSubtitle}>But took longer...</div>
                </>
              )}
            </div>

            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>YOUR PATH COST</div>
                <div className={styles.comparisonValue}>{selectedCost}</div>
                <div className={styles.comparisonMeta}>{selectedPath.length} nodes</div>
              </div>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>OPTIMAL PATH COST</div>
                <div className={styles.comparisonValue}>{optimalCost}</div>
                <div className={styles.comparisonMeta}>{optimalPath.length} nodes</div>
              </div>
            </div>

            <div className={styles.explanation}>
              <div className={styles.explanationLabel}>WHY THIS MATTERS</div>
              <p>
                Graph algorithms like Dijkstra and BFS are fundamental to pathfinding. Dijkstra guarantees the shortest path in weighted graphs (like real-world routing), 
                while BFS is simpler for unweighted scenarios. Real applications: GPS navigation, game AI, network routing, and robot motion planning!
              </p>
            </div>

            <motion.button
              className={styles.completeBtn}
              onClick={() => {
                onComplete?.({
                  efficiency,
                  isOptimal: usedOptimalPath,
                  reward: Math.round(800 * (efficiency / 100)),
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
