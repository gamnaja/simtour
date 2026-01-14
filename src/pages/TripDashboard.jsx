import React, { useState, useEffect } from 'react'
import { ChevronLeft, Users, MapPin, CreditCard, Calendar, UserPlus, Trash2, Mail, Search, Edit2, Save, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ItineraryView from '../components/ItineraryView'
import ExpenseView from '../components/ExpenseView'
import { travelService } from '../services/travelService'
import { authService } from '../services/authService'
import ConfirmModal from '../components/ConfirmModal'

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

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [newItem, setNewItem] = useState({ day: '1일차', time: '', activity: '', location: '', group: '전체' })
    const [showDeleteModal, setShowDeleteModal] = useState(false)

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

    useEffect(() => {
        console.log("showDeleteModal changed:", showDeleteModal);
    }, [showDeleteModal]);

    const handleDeleteTrip = (e) => {
        console.log("Trip delete button clicked");
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setShowDeleteModal(true)
    }

    const confirmDeleteTrip = async () => {
        console.log("Confirm delete trip");
        setShowDeleteModal(false)
        try {
            await travelService.deleteTrip(tripId)
            navigate('/')
        } catch (err) {
            console.error("Delete failed", err);
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

    const handleAddItinerary = async (e) => {
        e.preventDefault()
        try {
            await travelService.addItinerary(tripId, newItem)
            setShowAddModal(false)
            setNewItem({ day: '1일차', time: '', activity: '', location: '', group: '전체' })
            await loadTrip()
        } catch (err) {
            alert("일정 추가에 실패했습니다.")
        }
    }

    // Calculations
    const getTripDuration = () => {
        if (!trip?.date) return 1
        const parts = trip.date.split(' - ')
        if (parts.length < 2) return 1
        const start = new Date(parts[0].replace(/\./g, '-'))
        const end = new Date(parts[1].replace(/\./g, '-'))
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return isNaN(diffDays) ? 1 : diffDays
    }

    const tripDuration = getTripDuration()
    const groups = trip?.groups || []

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

    const NavContent = () => (
        <div className="mobile-nav-bar">
            {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <Icon strokeWidth={isActive ? 2.5 : 2} />
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </div>
    )

    return (
        <div className="trip-dashboard animate-fade layout-with-sidebar" style={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
            {/* Desktop Sidebar */}
            <aside className="sidebar desktop-only glass" style={{ display: 'none', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '10px' }}>
                            <MapPin size={24} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>Simtour</span>
                    </div>

                    <div style={{ padding: '0 1rem' }}>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text)' }}>{trip.name}</h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={12} /> {trip.date}
                        </p>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 0.5rem' }}>
                        {tabs.filter(t => t.id !== 'profile').map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`nav-tab ${isActive ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.85rem 1rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text)',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                        textAlign: 'left'
                                    }}
                                >
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                <div style={{ padding: '1rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === 'profile' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                    >
                        <Users size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        <span>프로필</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                    >
                        <ChevronLeft size={20} />
                        <span>목록으로</span>
                    </button>
                </div>
            </aside>

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Mobile Header - remains unchanged for mobile feel */}
                <nav className="glass mobile-only" style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '-0.3rem' }}
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
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>{trip.name}</h2>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {trip.date} <span style={{ color: 'var(--primary)', fontWeight: 600 }}>({tripDuration - 1}박 {tripDuration}일)</span>
                                </span>
                                {isOwner && (
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem', flexShrink: 0 }}>
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>
                            {isOwner && (
                                <button
                                    onClick={handleDeleteTrip}
                                    style={{
                                        padding: '0.4rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#dc2626',
                                        flexShrink: 0,
                                        position: 'relative',
                                        zIndex: 200,
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    )}
                </nav>
                <main className="container" style={{ flex: 1, paddingBottom: '7rem', paddingTop: '0.75rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                    {activeTab === 'itinerary' && (
                        <>
                            <ItineraryView trip={trip} onRefreshTrip={loadTrip} />
                            {showAddModal && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                                    <form onSubmit={handleAddItinerary} className="card glass animate-slide-up" style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>일정 추가</h3>
                                            <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>일차</label>
                                                <select
                                                    value={newItem.day}
                                                    onChange={e => setNewItem({ ...newItem, day: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                                >
                                                    {Array.from({ length: tripDuration }, (_, i) => (
                                                        <option key={i + 1} value={`${i + 1}일차`}>{i + 1}일차</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1.5 }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>시간</label>
                                                <input
                                                    placeholder="예: 10:00"
                                                    value={newItem.time}
                                                    onChange={e => setNewItem({ ...newItem, time: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>활동 내용</label>
                                            <input
                                                placeholder="무엇을 하나요?"
                                                value={newItem.activity}
                                                onChange={e => setNewItem({ ...newItem, activity: e.target.value })}
                                                required
                                                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>장소</label>
                                            <input
                                                placeholder="장소 이름"
                                                value={newItem.location}
                                                onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                                                required
                                                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>대상 그룹</label>
                                            <select
                                                value={newItem.group}
                                                onChange={e => setNewItem({ ...newItem, group: e.target.value })}
                                                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                            >
                                                <option value="전체">전체 참여</option>
                                                {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                            </select>
                                        </div>

                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                                            저장하기
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                    {activeTab === 'expenses' && <ExpenseView trip={trip} user={user} onRefreshTrip={loadTrip} />}
                    {activeTab === 'group' && (
                        <div className="animate-fade grid grid-cols-1 lg-grid-cols-2">
                            <section className="card glass" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 1rem' }}>함께하는 사람들</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {(trip.members || []).map(member => (
                                        <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
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
                                                <button onClick={() => handleRemoveMember(member.uid)} style={{ padding: '0.5rem', borderRadius: '50%', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} title="멤버 삭제">
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="group-right-side">
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
                                                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '12px', border: '2px solid var(--border)', background: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
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
                                                    <button onClick={() => handleAddMember(u.uid)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>추가</button>
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
                        </div>
                    )}
                </main>

                <footer className="glass mobile-only" style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 2147483647, /* Max Z-Index */
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    paddingBottom: 'env(safe-area-inset-bottom, 20px)',
                    display: 'block'
                }}>
                    <NavContent />
                </footer>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    message="정말로 이 여행을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다."
                    onConfirm={confirmDeleteTrip}
                    onCancel={() => setShowDeleteModal(false)}
                />
            </div>
        </div>
    )
}

export default TripDashboard

