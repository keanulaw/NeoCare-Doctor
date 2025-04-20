/* src/screens/Dashboard.jsx */
import React, { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot, getDocs,
} from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

const Dashboard = () => {
  const doctor = auth.currentUser;

  const [loading, setLoading]         = useState(true);
  const [patients, setPatients]       = useState(0);
  const [pendingApt, setPendingApt]   = useState(0);
  const [unreadMsgs, setUnreadMsgs]   = useState(0);

  /* ─── fetch counts ─── */
  useEffect(() => {
    if (!doctor) return;

    /* Active patients = clients where consultantId == doctor.uid */
    const unsubClients = onSnapshot(
      query(collection(db, "clients"), where("consultantId", "==", doctor.uid)),
      snap => setPatients(snap.size)
    );

    /* Pending appointments */
    const unsubReq = onSnapshot(
      query(
        collection(db, "appointmentRequests"),
        where("consultantId", "==", doctor.uid),
        where("status", "==", "pending")
      ),
      snap => setPendingApt(snap.size)
    );

    /* Unread messages: for each chat find messages not seen by doctor */
    const fetchUnread = async () => {
      let total = 0;
      const chats = await getDocs(
        query(collection(db, "chats"), where("doctorUid", "==", doctor.uid))
      );
      const promises = chats.docs.map(async (c) => {
        const msgs = await getDocs(
          query(
            collection(db, "chats", c.id, "messages"),
            where("seenByDoctor", "==", false)
          )
        );
        total += msgs.size;
      });
      await Promise.all(promises);
      setUnreadMsgs(total);
      setLoading(false);
    };
    fetchUnread();

    return () => {
      unsubClients();
      unsubReq();
    };
  }, [doctor]);

  /* card component */
  const StatCard = ({ title, value }) => (
    <div className="bg-white shadow-md rounded-2xl border-2 border-[#DA79B9] p-6 flex flex-col">
      <span className="text-[#DA79B9] font-bold text-xl">{title}</span>
      <span className="text-5xl mt-2 font-semibold text-gray-900">{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xl text-gray-600">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pt-24 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-center text-gray-700 mb-10 max-w-md">
          Share your parenting aspirations—we're here to support your family's unique path.
        </p>

        {/* stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <StatCard title="Active Patients"      value={patients}   />
          <StatCard title="Pending Appointments" value={pendingApt} />
          <StatCard title="New Messages"         value={unreadMsgs} />
          <StatCard title="Satisfaction Rate"    value="98%"        />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
