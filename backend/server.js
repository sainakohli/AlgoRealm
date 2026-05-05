require("dotenv").config({ path: __dirname + "/.env" });

const OpenAI = require("openai");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const arenaSocket = require("./socket/arenaSocket");
const heistSocket = require("./socket/heistSocket");
const app = express();

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"]
}));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("AlgoRealm backend is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const players = {};

io.on("connection", (socket) => {
  
  console.log("User connected:", socket.id);
  arenaSocket(io, socket);
  heistSocket(io, socket);
  socket.on("join_world", (player) => {
    players[socket.id] = {
      id: socket.id,
      name: player.name || "Player",
      x: player.x || 100,
      y: player.y || 100,
      direction: "down"
    };

    socket.emit("world_players", players);
    socket.broadcast.emit("player_joined", players[socket.id]);

    console.log(`${players[socket.id].name} joined world`);
  });

  socket.on("player_move", (data) => {
    if (!players[socket.id]) return;

    players[socket.id] = {
      ...players[socket.id],
      x: data.x,
      y: data.y,
      direction: data.direction
    };

    socket.broadcast.emit("player_moved", players[socket.id]);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete players[socket.id];
    socket.broadcast.emit("player_left", socket.id);
  });
});

const PORT = 5000;

app.post("/api/arena/judge", async (req, res) => {
  try {
    const { solverCode, corruptorTests, problem, roundNumber } = req.body;

    if (!process.env.NVIDIA_API_KEY) {
      throw new Error("NVIDIA_API_KEY not loaded");
    }

    const prompt = `
You are an expert competitive programming judge for AlgoRealm.

Problem:
${JSON.stringify(problem)}

Round:
${roundNumber}

Solver Code:
${solverCode}

Corruptor Test Cases:
${corruptorTests}

Evaluate:
1. Are the corruptor test cases valid edge cases?
2. Does the solver code handle empty inputs, duplicates, invalid inputs, negative numbers, and performance constraints?
3. Decide the winner.

Return ONLY valid JSON. No markdown. No extra text.

JSON format:
{
  "weaknessFound": true,
  "corruptorTestValidity": "VALID",
  "solverRobustness": 78,
  "explanation": "Solver fails for empty array input.",
  "roundWinner": "CORRUPTOR"
}

Rules:
- roundWinner must be either "SOLVER" or "CORRUPTOR".
- corruptorTestValidity must be either "VALID" or "WEAK".
- solverRobustness must be a number from 0 to 100.
`;

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false,
    });

    let text = completion.choices[0]?.message?.content || "";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let decision;

    try {
      decision = JSON.parse(text);
    } catch (parseError) {
      console.error("NIM JSON parse failed:", text);

      const hasEdgeCases =
        corruptorTests?.toLowerCase().includes("empty") ||
        corruptorTests?.includes("[]") ||
        corruptorTests?.includes("null") ||
        corruptorTests?.includes("-1");

      decision = {
        weaknessFound: hasEdgeCases,
        corruptorTestValidity: hasEdgeCases ? "VALID" : "WEAK",
        solverRobustness: hasEdgeCases ? 45 : 75,
        explanation: "AI response could not be parsed. Fallback judge result used.",
        roundWinner: hasEdgeCases ? "CORRUPTOR" : "SOLVER",
      };
    }

    res.json({
      weaknessFound: Boolean(decision.weaknessFound),
      corruptorTestValidity:
        decision.corruptorTestValidity === "VALID" ? "VALID" : "WEAK",
      solverRobustness: Number(decision.solverRobustness) || 50,
      explanation: decision.explanation || "AI referee completed judgement.",
      roundWinner:
        decision.roundWinner === "CORRUPTOR" ? "CORRUPTOR" : "SOLVER",
    });
  } catch (error) {
    console.error("Judge API error:", error);

    res.json({
      weaknessFound: false,
      corruptorTestValidity: "WEAK",
      solverRobustness: 50,
      explanation: "AI referee unavailable. Fallback result used.",
      roundWinner: "SOLVER",
    });
  }
});

