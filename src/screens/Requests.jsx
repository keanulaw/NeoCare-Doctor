import React, { useEffect, useState } from "react";
import { db, auth } from "../configs/firebase-config";
import { collection, doc, getDocs, updateDoc, addDoc, getDoc } from "firebase/firestore";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

// Function to generate a consistent conversation ID
const generateConversationId = (userId, consultantId) => {
  return [userId, consultantId].sort().join('_');
};

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      const querySnapshot = await getDocs(collection(db, "appointmentRequests"));
      const requestsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          ...data,
          date: data.date?.toDate() // Convert Firestore timestamp to Date
        };
      });
      setRequests(requestsData);
    };

    fetchRequests();
  }, []);

  const acceptAppointment = async (requestId) => {
    try {
      const requestRef = doc(db, "appointmentRequests", requestId);
      await updateDoc(requestRef, { status: "accepted" });

      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        await addDoc(collection(db, "clients"), requestDoc.data());
      }
    } catch (error) {
      console.error("Error accepting appointment: ", error);
    }
  };

  const handleChat = (request) => {
    const conversationId = generateConversationId(request.userId, request.consultantId);
    navigate(`/chat/${conversationId}`);
  };

  const formatDate = (date) => {
    return date?.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full h-screen flex flex-col items-center bg-[#F5EFE8]">
      <Header />
      <div className="pt-24 w-full max-w-2xl flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-4">Appointment Requests</h1>
        <p className="text-center mb-8">
          Share your parenting aspirations—we're here to support your family's unique path.
        </p>
        <div className="bg-white shadow-md rounded-lg p-4 w-full">
          {requests.map((request) => (
            <div key={request.id} className="flex justify-between items-center border-b py-4">
              <div className="flex flex-col">
                <span className="font-bold">{request.userName}</span>
                <span className="text-sm text-gray-600">
                  {formatDate(request.date)} at {request.time}
                </span>
                <span className="text-sm">Status: {request.status}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptAppointment(request.id)}
                  className="bg-pink-500 text-white px-4 py-2 rounded"
                >
                  Accept
                </button>
                <button className="border border-pink-500 text-pink-500 px-4 py-2 rounded">
                  Decline
                </button>
                <button
                  onClick={() => handleChat(request)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Requests; 