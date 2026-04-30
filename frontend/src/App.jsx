import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from './pages/Home'
import { Menu } from './pages/Menu'
import './App.css'
import { Registration } from "./pages/Registration"
import { TalkToUs } from "./pages/TalkToUs"
import { Locations } from "./pages/Locations"


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/home" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/contacts" element={<TalkToUs />} />
        <Route path="/locations" element={<Locations />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
