import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import World from './pages/World'
import Practice from './pages/Practice'
import Arena from './pages/Arena'
import Heist from './pages/Heist'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import RewardPopup from './components/RewardPopup'
import ChallengePage from './pages/ChallengePage'
import WorldSocketTest from './pages/WorldSocketTest'
import Login from './pages/Login'
import Register from './pages/Register'

import { socket } from './socket'

export default function App() {
  const [reward, setReward] = useState(null)

  const showReward = (data) => setReward(data)
  const hideReward = () => setReward(null)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to backend:', socket.id)
    })

    socket.emit('join_world', {
      name: 'TestPlayer',
      x: 100,
      y: 100
    })

    return () => {
      socket.off('connect')
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Dashboard showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/world"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <World showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Practice showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice/:questId"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <ChallengePage showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/arena"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Arena showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/heist"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Heist showReward={showReward} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Leaderboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/socket-test"
          element={
            <ProtectedRoute>
              <Layout showReward={showReward}>
                <WorldSocketTest />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {reward && <RewardPopup data={reward} onClose={hideReward} />}
    </>
  )
}