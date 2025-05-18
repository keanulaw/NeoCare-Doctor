// src/screens/ClientDetails.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../configs/firebase-config";
import Header from "../components/Header";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient]       = useState(null);
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [role, setRole]           = useState(null);

  useEffect(() => {
    let unsubscribeNotes;

    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // 1️⃣ Load the signed-in user's profile to get role & consultantId
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let detectedRole, allowedConsultantId;
        if (userSnap.exists()) {
          const data = userSnap.data();
          detectedRole = data.role;
          // staff users see clients of their assigned consultant
          allowedConsultantId =
            data.role === "staff" ? data.consultantId : user.uid;
        } else {
          // fallback: they might only exist under "consultants"
          detectedRole = "consultant";
          allowedConsultantId = user.uid;
        }
        setRole(detectedRole);

        // 2️⃣ Fetch the client record
        const clientRef = doc(db, "clients", id);
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists()) {
          navigate("/clients");
          return;
        }
        const clientData = clientSnap.data();

        // 3️⃣ Ensure access: client.consultantId must match
        if (clientData.consultantId !== allowedConsultantId) {
          navigate("/clients");
          return;
        }
        setClient(clientData);

        // 4️⃣ Subscribe in real-time to this client's notes
        //    *only* those authored under your consultantId.
        const notesQuery = query(
          collection(db, "consultationNotes"),
          where("clientId",     "==", id),
          where("consultantId", "==", allowedConsultantId),
          orderBy("createdAt",  "desc")
        );
        unsubscribeNotes = onSnapshot(notesQuery, snapshot => {
          setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } catch (e) {
        console.error("Error loading client details:", e);
        navigate("/clients");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // cleanup when unmounting
    return () => {
      if (unsubscribeNotes) unsubscribeNotes();
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="w-auto overflow-y-auto relative">
        <Header />
        <div className="pt-24 w-full h-screen flex justify-center items-center bg-[#F5EFE8]">
          <div className="text-xl text-gray-600">
            Loading client details...
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const filtered =
    filterType === "all"
      ? notes
      : notes.filter(n => n.consultationType === filterType);

  const renderSection = (title, dataObj) => {
    if (!dataObj) return null;
    const entries = Object.entries(dataObj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    );
    if (entries.length === 0) return null;
    return (
      <div className="mt-4">
        <p className="font-semibold">{title}</p>
        <ul className="list-disc list-inside">
          {entries.map(([key, value]) => (
            <li key={key}>
              <strong>
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, s => s.toUpperCase())}
                :
              </strong>{" "}
              {value}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">{client.fullName}</h1>

        {notes.length > 0 ? (
          <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-2xl border-l-4 border-[#DA79B9]">
            <h2 className="text-2xl font-semibold mb-4">Consultation History</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {["all", "pregnancy", "prenatal", "emergency"].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded transition ${
                    filterType === type
                      ? "bg-[#DA79B9] text-white"
                      : "bg-white text-[#DA79B9] border border-[#DA79B9]"
                  }`}
                >
                  {type === "all"
                    ? "All"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              filtered.map(note => {
                const type = note.consultationType || "unknown";
                const typeLabel =
                  type === "unknown"
                    ? "Unknown"
                    : type.charAt(0).toUpperCase() + type.slice(1);
                const assessment =
                  note[`${type}Assessment`] ?? note.assessment;
                const recommendations =
                  note[`${type}Recommendations`] ?? note.recommendations;

                return (
                  <div key={note.id} className="border-b border-gray-200 py-4">
                    <p>
                      <strong>Type:</strong> {typeLabel}
                    </p>
                    <p>
                      <strong>Consultant:</strong> {note.consultantName}
                    </p>

                    {type === "pregnancy" && (
                      <>
                        {renderSection("Maternal Health", note.maternalHealth)}
                        {renderSection("Pregnancy Screening", note.screening)}
                      </>
                    )}

                    {type === "prenatal" && (
                      <>
                        {renderSection("Maternal Health", note.maternalHealth)}
                        {renderSection("Fetal Health", note.fetalHealth)}
                      </>
                    )}

                    {type === "emergency" && (
                      <>
                        {renderSection("Vital Signs", note.vitalSigns)}
                        {renderSection("Fetal Monitoring", note.fetalMonitoring)}
                        {renderSection("Core Labs", note.labs)}
                        {renderSection("Type & Screen", note.typeAndScreen)}
                        {renderSection("Blood Cultures & Ultrasound", {
                          "Blood Cultures Drawn": note.bloodCultures,
                          "Ultrasound Findings": note.ultrasoundFindings,
                        })}
                      </>
                    )}

                    {assessment && (
                      <p className="mt-4">
                        <strong>Assessment:</strong> {assessment}
                      </p>
                    )}
                    {recommendations && (
                      <p>
                        <strong>Recommendations:</strong> {recommendations}
                      </p>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Date:</strong>{" "}
                      {note.createdAt?.toDate?.().toLocaleString() || "N/A"}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-600">
                No &quot;{filterType}&quot; history found.
              </div>
            )}
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
