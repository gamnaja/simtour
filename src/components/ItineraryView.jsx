import React, { useState, useEffect } from 'react'
import { MapPin, Plus, X, Edit2, Trash2, Settings } from 'lucide-react'
import { travelService } from '../services/travelService'

const ItineraryView = ({ trip, onRefreshTrip }) => {
    const [filter, setFilter] = useState('전체')
    const [itinerary, setItinerary] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [showGroupSettings, setShowGroupSettings] = useState(false)
    const [newGroup, setNewGroup] = useState('')

    const [newItem, setNewItem] = useState({ day: '', time: '', activity: '', location: '', group: '전체' })

    const groups = trip.groups || ['전체']

    useEffect(() => {
        loadItinerary()
    }, [trip.id])

    const loadItinerary = async () => {
        const data = await travelService.getItinerary(trip.id)
        setItinerary(data)
    }

    const handleAddItem = async (e) => {
        e.preventDefault()
        if (editingItem) {
            await travelService.updateItineraryItem(trip.id, editingItem.id, newItem)
        } else {
            await travelService.addItineraryItem(trip.id, newItem)
        }
        setShowAddForm(false)
        setEditingItem(null)
        setNewItem({ day: '', time: '', activity: '', location: '', group: '전체' })
        loadItinerary()
    }

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("이 일정을 삭제하시겠습니까?")) return
        await travelService.deleteItineraryItem(trip.id, itemId)
        loadItinerary()
    }

    const handleEditItem = (item) => {
        setEditingItem(item)
        setNewItem({ ...item })
        setShowAddForm(true)
    }

    const handleAddGroup = async () => {
        if (!newGroup.trim() || groups.includes(newGroup)) return
        const updatedGroups = [...groups, newGroup.trim()]
        await travelService.updateTrip(trip.id, { groups: updatedGroups })
        setNewGroup('')
        onRefreshTrip()
    }

    const handleDeleteGroup = async (groupName) => {
        if (groupName === '전체') return
        if (!window.confirm(`'${groupName}' 그룹을 삭제하시겠습니까?`)) return
        const updatedGroups = groups.filter(g => g !== groupName)
        await travelService.updateTrip(trip.id, { groups: updatedGroups })
        if (filter === groupName) setFilter('전체')
        onRefreshTrip()
    }

    const filteredItems = filter === '전체' ? itinerary : itinerary.filter(item => item.group === '전체' || item.group === filter)

    return (
        <div className="itinerary-view">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', padding: '0.25rem' }}>
                {groups.map(g => (
                    <button
                        key={g}
                        onClick={() => setFilter(g)}
                        className={`btn ${filter === g ? 'btn-primary' : 'glass'}`}
                        style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}
                    >
                        {g === '전체' ? '전체 일정' : `${g} 그룹`}
                    </button>
                ))}
                <button
                    onClick={() => setShowGroupSettings(true)}
                    className="glass"
                    style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer', minWidth: '36px', height: '36px', justifyContent: 'center' }}
                >
                    <Settings size={18} />
                </button>
            </div>

            <div className="timeline">
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <div key={item.id} className="card glass animate-fade" style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        <div style={{ minWidth: '70px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.time}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.day}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h4 style={{ margin: 0 }}>{item.activity}</h4>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button onClick={() => handleEditItem(item)} style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', padding: '0.25rem', color: '#dc2626', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                <MapPin size={12} /> {item.location}
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '20px',
                                    background: 'rgba(37, 99, 235, 0.1)',
                                    color: 'var(--primary)',
                                    fontWeight: 700
                                }}>
                                    {item.group}
                                </span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        등록된 일정이 없습니다.
                    </div>
                )}
            </div>

            <button onClick={() => { setEditingItem(null); setNewItem({ day: '', time: '', activity: '', location: '', group: filter === '전체' ? '전체' : filter }); setShowAddForm(true); }} className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> 일정 추가하기
            </button>

            {/* 일정 추가/수정 모달 */}
            {showAddForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <form onSubmit={handleAddItem} className="card glass" style={{ width: '100%', maxWidth: '400px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>일정 {editingItem ? '수정' : '추가'}</h3>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <input placeholder="날짜 (예: 1일차)" value={newItem.day} onChange={e => setNewItem({ ...newItem, day: e.target.value })} required />
                            <input placeholder="시간 (예: 10:00)" value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })} required />
                        </div>
                        <input placeholder="활동 내용" value={newItem.activity} onChange={e => setNewItem({ ...newItem, activity: e.target.value })} required />
                        <input placeholder="장소" value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} />
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>대상 그룹</label>
                        <select value={newItem.group} onChange={e => setNewItem({ ...newItem, group: e.target.value })}>
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>저장하기</button>
                    </form>
                </div>
            )}

            {/* 그룹 관리 모달 */}
            {showGroupSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="card glass" style={{ width: '100%', maxWidth: '400px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>그룹 관리</h3>
                            <button onClick={() => setShowGroupSettings(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>새 그룹 추가</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="그룹 이름 (예: 니세코)"
                                    value={newGroup}
                                    onChange={e => setNewGroup(e.target.value)}
                                />
                                <button onClick={handleAddGroup} className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>추가</button>
                            </div>
                        </div>

                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>그룹 목록</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {groups.map(g => (
                                <div key={g} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                                    <span>{g}</span>
                                    {g !== '전체' && (
                                        <button onClick={() => handleDeleteGroup(g)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setShowGroupSettings(false)} className="btn glass" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ItineraryView
