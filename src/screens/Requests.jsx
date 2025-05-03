// src/pages/Requests.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
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
    if (!user) {
      nav("/");
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("doctorId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        (async () => {
          // 1) Map raw data, parse date
          const raw = snapshot.docs.map((snap) => {
            const data = snap.data();
            let jsDate = null;
            // check for ANY .toDate() method (modular or compat)
            if (data.date && typeof data.date.toDate === "function") {
              jsDate = data.date.toDate();
            } else if (data.date) {
              // maybe a plain string or number
              jsDate = new Date(data.date);
            }

            return {
              id: snap.id,
              userId: data.userId,
              amount: data.amount,
              // if you ever saved name on the booking itself:
              userNameField: data.userName || data.clientName || null,
              date: jsDate,
              rawDateValue: data.date, 
            };
          });

          // 2) Figure out which UIDs still need lookup
          const toLookup = raw
            .filter((b) => !b.userNameField)
            .map((b) => b.userId);
          const unique = [...new Set(toLookup)];

          // 3) Batch‐fetch those user docs
          const snapshots = await Promise.all(
            unique.map((uid) => getDoc(doc(db, "users", uid)))
          );
          const nameMap = {};
          snapshots.forEach((uSnap) => {
            if (uSnap.exists()) {
              const u = uSnap.data();
              // look for common patterns:
              nameMap[uSnap.id] =
                u.name ||
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.displayName ||
                null;
            }
          });

          // 4) Enrich each booking with final displayName
          const enriched = raw.map((b) => {
            let finalName =
              b.userNameField ||
              nameMap[b.userId] ||
              b.userId; // fallback to id
            return {
              ...b,
              displayName: finalName,
            };
          });

          setBookings(enriched);
          setLoading(false);
        })().catch((e) => {
          console.error("Error enriching bookings:", e);
          setLoading(false);
        });
      },
      (err) => {
        console.error("Error loading bookings:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, nav]);

  const accept = async (id) => {
    setBusyId(id);
    try {
      await updateDoc(doc(db, "bookings", id), { status: "accepted" });
      alert("Booking accepted! User can now pay.");
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
      await updateDoc(doc(db, "bookings", id), { status: "canceled" });
      alert("Booking declined.");
    } catch (e) {
      console.error("Decline error:", e);
      alert("Failed to decline—try again.");
    } finally {
      setBusyId("");
    }
  };

  const fmtDate = (d) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20 px-6">
        <h1 className="text-3xl font-bold mb-6">Pending Appointments</h1>
        <section className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-6 bg-white shadow-lg rounded-xl flex justify-between items-center border-l-4 border-purple-500 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-xl">{b.displayName}</p>
                  <p className="text-sm text-gray-500">({b.userId})</p>
                  <p className="text-sm text-gray-600">
                    {b.date
                      ? fmtDate(b.date)
                      : b.rawDateValue
                      ? new Date(b.rawDateValue).toLocaleString()
                      : "Date TBD"}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₱{(b.amount / 100).toFixed(2)}
                  </p>
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
                    {busyId === b.id ? "…" : "Decline"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">
              No pending appointments.
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Requests;
