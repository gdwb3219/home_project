import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ChartDashboardPage from './pages/ChartDashboardPage'
import AssetRegisterPage from './pages/AssetRegisterPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/charts" element={<ChartDashboardPage />} />
        <Route path="/register" element={<AssetRegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
