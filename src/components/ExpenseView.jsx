import React, { useState, useEffect } from 'react'
import { Plus, Check, User, X, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { travelService } from '../services/travelService'
import ConfirmModal from './ConfirmModal'

const ExpenseView = ({ trip, user, onRefreshTrip }) => { // Added onRefreshTrip prop
    const [view, setView] = useState('list')
    const [expenses, setExpenses] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [expandedUser, setExpandedUser] = useState(null) // State for expanding user details
    const [newExpense, setNewExpense] = useState({
        item: '',
        amount: '',
        currency: 'KRW',
        amountKRW: '',
        payer: user.displayName || '나',
        splitWith: [],
        isPersonal: false
    })

    // Delete Modal State
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: null })

    useEffect(() => {
        loadExpenses()
    }, [trip.id])

    const loadExpenses = async () => {
        const data = await travelService.getExpenses(trip.id)
        setExpenses(data)
    }

    const participants = trip.members || []

    const handleAddExpense = async (e) => {
        e.preventDefault()
        const payer = newExpense.payer || user.displayName || '나'
        // If specific splitWith is selected, use it.
        // Otherwise (fail-safe), use all participants.
        let splitWith = []
        if (newExpense.splitWith.length > 0) {
            splitWith = newExpense.splitWith
        } else {
            splitWith = participants.map(p => p.displayName)
        }

        const expenseData = {
            ...newExpense,
            payer,
            amount: Number(newExpense.amount),
            amountKRW: newExpense.currency === 'KRW' ? Number(newExpense.amount) : Number(newExpense.amountKRW),
            splitWith,
            settled: editingExpense ? (editingExpense.settled || []) : [],
            date: editingExpense ? editingExpense.date : new Date()
        }

        if (editingExpense) {
            await travelService.updateExpense(trip.id, editingExpense.id, expenseData)
        } else {
            await travelService.addExpense(trip.id, expenseData)
        }

        setShowAddForm(false)
        setEditingExpense(null)
        // Reset form - Default splitWith is ALL participants
        setNewExpense({
            item: '',
            amount: '',
            currency: 'KRW',
            amountKRW: '',
            payer: user.displayName || '나',
            splitWith: participants.map(p => p.displayName),
            isPersonal: false
        })
        loadExpenses()
    }

    const handleDeleteExpense = (expenseId) => {
        setDeleteConfig({ isOpen: true, id: expenseId })
    }

    const confirmDelete = async () => {
        const expenseId = deleteConfig.id
        setDeleteConfig({ isOpen: false, id: null })
        await travelService.deleteExpense(trip.id, expenseId)
        loadExpenses()
    }

    const handleEditExpense = (exp) => {
        setEditingExpense(exp)
        setNewExpense({
            item: exp.item,
            amount: exp.amount,
            currency: exp.currency || 'KRW',
            amountKRW: exp.amountKRW || '',
            payer: exp.payer,
            splitWith: exp.splitWith || participants.map(p => p.displayName),
            isPersonal: false // Deprecated
        })
        setShowAddForm(true)
    }

    const currencySymbols = { KRW: '₩', JPY: '¥', USD: '$', CNY: '¥' }

    const calculateStats = (personObj) => {
        const personName = personObj.displayName
        const personUid = personObj.uid

        let totalSpent = 0 // 내가 결제한 총액 (Total Payer Amount)
        let totalDebt = 0  // 내가 줘야 할 돈 (Total Debt to others)

        const spendingList = [] // 내가 결제한 내역 리스트
        const toGiveList = []   // 남에게 줘야 할 내역 리스트

        expenses.forEach(exp => {
            const amount = exp.amountKRW || exp.amount
            const isPayer = exp.payer && exp.payer.trim() === personName.trim()
            const isInvolved = exp.splitWith.includes(personName)
            const settledArray = exp.settled || []
            const isSettled = settledArray.includes(personUid) // Has this person settled their share?

            // 1. 내가 결제한 내역 (Spending)
            if (isPayer) {
                totalSpent += amount
                spendingList.push({ ...exp, amount })
            }

            // 2. 내가 부담해야 할 내역 중 '남이 결제한' 것 (Debt)
            // (즉, 내가 썼는데 결제자가 내가 아닌 경우)
            if (isInvolved && !isPayer) {
                const splitAmount = amount / exp.splitWith.length

                // 정산 완료 여부와 상관없이 '줄 돈' 리스트에는 표시하되,
                // 완료된 항목은 금액 합산에서 제외하거나, UI에서 스트라이크 처리.
                // 요구사항: "체크하면 정산내역에서는 지급 완료 처리" -> 합산 제외가 맞음.
                if (!isSettled) {
                    totalDebt += splitAmount
                }

                toGiveList.push({
                    ...exp,
                    splitAmount,
                    receiver: exp.payer,
                    isSettled
                })
            }
        })

        return { totalSpent, totalDebt, spendingList, toGiveList }
    }

    // 개별 지출 항목에 대한 정산 완료 토글 (To Give List 아이템 체크 시)
    const handleToggleExpenseSettled = async (expense, personUid) => {
        const settledArray = expense.settled || []
        let newSettledArray
        if (settledArray.includes(personUid)) {
            newSettledArray = settledArray.filter(uid => uid !== personUid)
        } else {
            newSettledArray = [...settledArray, personUid]
        }

        // Optimistic Update (UI 즉시 반영을 위해 expenses state 먼저 수정)
        const updatedExpenses = expenses.map(e =>
            e.id === expense.id ? { ...e, settled: newSettledArray } : e
        )
        setExpenses(updatedExpenses)

        await travelService.updateExpense(trip.id, expense.id, { settled: newSettledArray })
        // loadExpenses() // Optimistic update is sufficient, avoid re-render stutter
    }

    const SummaryView = () => (
        <div className="summary-view grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
            {participants.map(p => {
                const stats = calculateStats(p)
                const isExpanded = expandedUser === p.uid
                const isMe = p.displayName === (user.displayName || '나')

                return (
                    <div
                        key={p.uid}
                        className="card glass"
                        style={{ margin: 0, cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}
                        onClick={() => setExpandedUser(isExpanded ? null : p.uid)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '50%' }}>
                                    <User size={18} />
                                </div>
                                <h4 style={{ margin: 0 }}>
                                    {isMe ? `${p.displayName} (나)` : p.displayName}
                                </h4>
                            </div>
                            {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>총 지출 (Paid)</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₩{Math.round(stats.totalSpent).toLocaleString()}</div>
                            </div>
                            {/* 줄 돈이 0이면 초록색, 있으면 빨간색 강조 */}
                            <div style={{ background: stats.totalDebt > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>줄 돈 (To Give)</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: stats.totalDebt > 0 ? '#dc2626' : '#059669' }}>
                                    ₩{Math.round(stats.totalDebt).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="animate-fade" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Check size={14} /> 줄 돈 리스트 (Click to Settled)
                                    </h5>
                                    {stats.toGiveList.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {stats.toGiveList.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleExpenseSettled(item, p.uid)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        fontSize: '0.85rem',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        background: item.isSettled ? 'rgba(0,0,0,0.02)' : 'white',
                                                        border: '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        opacity: item.isSettled ? 0.6 : 1,
                                                        textDecoration: item.isSettled ? 'line-through' : 'none'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '50%',
                                                            border: item.isSettled ? 'none' : '2px solid var(--text-muted)',
                                                            background: item.isSettled ? 'var(--primary)' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            {item.isSettled && <Check size={12} />}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>{item.item || item.description}</span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>to {item.receiver}</span>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: item.isSettled ? 'var(--text-muted)' : '#dc2626' }}>
                                                        ₩{Math.round(item.splitAmount).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem' }}>줄 돈이 없습니다.</div>
                                    )}
                                </div>
                                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                                    <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>내가 결제한 내역 (Paid)</h5>
                                    {stats.spendingList.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {stats.spendingList.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                                                    <span>{item.item || item.description}</span>
                                                    <span style={{ fontWeight: 600 }}>₩{Math.round(item.amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem' }}>내역 없음</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )

    const ListView = () => (
        <div className="expense-list grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
            {expenses.length > 0 ? expenses.map(exp => (
                <div key={exp.id} className="card glass animate-fade" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{exp.item}</h4>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button onClick={() => handleEditExpense(exp)} style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteExpense(exp.id)
                                        }}
                                        style={{ background: 'none', border: 'none', padding: '0.25rem', color: '#dc2626', cursor: 'pointer', position: 'relative', zIndex: 10 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                                {exp.payer} 결제 • {exp.isPersonal ? '개인' : `${exp.splitWith.length} 명`}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                {currencySymbols[exp.currency || 'KRW']}{Number(exp.amount).toLocaleString()}
                            </div>
                            {exp.currency !== 'KRW' && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    약 ₩{Number(exp.amountKRW).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )) : (
                <div className="card glass" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
                    기록된 지출이 없습니다.
                </div>
            )}

            <button onClick={() => {
                setEditingExpense(null);
                setNewExpense({
                    item: '',
                    amount: '',
                    currency: 'KRW',
                    amountKRW: '',
                    payer: user.displayName || '나',
                    splitWith: participants.map(p => p.displayName),
                    isPersonal: false
                });
                setShowAddForm(true);
            }} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> 지출 추가
            </button>
        </div>
    )

    return (
        <div className="expense-view" style={{ paddingBottom: '2rem' }}>
            {/* Desktop View: Side-by-Side */}
            <div className="desktop-only">
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1.2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>지출 내역</h3>
                        </div>
                        <ListView />
                    </div>
                    <div style={{ flex: '1', position: 'sticky', top: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>정산 현황</h3>
                        <SummaryView />
                    </div>
                </div>
            </div>

            {/* Mobile View: Tabbed */}
            <div className="mobile-only">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button className={`btn ${view === 'list' ? 'btn-primary' : 'glass'} `} onClick={() => setView('list')}>지출 내역</button>
                    <button className={`btn ${view === 'summary' ? 'btn-primary' : 'glass'} `} onClick={() => setView('summary')}>정산 현황</button>
                </div>
                {view === 'list' ? <ListView /> : <SummaryView />}
            </div>

            {showAddForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <form onSubmit={handleAddExpense} className="card glass" style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>지출 {editingExpense ? '수정' : '추가'}</h3>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>항목</label>
                            <input
                                placeholder="저녁 식사, 택시비 등"
                                value={newExpense.item}
                                onChange={e => setNewExpense({ ...newExpense, item: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>결제자 (누가 냈나요?)</label>
                            <select
                                value={newExpense.payer}
                                onChange={e => setNewExpense({ ...newExpense, payer: e.target.value })}
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                            >
                                {participants.map(p => (
                                    <option key={p.uid} value={p.displayName}>{p.displayName}</option>
                                ))}
                                {!participants.find(p => p.displayName === newExpense.payer) && <option value={newExpense.payer}>{newExpense.payer}</option>}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>통화</label>
                                <select
                                    value={newExpense.currency}
                                    onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                >
                                    <option value="KRW">₩ (원)</option>
                                    <option value="JPY">¥ (엔)</option>
                                    <option value="USD">$ (달러)</option>
                                    <option value="CNY">¥ (위안)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1.5 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>금액</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                />
                            </div>
                        </div>

                        {newExpense.currency !== 'KRW' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>원화 환산 금액</label>
                                <input
                                    type="number"
                                    placeholder="₩ 0"
                                    value={newExpense.amountKRW}
                                    onChange={e => setNewExpense({ ...newExpense, amountKRW: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>정산 대상 선택 (N/1)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {participants.map(p => {
                                        const isChecked = newExpense.splitWith.includes(p.displayName)
                                        return (
                                            <div
                                                key={p.uid}
                                                onClick={() => {
                                                    const current = newExpense.splitWith
                                                    let next
                                                    if (current.includes(p.displayName)) {
                                                        next = current.filter(n => n !== p.displayName)
                                                    } else {
                                                        next = [...current, p.displayName]
                                                    }
                                                    setNewExpense({ ...newExpense, splitWith: next })
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    background: isChecked ? 'var(--primary)' : 'white',
                                                    color: isChecked ? 'white' : 'var(--text)',
                                                    border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                {p.displayName}
                                                {p.displayName === newExpense.payer && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(결제자)</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                                {newExpense.splitWith.length === 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
                                        * 최소 1명 이상 선택해야 합니다.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                            저장하기
                        </button>
                    </form>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfig.isOpen}
                message="이 지출 내역을 삭제하시겠습니까?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfig({ isOpen: false, id: null })}
            />
        </div>
    )
}

export default ExpenseView
