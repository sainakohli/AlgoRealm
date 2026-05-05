const heistRooms = {};
const waitingPlayers = [];

function getRoleByIndex(index) {
  if (index === 0) return "BUILDER";
  if (index === 1) return "TESTER";
  return "ANALYST";
}

function createRoom(io) {
  const roomId = `heist_${Date.now()}`;
  const players = waitingPlayers.splice(0, 3);

  heistRooms[roomId] = {
    roomId,
    phase: "CODE",
    status: "IN_PROGRESS",
    solutionCode: "",
    testCases: "",
    testResults: null,
    complexityReview: null,
    approvalStatus: "PENDING",
    vetoReason: "",
    players: {},
    activityLog: [
      {
        id: `h_${Date.now()}`,
        user: "SYSTEM",
        role: "SYSTEM",
        action: "Heist team formed. Builder phase started.",
        ts: "just now",
        color: "#ff9500",
      },
    ],
  };

  players.forEach((player, index) => {
    const role = getRoleByIndex(index);

    heistRooms[roomId].players[player.socketId] = {
      id: player.socketId,
      name: player.name,
      role,
      status: role === "BUILDER" ? "CODING" : "READY",
      color:
        role === "BUILDER"
          ? "#00f5ff"
          : role === "TESTER"
          ? "#00ff88"
          : "#a855f7",
      online: true,
    };

    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.join(roomId);
      socket.emit("heist:matched", {
        roomId,
        role,
        room: heistRooms[roomId],
      });
    }
  });

  io.to(roomId).emit("heist:update", heistRooms[roomId]);
}

module.exports = function heistSocket(io, socket) {
  socket.on("heist:join-queue", ({ name }) => {
    if (waitingPlayers.find((p) => p.socketId === socket.id)) return;

    waitingPlayers.push({
      socketId: socket.id,
      name: name || `Player_${socket.id.slice(0, 4)}`,
    });

    socket.emit("heist:queue-status", {
      waiting: waitingPlayers.length,
      needed: 3,
    });

    if (waitingPlayers.length >= 3) {
      createRoom(io);
    }
  });

  socket.on("heist:submit-code", ({ roomId, solutionCode }) => {
    const room = heistRooms[roomId];
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.role !== "BUILDER") return;

    room.solutionCode = solutionCode;
    room.phase = "TESTING";

    Object.values(room.players).forEach((p) => {
      if (p.role === "BUILDER") p.status = "WAITING";
      if (p.role === "TESTER") p.status = "TESTING";
    });

    room.activityLog.unshift({
      id: `h_${Date.now()}`,
      user: player.name,
      role: "BUILDER",
      action: "submitted code for testing",
      ts: "just now",
      color: player.color,
    });

    io.to(roomId).emit("heist:update", room);
  });

  socket.on("heist:submit-tests", ({ roomId, testCases, testResults }) => {
    const room = heistRooms[roomId];
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.role !== "TESTER") return;

    room.testCases = testCases;
    room.testResults = testResults;
    room.phase = "ANALYSIS";

    Object.values(room.players).forEach((p) => {
      if (p.role === "TESTER") p.status = "DONE";
      if (p.role === "ANALYST") p.status = "REVIEWING";
    });

    room.activityLog.unshift({
      id: `h_${Date.now()}`,
      user: player.name,
      role: "TESTER",
      action: `submitted tests — ${testResults?.passed || 0}/${testResults?.total || 0} passed`,
      ts: "just now",
      color: player.color,
    });

    io.to(roomId).emit("heist:update", room);
  });

  socket.on("heist:analyst-decision", ({ roomId, complexityReview, decision, reason }) => {
    const room = heistRooms[roomId];
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.role !== "ANALYST") return;

    const normalizedDecision = decision === "VETO" ? "VETO" : "APPROVE";

    room.complexityReview = complexityReview;
    room.approvalStatus = normalizedDecision === "VETO" ? "VETOED" : "APPROVED";
    room.vetoReason = reason || "";

    if (normalizedDecision === "VETO") {
      room.phase = "VETOED";
      room.status = "REWRITE_REQUIRED";

      Object.values(room.players).forEach((p) => {
        if (p.role === "BUILDER") p.status = "CODING";
      });

      room.activityLog.unshift({
        id: `h_${Date.now()}`,
        user: player.name,
        role: "ANALYST",
        action: `VETOED: ${reason || "Builder must rewrite"}`,
        ts: "just now",
        color: player.color,
      });
    } else {
      room.phase = "BREACH";
      room.status = "APPROVED";

      room.activityLog.unshift({
        id: `h_${Date.now()}`,
        user: player.name,
        role: "ANALYST",
        action: "approved solution — fortress breached",
        ts: "just now",
        color: player.color,
      });
    }

    io.to(roomId).emit("heist:update", room);
  });

  socket.on("heist:reset-after-veto", ({ roomId }) => {
    const room = heistRooms[roomId];
    if (!room) return;

    room.phase = "CODE";
    room.approvalStatus = "PENDING";
    room.testResults = null;
    room.vetoReason = "";

    io.to(roomId).emit("heist:update", room);
  });

  socket.on("disconnect", () => {
    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) waitingPlayers.splice(index, 1);

    Object.values(heistRooms).forEach((room) => {
      if (room.players[socket.id]) {
        room.players[socket.id].online = false;
        io.to(room.roomId).emit("heist:update", room);
      }
    });
  });
};