import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for chats where the logged-in doctor is the consultant
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.warn("No doctor logged in on website.");
        navigate('/'); // Redirect to login
        return;
      }
      
      console.log("Doctor UID:", user.uid);

      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("doctorUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const convs = [];
          snapshot.forEach((doc) => {
            console.log("Found chat doc:", doc.id, doc.data());
            convs.push({ id: doc.id, ...doc.data() });
          });
          setConversations(convs);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching conversations:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    });

    return () => unsubscribe();
  }, [navigate]);

  // For each conversation, subscribe to its messages subcollection to get the latest message
  useEffect(() => {
    const unsubscribes = conversations.map((conv) => {
      const messagesRef = collection(db, "chats", conv.id, "messages");
      const q = query(messagesRef, orderBy("createdAt", "desc"));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const lastMsgDoc = snapshot.docs[0];
            const lastMsgData = lastMsgDoc.data();
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: {
                text: lastMsgData.text || "",
                createdAt: lastMsgData.createdAt,
              },
            }));
          } else {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: { text: "No messages yet", createdAt: null },
            }));
          }
        },
        (error) =>
          console.error(`Error fetching messages for chat ${conv.id}:`, error)
      );
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [conversations]);

  const handleChatClick = (chatId) => {
    console.log("Clicking chat:", chatId);
    navigate(`/chat/${chatId}`);
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-6">Messages</h1>
      <p className="text-center text-gray-600 mb-6">
        View and continue your conversations with parents.
      </p>
      <div className="space-y-4">
        {conversations.length > 0 ? (
          conversations.map((conv) => {
            let displayName = conv.parentName || conv.parentUid;
            const lastMsg = lastMessages[conv.id];
            return (
              <div
                key={conv.id}
                onClick={() => handleChatClick(conv.id)}
                className="cursor-pointer block transition-transform hover:scale-[1.02]"
              >
                <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {displayName || "Chat"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {lastMsg ? lastMsg.text : "Loading..."}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {lastMsg && lastMsg.createdAt
                      ? new Date(lastMsg.createdAt.seconds * 1000).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">
            No conversations yet. Start chatting with a parent!
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPage; 