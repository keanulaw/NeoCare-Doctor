import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { db, auth } from "../configs/firebase-config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      console.warn("No doctor logged in.");
      navigate('/'); // Redirect to login if not authenticated
      return;
    }

    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("consultantId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching clients:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="w-auto overflow-y-auto relative">
        <Header />
        <div className="pt-24 w-full h-screen flex justify-center items-center bg-[#F5EFE8]">
          <div className="text-xl text-gray-600">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full h-screen flex flex-col items-center bg-[#F5EFE8]">
        <h1 className="text-4xl font-bold text-center mb-4">Clients</h1>
        <p className="text-center mb-8">
          Manage your client relationships and view client details here.
        </p>
        <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-2xl">
          {clients.length > 0 ? (
            clients.map((client) => (
              <div key={client.id} className="flex justify-between items-center border-b py-4">
                <div className="flex flex-col">
                  <span className="font-bold">{client.fullName}</span>
                  <span className="text-sm text-gray-600">{client.email}</span>
                  <span className="text-sm">Status: {client.status}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                    className="border border-blue-500 text-blue-500 px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No clients found. Accept appointment requests to add clients.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients; 