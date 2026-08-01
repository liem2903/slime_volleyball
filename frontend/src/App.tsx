import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import PlayerPage from './pages/PlayerPage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/session/:sessionId" element={<SessionPage />} />
      <Route path="/session/:sessionId/:adminId" element={<AdminPage />} />
      <Route path="/player/:sessionId/:playerId" element={<PlayerPage/>}/>
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes> 
  )
}

export default App
