# AlgoRealm

AlgoRealm is a multiplayer coding game set inside a corrupted cyber world where algorithms become gameplay mechanics. Players can explore digital zones, compete in real-time coding battles, and team up for collaborative heists where each member has a unique role.

Instead of solving DSA problems on a plain screen, players interact with a game-inspired world featuring live multiplayer movement, AI-powered judging, progression systems, and role-based missions.

---

# Features

* Real-time multiplayer world exploration using Socket.IO
* Arena Mode — 1v1 Solver vs Corruptor battles
* Heist Mode — 3-player collaborative coding missions
* AI Referee system for evaluating code robustness and edge cases
* XP, coins, ranks, rewards, and progression system
* Login/Register with Firebase Authentication
* Player profiles and leaderboard system
* Interactive futuristic cyberpunk UI
* Protected routes and authenticated gameplay

---

# Arena Mode

Two players are matched into a live coding battle.

* Solver writes the solution
* Corruptor writes edge-case test attacks
* AI Referee evaluates who wins the round

---

# Heist Mode

Three players collaborate in a synchronized mission.

* Builder → writes code
* Tester → creates test cases
* Analyst → reviews time/space complexity

The mission progresses through coding, testing, analysis, and fortress breach phases.

---

# Tech Stack

* React 18
* Vite
* React Router DOM
* Socket.IO
* Firebase Authentication
* Firestore Database
* Node.js + Express
* Framer Motion
* CSS Modules
* NVIDIA NIM (Llama 3.1 AI Referee)

---

# Installation

## 1. Clone Repository

```bash
git clone <repo-url>
cd AlgoRealm
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd backend
npm install
```

---

# Environment Variables

Create a `.env` file inside the backend folder:

```env
NVIDIA_API_KEY=your_nvidia_api_key
```

For Firebase, create a Firebase project and add your Firebase configuration inside:

```text
src/firebase.js
```

Example:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

---

# Running the Project

## Start Backend

```bash
cd backend
node server.js
```

Backend runs on:

```text
http://localhost:5000
```

---

## Start Frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Pages

| Route          | Description                            |
| -------------- | -------------------------------------- |
| `/dashboard`   | Player hub with stats, quests, rewards |
| `/world`       | Multiplayer world map and heist zones  |
| `/practice`    | Algorithm challenge browser            |
| `/arena`       | Real-time Solver vs Corruptor battles  |
| `/heist`       | 3-player collaborative coding missions |
| `/leaderboard` | Global rankings and progression        |
| `/profile`     | Player profile and achievements        |

---

# Important Notes

* Firebase Authentication is required for login/register.
* NVIDIA API key is required for AI referee functionality.
* Some gameplay systems currently use mock/demo logic as part of the prototype.
* Phaser.js integration is planned for future versions. Current world rendering is React-based.

---

# Future Improvements

* Full secure online code execution
* Advanced AI judging system
* Real matchmaking/ranking system
* Persistent multiplayer worlds
* More algorithm-based game modes
* Cloud deployment and scaling
