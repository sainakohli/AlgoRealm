import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { QUESTS } from '../data/mockData'
import styles from './ChallengePage.module.css'
import { getPlayerData, savePlayerData } from '../utils/playerStorage'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
export default function ChallengePage({ showReward }) {
  const { questId } = useParams()
  const navigate = useNavigate()

  const quest = QUESTS.find(q => q.id === questId)

  const [code, setCode] = useState(quest?.starterCode || '')
  const [output, setOutput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!quest) {
    return <div className={styles.page}>Quest not found.</div>
  }

  const runTests = () => {
    if (!code.trim()) {
      setOutput('❌ Code editor is empty.')
      return
    }

    setOutput(`✅ Test Run Complete

Passed: ${quest.testCases?.length || 0}/${quest.testCases?.length || 0}

Note: This is frontend mock testing. Real code execution needs backend.`)
  }

  const submitQuest = async () => {
  if (!code.trim()) {
    setOutput('❌ Write code before submitting.')
    return
  }

  const user = auth.currentUser

  if (!user) {
    setOutput('❌ User not logged in.')
    return
  }

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    setOutput('❌ Player profile not found.')
    return
  }

  const playerData = userSnap.data()

  const completedQuests = playerData.completedQuests || []

  if (completedQuests.includes(quest.id)) {
    setOutput('⚠ Quest already completed.')
    return
  }

  const updatedQuests = [...completedQuests, quest.id]

  await updateDoc(userRef, {
    xp: playerData.xp + quest.xpReward,
    coins: playerData.coins + quest.coinReward,
    fragments: playerData.fragments + quest.fragmentReward,
    completedQuests: updatedQuests
  })

  setSubmitted(true)

  showReward?.({
    title: 'QUEST COMPLETED',
    subtitle: quest.title,
    xp: quest.xpReward,
    coins: quest.coinReward,
    fragments: quest.fragmentReward,
  })

  setOutput(`🎉 Quest completed successfully!

Rewards synced with Firebase.`)
}

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/practice')}>
          ← BACK
        </button>

        <div>
          <h1>{quest.title}</h1>
          <p>{quest.description}</p>
        </div>

        <span className={styles.diff}>{quest.difficulty}</span>
      </div>

      <div className={styles.grid}>
        <section className={styles.problemPanel}>
          <h2>MISSION BRIEF</h2>

          <h3>Problem Statement</h3>
          <p>{quest.statement || quest.description}</p>

          <h3>Input Format</h3>
          <p>{quest.inputFormat || 'Input format not added yet.'}</p>

          <h3>Output Format</h3>
          <p>{quest.outputFormat || 'Output format not added yet.'}</p>

          <h3>Test Cases</h3>
          <div className={styles.tests}>
            {(quest.testCases || []).map((tc, index) => (
              <div key={index} className={styles.testCase}>
                <strong>Case {index + 1}</strong>
                <p>Input: {tc.input}</p>
                <p>Expected: {tc.expectedOutput}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>CODE EDITOR</span>
            <span>JavaScript</span>
          </div>

          <Editor
            height="430px"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
            }}
          />

          <div className={styles.actions}>
            <button onClick={runTests} className={styles.runBtn}>
              RUN TESTS
            </button>
            <button
              onClick={submitQuest}
              className={styles.submitBtn}
              disabled={submitted}
            >
              {submitted ? 'SUBMITTED' : 'SUBMIT QUEST'}
            </button>
          </div>

          <pre className={styles.output}>{output || 'Output will appear here...'}</pre>
        </section>
      </div>
    </div>
  )
}