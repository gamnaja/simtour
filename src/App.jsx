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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Hokkaido Ski 2026</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>여행 일정과 경비를 스마트하게 관리하세요</p>
                <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <LogIn size={20} /> 구글로 시작하기
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
