require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const arenaSocket = require('./socket/arenaSocket')
const app = express();

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


app.post('/api/arena/judge', async (req, res) => {
  try {
    const { solverCode, corruptorTests, problem, roundNumber } = req.body;

    const prompt = `
You are an expert competitive programming judge.

Problem:
${JSON.stringify(problem)}

Solver Code:
${solverCode}

Corruptor Test Cases:
${corruptorTests}

Strictly evaluate:

1. Are the test cases valid edge cases? (empty array, duplicates, negative numbers, large input, etc.)
2. Does the solver code handle:
   - empty inputs
   - invalid inputs
   - duplicates
   - performance constraints
3. Identify specific weakness if any.

Return ONLY JSON:
{
  "weaknessFound": true,
  "corruptorTestValidity": "VALID",
  "solverRobustness": 78,
  "explanation": "Solver fails for empty array input.",
  "roundWinner": "CORRUPTOR"
}

Rules:
- Be strict and logical
- Do NOT hallucinate
- Do NOT explain outside JSON
`

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    let text = result.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let decision;

    try {
      decision = JSON.parse(text);
    } catch {
      decision = {
        weaknessFound: false,
        corruptorTestValidity: "WEAK",
        solverRobustness: 50,
        explanation: "Fallback decision (AI parsing failed)",
        roundWinner: "SOLVER",
      };
    }

    res.json(decision);

  } catch (error) {
    console.error("Judge API error:", error);
    res.status(500).json({ error: "Failed to judge arena battle" });
  }
});
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});