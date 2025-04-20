import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, query, where, orderBy, onSnapshot,
  getDoc, doc
} from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  /* ─── fetch list of conversations for logged‑in doctor ─── */
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async user => {
      if (!user) { nav("/"); return; }

      const q = query(
        collection(db, "chats"),
        where("doctorUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubChats = onSnapshot(q, async snap => {
        const base = [];
        const namePromises = [];

        snap.forEach(d => {
          const chat = d.data();
          base.push({ id: d.id, ...chat });

          /* fetch parent’s name */
          if (chat.parentUid) {
            namePromises.push(
              getDoc(doc(db, "users", chat.parentUid)).then(u => ({
                id: d.id,
                parentName: u.exists() ? u.data().fullName : "Unknown",
              }))
            );
          }
        });

        const names = await Promise.all(namePromises);
        setConversations(
          base.map(c => {
            const n = names.find(x => x.id === c.id);
            return { ...c, parentName: n ? n.parentName : c.parentUid };
          })
        );
        setLoading(false);
      });

      return () => unsubChats();
    });

    return () => unsubAuth();
  }, [nav]);

  /* ─── listen to last message of each chat ─── */
  useEffect(() => {
    const unsubList = conversations.map(conv => {
      const q = query(
        collection(db, "chats", conv.id, "messages"),
        orderBy("createdAt", "desc")
      );
      return onSnapshot(q, snap => {
        const last = snap.empty ? null : snap.docs[0].data();
        setLastMessages(p => ({
          ...p,
          [conv.id]: last
            ? { text: last.text || "", createdAt: last.createdAt }
            : { text: "No messages yet", createdAt: null },
        }));
      });
    });
    return () => unsubList.forEach(u => u());
  }, [conversations]);

  const openChat = id => nav(`/chat/${id}`);

  const fmtTime = t =>
    t ? new Date(t.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  /* ─── UI ─── */
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xl text-gray-600">Loading conversations…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center pt-20 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-center text-gray-700 mb-8 max-w-md">
          View and continue conversations with parents.
        </p>

        <section className="w-full max-w-3xl space-y-4">
          {conversations.length ? (
            conversations.map(c => {
              const last = lastMessages[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => openChat(c.id)}
                  className="w-full text-left transform hover:scale-[1.02] transition"
                >
                  <div className="bg-white shadow-md rounded-lg p-6 flex justify-between items-start border-l-4 border-[#DA79B9]">
                    <div className="pr-4">
                      <h2 className="text-lg font-semibold text-gray-900">{c.parentName}</h2>
                      <p className="text-sm text-gray-600 truncate max-w-[220px]">
                        {last ? last.text : "Loading…"}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {last ? fmtTime(last.createdAt) : ""}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-center text-gray-600">
              No conversations yet. Start chatting with a parent!
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ChatPage;
