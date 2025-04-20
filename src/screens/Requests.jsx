import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

const Requests = () => {
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { nav("/"); return; }

    // listen to pending bookings for this doctor
    const q = query(
      collection(db, "bookings"),
      where("doctorId", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().dateTime.toDate()
      })));
      setLoading(false);
    }, err => {
      console.error("Error loading bookings:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, nav]);

  const accept = async (id) => {
    setBusyId(id);
    try {
      // mark booking approved
      await updateDoc(doc(db, "bookings", id), { status: "approved" });

      alert("Booking accepted! User can now pay.");
      // optionally navigate or refresh
    } catch (e) {
      console.error("Accept error:", e);
      alert("Failed to accept—try again.");
    } finally {
      setBusyId("");
    }
  };

  const decline = async (id) => {
    if (!window.confirm("Decline this booking?")) return;
    setBusyId(id);
    try {
      await deleteDoc(doc(db, "bookings", id));
      alert("Booking declined.");
    } catch (e) {
      console.error("Decline error:", e);
      alert("Failed to decline—try again.");
    } finally {
      setBusyId("");
    }
  };

  const fmtDate = d =>
    d.toLocaleDateString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric"
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span>Loading bookings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 pt-20 px-4">
        <h1 className="text-3xl font-bold mb-4">Pending Appointments</h1>
        <section className="space-y-4">
          {bookings.length > 0 ? bookings.map(b => (
            <div
              key={b.id}
              className="p-6 bg-white shadow rounded-lg flex justify-between items-center border-l-4 border-purple-500"
            >
              <div>
                <p className="font-semibold">{b.userId /* or name if you stored it */}</p>
                <p className="text-gray-600">{fmtDate(b.date)}</p>
                <p className="text-gray-600">₱{(b.amount / 100).toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => accept(b.id)}
                  disabled={busyId === b.id}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {busyId === b.id ? "…" : "Accept"}
                </button>
                <button
                  onClick={() => decline(b.id)}
                  disabled={busyId === b.id}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-600">No pending appointments.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Requests;
