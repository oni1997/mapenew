import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { Helmet } from 'react-helmet-async'

// Layout components
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'

// Page components
import Dashboard from './pages/Dashboard'
import NeighborhoodExplorer from './pages/NeighborhoodExplorer'
import RentalExplorerFixed from './pages/RentalExplorerFixed'
import Comparator from './pages/Comparator'
import ChatBot from './pages/ChatBot'
import MarketInsights from './pages/MarketInsights'
import Help from './pages/Help'
import About from './pages/About'

// Store
import { useAppStore } from './store/appStore'

function App() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <>
      <Helmet>
        <title>City Insights AI - Urban Analytics Platform</title>
        <meta name="description" content="AI-powered urban analytics platform using MongoDB vector search and Gemini AI" />
      </Helmet>
      
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />
        
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: 8, // Account for header height
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explorer" element={<NeighborhoodExplorer />} />
            <Route path="/rentals" element={<RentalExplorerFixed />} />
            <Route path="/compare" element={<Comparator />} />
            <Route path="/chat" element={<ChatBot />} />
            <Route path="/insights" element={<MarketInsights />} />
            <Route path="/help" element={<Help />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </>
  )
}

export default App
