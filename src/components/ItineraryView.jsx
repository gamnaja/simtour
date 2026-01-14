import React, { useState, useEffect } from 'react'
import { MapPin, Plus, X, Edit2, Trash2, Settings } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import { travelService } from '../services/travelService'
import { differenceInDays, parse } from 'date-fns'

const ItineraryView = ({ trip, onRefreshTrip }) => {
    const [filter, setFilter] = useState('전체')
    const [itinerary, setItinerary] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [showGroupSettings, setShowGroupSettings] = useState(false)
    const [newGroup, setNewGroup] = useState('')
    const [editingGroup, setEditingGroup] = useState(null) // { oldName: string, newName: string }

    // Calculate trip duration
    const getTripDays = () => {
        if (!trip?.date) return ['1일차']
        const parts = trip.date.split(' - ')
        if (parts.length < 2) return ['1일차']

        try {
            const startDate = parse(parts[0], 'yyyy.MM.dd', new Date())
            const endDate = parse(parts[1], 'yyyy.MM.dd', new Date())
            const diff = differenceInDays(endDate, startDate) + 1
            return Array.from({ length: diff }, (_, i) => `${i + 1}일차`)
        } catch (e) {
            return ['1일차']
        }
    }

    const tripDays = getTripDays()

    const [newItem, setNewItem] = useState({
        day: tripDays[0],
        time: '',
        activity: '',
        location: '',
        group: '전체'
    })

    // Modal & Delete State
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, type: null, id: null, message: '' })

    // Filter out '전체' from DB data to prevent duplicates with virtual '전체'
    const savedGroups = (trip.groups || []).filter(g => g !== '전체')
    // '전체' is virtual, used for UI only
    const displayGroups = ['전체', ...savedGroups]

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
        setNewItem({ day: tripDays[0], time: '', activity: '', location: '', group: '전체' })
        loadItinerary()
    }

    const handleDeleteItem = (itemId) => {
        setDeleteConfig({
            isOpen: true,
            type: 'item',
            id: itemId,
            message: "이 일정을 삭제하시겠습니까?"
        })
    }

    const handleEditItem = (item) => {
        setEditingItem(item)
        setNewItem({ ...item })
        setShowAddForm(true)
    }

    const handleAddGroup = async () => {
        if (!newGroup.trim() || newGroup.trim() === '전체' || savedGroups.includes(newGroup.trim())) return
        const updatedGroups = [...savedGroups, newGroup.trim()]
        await travelService.updateTrip(trip.id, { groups: updatedGroups })
        setNewGroup('')
        onRefreshTrip()
    }

    const handleStartEditGroup = (g) => {
        setEditingGroup({ oldName: g, newName: g })
    }

    const handleUpdateGroup = async () => {
        if (!editingGroup || !editingGroup.newName.trim()) return
        const { oldName, newName } = editingGroup
        const listName = newName.trim()

        if (listName === oldName) {
            setEditingGroup(null)
            return
        }

        if (listName === '전체' || savedGroups.includes(listName)) {
            alert('이미 존재하는 그룹 이름입니다.')
            return
        }

        // 1. Update Trip Groups
        const updatedGroups = savedGroups.map(g => g === oldName ? listName : g)
        await travelService.updateTrip(trip.id, { groups: updatedGroups })

        // 2. Cascade Update Itinerary Items
        // Find items in this group
        const itemsToUpdate = itinerary.filter(item => item.group === oldName)

        // Update them parallel
        await Promise.all(itemsToUpdate.map(item =>
            travelService.updateItineraryItem(trip.id, item.id, { group: listName })
        ))

        setEditingGroup(null)
        if (filter === oldName) setFilter(listName)
        onRefreshTrip()
    }

    const handleDeleteGroup = (groupName) => {
        if (groupName === '전체') return
        setDeleteConfig({
            isOpen: true,
            type: 'group',
            id: groupName,
            message: `'${groupName}' 그룹을 삭제하시겠습니까?`
        })
    }

    const confirmDelete = async () => {
        const { type, id } = deleteConfig
        setDeleteConfig({ ...deleteConfig, isOpen: false })

        if (type === 'item') {
            await travelService.deleteItineraryItem(trip.id, id)
            loadItinerary()
        } else if (type === 'group') {
            // Cascade: Move items from deleted group to '전체'
            const itemsToUpdate = itinerary.filter(item => item.group === id)
            await Promise.all(itemsToUpdate.map(item =>
                travelService.updateItineraryItem(trip.id, item.id, { group: '전체' })
            ))

            const updatedGroups = savedGroups.filter(g => g !== id)
            await travelService.updateTrip(trip.id, { groups: updatedGroups })
            if (filter === id) setFilter('전체')
            onRefreshTrip()
        }
    }

    const filteredItems = (filter === '전체' ? itinerary : itinerary.filter(item => item.group === filter)).sort((a, b) => {
        // Sort by Day (1일차, 2일차...)
        const dayA = parseInt(a.day.replace('일차', '')) || 0;
        const dayB = parseInt(b.day.replace('일차', '')) || 0;
        if (dayA !== dayB) return dayA - dayB;

        // Sort by Time (오전/오후 HH:MM -> 24h)
        const getTimeValue = (timeStr) => {
            if (!timeStr) return 0;
            const parts = timeStr.split(' ');
            if (parts.length < 2) return 0;
            const ampm = parts[0];
            const [h, m] = parts[1].split(':').map(Number);
            let hour = h;
            if (ampm === '오후' && hour !== 12) hour += 12;
            if (ampm === '오전' && hour === 12) hour = 0;
            return hour * 60 + (m || 0);
        };

        return getTimeValue(a.time) - getTimeValue(b.time);
    });

    return (
        <div className="itinerary-view">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', padding: '0.25rem' }}>
                {displayGroups.map(g => (
                    <button
                        key={g}
                        onClick={() => setFilter(g)}
                        className={`btn ${filter === g ? 'btn-primary' : 'glass'}`}
                        style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}
                    >
                        {g === '전체' ? '전체 일정' : `${g}`}
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

            <div className="timeline grid grid-cols-1 lg-grid-cols-2" style={{ gap: '0.75rem' }}>
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <div key={item.id} className="card glass animate-fade" style={{ display: 'flex', gap: '1rem', position: 'relative', margin: 0 }}>
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem(item.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '0.25rem',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            zIndex: 10
                                        }}
                                    >
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

            <button onClick={() => { setEditingItem(null); setNewItem({ day: tripDays[0], time: '', activity: '', location: '', group: filter === '전체' ? '전체' : filter }); setShowAddForm(true); }} className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> 일정 추가하기
            </button>

            {/* 일정 추가/수정 모달 */}
            {showAddForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <form onSubmit={handleAddItem} className="card glass" style={{ width: '100%', maxWidth: '400px', background: 'white', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>일정 {editingItem ? '수정' : '추가'}</h3>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>날짜 및 시간</label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select
                                    value={newItem.day}
                                    onChange={e => setNewItem({ ...newItem, day: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', background: 'white' }}
                                >
                                    {tripDays.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                                <input
                                    type="time"
                                    value={(() => {
                                        if (!newItem.time) return '10:00';
                                        // "오전/오후 HH:MM" -> "HH:mm" (24h format for input)
                                        const parts = newItem.time.split(' ');
                                        if (parts.length < 2) return newItem.time;

                                        const ampm = parts[0];
                                        const timeStr = parts[1];
                                        let [hours, minutes] = timeStr.split(':');
                                        hours = parseInt(hours, 10);

                                        if (ampm === '오후' && hours !== 12) hours += 12;
                                        if (ampm === '오전' && hours === 12) hours = 0;

                                        return `${hours.toString().padStart(2, '0')}:${minutes}`;
                                    })()}
                                    onChange={(e) => {
                                        // "HH:mm" -> "오전/오후 HH:MM" (storage format)
                                        if (!e.target.value) return;
                                        const [h, m] = e.target.value.split(':');
                                        const hour = parseInt(h, 10);
                                        const ampm = hour >= 12 ? '오후' : '오전';
                                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                                        const formattedTime = `${ampm} ${displayHour}:${m}`;
                                        setNewItem({ ...newItem, time: formattedTime });
                                    }}
                                    onClick={(e) => {
                                        if (e.target.showPicker) {
                                            e.target.showPicker();
                                        }
                                    }}
                                    required
                                    style={{ flex: 1.5, padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', background: 'white', minHeight: '50px', cursor: 'pointer' }}
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
                                style={{ width: '100%', padding: '0.85rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>장소</label>
                            <input
                                placeholder="장소 이름"
                                value={newItem.location}
                                onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                                style={{ width: '100%', padding: '0.85rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>대상 그룹</label>
                            <select
                                value={newItem.group}
                                onChange={e => setNewItem({ ...newItem, group: e.target.value })}
                                style={{ width: '100%', padding: '0.85rem' }}
                            >
                                {displayGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 700, marginTop: '1rem' }}>저장하기</button>
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
                            {savedGroups.length > 0 ? savedGroups.map(g => (
                                <div key={g} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                                    {editingGroup && editingGroup.oldName === g ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                            <input
                                                value={editingGroup.newName}
                                                onChange={e => setEditingGroup({ ...editingGroup, newName: e.target.value })}
                                                autoFocus
                                                style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--primary)', fontSize: '0.9rem' }}
                                            />
                                            <button onClick={handleUpdateGroup} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>저장</button>
                                            <button onClick={() => setEditingGroup(null)} style={{ background: 'var(--text-muted)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>취소</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{g}</span>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button onClick={() => handleStartEditGroup(g)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteGroup(g)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                                    추가된 그룹이 없습니다.
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowGroupSettings(false)} className="btn glass" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }}>닫기</button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfig.isOpen}
                message={deleteConfig.message}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
            />
        </div>
    )
}

export default ItineraryView
