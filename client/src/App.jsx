import { BrowserRouter, Routes, Route } from "react-router-dom"
import CreatePoll from "./CreatePoll"
import PollPage from "./PollPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
