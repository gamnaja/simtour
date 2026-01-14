import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

export const travelService = {
    // Trips
    async getTrip(tripId) {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        return tripSnap.exists() ? { id: tripSnap.id, ...tripSnap.data() } : null;
    },

    async getTrips() {
        const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getUserTrips(uid) {
        // Find trips where the user's UID is in the participants list
        const q = query(collection(db, 'trips'), where('participants', 'array-contains', uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createTrip(tripData, ownerUid) {
        return await addDoc(collection(db, 'trips'), {
            ...tripData,
            owner: ownerUid,
            participants: [ownerUid],
            groups: ['전체'],
            createdAt: new Date()
        });
    },

    async deleteTrip(tripId) {
        const tripRef = doc(db, 'trips', tripId);
        return await deleteDoc(tripRef);
    },

    async joinTrip(tripId, uid) {
        const tripRef = doc(db, 'trips', tripId);
        return await updateDoc(tripRef, {
            participants: arrayUnion(uid)
        });
    },

    async removeMember(tripId, uid) {
        const tripRef = doc(db, 'trips', tripId);
        return await updateDoc(tripRef, {
            participants: arrayRemove(uid)
        });
    },

    // Itinerary
    async getItinerary(tripId) {
        const q = query(collection(db, `trips/${tripId}/itinerary`), orderBy('time', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addItineraryItem(tripId, item) {
        return await addDoc(collection(db, `trips/${tripId}/itinerary`), item);
    },

    // Expenses
    async updateItineraryItem(tripId, itemId, data) {
        const itemRef = doc(db, `trips/${tripId}/itinerary`, itemId);
        return await updateDoc(itemRef, data);
    },

    async deleteItineraryItem(tripId, itemId) {
        const itemRef = doc(db, `trips/${tripId}/itinerary`, itemId);
        return await deleteDoc(itemRef);
    },

    async updateTrip(tripId, data) {
        const tripRef = doc(db, 'trips', tripId);
        return await updateDoc(tripRef, data);
    },

    // Expenses
    async getExpenses(tripId) {
        const q = query(collection(db, `trips/${tripId}/expenses`), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addExpense(tripId, expense) {
        return await addDoc(collection(db, `trips/${tripId}/expenses`), expense);
    },

    async updateExpense(tripId, expenseId, data) {
        const expRef = doc(db, `trips/${tripId}/expenses`, expenseId);
        return await updateDoc(expRef, data);
    },

    async deleteExpense(tripId, expenseId) {
        const expRef = doc(db, `trips/${tripId}/expenses`, expenseId);
        return await deleteDoc(expRef);
    }
};
