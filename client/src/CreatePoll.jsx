import { useState } from "react"
import axios from "axios"

function CreatePoll() {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [generatedLink, setGeneratedLink] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOptionChange = (value, index) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length >= 5) return
    setOptions([...options, ""])
  }

  const handleCreate = async () => {
    if (!question.trim()) return alert("Enter a question")

    const validOptions = options.filter(o => o.trim() !== "")
    if (validOptions.length < 2)
      return alert("Minimum 2 valid options required")

    try {
      setLoading(true)

      const res = await axios.post("http://localhost:5000/api/create", {
        question,
        options: validOptions
      })

      const fullLink = `${window.location.origin}${res.data.link}`
      setGeneratedLink(fullLink)

    } catch (err) {
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    alert("Link copied!")
  }

  const resetForm = () => {
    setQuestion("")
    setOptions(["", ""])
    setGeneratedLink("")
  }

  return (
    <div className="container">

      <h1>Create Poll</h1>

      <label>Poll Question</label>
      <input
        placeholder="Enter your question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <label style={{ marginTop: "20px" }}>Options</label>

      {options.map((opt, index) => (
        <input
          key={index}
          placeholder={`Option ${index + 1}`}
          value={opt}
          onChange={(e) =>
            handleOptionChange(e.target.value, index)
          }
        />
      ))}

      {/* Buttons Row */}
      <div className="button-row">
        <button
          className="secondary"
          onClick={addOption}
          disabled={options.length >= 5}
        >
          + Add Option
        </button>

        <button onClick={handleCreate} disabled={loading}>
          {loading ? "Generating..." : "Generate Link"}
        </button>
      </div>

      {/* Generated Link Section */}
      {generatedLink && (
        <>
          <div className="link-box">
            {generatedLink}
          </div>

          <div className="link-actions">
            <button onClick={copyToClipboard}>
              Copy Link
            </button>

            <button
              className="secondary"
              onClick={resetForm}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CreatePoll
