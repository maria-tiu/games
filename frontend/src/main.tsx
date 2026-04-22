import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './theme.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { PlaylistProvider } from './context/PlaylistContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import AuthPage from './pages/AuthPage.tsx'
import TetrisGame from './pages/TetrisGame.tsx'
import SlidingPuzzle from './pages/SlidingPuzzle.tsx'
import Game2048 from './pages/Game2048.tsx'
import BreakoutGame from './pages/BreakoutGame.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PlaylistProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="/tetris" element={<TetrisGame />} />
              <Route path="/sliding-puzzle" element={<SlidingPuzzle />} />
              <Route path="/2048" element={<Game2048 />} />
              <Route path="/breakout" element={<BreakoutGame />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </PlaylistProvider>
    </AuthProvider>
  </StrictMode>,
)
