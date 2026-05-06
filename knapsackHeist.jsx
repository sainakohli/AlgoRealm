import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import styles from './KnapsackHeist.module.css'

// Mock loot items
const LOOT_ITEMS = [
  { id: 1, name: 'DIAMOND MATRIX', weight: 8, value: 500, type: 'gem' },
  { id: 2, name: 'GOLD INGOT', weight: 12, value: 400, type: 'metal' },
  { id: 3, name: 'CRYPTO KEY', weight: 2, value: 350, type: 'data' },
  { id: 4, name: 'RUBY CORE', weight: 5, value: 300, type: 'gem' },
  { id: 5, name: 'SILVER STACK', weight: 10, value: 250, type: 'metal' },
  { id: 6, name: 'ALGORITHM SHARD', weight: 1, value: 450, type: 'data' },
  { id: 7, name: 'EMERALD BLOCK', weight: 6, value: 280, type: 'gem' },
  { id: 8, name: 'COPPER WIRE', weight: 4, value: 150, type: 'metal' },
]

const MAX_WEIGHT = 35

// Simple knapsack solver (greedy by value/weight ratio)
const solveKnapsack = (items) => {
  const withRatio = items.map(item => ({
    ...item,
    ratio: item.value / item.weight,
  })).sort((a, b) => b.ratio - a.ratio)

  const solution = []
  let currentWeight = 0

  for (const item of withRatio) {
    if (currentWeight + item.weight <= MAX_WEIGHT) {
      solution.push(item.id)
      currentWeight += item.weight
    }
  }

  return {
    itemIds: solution,
    totalWeight: currentWeight,
    totalValue: items.filter(i => solution.includes(i.id)).reduce((sum, i) => sum + i.value, 0),
  }
}