// ─── Heist Mode Backend State ────────────────────────────────────────────────

const heistRooms = {};

app.post("/api/heist/create", (req, res) => {
  const roomId = `heist_${Date.now()}`;

  heistRooms[roomId] = {
    roomId,
    phase: "BUILD", // BUILD | TEST | ANALYZE | COMPLETE
    status: "IN_PROGRESS", // IN_PROGRESS | REWRITE_REQUIRED | APPROVED
    builderCode: "",
    testerCases: "",
    testResults: null,
    analystReview: null,
    history: [
      {
        type: "SYSTEM",
        message: "Heist room created. Builder phase started.",
        time: new Date().toISOString(),
      },
    ],
  };

  res.json(heistRooms[roomId]);
});

app.get("/api/heist/:roomId", (req, res) => {
  const { roomId } = req.params;

  if (!heistRooms[roomId]) {
    return res.status(404).json({ error: "Heist room not found" });
  }

  res.json(heistRooms[roomId]);
});

app.post("/api/heist/:roomId/code", (req, res) => {
  const { roomId } = req.params;
  const { builderCode } = req.body;

  if (!heistRooms[roomId]) {
    return res.status(404).json({ error: "Heist room not found" });
  }

  if (!builderCode || !builderCode.trim()) {
    return res.status(400).json({ error: "Builder code is required" });
  }

  heistRooms[roomId].builderCode = builderCode;
  heistRooms[roomId].phase = "TEST";
  heistRooms[roomId].status = "IN_PROGRESS";

  heistRooms[roomId].history.unshift({
    type: "BUILDER",
    message: "Builder submitted code. Tester phase started.",
    time: new Date().toISOString(),
  });

  res.json(heistRooms[roomId]);
});

app.post("/api/heist/:roomId/tests", (req, res) => {
  const { roomId } = req.params;
  const { testerCases, testResults } = req.body;

  if (!heistRooms[roomId]) {
    return res.status(404).json({ error: "Heist room not found" });
  }

  if (!testerCases || !testerCases.trim()) {
    return res.status(400).json({ error: "Tester cases are required" });
  }

  heistRooms[roomId].testerCases = testerCases;
  heistRooms[roomId].testResults = testResults || null;
  heistRooms[roomId].phase = "ANALYZE";

  heistRooms[roomId].history.unshift({
    type: "TESTER",
    message: "Tester submitted test cases. Analyst phase started.",
    time: new Date().toISOString(),
  });

  res.json(heistRooms[roomId]);
});

app.post("/api/heist/:roomId/analysis", (req, res) => {
  const { roomId } = req.params;
  const { timeComplexity, spaceComplexity, decision, reason } = req.body;

  if (!heistRooms[roomId]) {
    return res.status(404).json({ error: "Heist room not found" });
  }

  if (!timeComplexity || !spaceComplexity || !decision) {
    return res.status(400).json({
      error: "timeComplexity, spaceComplexity, and decision are required",
    });
  }

  const normalizedDecision = decision.toUpperCase();

  if (!["APPROVE", "VETO"].includes(normalizedDecision)) {
    return res.status(400).json({
      error: "decision must be APPROVE or VETO",
    });
  }

  heistRooms[roomId].analystReview = {
    timeComplexity,
    spaceComplexity,
    decision: normalizedDecision,
    reason: reason || "",
    reviewedAt: new Date().toISOString(),
  };

  if (normalizedDecision === "VETO") {
    heistRooms[roomId].phase = "BUILD";
    heistRooms[roomId].status = "REWRITE_REQUIRED";

    heistRooms[roomId].history.unshift({
      type: "ANALYST",
      message: "Analyst vetoed the solution. Builder must rewrite code.",
      time: new Date().toISOString(),
    });
  } else {
    heistRooms[roomId].phase = "COMPLETE";
    heistRooms[roomId].status = "APPROVED";

    heistRooms[roomId].history.unshift({
      type: "ANALYST",
      message: "Analyst approved the solution. Heist completed.",
      time: new Date().toISOString(),
    });
  }

  res.json(heistRooms[roomId]);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


