import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../configs/firebase-config";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import Header from "../components/Header";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const currentConsultantId = auth.currentUser?.uid;

    const fetchClientDetails = async () => {
      try {
        const clientRef = doc(db, "clients", id);
        const clientDoc = await getDoc(clientRef);

        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          console.log("Fetched client:", clientData);
          console.log("Fetched client ID:", id);
          console.log("Current consultant ID:", currentConsultantId);

          if (clientData.consultantId === currentConsultantId) {
            setClient(clientData);
            await fetchConsultationNotes(id, currentConsultantId);
          } else {
            console.warn("Consultant ID does not match. Access denied.");
            navigate("/clients");
          }
        } else {
          console.error("No such client!");
          navigate("/clients");
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };

    const fetchConsultationNotes = async (clientId, consultantId) => {
      try {
        const notesRef = collection(db, "consultationNotes");

        let q;
        try {
          q = query(
            notesRef,
            where("clientId", "==", clientId),
            where("consultantId", "==", consultantId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);
          const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotes(notesList);
        } catch (indexError) {
          // Fallback: retry without orderBy, and sort manually
          console.warn("Index missing, retrying without orderBy...");
          q = query(
            notesRef,
            where("clientId", "==", clientId),
            where("consultantId", "==", consultantId)
          );
          const snapshot = await getDocs(q);
          const notesList = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) =>
              b.createdAt?.toDate?.() - a.createdAt?.toDate?.()
            );
          setNotes(notesList);
        }

        if (notes.length === 0) {
          console.log("No consultation notes found.");
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
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
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen p-4 ">
        <h1 className="text-4xl font-bold mb-8">{client.fullName}</h1>

        {notes.length > 0 ? (
          <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-2xl border-l-4 border-[#DA79B9]">
            <h2 className="text-2xl font-semibold mb-4 ">Consultation History</h2>
            {notes.map(note => (
              <div key={note.id} className="border-b border-gray-200 py-4">
                <p><strong>Consultant:</strong> {note.consultantName}</p>
                <p><strong>Assessment:</strong> {note.assessment}</p>
                <p><strong>Recommendations:</strong> {note.recommendations}</p>

                <div className="mt-2">
                  <p className="font-semibold">Maternal Health:</p>
                  {note.maternalHealth ? (
                    <ul className="list-disc list-inside">
                      <li><strong>Blood Pressure:</strong> {note.maternalHealth.bloodPressure}</li>
                      <li><strong>Weight Gain:</strong> {note.maternalHealth.weightGain}</li>
                      <li><strong>Hemoglobin:</strong> {note.maternalHealth.hemoglobin}</li>
                      <li><strong>Uterine Height:</strong> {note.maternalHealth.uterineHeight}</li>
                      <li><strong>Symptoms:</strong> {note.maternalHealth.symptoms}</li>
                      <li><strong>Urine Analysis:</strong> {note.maternalHealth.urineAnalysis}</li>
                    </ul>
                  ) : <p>N/A</p>}
                </div>

                <div className="mt-2">
                  <p className="font-semibold">Fetal Health:</p>
                  {note.fetalHealth ? (
                    <ul className="list-disc list-inside">
                      <li><strong>Amniotic Fluid:</strong> {note.fetalHealth.amnioticFluid}</li>
                      <li><strong>Gestational Age:</strong> {note.fetalHealth.gestationalAge}</li>
                      <li><strong>Heart Rate:</strong> {note.fetalHealth.heartRate}</li>
                      <li><strong>Movement Frequency:</strong> {note.fetalHealth.movementFrequency}</li>
                      <li><strong>Presentation:</strong> {note.fetalHealth.presentation}</li>
                      <li><strong>Ultrasound Findings:</strong> {note.fetalHealth.ultrasoundFindings}</li>
                    </ul>
                  ) : <p>N/A</p>}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  <strong>Date:</strong> {note.createdAt?.toDate?.().toLocaleString() || "N/A"}
                </p>
              </div>
            ))}
          </div>  
        ) : (
          <div className="mt-8 text-gray-600">No consultation history yet.</div>
        )}

        <button
          onClick={() => navigate("/clients")}
          className="mt-6 bg-[#DA79B9] text-white px-6 py-3 rounded hover:bg-[#C064A0] transition"
        >
          Back to Clients
        </button>
      </div>
    </div>
  );
};

export default ClientDetails;