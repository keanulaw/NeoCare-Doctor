import React, { useState, useEffect } from "react";
import { db, auth } from "../configs/firebase-config";
import { collection, query, where, getDocs, doc, setDoc, addDoc, onSnapshot, orderBy } from "firebase/firestore";
import { useParams } from "react-router-dom";
import '../styles/ChatComponent.css';

const ChatComponent = () => {
  const { consultantId } = useParams();
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const participants = [user.uid, consultantId].sort();
        console.log("Web Participants:", participants);

        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "==", participants));
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          console.log("Web Existing Chat ID:", snapshot.docs[0].id);
          setChatId(snapshot.docs[0].id);
        } else {
          const newChatRef = doc(chatsRef);
          await setDoc(newChatRef, {
            participants,
            createdAt: new Date(),
          });
          console.log("Web New Chat ID:", newChatRef.id);
          setChatId(newChatRef.id);
        }
      } catch (error) {
        console.error("Web Chat Error:", error);
      }
    };

    if (user?.uid && consultantId) fetchChat();
  }, [user?.uid, consultantId]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    try {
      if (!chatId) {
        console.log("Web Chat ID not found!");
        return;
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        user: {
          _id: user.uid,
          name: user.displayName || "User",
        },
        createdAt: new Date(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Web Send Error:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg._id} className={msg.user._id === user.uid ? "sent" : "received"}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          className="chat-input-field"
        />
        <button onClick={handleSend} className="chat-send-button">Send</button>
      </div>
    </div>
  );
};

export default ChatComponent; 