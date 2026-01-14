import React, { useState, useEffect } from 'react';
import { User, Edit2, LogOut, ChevronRight, MapPin, ChevronLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { travelService } from '../services/travelService';
import { useNavigate } from 'react-router-dom';

const Profile = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [userTrips, setUserTrips] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        try {
            const data = await authService.getUserData(user.uid);
            setUserData(data);
            setNewName(data?.displayName || user.displayName);

            const trips = await travelService.getUserTrips(user.uid);
            setUserTrips(trips);
        } catch (err) {
            console.error("Error loading profile data:", err);
        }
    };

    const handleUpdateName = async () => {
        if (!newName.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        console.log("Updating name to:", newName);

        try {
            await authService.updateUserName(user.uid, newName);
            setIsEditing(false);
            setUserData(prev => ({ ...prev, displayName: newName }));
            alert("이름이 변경되었습니다.");
        } catch (err) {
            console.error("Name update failed:", err);
            alert("이름 변경에 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="container animate-fade">
            <nav style={{ padding: '1rem 0', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn"
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}
                >
                    <ChevronLeft size={24} /> 뒤로가기
                </button>
            </nav>
            <header style={{ padding: '0.5rem 1rem 2rem', textAlign: 'center' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    margin: '0 auto 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 700,
                    border: '4px solid var(--glass-border)'
                }}>
                    {user.photoURL ? <img src={user.photoURL} alt="Profile" style={{ width: '100%', borderRadius: '50%' }} /> : (userData?.displayName || user.displayName || "?").charAt(0)}
                </div>

                {isEditing ? (
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleUpdateName(); }}
                        style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                    >
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="glass"
                            autoFocus
                            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "저장 중..." : "저장"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="btn glass"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0 }}>{userData?.displayName || user.displayName}</h2>
                        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                            <Edit2 size={16} />
                        </button>
                    </div>
                )}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.email}</p>
            </header>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ padding: '0 1rem', fontSize: '1.1rem' }}>내 여행 목록</h3>
                <div className="trip-list grid grid-cols-1 sm-grid-cols-2" style={{ padding: '0 1rem' }}>
                    {userTrips.length > 0 ? userTrips.map(trip => (
                        <div
                            key={trip.id}
                            className="card glass"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            onClick={() => navigate(`/trip/${trip.id}`)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{trip.name}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.date}</span>
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--text-muted)" />
                        </div>
                    )) : (
                        <div className="card glass" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            참여 중인 여행이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <div style={{ padding: '0 1rem' }}>
                <button
                    onClick={handleLogout}
                    className="btn glass"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#dc2626' }}
                >
                    <LogOut size={18} /> 로그아웃
                </button>
            </div>
        </div>
    );
};

export default Profile;
