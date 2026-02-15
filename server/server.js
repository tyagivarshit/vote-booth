import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import { nanoid } from "nanoid"

dotenv.config()

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// ================= SAFE MONGO CONNECT =================

const mongoUri = process.env.MONGO_URL

if (!mongoUri) {
  console.error(" MONGO_URL is missing")
  process.exit(1)
}

mongoose.connect(mongoUri)
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.log(" Mongo Error:", err.message))

// ================= MODEL =================

const pollSchema = new mongoose.Schema({
  pollId: String,
  question: String,
  options: [
    {
      text: String,
      votes: { type: Number, default: 0 }
    }
  ],
  voters: [String]
})

const Poll = mongoose.model("Poll", pollSchema)

// ================= CREATE POLL =================

app.post("/api/create", async (req, res) => {
  const { question, options } = req.body

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: "Minimum 2 options required" })
  }

  const pollId = nanoid(8)

  await Poll.create({
    pollId,
    question,
    options: options.map(opt => ({ text: opt }))
  })

  res.json({ link: `/poll/${pollId}` })
})

// ================= GET POLL =================

app.get("/api/poll/:id", async (req, res) => {
  const poll = await Poll.findOne({ pollId: req.params.id })

  if (!poll) return res.status(404).json({ message: "Not found" })

  res.json(poll)
})

// ================= SOCKET =================

io.on("connection", (socket) => {

  socket.on("joinPoll", (pollId) => {
    socket.join(pollId)
  })

  socket.on("vote", async ({ pollId, optionIndex, voterId }) => {
    const poll = await Poll.findOne({ pollId })
    if (!poll) return

    // Prevent multiple voting
    if (poll.voters.includes(voterId)) {
      socket.emit("alreadyVoted")
      return
    }

    poll.options[optionIndex].votes += 1
    poll.voters.push(voterId)

    await poll.save()

    io.to(pollId).emit("update", poll.options)
  })
})

// ================= PORT FIX =================

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`)
})
