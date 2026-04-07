import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import AuthButtons from './components/AuthButtons'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import PlotDetail from './pages/PlotDetail'

function App() {
  const { isLoading } = useAuth0()

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <nav>
        <strong>My Plots</strong> | <AuthButtons />
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/plot/:id" element={<ProtectedRoute><PlotDetail /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
