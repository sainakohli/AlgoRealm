import { useEffect, useState } from 'react'
import { socket } from '../socket'

export default function useArenaSocket() {
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('lobby')
  const [decision, setDecision] = useState(null)
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    socket.on('arena_queue_waiting', () => {
      setStatus('matching')
    })

    socket.on('arena_match_found', (roomData) => {
      console.log('Arena match found:', roomData)
      setRoom(roomData)
      setStatus('active')
    })

    socket.on('solution_submitted', (data) => {
      console.log('Solution submitted:', data)
    })

    socket.on('attacks_submitted', (data) => {
      console.log('Attacks submitted:', data)
      setStatus('judging')
    })

    socket.on('ai_judge_result', ({ decision, players }) => {
      setDecision(decision)
      setRoom((prev) => ({
        ...prev,
        players
      }))
      setStatus('judged')
    })

    socket.on('roles_switched', (updatedRoom) => {
      setRoom(updatedRoom)
      setDecision(null)
      setStatus('active')
    })

    socket.on('battle_finished', ({ winner, room }) => {
      setWinner(winner)
      setRoom(room)
      setStatus('completed')
    })

    return () => {
      socket.off('arena_queue_waiting')
      socket.off('arena_match_found')
      socket.off('solution_submitted')
      socket.off('attacks_submitted')
      socket.off('ai_judge_result')
      socket.off('roles_switched')
      socket.off('battle_finished')
    }
  }, [])

  const joinArenaQueue = (name = 'Cipher_Wraith') => {
    socket.emit('join_arena_queue', { name })
  }

  const updateSolverCode = (code) => {
    if (!room) return
    socket.emit('solver_code_update', {
      roomId: room.roomId,
      code
    })
  }

  const updateCorruptorTests = (tests) => {
    if (!room) return
    socket.emit('corruptor_tests_update', {
      roomId: room.roomId,
      tests
    })
  }

  const submitSolution = (code) => {
    if (!room) return
    socket.emit('submit_solution', {
      roomId: room.roomId,
      code
    })
  }

  const submitAttacks = (tests) => {
    if (!room) return
    socket.emit('submit_attacks', {
      roomId: room.roomId,
      tests
    })
  }

  const switchRoles = () => {
    if (!room) return
    socket.emit('switch_roles', {
      roomId: room.roomId
    })
  }

  const finishBattle = () => {
    if (!room) return
    socket.emit('finish_battle', {
      roomId: room.roomId
    })
  }

  return {
    room,
    status,
    decision,
    winner,
    joinArenaQueue,
    updateSolverCode,
    updateCorruptorTests,
    submitSolution,
    submitAttacks,
    switchRoles,
    finishBattle
  }
}