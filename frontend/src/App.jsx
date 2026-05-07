import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from './pages/userPages/Home';
import { Menu } from './pages/userPages/Menu';
import { Registration } from "./pages/userPages/Registration";
import { TalkToUs } from "./pages/userPages/TalkToUs";
import { Locations } from "./pages/userPages/Locations";
import { ProductManager } from "./pages/adminPages/ProductManager";
import { OrderManager } from "./pages/adminPages/OrderManager";
import './App.css';


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/home" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/contacts" element={<TalkToUs />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/product_manager" element={<ProductManager />} />
        <Route path="/order_manager" element={<OrderManager />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
