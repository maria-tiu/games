import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { PlaylistProvider } from './context/PlaylistContext.tsx'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import AuthPage from './pages/AuthPage.tsx'
import TetrisGame from './pages/TetrisGame.tsx'
import SlidingPuzzle from './pages/SlidingPuzzle.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PlaylistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="/tetris" element={<TetrisGame />} />
            <Route path="/sliding-puzzle" element={<SlidingPuzzle />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PlaylistProvider>
    </AuthProvider>
  </StrictMode>,
)

