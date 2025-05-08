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
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

const Requests = () => {
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  // new: which filter tab is active
  const [filter, setFilter] = useState("pending"); // "pending" | "upcoming" | "completed"
  const nav = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      nav("/");
      return;
    }

    // now fetch both pending and accepted, so we can slice them client-side
    const q = query(
      collection(db, "bookings"),
      where("doctorId", "==", user.uid),
      where("status", "in", ["pending", "accepted"])
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        (async () => {
          const raw = snapshot.docs.map((snap) => {
            const data = snap.data();
            let jsDate = null;
            if (data.date && typeof data.date.toDate === "function") {
              jsDate = data.date.toDate();
            } else if (data.date) {
              jsDate = new Date(data.date);
            }

            return {
              id: snap.id,
              userId: data.userId,
              amount: data.amount,
              status: data.status,              // include status
              fullName:
                data.fullName || data.userName || data.clientName || null,
              date: jsDate,
              rawDateValue: data.date,
            };
          });

          const toLookup = raw
            .filter((b) => !b.fullName)
            .map((b) => b.userId);
          const unique = [...new Set(toLookup)];

          const snapshots = await Promise.all(
            unique.map((uid) => getDoc(doc(db, "users", uid)))
          );
          const nameMap = {};
          snapshots.forEach((uSnap) => {
            if (uSnap.exists()) {
              const u = uSnap.data();
              nameMap[uSnap.id] =
                u.fullName ||
                u.name ||
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.displayName ||
                null;
            }
          });

          const enriched = raw.map((b) => ({
            ...b,
            fullName: b.fullName || nameMap[b.userId] || b.userId,
          }));

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

      const bookingSnap = await getDoc(doc(db, "bookings", id));
      if (bookingSnap.exists()) {
        const { userId, fullName } = bookingSnap.data();
        await setDoc(
          doc(db, "clients", userId),
          {
            fullName: fullName || "",
            consultantId: auth.currentUser.uid,
            status: "active",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      alert("Booking accepted! Client added.");
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

  // new: filter the full list in memory
  const now = new Date();
  const filteredBookings = bookings.filter((b) => {
    if (filter === "pending") {
      return b.status === "pending";
    }
    if (filter === "upcoming") {
      return b.status === "accepted" && b.date && b.date >= now;
    }
    if (filter === "completed") {
      return b.status === "accepted" && b.date && b.date < now;
    }
    return false;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20 px-6">
        {/* filter tabs */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${
              filter === "pending"
                ? "bg-purple-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Appointment Requests
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded ${
              filter === "upcoming"
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Upcoming Appointments
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded ${
              filter === "completed"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Completed Appointments
          </button>
        </div>

        {/* dynamic heading */}
        <h1 className="text-3xl font-bold mb-6">
          {filter === "pending"
            ? "Pending Appointments"
            : filter === "upcoming"
            ? "Upcoming Appointments"
            : "Completed Appointments"}
        </h1>

        <section className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                className="p-6 bg-white shadow-lg rounded-xl flex justify-between items-center border-l-4 border-purple-500 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-xl">{b.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {b.date
                      ? fmtDate(b.date)
                      : b.rawDateValue
                      ? new Date(b.rawDateValue).toLocaleString()
                      : "Date TBD"}
                  </p>
                  
                </div>
                {/* only show Accept/Decline on pending */}
                {filter === "pending" && (
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
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">
              {filter === "pending"
                ? "No pending appointments."
                : filter === "upcoming"
                ? "No upcoming appointments."
                : "No completed appointments."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Requests;
