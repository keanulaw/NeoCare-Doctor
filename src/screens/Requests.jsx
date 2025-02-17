import React, { useEffect, useState } from "react";
import { db, auth } from "../configs/firebase-config";
import { collection, doc, getDocs, updateDoc, addDoc, getDoc, deleteDoc, query, where } from "firebase/firestore";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

// Function to generate a consistent conversation ID
const generateConversationId = (userId, consultantId) => {
  return [userId, consultantId].sort().join('_');
};

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, "appointmentRequests"), where("consultantId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id,
            ...data,
            date: data.date?.toDate() // Convert Firestore timestamp to Date
          };
        });
        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests: ", error);
      }
    };

    if (currentUser) {
      fetchRequests();
    } else {
      navigate('/'); // Redirect to login if not authenticated
    }
  }, [currentUser, navigate]);

  const acceptAppointment = async (requestId) => {
    setLoading(true);
    try {
      const requestRef = doc(db, "appointmentRequests", requestId);
      await updateDoc(requestRef, { status: "accepted" });

      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        // Add consultantId to client data
        await addDoc(collection(db, "clients"), {
          ...requestData,
          consultantId: currentUser.uid,
          acceptedAt: new Date()
        });

        // Remove the accepted request from the local state
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));

        alert("Appointment accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting appointment: ", error);
      alert("Failed to accept the appointment. Please try again.");
    }
    setLoading(false);
  };

  const declineAppointment = async (requestId) => {
    if (window.confirm("Are you sure you want to decline this request?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "appointmentRequests", requestId));
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
        alert("Appointment declined successfully!");
      } catch (error) {
        console.error("Error declining appointment: ", error);
        alert("Failed to decline the appointment. Please try again.");
      }
      setLoading(false);
    }
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
          {requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id} className="flex justify-between items-center border-b py-4">
                <div className="flex flex-col">
                  <span className="font-bold">{request.fullName}</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(request.date)} at {request.time}
                  </span>
                  <span className="text-sm">Status: {request.status}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptAppointment(request.id)}
                    className="bg-pink-500 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Accept"}
                  </button>
                  <button
                    onClick={() => declineAppointment(request.id)}
                    className="border border-pink-500 text-pink-500 px-4 py-2 rounded"
                    disabled={loading}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No appointment requests found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Requests;