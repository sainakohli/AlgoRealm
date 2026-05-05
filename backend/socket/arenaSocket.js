let waitingPlayer = null
const arenaRooms = {}

function createArenaRoom(player1, player2) {
  const roomId = `arena_${Date.now()}`

  arenaRooms[roomId] = {
    roomId,
    round: 1,
    status: 'active',
    players: {
      [player1.id]: {
        id: player1.id,
        name: player1.name,
        role: 'solver',
        score: 0
      },
      [player2.id]: {
        id: player2.id,
        name: player2.name,
        role: 'corruptor',
        score: 0
      }
    },
    solverCode: '',
    corruptorTests: '',
    decisions: []
  }

  return arenaRooms[roomId]
}

function mockAIJudge(room) {
  const tests = room.corruptorTests.toLowerCase()
  const code = room.solverCode.toLowerCase()

  const hasEdgeCase =
    tests.includes('empty') ||
    tests.includes('null') ||
    tests.includes('[]') ||
    tests.includes('-1')

  const solverHandled =
    code.includes('if') &&
    (code.includes('null') || code.includes('length'))

  const corruptorWins = hasEdgeCase && !solverHandled

  return {
    weaknessFound: corruptorWins,
    validAttack: hasEdgeCase,
    solverRobustness: solverHandled ? 85 : 45,
    explanation: corruptorWins
      ? 'AI Judge: Corruptor found a valid edge-case weakness in the solver code.'
      : 'AI Judge: Solver handled the submitted edge cases successfully.',
    roundWinner: corruptorWins ? 'corruptor' : 'solver'
  }
}

function arenaSocket(io, socket) {
  socket.on('join_arena_queue', ({ name }) => {
    const player = {
      id: socket.id,
      name: name || 'Anonymous'
    }

    if (!waitingPlayer) {
      waitingPlayer = player
      socket.emit('arena_queue_waiting', {
        message: 'Waiting for opponent...'
      })
      return
    }

    const opponent = waitingPlayer
    waitingPlayer = null

    const room = createArenaRoom(opponent, player)

    socket.join(room.roomId)
    io.sockets.sockets.get(opponent.id)?.join(room.roomId)

    io.to(room.roomId).emit('arena_match_found', room)
  })

  socket.on('solver_code_update', ({ roomId, code }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.solverCode = code

    socket.to(roomId).emit('solver_code_updated', {
      playerId: socket.id,
      code
    })
  })

  socket.on('corruptor_tests_update', ({ roomId, tests }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.corruptorTests = tests

    socket.to(roomId).emit('corruptor_tests_updated', {
      playerId: socket.id,
      tests
    })
  })

  socket.on('submit_solution', ({ roomId, code }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.solverCode = code

    io.to(roomId).emit('solution_submitted', {
      playerId: socket.id,
      code
    })
  })

  socket.on('submit_attacks', ({ roomId, tests }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.corruptorTests = tests

    io.to(roomId).emit('attacks_submitted', {
      playerId: socket.id,
      tests
    })

    const decision = mockAIJudge(room)
    room.decisions.push({
      round: room.round,
      ...decision
    })

    const winnerRole = decision.roundWinner

    Object.values(room.players).forEach((player) => {
      if (player.role === winnerRole) {
        player.score += 1
      }
    })

    io.to(roomId).emit('ai_judge_result', {
      round: room.round,
      decision,
      players: room.players
    })
  })

  socket.on('switch_roles', ({ roomId }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.round = 2

    Object.values(room.players).forEach((player) => {
      player.role = player.role === 'solver' ? 'corruptor' : 'solver'
    })

    room.solverCode = ''
    room.corruptorTests = ''

    io.to(roomId).emit('roles_switched', room)
  })

  socket.on('finish_battle', ({ roomId }) => {
    const room = arenaRooms[roomId]
    if (!room) return

    room.status = 'completed'

    const players = Object.values(room.players)
    const winner =
      players[0].score > players[1].score
        ? players[0]
        : players[1].score > players[0].score
          ? players[1]
          : null

    io.to(roomId).emit('battle_finished', {
      winner,
      room
    })
  })

  socket.on('disconnect', () => {
    if (waitingPlayer?.id === socket.id) {
      waitingPlayer = null
    }
  })
}

module.exports = arenaSocket