import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import TripDashboard from './pages/TripDashboard'
import Profile from './pages/Profile'
import { authService } from './services/authService'
import { LogIn } from 'lucide-react'
import './App.css'

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = authService.onAuthSync((u) => {
            setUser(u)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleLogin = async () => {
        try {
            await authService.loginWithGoogle()
        } catch (err) {
            alert("로그인에 실패했습니다.")
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 700 }}>Loading...</div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container" style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src="/logo-v3.png" alt="SimTour Logo" style={{ width: '110px', height: '110px', marginBottom: '1.5rem', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>SimTour</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Simple Tour, Smart Travel</p>
                </div>
                <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '1.1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: 700, borderRadius: '16px' }}>
                    <LogIn size={24} /> 구글로 시작하기
                </button>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route
                    path="/trip/:tripId/*"
                    element={<TripDashboard user={user} />}
                />
            </Routes>
        </Router>
    )
}

export default App
