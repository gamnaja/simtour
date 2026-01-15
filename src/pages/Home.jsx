import React, { useState, useEffect } from 'react'
import { Plus, Plane, User, X, Edit2, Trash2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { travelService } from '../services/travelService'
import ContextMenu from '../components/ContextMenu'
import { useContextMenu } from '../hooks/useContextMenu'
import ConfirmModal from '../components/ConfirmModal'

const Home = ({ user }) => {
    const navigate = useNavigate()
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingTrip, setEditingTrip] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [tripToDelete, setTripToDelete] = useState(null)
    const [newTrip, setNewTrip] = useState({ name: '', startDate: '', endDate: '' })

    const { contextMenu, onContextMenu, onTouchStart, onTouchEnd, closeContextMenu } = useContextMenu()

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

    const handleSelect = (trip) => {
        // Only navigate if menu is closed
        if (!contextMenu.isOpen) {
            navigate(`/trip/${trip.id}`)
        }
    }

    const handleEditTrip = (trip) => {
        setEditingTrip(trip)
        const dates = trip.date.split(' - ')
        setNewTrip({
            name: trip.name,
            startDate: dates[0] || '',
            endDate: dates[1] || ''
        })
        setShowCreateModal(true)
    }

    const handleDeleteTrip = (trip) => {
        setTripToDelete(trip)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!tripToDelete) return
        try {
            await travelService.deleteTrip(tripToDelete.id)
            setShowDeleteModal(false)
            setTripToDelete(null)
            loadTrips()
            alert("여행이 삭제되었습니다.")
        } catch (err) {
            alert("여행 삭제에 실패했습니다.")
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newTrip.name) return

        try {
            if (editingTrip) {
                await travelService.updateTrip(editingTrip.id, {
                    name: newTrip.name,
                    date: `${newTrip.startDate} - ${newTrip.endDate}`
                })
                alert("여행이 수정되었습니다!")
            } else {
                await travelService.createTrip({
                    name: newTrip.name,
                    date: `${newTrip.startDate} - ${newTrip.endDate}`,
                    participants: [user.uid]
                }, user.uid)
                alert("여행이 생성되었습니다!")
            }
            setShowCreateModal(false)
            setEditingTrip(null)
            setNewTrip({ name: '', startDate: '', endDate: '' })
            loadTrips()
        } catch (err) {
            alert(editingTrip ? "여행 수정에 실패했습니다." : "여행 생성에 실패했습니다.")
        }
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
                        style={{ cursor: 'pointer', transition: 'transform 0.2s', userSelect: 'none', WebkitTouchCallout: 'none' }}
                        onClick={() => handleSelect(trip)}
                        onContextMenu={(e) => onContextMenu(e, trip)}
                        onTouchStart={(e) => onTouchStart(e, trip)}
                        onTouchEnd={onTouchEnd}
                        onMouseOver={(e) => !contextMenu.isOpen && (e.currentTarget.style.transform = 'scale(1.01)')}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} className="card glass animate-fade" style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '2rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1e293b' }}>{editingTrip ? '여행 수정하기' : '새 여행 만들기'}</h3>
                            <button type="button" onClick={() => { setShowCreateModal(false); setEditingTrip(null); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', marginLeft: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>여행 이름</label>
                            <input
                                placeholder="예: 홋카이도 스키 여행"
                                value={newTrip.name}
                                onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
                                required
                                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1.5px solid #f1f5f9', fontSize: '1rem', background: '#f8fafc', transition: 'all 0.2s' }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.background = '#f8fafc'; }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', marginLeft: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>시작일</label>
                                <input
                                    type="date"
                                    value={newTrip.startDate}
                                    onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1.5px solid #f1f5f9', fontSize: '1rem', background: '#f8fafc', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', marginLeft: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>종료일</label>
                                <input
                                    type="date"
                                    value={newTrip.endDate}
                                    onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1.5px solid #f1f5f9', fontSize: '1rem', background: '#f8fafc', fontWeight: 600 }}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '18px', marginTop: '0.5rem', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)' }}
                        >
                            {editingTrip ? '수정하기' : '생성하기'}
                        </button>
                    </form>
                </div>
            )}

            <ContextMenu
                isOpen={contextMenu.isOpen}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={closeContextMenu}
                items={[
                    {
                        label: '여행 수정',
                        icon: <Edit2 size={16} />,
                        onClick: () => handleEditTrip(contextMenu.data)
                    },
                    {
                        label: '여행 삭제',
                        icon: <Trash2 size={16} />,
                        color: '#dc2626',
                        onClick: () => handleDeleteTrip(contextMenu.data)
                    }
                ]}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                message={`'${tripToDelete?.name}' 여행을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.`}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    )
}

export default Home
