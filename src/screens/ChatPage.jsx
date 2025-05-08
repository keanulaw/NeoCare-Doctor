import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc
} from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loadingConvos, setLoadingConvos] = useState(true);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef(null);

  // ─── 1) Load conversations + lastMessages ───
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (!user) return;

      const q = query(
        collection(db, "chats"),
        where("doctorUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubChats = onSnapshot(q, snap => {
        const convos = [];
        const namePromises = [];

        snap.forEach(d => {
          const data = d.data();
          convos.push({ id: d.id, ...data });
          if (data.parentUid) {
            namePromises.push(
              getDoc(doc(db, "users", data.parentUid)).then(u => ({
                id: d.id,
                parentName: u.exists() ? u.data().fullName : "Unknown"
              }))
            );
          }
        });

        Promise.all(namePromises).then(names => {
          setConversations(
            convos.map(c => {
              const n = names.find(x => x.id === c.id);
              return { ...c, parentName: n?.parentName || "Unknown" };
            })
          );
          setLoadingConvos(false);
        });
      });

      return () => unsubChats();
    });

    return () => unsubAuth();
  }, []);

  // ─── 2) Subscribe to each convo’s last message ───
  useEffect(() => {
    const unsubs = conversations.map(c => {
      const q = query(
        collection(db, "chats", c.id, "messages"),
        orderBy("createdAt", "desc")
      );
      return onSnapshot(q, snap => {
        const last = snap.docs[0]?.data();
        setLastMessages(prev => ({
          ...prev,
          [c.id]: last
            ? {
                text: last.text,
                createdAt: last.createdAt.toDate()    // ← convert to JS Date here
              }
            : { text: "No messages yet", createdAt: null }
        }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [conversations]);

  // ─── 3) When a convo is selected, load its info & subscribe to messages ───
  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);

    // grab parentName from conversations array
    const selected = conversations.find(c => c.id === selectedChatId);
    if (selected) setChatInfo(selected);

    // listen to all messages in this chat
    const q = query(
      collection(db, "chats", selectedChatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()  // ← also convert here
      }));
      setMessages(msgs);
      setLoadingMessages(false);
      // scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => unsub();
  }, [selectedChatId, conversations]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "chats", selectedChatId, "messages"), {
      text: newMessage,
      user: {
        _id: auth.currentUser.uid,
        name: auth.currentUser.displayName || "Doctor"
      },
      createdAt: new Date()
    });
    setNewMessage("");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
      <Header />

      <main className="flex flex-1 pt-4">
        {/* ─── LEFT PANE: Conversations List ─── */}
        <aside className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <h2 className="px-6 py-4 text-2xl font-bold">Messages</h2>
          {loadingConvos ? (
            <div className="px-6 text-gray-600">Loading…</div>
          ) : (
            conversations.map(c => {
              const last = lastMessages[c.id];
              const isActive = c.id === selectedChatId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`w-full text-left px-6 py-4 flex justify-between items-start border-l-4 ${
                    isActive
                      ? "bg-white border-[#DA79B9]"
                      : "border-transparent hover:bg-white hover:border-[#DA79B9]"
                  } transition`}
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {c.parentName}
                    </div>
                    <div className="text-sm text-gray-600 truncate max-w-[180px]">
                      {last?.text}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {last?.createdAt?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* ─── RIGHT PANE: Active Chat ─── */}
        <section className="flex-1 flex flex-col">
          {!selectedChatId ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              Select a conversation
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white shadow p-4 border-b-4 border-[#DA79B9]">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="text-[#DA79B9] hover:text-[#C064A0] mr-4"
                >
                  ← Back
                </button>
                <span className="font-semibold text-lg">
                  {chatInfo?.parentName}
                </span>
              </div>

              {/* Message list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-gray-600">Loading chat…</div>
                ) : (
                  messages.map(m => {
                    const isMe = m.user._id === auth.currentUser.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg p-3 max-w-[70%] ${
                            isMe
                              ? "bg-[#DA79B9] text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p>{m.text}</p>
                          <p
                            className={`mt-1 text-xs ${
                              isMe ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {m.createdAt?.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="bg-white border-t-4 border-[#DA79B9] p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#DA79B9]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-[#DA79B9] text-white font-medium hover:bg-[#C064A0] transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