export default function KnapsackHeist({ heist, onClose, onComplete }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [phase, setPhase] = useState('planning') // planning | executing | results
  const [expanded, setExpanded] = useState(true)

  const currentWeight = LOOT_ITEMS.filter(item => selectedItems.includes(item.id)).reduce((sum, item) => sum + item.weight, 0)
  const currentValue = LOOT_ITEMS.filter(item => selectedItems.includes(item.id)).reduce((sum, item) => sum + item.value, 0)

  const optimalSolution = useMemo(() => solveKnapsack(LOOT_ITEMS), [])

  const toggleItem = (itemId) => {
    const newWeight = currentWeight + (LOOT_ITEMS.find(i => i.id === itemId)?.weight || 0)
    if (!selectedItems.includes(itemId) && newWeight > MAX_WEIGHT) return

    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const handleExecute = () => {
    setPhase('executing')
    setTimeout(() => setPhase('results'), 2000)
  }

  const efficiency = ((currentValue / optimalSolution.totalValue) * 100).toFixed(0)
  const isOptimal = selectedItems.length === optimalSolution.itemIds.length &&
    selectedItems.every(id => optimalSolution.itemIds.includes(id))

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
            <div className={styles.subtitle}>KNAPSACK OPTIMIZATION HEIST</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {phase === 'planning' && (
          <>
            {/* Knapsack capacity meter */}
            <div className={styles.capacitySection}>
              <div className={styles.capacityLabel}>
                <span>WEIGHT CAPACITY</span>
                <span className={styles.capacityValue}>
                  {currentWeight} / {MAX_WEIGHT} kg
                </span>
              </div>
              <div className={styles.capacityTrack}>
                <motion.div
                  className={styles.capacityFill}
                  style={{ background: currentWeight > MAX_WEIGHT * 0.8 ? '#ff3366' : '#00f5ff' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((currentWeight / MAX_WEIGHT) * 100, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Current selection stats */}
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>TOTAL VALUE</div>
                <div className={styles.statValue} style={{ color: '#00f5ff' }}>${currentValue}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>ITEMS SELECTED</div>
                <div className={styles.statValue}>{selectedItems.length}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>EFFICIENCY</div>
                <div className={styles.statValue} style={{ color: isOptimal ? '#00ff88' : '#ff9500' }}>
                  {efficiency}%
                </div>
              </div>
            </div>

            {/* Algorithm hint */}
            <motion.div
              className={styles.hint}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.hintLabel}>⟳ ALGORITHM</div>
              <div className={styles.hintText}>
                Maximize total value while staying within weight limit. Higher value-to-weight ratio items are more efficient.
              </div>
            </motion.div>

            {/* Loot items grid */}
            <div className={styles.itemsContainer}>
              <div className={styles.itemsHeader}>
                <button
                  className={styles.expandBtn}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>AVAILABLE LOOT ({LOOT_ITEMS.length})</span>
                </button>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    className={styles.itemsGrid}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {LOOT_ITEMS.map(item => {
                      const isSelected = selectedItems.includes(item.id)
                      const canFit = currentWeight + item.weight <= MAX_WEIGHT
                      const isOptimalItem = optimalSolution.itemIds.includes(item.id)

                      return (
                        <motion.button
                          key={item.id}
                          className={`${styles.itemCard} ${isSelected ? styles.selected : ''} ${!canFit && !isSelected ? styles.disabled : ''}`}
                          onClick={() => toggleItem(item.id)}
                          whileHover={canFit ? { scale: 1.05 } : {}}
                          whileTap={canFit ? { scale: 0.98 } : {}}
                          style={{
                            '--item-color': isOptimalItem ? '#00ff88' : '#a855f7',
                          }}
                        >
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemStats}>
                            <span className={styles.itemStat}>W: {item.weight}</span>
                            <span className={styles.itemStat} style={{ color: '#00f5ff' }}>V: ${item.value}</span>
                            <span className={styles.itemRatio}>
                              {(item.value / item.weight).toFixed(1)}/kg
                            </span>
                          </div>
                          {isSelected && <div className={styles.itemCheckmark}>✓</div>}
                          {isOptimalItem && <div className={styles.itemOptimal}>◆</div>}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Execute button */}
            <motion.button
              className={styles.executeBtn}
              onClick={handleExecute}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              EXECUTE HEIST
            </motion.button>
          </>
        )}

        {phase === 'executing' && (
          <motion.div
            className={styles.executingPhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.executing}>
              <div className={styles.loader} />
              <div className={styles.executingText}>STEALING LOOT...</div>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            className={styles.resultsPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.resultsHeader}>
              {isOptimal ? (
                <>
                  <div className={styles.resultTitle} style={{ color: '#00ff88' }}>OPTIMAL SOLUTION FOUND!</div>
                  <div className={styles.resultSubtitle}>You chose the perfect items.</div>
                </>
              ) : (
                <>
                  <div className={styles.resultTitle} style={{ color: '#ff9500' }}>HEIST SUCCESSFUL</div>
                  <div className={styles.resultSubtitle}>But not optimal...</div>
                </>
              )}
            </div>

            <div className={styles.comparisonGrid}>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>YOUR SOLUTION</div>
                <div className={styles.comparisonValue}>${currentValue}</div>
                <div className={styles.comparisonMeta}>{currentWeight} / {MAX_WEIGHT} kg</div>
              </div>
              <div className={styles.comparisonCard}>
                <div className={styles.comparisonLabel}>OPTIMAL SOLUTION</div>
                <div className={styles.comparisonValue}>${optimalSolution.totalValue}</div>
                <div className={styles.comparisonMeta}>{optimalSolution.totalWeight} / {MAX_WEIGHT} kg</div>
              </div>
            </div>

            <div className={styles.explanation}>
              <div className={styles.explanationLabel}>WHY THIS MATTERS</div>
              <p>
                The 0/1 Knapsack Problem is a classic optimization challenge in dynamic programming. 
                The greedy approach (pick highest value/weight ratio) often works, but doesn't always 
                guarantee optimal results. Real heists require careful planning!
              </p>
            </div>

            <motion.button
              className={styles.completeBtn}
              onClick={() => {
                onComplete?.({
                  efficiency: parseInt(efficiency),
                  isOptimal,
                  reward: Math.round(currentValue * (isOptimal ? 1.5 : 1)),
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