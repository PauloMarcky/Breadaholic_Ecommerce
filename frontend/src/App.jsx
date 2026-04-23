import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from './pages/Home'
import './App.css'
import { Registration } from "./pages/Registration"


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
