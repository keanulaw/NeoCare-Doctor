import React, { useState } from "react";
import Header from "../components/Header";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../configs/firebase-config";
import { addDoc, collection } from "firebase/firestore";

const AddConsultationNote = () => {
  const { id } = useParams(); // Assuming this is the client id
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddNote = async () => {
    setLoading(true);
    try {
      // Save the consultation note in Firestore
      await addDoc(collection(db, "consultationNotes"), {
        clientId: id,
        note,
        createdAt: new Date(),
      });
      setLoading(false);
      // Navigate back to client detail page (or any desired page)
      navigate(`/clients/${id}`);
    } catch (error) {
      console.error("Error adding consultation note:", error);
      setLoading(false);
    }
  };

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Add Consultation Note</h1>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full max-w-2xl"
          placeholder="Enter consultation note..."
          rows={10}
        />
        <button
          onClick={handleAddNote}
          disabled={loading}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded"
        >
          {loading ? "Saving..." : "Save Consultation Note"}
        </button>
      </div>
    </div>
  );
};

export default AddConsultationNote; 