import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useHeistSocket from '../hooks/useHeistSocket'
import HeistHeader from "../components/heist/HeistHeader"
import RoleRoster from "../components/heist/RoleRoster"
import HeistPipeline from "../components/heist/HeistPipeline"
import SharedWorkspace from "../components/heist/SharedWorkspace"
import ActivityFeed from "../components/heist/ActivityFeed"
import { HEIST_ACTIVE_MISSION } from '../data/mockData'
import styles from './Heist.module.css'

export function useHeistState() {
  const [roomId, setRoomId] = useState(null)
  const [heistBackendState, setHeistBackendState] = useState(null)

  const [missionStage, setMissionStage] = useState('CODE')
  const [currentUserRole, setCurrentUserRole] = useState('BUILDER')
  const [approvalStatus, setApprovalStatus] = useState('PENDING')

  const [solutionCode, setSolutionCode] = useState(
`// Operation: Deep Freeze - Solution Slot
// Builder: CIPHER_WRAITH
// Status: IN PROGRESS

function findMinimumInRotatedArray(nums) {
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return nums[left];
}`
  )

  const [testCases, setTestCases] = useState(
`// Tester: GHOST_V0ID
// Test Suite v1.2

const tests = [
  { input: [3,4,5,1,2], expected: 1, label: "Standard rotation" },
  { input: [4,5,6,7,0,1,2], expected: 0, label: "Larger array" },
  { input: [1], expected: 1, label: "Single element" },
  { input: [2,1], expected: 1, label: "Two elements" }
];`
  )

  const [testResults, setTestResults] = useState(null)

  const [complexityReview, setComplexityReview] = useState({
    time: null,
    space: null,
    notes: '',
  })

  const [vetoReason, setVetoReason] = useState('')

  const [teamPresence, setTeamPresence] = useState([
    { id: 'usr_1', name: 'Waiting...', role: 'BUILDER', status: 'WAITING', color: '#00f5ff', online: false },
    { id: 'usr_2', name: 'Waiting...', role: 'TESTER', status: 'WAITING', color: '#00ff88', online: false },
    { id: 'usr_3', name: 'Waiting...', role: 'ANALYST', status: 'WAITING', color: '#a855f7', online: false },
  ])

  const [activityLog, setActivityLog] = useState([
    { id: 'a1', user: 'SYSTEM', role: 'SYSTEM', action: 'waiting for heist team...', ts: 'just now', color: '#ff9500' },
  ])

  const [chatMessages, setChatMessages] = useState([])
  const [fortressHealth, setFortressHealth] = useState(100)
  const [missionTimer, setMissionTimer] = useState(4 * 60 * 60 + 22 * 60)

  const chatIdRef = useRef(10)

  const socketRef = useHeistSocket({
    setRoomId,
    setCurrentUserRole,
    setHeistBackendState,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMissionTimer(t => (t > 0 ? t - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!heistBackendState) return

    setMissionStage(heistBackendState.phase || 'CODE')
    setApprovalStatus(heistBackendState.approvalStatus || 'PENDING')

    if (heistBackendState.solutionCode) {
      setSolutionCode(heistBackendState.solutionCode)
    }

    if (heistBackendState.testCases) {
      setTestCases(heistBackendState.testCases)
    }

    if (heistBackendState.testResults) {
      setTestResults(heistBackendState.testResults)
    }

    if (heistBackendState.complexityReview) {
      setComplexityReview(heistBackendState.complexityReview)
    }

    if (heistBackendState.vetoReason) {
      setVetoReason(heistBackendState.vetoReason)
    }

    if (heistBackendState.players) {
      setTeamPresence(Object.values(heistBackendState.players))
    }

    if (heistBackendState.activityLog) {
      setActivityLog(heistBackendState.activityLog)
    }

    if (heistBackendState.phase === 'BREACH') {
      setFortressHealth(0)
    }
  }, [heistBackendState])

  const handleCodeChange = useCallback((newCode) => {
    setSolutionCode(newCode)
  }, [])

  const handleRequestTesting = useCallback(() => {
    if (!roomId || !socketRef.current) return

    socketRef.current.emit('heist:submit-code', {
      roomId,
      solutionCode,
    })
  }, [roomId, solutionCode, socketRef])

  const handleTestCaseChange = useCallback((newTests) => {
    setTestCases(newTests)
  }, [])

  const handleRunTests = useCallback(() => {
    const mockResults = {
      passed: 4,
      failed: 0,
      total: 4,
      cases: [
        { label: 'Standard rotation', passed: true, output: '1', expected: '1' },
        { label: 'Larger array', passed: true, output: '0', expected: '0' },
        { label: 'Single element', passed: true, output: '1', expected: '1' },
        { label: 'Two elements', passed: true, output: '1', expected: '1' },
      ],
    }

    setTestResults(mockResults)
    setFortressHealth(h => Math.max(0, h - 15))
  }, [])

  const handleSubmitForAnalysis = useCallback(() => {
    if (!roomId || !socketRef.current) return
    if (!testResults || testResults.failed > 0) return

    socketRef.current.emit('heist:submit-tests', {
      roomId,
      testCases,
      testResults,
    })
  }, [roomId, socketRef, testCases, testResults])

  const handleComplexityChange = useCallback((field, value) => {
    setComplexityReview(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleApproveComplexity = useCallback(() => {
    if (!roomId || !socketRef.current) return
    if (!complexityReview.time || !complexityReview.space) return

    socketRef.current.emit('heist:analyst-decision', {
      roomId,
      complexityReview,
      decision: 'APPROVE',
      reason: complexityReview.notes || 'Complexity approved by analyst.',
    })
  }, [roomId, socketRef, complexityReview])

  const handleVetoSubmission = useCallback((reason) => {
    if (!roomId || !socketRef.current) return

    socketRef.current.emit('heist:analyst-decision', {
      roomId,
      complexityReview,
      decision: 'VETO',
      reason: reason || 'Complexity too high. Builder must rewrite.',
    })
  }, [roomId, socketRef, complexityReview])

  const handleResetAfterVeto = useCallback(() => {
    if (!roomId || !socketRef.current) return

    socketRef.current.emit('heist:reset-after-veto', {
      roomId,
    })
  }, [roomId, socketRef])

  const handleFinalBreach = useCallback(() => {
    setActivityLog(prev => [
      {
        id: `a_${Date.now()}`,
        user: 'SYSTEM',
        role: 'SYSTEM',
        action: '🔓 FORTRESS BREACHED — MISSION COMPLETE',
        ts: 'just now',
        color: '#ff9500',
      },
      ...prev,
    ])
  }, [])

  const handleSendChat = useCallback((text) => {
    if (!text.trim()) return

    const id = `c${++chatIdRef.current}`
    const sender = teamPresence.find(m => m.role === currentUserRole)

    setChatMessages(prev => [
      ...prev,
      {
        id,
        user: sender?.name || 'UNKNOWN',
        role: currentUserRole,
        text,
        ts: 'just now',
        color: sender?.color || '#fff',
      },
    ])
  }, [currentUserRole, teamPresence])

  return {
    missionStage,
    currentUserRole,
    approvalStatus,
    solutionCode,
    testCases,
    testResults,
    complexityReview,
    vetoReason,
    teamPresence,
    activityLog,
    chatMessages,
    fortressHealth,
    missionTimer,
    roomId,
    heistBackendState,

    setCurrentUserRole,
    handleCodeChange,
    handleRequestTesting,
    handleTestCaseChange,
    handleRunTests,
    handleSubmitForAnalysis,
    handleComplexityChange,
    handleApproveComplexity,
    handleVetoSubmission,
    handleResetAfterVeto,
    handleFinalBreach,
    handleSendChat,
  }
}

export default function Heist() {
  const state = useHeistState()
  const mission = HEIST_ACTIVE_MISSION

  return (
    <div className={styles.page}>
      <div className={styles.scanlines} aria-hidden />

      <HeistHeader
        mission={mission}
        missionStage={state.missionStage}
        missionTimer={state.missionTimer}
        fortressHealth={state.fortressHealth}
      />

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <RoleRoster
            teamPresence={state.teamPresence}
            currentUserRole={state.currentUserRole}
            onRoleSwitch={state.setCurrentUserRole}
          />

          <HeistPipeline
            missionStage={state.missionStage}
            approvalStatus={state.approvalStatus}
          />

          <ActivityFeed log={state.activityLog} />
        </div>

        <div className={styles.rightCol}>
          <SharedWorkspace
            {...state}
            mission={mission}
          />
        </div>
      </div>

      <AnimatePresence>
        {state.missionStage === 'BREACH' && (
          <motion.div
            className={styles.breachOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.breachCard}
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className={styles.breachGlow} />
              <div className={styles.breachIcon}>🔓</div>
              <h2 className={styles.breachTitle}>FORTRESS BREACHED</h2>
              <p className={styles.breachSub}>OPERATION: {mission.name}</p>

              <div className={styles.breachRewards}>
                <span className={styles.breachXp}>+{mission.reward.xp} XP</span>
                <span className={styles.breachCoins}>◈ {mission.reward.coins}</span>
                <span className={styles.breachFrags}>⬡ {mission.reward.fragment} FRAGS</span>
              </div>

              <button className={styles.breachBtn} onClick={state.handleFinalBreach}>
                CLAIM REWARDS
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}