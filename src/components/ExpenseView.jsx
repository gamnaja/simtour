import React, { useState, useEffect } from 'react'
import { Plus, Check, User, X, Edit2, Trash2 } from 'lucide-react'
import { travelService } from '../services/travelService'

const ExpenseView = ({ trip, user }) => {
    const [view, setView] = useState('list')
    const [expenses, setExpenses] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [newExpense, setNewExpense] = useState({
        item: '',
        amount: '',
        currency: 'KRW',
        amountKRW: '',
        payer: user.displayName || '나',
        splitWith: [],
        isPersonal: false
    })

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
        const splitWith = newExpense.isPersonal
            ? [payer]
            : (newExpense.splitWith.length > 0 ? newExpense.splitWith : participants.map(p => p.displayName))

        const expenseData = {
            ...newExpense,
            payer,
            amount: Number(newExpense.amount),
            amountKRW: newExpense.currency === 'KRW' ? Number(newExpense.amount) : Number(newExpense.amountKRW),
            splitWith,
            settled: editingExpense ? editingExpense.settled : [],
            date: editingExpense ? editingExpense.date : new Date()
        }

        if (editingExpense) {
            await travelService.updateExpense(trip.id, editingExpense.id, expenseData)
        } else {
            await travelService.addExpense(trip.id, expenseData)
        }

        setShowAddForm(false)
        setEditingExpense(null)
        setNewExpense({ item: '', amount: '', currency: 'KRW', amountKRW: '', payer: user.displayName || '나', splitWith: [], isPersonal: false })
        loadExpenses()
    }

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm("이 지출 내역을 삭제하시겠습니까?")) return
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
            splitWith: exp.splitWith,
            isPersonal: exp.isPersonal || false
        })
        setShowAddForm(true)
    }

    const currencySymbols = { KRW: '₩', JPY: '¥', USD: '$', CNY: '¥' }

    const calculateStats = (personObj) => {
        const personName = personObj.displayName
        let paid = 0
        let shouldPay = 0

        expenses.forEach(exp => {
            const amount = exp.amountKRW || exp.amount
            if (exp.payer === personName) paid += amount
            if (exp.splitWith.includes(personName)) {
                shouldPay += amount / exp.splitWith.length
            }
        })

        return { paid, shouldPay, balance: paid - shouldPay }
    }

    return (
        <div className="expense-view" style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button className={`btn ${view === 'list' ? 'btn-primary' : 'glass'}`} onClick={() => setView('list')}>지출 내역</button>
                <button className={`btn ${view === 'summary' ? 'btn-primary' : 'glass'}`} onClick={() => setView('summary')}>정산 현황</button>
            </div>

            {view === 'list' ? (
                <div className="expense-list">
                    {expenses.length > 0 ? expenses.map(exp => (
                        <div key={exp.id} className="card glass animate-fade">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h4 style={{ margin: 0 }}>{exp.item}</h4>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button onClick={() => handleEditExpense(exp)} style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', padding: '0.25rem', color: '#dc2626', cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                                        {exp.payer} 결제 • {exp.isPersonal ? '개인 지출' : `${exp.splitWith.length}명 정산`}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        {currencySymbols[exp.currency || 'KRW']}{Number(exp.amount).toLocaleString()}
                                    </div>
                                    {exp.currency !== 'KRW' && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            약 ₩{Number(exp.amountKRW).toLocaleString()}
                                        </div>
                                    )}
                                    {!exp.isPersonal && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>
                                            인당 {currencySymbols[exp.currency || 'KRW']}{(exp.amount / exp.splitWith.length).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!exp.isPersonal && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {exp.splitWith.map(p => (
                                        <div key={p} style={{
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            color: (exp.settled && exp.settled.includes(p)) || p === exp.payer ? 'var(--primary)' : 'var(--text-muted)'
                                        }}>
                                            {(exp.settled && exp.settled.includes(p)) || p === exp.payer ? <Check size={14} /> : <div style={{ width: 14 }} />}
                                            {p === user.displayName ? '나' : p}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="card glass" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                            기록된 지출이 없습니다.
                        </div>
                    )}

                    <button onClick={() => { setEditingExpense(null); setNewExpense({ item: '', amount: '', currency: 'KRW', amountKRW: '', payer: user.displayName || '나', splitWith: [], isPersonal: false }); setShowAddForm(true); }} className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> 지출 추가하기
                    </button>
                </div>
            ) : (
                <div className="summary-view">
                    {participants.map(p => {
                        const stats = calculateStats(p)
                        return (
                            <div key={p.uid} className="card glass">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                                        <User size={20} />
                                    </div>
                                    <h3 style={{ margin: 0 }}>{p.displayName === user.displayName ? `${p.displayName} (나)` : p.displayName}</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>지불한 금액</div>
                                        <div style={{ fontWeight: 700 }}>₩{Math.round(stats.paid).toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>내가 쓴 금액</div>
                                        <div style={{ fontWeight: 700 }}>₩{Math.round(stats.shouldPay).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: stats.balance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: stats.balance >= 0 ? '#059669' : '#dc2626',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontWeight: 600 }}>{stats.balance >= 1 ? '받을 금액' : stats.balance <= -1 ? '보낼 금액' : '정산 완료'}</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>₩{Math.abs(Math.round(stats.balance)).toLocaleString()}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {showAddForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <form onSubmit={handleAddExpense} className="card glass" style={{ width: '100%', maxWidth: '400px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>지출 {editingExpense ? '수정' : '추가'}</h3>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
                        </div>
                        <input placeholder="항목 (예: 저녁 식사)" value={newExpense.item} onChange={e => setNewExpense({ ...newExpense, item: e.target.value })} required />

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <select
                                value={newExpense.currency}
                                onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })}
                                style={{ width: 'auto' }}
                            >
                                <option value="KRW">₩ (원)</option>
                                <option value="JPY">¥ (엔)</option>
                                <option value="USD">$ (달러)</option>
                                <option value="CNY">¥ (위안)</option>
                            </select>
                            <input type="number" placeholder="금액" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required />
                        </div>

                        {newExpense.currency !== 'KRW' && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>원화 환산 금액 (필수)</div>
                                <input type="number" placeholder="₩ 0" value={newExpense.amountKRW} onChange={e => setNewExpense({ ...newExpense, amountKRW: e.target.value })} required />
                            </div>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            <input type="checkbox" checked={newExpense.isPersonal} onChange={e => setNewExpense({ ...newExpense, isPersonal: e.target.checked })} />
                            나 혼자 쓴 돈 (개인 지출)
                        </label>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>저장하기</button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default ExpenseView
