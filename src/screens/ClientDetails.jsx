import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../configs/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import Header from "../components/Header";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const clientRef = doc(db, "clients", id);
        const clientDoc = await getDoc(clientRef);
        if (clientDoc.exists()) {
          setClient(clientDoc.data());
        } else {
          console.error("No such client!");
          navigate("/clients");
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="w-auto overflow-y-auto relative">
        <Header />
        <div className="pt-24 w-full h-screen flex justify-center items-center bg-[#F5EFE8]">
          <div className="text-xl text-gray-600">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">{client.fullName}</h1>
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Status:</strong> {client.status}</p>
          {/* Add more client details as needed */}
        </div>
        <button
          onClick={() => navigate("/clients")}
          className="mt-4 bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        >
          Back to Clients
        </button>
      </div>
    </div>
  );
};

export default ClientDetails; 