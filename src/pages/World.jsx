import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Target, ChevronRight } from 'lucide-react'

import useWorldSocket from '../hooks/useWorldSocket'
import WorldCanvas from '../components/world/WorldCanvas'
import KnapsackHeist from '../components/world/KnapsackHeist'
import TSPHeist from '../components/world/TSPHeist'
import GraphHeist from '../components/world/GraphHeist'

import { WORLD_ZONES, QUESTS } from '../data/mockData'
import QuestCard from '../components/QuestCard'
import MissionModal from '../components/MissionModal'
import styles from './World.module.css'

export default function World({ showReward }) {
  const [selectedZone, setSelectedZone] = useState(WORLD_ZONES[0])
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [selectedHeist, setSelectedHeist] = useState(null)

  const { players, movePlayer } = useWorldSocket()

  const zoneQuests = QUESTS.filter(q => q.worldZone === selectedZone?.slug)

  const handleStart = (quest) => {
    setSelectedQuest(null)

    showReward?.({
      title: 'QUEST INITIATED',
      subtitle: quest.title,
      xp: quest.xpReward,
      coins: quest.coinReward,
      fragments: quest.fragmentReward,
    })
  }

  const handleHeistClick = (heist) => {
    setSelectedHeist(heist)
  }

  const handleHeistComplete = (result) => {
    showReward?.({
      title: 'HEIST COMPLETE',
      subtitle: result.isOptimal ? 'OPTIMAL SOLUTION!' : 'Heist Successful',
      xp: Math.round(result.reward * 0.5),
      coins: result.reward,
      fragments: result.isOptimal ? 5 : 2,
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>WORLD MAP</h1>
        <p className={styles.subtitle}>
          Navigate the corrupted realms. Start heists by clicking zones on the map.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapSection}>
          <WorldCanvas
            players={players}
            movePlayer={movePlayer}
            onHeistZoneClick={handleHeistClick}
            selectedHeistId={selectedHeist?.id}
          />
        </div>

        <div className={styles.zonePanel}>
          <AnimatePresence mode="wait">
            {selectedZone && (
              <motion.div
                key={selectedZone.id}
                className={styles.zoneInfo}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                style={{ '--zone-color': selectedZone.color }}
              >
                <div className={styles.zoneHeader}>
                  <div className={styles.zoneName}>{selectedZone.name}</div>

                  {!selectedZone.unlocked && (
                    <div className={styles.lockBadge}>
                      <Lock size={10} /> LOCKED
                    </div>
                  )}
                </div>

                <p className={styles.zoneDesc}>{selectedZone.description}</p>

                <div className={styles.zoneStats}>
                  <div className={styles.zoneStat}>
                    <span className={styles.zoneStatLabel}>QUESTS</span>
                    <span
                      className={styles.zoneStatVal}
                      style={{ color: selectedZone.color }}
                    >
                      {selectedZone.completedCount} / {selectedZone.questCount}
                    </span>
                  </div>

                  <div className={styles.zoneStat}>
                    <span className={styles.zoneStatLabel}>TYPE</span>
                    <span className={styles.zoneStatVal}>
                      {selectedZone.dominantType}
                    </span>
                  </div>
                </div>

                <div className={styles.zoneProgress}>
                  <div className={styles.progressTrack}>
                    <motion.div
                      className={styles.progressFill}
                      style={{ background: selectedZone.color }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(selectedZone.completedCount / selectedZone.questCount) * 100}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>

                  <span className={styles.progressLabel}>
                    {Math.round(
                      (selectedZone.completedCount / selectedZone.questCount) * 100
                    )}
                    % CLEARED
                  </span>
                </div>

                <div className={styles.bossCard}>
                  <div className={styles.bossLabel}>ZONE BOSS</div>
                  <div className={styles.bossName}>{selectedZone.bossName}</div>

                  <div className={styles.bossStatus}>
                    {selectedZone.bossDefeated ? (
                      <span style={{ color: '#00ff88' }}>✓ DEFEATED</span>
                    ) : (
                      <span style={{ color: 'var(--red-corrupt)' }}>● ACTIVE</span>
                    )}
                  </div>
                </div>

                {zoneQuests.length > 0 && (
                  <div className={styles.questSection}>
                    <div className={styles.questSectionTitle}>
                      <Target size={12} />
                      <span>ZONE MISSIONS ({zoneQuests.length})</span>
                    </div>

                    <div className={styles.questList}>
                      {zoneQuests.map(q => (
                        <QuestCard
                          key={q.id}
                          quest={q}
                          onClick={setSelectedQuest}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.zoneListSection}>
        <h2 className={styles.zoneListTitle}>ALL ZONES</h2>

        <div className={styles.zoneList}>
          {WORLD_ZONES.map(zone => (
            <motion.button
              key={zone.id}
              className={`${styles.zoneListItem} ${
                !zone.unlocked ? styles.zoneListLocked : ''
              } ${selectedZone?.id === zone.id ? styles.zoneListActive : ''}`}
              style={{ '--zone-color': zone.color }}
              whileHover={zone.unlocked ? { x: 4 } : {}}
              onClick={() => zone.unlocked && setSelectedZone(zone)}
            >
              <div className={styles.zoneListDot} />

              <div className={styles.zoneListMeta}>
                <span className={styles.zoneListName}>{zone.name}</span>
                <span className={styles.zoneListType}>{zone.dominantType}</span>
              </div>

              <div className={styles.zoneListStats}>
                <span>
                  {zone.completedCount}/{zone.questCount}
                </span>
              </div>

              {zone.unlocked ? (
                <ChevronRight size={14} className={styles.zoneArrow} />
              ) : (
                <Lock size={12} className={styles.zoneArrow} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <MissionModal
        quest={selectedQuest}
        onClose={() => setSelectedQuest(null)}
        onStart={handleStart}
      />

      <AnimatePresence>
        {selectedHeist &&
          (selectedHeist.type === 'knapsack' ? (
            <KnapsackHeist
              heist={selectedHeist}
              onClose={() => setSelectedHeist(null)}
              onComplete={handleHeistComplete}
            />
          ) : selectedHeist.type === 'tsp' ? (
            <TSPHeist
              heist={selectedHeist}
              onClose={() => setSelectedHeist(null)}
              onComplete={handleHeistComplete}
            />
          ) : (
            <GraphHeist
              heist={selectedHeist}
              onClose={() => setSelectedHeist(null)}
              onComplete={handleHeistComplete}
            />
          ))}
      </AnimatePresence>
    </div>
  )
}