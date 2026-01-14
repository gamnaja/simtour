import React, { useState, useEffect } from 'react'
import { ChevronLeft, Users, MapPin, CreditCard, Calendar, UserPlus, Trash2, Mail, Search, Edit2, Save, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ItineraryView from '../components/ItineraryView'
import ExpenseView from '../components/ExpenseView'
import { travelService } from '../services/travelService'
import { authService } from '../services/authService'

const TripDashboard = ({ user }) => {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const [trip, setTrip] = useState(null)
    const [activeTab, setActiveTab] = useState('itinerary')
    const [loading, setLoading] = useState(true)
    const [allUsers, setAllUsers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editStartDate, setEditStartDate] = useState('')
    const [editEndDate, setEditEndDate] = useState('')

    useEffect(() => {
        loadTrip()
        loadAllUsers()
    }, [tripId])

    useEffect(() => {
        if (isEditing && trip) {
            setEditName(trip.name)
            // Parse date string for inputs
            if (trip.date) {
                const parts = trip.date.split(' - ').map(p => p.trim())
                if (parts.length >= 1) {
                    setEditStartDate(parts[0].replace(/\./g, '-'))
                }
                if (parts.length >= 2) {
                    let end = parts[1].replace(/\./g, '-')
                    // Handle "MM.DD" case by prepending year from start date
                    if (end.length <= 5 && parts[0].length >= 4) {
                        end = parts[0].substring(0, 5) + end
                    }
                    setEditEndDate(end)
                }
            }
        }
    }, [isEditing, trip])



    const loadTrip = async () => {
        setLoading(true)
        try {
            const data = await travelService.getTrip(tripId)
            if (!data) {
                setLoading(false)
                return
            }
            setTrip(data)
            setLoading(false)

            if (data.participants && data.participants.length > 0) {
                const members = await Promise.all(data.participants.map(async (uid) => {
                    const profile = await authService.getUserData(uid)
                    return { uid, displayName: profile?.displayName || "알 수 없음", email: profile?.email }
                }))
                setTrip(prev => ({ ...prev, members }))
            }
        } catch (err) {
            console.error("Error loading trip:", err)
            setLoading(false)
        }
    }

    const handleUpdateTrip = async () => {
        if (!editName.trim()) return
        const formatDate = (d) => d.replace(/-/g, '.')
        const newDateStr = editStartDate && editEndDate
            ? `${formatDate(editStartDate)} - ${formatDate(editEndDate)}`
            : trip.date

        try {
            await travelService.updateTrip(tripId, {
                name: editName,
                date: newDateStr
            })
            setTrip(prev => ({ ...prev, name: editName, date: newDateStr }))
            setIsEditing(false)
        } catch (err) {
            alert("여행 정보 수정에 실패했습니다.")
        }
    }



    const loadAllUsers = async () => {
        try {
            const users = await authService.getAllUsers()
            setAllUsers(users)
        } catch (err) {
            console.error("Error loading users:", err)
        }
    }

    const handleDeleteTrip = async () => {
        if (!window.confirm("정말로 이 여행을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return
        try {
            await travelService.deleteTrip(tripId)
            navigate('/')
        } catch (err) {
            alert("삭제에 실패했습니다.")
        }
    }

    const handleJoinTrip = async () => {
        try {
            await travelService.joinTrip(tripId, user.uid)
            await loadTrip()
            alert("여행에 성공적으로 참여했습니다!")
        } catch (err) {
            alert("참여에 실패했습니다.")
        }
    }

    const handleAddMember = async (uid) => {
        try {
            await travelService.joinTrip(tripId, uid)
            await loadTrip()
        } catch (err) {
            alert("멤버 추가에 실패했습니다.")
        }
    }

    const handleRemoveMember = async (uid) => {
        if (!window.confirm("이 멤버를 여행에서 제외하시겠습니까?")) return
        try {
            await travelService.removeMember(tripId, uid)
            await loadTrip()
        } catch (err) {
            alert("멤버 삭제에 실패했습니다.")
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            로딩 중...
        </div>
    )

    if (!trip) return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
            <p>여행 정보를 찾을 수 없습니다.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">홈으로 가기</button>
        </div>
    )

    const isParticipant = trip.participants?.includes(user?.uid)
    const isOwner = trip.owner === user?.uid
    const nonMembers = allUsers.filter(u => !trip.participants?.includes(u.uid))
    const filteredNonMembers = nonMembers.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const tabs = [
        { id: 'itinerary', label: '일정', icon: Calendar },
        { id: 'expenses', label: '경비', icon: CreditCard },
        { id: 'group', label: '멤버', icon: Users },
    ]

    return (
        <div className="trip-dashboard animate-fade" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <nav className="glass" style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.8)'
            }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                    <ChevronLeft size={24} />
                </button>
                {isEditing ? (
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--primary)', fontSize: '1.125rem', minWidth: '150px', flex: '1 1 auto' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <input
                                type="date"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--primary)', fontSize: '0.8rem' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                            <input
                                type="date"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--primary)', fontSize: '0.8rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                            <button onClick={handleUpdateTrip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Save size={20} /></button>
                            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.125rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trip.name}</h2>
                                {isOwner && (
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.date}</div>
                        </div>
                        {isOwner && (
                            <button
                                onClick={handleDeleteTrip}
                                style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </>
                )}
            </nav>

            <main className="container" style={{ flex: 1, paddingBottom: '6rem', paddingTop: '1rem', width: '100%' }}>
                {activeTab === 'itinerary' && <ItineraryView trip={trip} onRefreshTrip={loadTrip} />}
                {activeTab === 'expenses' && <ExpenseView trip={trip} user={user} />}
                {activeTab === 'group' && (
                    <div className="animate-fade">
                        <section className="card glass" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem' }}>함께하는 사람들</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(trip.members || []).map(member => (
                                    <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '1.1rem'
                                        }}>
                                            {member.displayName.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                                {member.displayName}
                                                {member.uid === trip.owner && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '0.5rem', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>방장</span>}
                                                {member.uid === user.uid && <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginLeft: '0.5rem' }}>(나)</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                                        </div>
                                        {isOwner && member.uid !== trip.owner && (
                                            <button
                                                onClick={() => handleRemoveMember(member.uid)}
                                                style={{ padding: '0.5rem', borderRadius: '50%', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                                title="멤버 삭제"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {isParticipant && (
                            <section className="card glass">
                                <h3 style={{ margin: '0 0 1rem' }}>새 멤버 추가</h3>
                                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="이름 또는 이메일로 검색"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.85rem 1rem 0.85rem 2.8rem',
                                            borderRadius: '12px',
                                            border: '2px solid var(--border)',
                                            background: 'white',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {filteredNonMembers.length > 0 ? filteredNonMembers.map(u => (
                                        <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dee2e6', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                                {u.displayName?.charAt(0) || '?'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.displayName}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAddMember(u.uid)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                추가
                                            </button>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {searchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 사용자가 없습니다.'}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {!isParticipant && (
                            <div className="card glass" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                                <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                                    <UserPlus size={32} />
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem' }}>여행에 참여하시겠습니까?</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>참여하시면 일정을 공유하고 경비를 함께 정산할 수 있습니다.</p>
                                <button onClick={handleJoinTrip} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                                    이 여행에 참여하기
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="glass" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-around',
                padding: '0.75rem 0',
                borderTop: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 100
            }}>
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                flex: 1,
                                padding: '0.5rem 0'
                            }}
                        >
                            <Icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{tab.label}</span>
                        </button>
                    )
                })}
            </footer>
        </div >
    )
}

export default TripDashboard

