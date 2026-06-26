import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import AssetRegisterPage from './pages/AssetRegisterPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/register" element={<AssetRegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
