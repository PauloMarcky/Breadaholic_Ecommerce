import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from './pages/Home'
import './App.css'
import { Registration } from "./pages/Registration"


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registration" element={<Registration />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
