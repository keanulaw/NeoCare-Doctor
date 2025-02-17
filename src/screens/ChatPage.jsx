import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../configs/firebase-config";
import Header from "../components/Header";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.warn("No doctor logged in.");
        navigate('/');
        return;
      }

      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("doctorUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeChats = onSnapshot(q, async (snapshot) => {
        const convs = [];
        const namePromises = [];

        snapshot.forEach((chatDoc) => {
          const chatData = chatDoc.data();
          convs.push({ id: chatDoc.id, ...chatData });

          if (chatData.parentUid) {
            const parentDocRef = doc(db, "users", chatData.parentUid);
            namePromises.push(
              getDoc(parentDocRef).then((userDoc) => ({
                chatId: chatDoc.id,
                parentName: userDoc.exists() ? userDoc.data().fullName : "Unknown",
              }))
            );
          }
        });

        const resolvedNames = await Promise.all(namePromises);
        const updatedConvs = convs.map((conv) => {
          const nameObj = resolvedNames.find((n) => n.chatId === conv.id);
          return { ...conv, parentName: nameObj ? nameObj.parentName : conv.parentUid };
        });

        setConversations(updatedConvs);
        setLoading(false);
      });

      return () => unsubscribeChats();
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const unsubscribes = conversations.map((conv) => {
      const messagesRef = collection(db, "chats", conv.id, "messages");
      const q = query(messagesRef, orderBy("createdAt", "desc"));

      return onSnapshot(q, (snapshot) => {
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
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [conversations]);

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="w-full h-screen flex flex-col items-center bg-[#F5EFE8]">
      <Header />
      <div className="pt-24 w-full max-w-2xl flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6">Messages</h1>
        <p className="text-center text-gray-600 mb-6">
          View and continue your conversations with parents.
        </p>
        <div className="space-y-4 w-full">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
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
                        {conv.parentName || "Chat"}
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
    </div>
  );
};

export default ChatPage;
