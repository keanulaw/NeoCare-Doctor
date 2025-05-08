import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../configs/firebase-config";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import Header from "../components/Header";

const ChatComponent = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);

  // Fetch chat info (parent’s name, etc.)
  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "chats", chatId))
      .then(snapshot => {
        if (snapshot.exists()) setChatInfo(snapshot.data());
      })
      .catch(console.error);
  }, [chatId]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()
      }));
      setMessages(data);
      setLoading(false);
    });
    return () => unsub();
  }, [chatId]);

  const handleSendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        user: {
          _id: auth.currentUser.uid,
          name: auth.currentUser.displayName || "Doctor"
        },
        createdAt: new Date()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xl text-gray-600">Loading messages…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
      {/* Header */}
      <Header />
      <div className="bg-white shadow p-4 border-b-4 border-[#DA79B9]">
        <div className="max-w-4xl mx-auto flex items-center">
          <button
            onClick={() => navigate("/chat")}
            className="text-[#DA79B9] hover:text-[#C064A0] mr-4"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">
            {chatInfo?.parentName || "Chat"}
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(msg => {
            const isMe = msg.user._id === auth.currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    isMe
                      ? "bg-[#DA79B9] text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {msg.createdAt?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t-4 border-[#DA79B9] p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#DA79B9]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[#DA79B9] text-white font-medium hover:bg-[#C064A0] transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
