import React, { useState, useEffect } from 'react'
import { Plus, Plane, User, X } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { travelService } from '../services/travelService'

const Home = ({ user }) => {
    const navigate = useNavigate()
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newTrip, setNewTrip] = useState({ name: '', startDate: '', endDate: '' })

    useEffect(() => {
        loadTrips()
    }, [])

    const loadTrips = async () => {
        setLoading(true)
        try {
            const data = await travelService.getUserTrips(user.uid)
            setTrips(data)
        } catch (err) {
            console.error("Error loading trips:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newTrip.name) return

        try {
            await travelService.createTrip({
                name: newTrip.name,
                date: `${newTrip.startDate} - ${newTrip.endDate}`,
                participants: [user.uid]
            }, user.uid)
            setShowCreateModal(false)
            setNewTrip({ name: '', startDate: '', endDate: '' })
            loadTrips()
            alert("여행이 생성되었습니다!")
        } catch (err) {
            alert("여행 생성에 실패했습니다.")
        }
    }

    const handleSelect = (trip) => {
        navigate(`/trip/${trip.id}`)
    }

    return (
        <div className="container animate-fade">
            <nav style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 0' }}>
                <Link to="/profile" className="glass" style={{
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--primary)'
                }}>
                    <User size={24} />
                </Link>
            </nav>

            <header style={{ padding: '0.5rem 0 2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>SimTour</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Simple Tour, Smart Travel</p>
            </header>

            <div className="trip-list grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', gridColumn: '1 / -1' }}>진행 중인 여행</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
                ) : trips.length > 0 ? trips.map(trip => (
                    <div
                        key={trip.id}
                        className="card glass"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => handleSelect(trip)}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Plane size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>{trip.name}</h3>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {trip.date} • {trip.participants?.length || 0}명 참여 중
                                </p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="card glass" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        진행 중인 여행이 없습니다. 새로 만들어보세요!
                    </div>
                )}

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        margin: '1rem auto 0',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        gridColumn: '1 / -1'
                    }}>
                    <Plus size={20} />
                    새 여행 만들기
                </button>
            </div>

            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <form onSubmit={handleCreate} className="card glass animate-fade" style={{ width: '100%', maxWidth: '400px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>새 여행 만들기</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>여행 이름</label>
                            <input
                                placeholder="예: 홋카이도 스키 여행"
                                value={newTrip.name}
                                onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>시작일</label>
                                <input
                                    type="date"
                                    value={newTrip.startDate}
                                    onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>종료일</label>
                                <input
                                    type="date"
                                    value={newTrip.endDate}
                                    onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>생성하기</button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default Home
