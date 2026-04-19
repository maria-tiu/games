import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import AuthPage from './pages/AuthPage.tsx'
import TetrisGame from './pages/TetrisGame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<AuthPage />} />
          </Route>
          <Route path="/tetris" element={<TetrisGame />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
