import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { io } from "socket.io-client"

const API_URL = "https://web-poll-new.onrender.com"
const socket = io(API_URL)

function PollPage() {
  const { id } = useParams()
  const [poll, setPoll] = useState(null)
  const [selected, setSelected] = useState(null)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    axios.get(`${API_URL}/api/poll/${id}`)
      .then(res => setPoll(res.data))

    socket.emit("joinPoll", id)

    socket.on("update", (options) => {
      setPoll(prev => prev ? { ...prev, options } : prev)
    })

    socket.on("alreadyVoted", () => {
      setVoted(true)
      alert("You have already voted!")
    })

    return () => {
      socket.off("update")
      socket.off("alreadyVoted")
    }
  }, [id])

  const getVoterId = () => {
    let voterId = localStorage.getItem("voterId")
    if (!voterId) {
      voterId = crypto.randomUUID()
      localStorage.setItem("voterId", voterId)
    }
    return voterId
  }

  const vote = () => {
    if (selected === null) return alert("Select an option")
    if (voted) return alert("You already voted")

    socket.emit("vote", {
      pollId: id,
      optionIndex: selected,
      voterId: getVoterId()
    })

    setVoted(true)
  }

  if (!poll) return <div className="container">Loading...</div>

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)
  const leaderboard = [...poll.options].sort((a, b) => b.votes - a.votes)

  return (
    <div className="container">
      <h2>{poll.question}</h2>

      {poll.options.map((opt, index) => {
        const percentage = totalVotes
          ? ((opt.votes / totalVotes) * 100).toFixed(1)
          : 0

        return (
          <div key={index} style={{ marginTop: "15px" }}>
            <label>
              <input
                type="radio"
                name="vote"
                disabled={voted}
                onChange={() => setSelected(index)}
                style={{ marginRight: "8px" }}
              />
              {opt.text}
            </label>

            <div style={{
              height: "6px",
              background: "#eee",
              borderRadius: "4px",
              marginTop: "8px"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                background: "#111",
                borderRadius: "4px"
              }} />
            </div>

            <small>
              {opt.votes} votes ({percentage}%)
            </small>
          </div>
        )
      })}

      <button
        onClick={vote}
        disabled={voted}
        style={{ marginTop: "20px" }}
      >
        {voted ? "Vote Submitted" : "Submit Vote"}
      </button>

      <div style={{
        marginTop: "40px",
        padding: "20px",
        background: "#f5f5f5",
        borderRadius: "8px"
      }}>
        <h3>Leaderboard</h3>

        {leaderboard.map((item, index) => (
          <div key={index} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0",
            fontWeight: index === 0 ? "600" : "400"
          }}>
            <span>
              {index === 0 ? "🥇 " :
               index === 1 ? "🥈 " :
               index === 2 ? "🥉 " : ""}
              {item.text}
            </span>
            <span>{item.votes} votes</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PollPage
