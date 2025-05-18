import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { db, auth } from "../configs/firebase-config";
import { addDoc, collection, doc, getDoc, serverTimestamp, query, where, orderBy, limit, getDocs, updateDoc } from "firebase/firestore";

const AddConsultationNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ──────────── role detection ────────────
  const [role, setRole] = useState(null);   // "doctor" | "staff"
  useEffect(() => {
    (async () => {
      if (!auth.currentUser) return;
      const prof = await getDoc(doc(db, "users", auth.currentUser.uid));
      setRole(prof.exists() ? prof.data().role || "doctor" : "doctor");
    })();
  }, []);

  // Which form to show: null → picker, or "pregnancy"/"prenatal"/"emergency"
  const [consultationType, setConsultationType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("");

  // All fields, uniquely namespaced per consultation
  const [formData, setFormData] = useState({
    pregnancy: {
      maternalHealth: {
        pregnancyBloodPressure: "",
        pregnancySymptoms: ""
      },
      screening: {
        pregnancyHcgResult: "",
        pregnancyUltrasoundDate: "",
        pregnancyGestationalAgeEstimate: "",
        pregnancyInfectionScreening: "",
        pregnancyBloodType: "",
        pregnancyRubellaStatus: "",
        pregnancyHivTest: "",
        pregnancyPapSmear: ""
      },
      pregnancyAssessment: "",
      pregnancyRecommendations: ""
    },
    prenatal: {
      maternalHealth: {
        prenatalBloodPressure: "",
        prenatalWeightGain: "",
        prenatalHemoglobin: "",
        prenatalUterineHeight: "",
        prenatalSymptoms: "",
        prenatalUrineAnalysis: ""
      },
      fetalHealth: {
        prenatalHeartRate: "",
        prenatalMovementFrequency: "",
        prenatalPresentation: "",
        prenatalGestationalAge: "",
        prenatalAmnioticFluid: "",
        prenatalUltrasoundFindings: ""
      },
      prenatalAssessment: "",
      prenatalRecommendations: ""
    },
    emergency: {
    // 1) Vital signs to catch shock, sepsis, pre-eclampsia, etc.
    vitalSigns: {
      bloodPressure: "",      // mmHg
      heartRate: "",          // bpm
      respiratoryRate: "",    // breaths/min
      temperature: "",        // °C or °F
      oxygenSaturation: ""    // % SpO₂
    },

    // 2) Fetal monitoring to check for distress
    fetalMonitoring: {
      fetalHeartRate: ""      // bpm
    },

    // 3) Core labs for bleeding, clotting, infection, organ function
    labs: {
      hemoglobin: "",         // g/dL
      hematocrit: "",         // %
      whiteCellCount: "",     // cells/µL
      platelets: "",          // platelets/µL
      PT: "",                 // seconds
      aPTT: "",               // seconds
      fibrinogen: "",         // mg/dL
      sodium: "",             // mEq/L
      potassium: "",          // mEq/L
      bun: "",                // mg/dL
      creatinine: "",         // mg/dL
      AST: "",                // U/L
      ALT: "",                // U/L
      proteinuria: ""         // dipstick result
    },

    // 4) Blood bank prep for transfusion
    typeAndScreen: {
      bloodType: "",          // e.g. A+, O–
      rhStatus: "",           // Rh-positive/negative
      antibodyScreen: ""      // any unexpected antibodies
    },

    // 5) Infection workup if fever/sepsis suspected
    bloodCultures: "",        // drawn? (yes/no) or result

    // 6) Rapid imaging for bleeding/abruption
    ultrasoundFindings: "",   // free fluid, abruption, placental location

    // 7) Narrative synthesis
    emergencyAssessment: "",
    emergencyRecommendations: ""
  }
  });

  // track a draft note ID when loaded
  const [draftId, setDraftId] = useState(null);

  // ─── When a doctor picks a type, load the latest staff draft ───
  useEffect(() => {
    if (role !== "doctor" || !consultationType) return;
    (async () => {
      const q = query(
        collection(db, "consultationNotes"),
        where("clientId", "==", id),
        where("consultationType", "==", consultationType),
        where("role", "==", "staff"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      const docSnap = snap.docs[0];
      setDraftId(docSnap.id);
      const staffData = docSnap.data();

      setFormData(prev => ({
        ...prev,
        [consultationType]: {
          ...prev[consultationType],
          ...(staffData.maternalHealth    && { maternalHealth: staffData.maternalHealth }),
          ...(staffData.screening         && { screening: staffData.screening }),
          ...(staffData.fetalHealth       && { fetalHealth: staffData.fetalHealth }),
          ...(staffData.vitalSigns        && { vitalSigns: staffData.vitalSigns }),
          ...(staffData.fetalMonitoring   && { fetalMonitoring: staffData.fetalMonitoring }),
          ...(staffData.labs              && { labs: staffData.labs }),
          ...(staffData.typeAndScreen     && { typeAndScreen: staffData.typeAndScreen }),
          ...(staffData.bloodCultures     != null && { bloodCultures: staffData.bloodCultures }),
          ...(staffData.ultrasoundFindings!= null && { ultrasoundFindings: staffData.ultrasoundFindings })
        }
      }));
    })();
  }, [role, consultationType, id]);

  // generic updater for nested fields
  const handleInputChange = (section, group, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...prev[section][group],
          [field]: value
        }
      }
    }));
  };

  // ──────────── SAVE handler ────────────
  const handleAddNote = async () => {
    if (!consultationType) return;
    setLoading(true);

    const user = auth.currentUser;
    try {
      // load client & verify
      const cSnap = await getDoc(doc(db, "clients", id));
      if (!cSnap.exists()) throw new Error("Client not found");
      const client = cSnap.data();
      const doctorId = client.consultantId;

      // verify permissions
      const uSnap = await getDoc(doc(db, "users", user.uid));
      const uData = uSnap.data() || {};
      const isDocAllowed   = role === "doctor" && user.uid === doctorId;
      const isStaffAllowed = role === "staff" && uData.consultantId === doctorId;
      if (!isDocAllowed && !isStaffAllowed) throw new Error("Access denied");

      // fetch consultantName & authorName
      const drSnap = await getDoc(doc(db, "consultants", doctorId));
      const consultantName = drSnap.exists() ? drSnap.data().name : "Unknown Doctor";
      let rawAuthorName;
      if (role === "doctor") {
        const docSnap = await getDoc(doc(db, "consultants", user.uid));
        rawAuthorName = docSnap.exists() ? docSnap.data().name : null;
      } else {
        const usrSnap = await getDoc(doc(db, "users", user.uid));
        rawAuthorName = usrSnap.exists() ? usrSnap.data().name : null;
      }
      const authorName = rawAuthorName?.trim() || user.displayName || "Unknown";

      // strip or pick only the fields we want
      let body = { ...formData[consultationType] };
      if (role === "staff") {
        // remove assessment/recs
        if (consultationType === "pregnancy") {
          delete body.pregnancyAssessment;
          delete body.pregnancyRecommendations;
        } else if (consultationType === "prenatal") {
          delete body.prenatalAssessment;
          delete body.prenatalRecommendations;
        } else {
          delete body.emergencyAssessment;
          delete body.emergencyRecommendations;
        }
      } else {
        // doctor: only keep assessment/recs
        if (consultationType === "pregnancy") {
          body = {
            pregnancyAssessment: body.pregnancyAssessment,
            pregnancyRecommendations: body.pregnancyRecommendations
          };
        } else if (consultationType === "prenatal") {
          body = {
            prenatalAssessment: body.prenatalAssessment,
            prenatalRecommendations: body.prenatalRecommendations
          };
        } else {
          body = {
            emergencyAssessment: body.emergencyAssessment,
            emergencyRecommendations: body.emergencyRecommendations
          };
        }
      }

      // payload
      const base = {
        clientId: id,
        consultantId: doctorId,
        consultantName,
        authorId:   user.uid,
        authorName,
        role,
        consultationType
      };

      if (role === "doctor" && draftId) {
        // finish the draft
        const noteRef = doc(db, "consultationNotes", draftId);
        await updateDoc(noteRef, {
          ...body,
          updatedAt: serverTimestamp()
        });
      } else {
        // create a brand new draft
        await addDoc(collection(db, "consultationNotes"), {
          ...base,
          ...body,
          createdAt: serverTimestamp()
        });
      }

      navigate(`/clients/${id}`);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Dynamic Title Mapping
  const getTitleForConsultation = () => {
    switch (consultationType) {
      case "pregnancy": return "Pregnancy Consultation Note";
      case "prenatal": return "Prenatal Check-Up Note";
      case "emergency": return "Emergency OB Check-Up Note";
      default: return "Add OB Consultation Note";
    }
  };

  // ──────────── early loading / role guard ────────────
  if (role === null)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <p className="text-lg">Loading…</p>
      </div>
    );

  const isStaff = role === "staff";

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">{getTitleForConsultation()}</h1>

        {!consultationType && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 text-center">
            <button
              onClick={() => setConsultationType("pregnancy")}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition"
            >
              Pregnancy Consultation
            </button>
            <button
              onClick={() => setConsultationType("prenatal")}
              className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
            >
              Prenatal Check-Up
            </button>
            <button
              onClick={() => setConsultationType("emergency")}
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
            >
              Emergency OB Check-Up
            </button>
          </div>
        )}

        {consultationType && (
          <>
            {/* Pregnancy Consultation */}
            {consultationType === "pregnancy" && (
          <div className="space-y-6 w-full max-w-4xl">

            {/* Maternal Health */}
            <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
              <h3 className="text-pink-700 font-semibold mb-4">Maternal Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="e.g., 120/80"
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.maternalHealth.pregnancyBloodPressure}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "maternalHealth",
                        "pregnancyBloodPressure",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1">Symptoms</label>
                  <input
                    type="text"
                    placeholder="e.g., nausea, fatigue"
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.maternalHealth.pregnancySymptoms}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "maternalHealth",
                        "pregnancySymptoms",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Pregnancy Screening */}
            <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
              <h3 className="text-pink-700 font-semibold mb-4">Pregnancy Screening</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">hCG Result</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyHcgResult}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyHcgResult",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Ultrasound Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyUltrasoundDate}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyUltrasoundDate",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1">Gestational Age Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g., 6+2 weeks"
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyGestationalAgeEstimate}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyGestationalAgeEstimate",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1">Blood Type</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyBloodType}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyBloodType",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Rubella Status</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyRubellaStatus}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyRubellaStatus",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="immune">Immune</option>
                    <option value="non-immune">Non-immune</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">HIV Test</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyHivTest}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyHivTest",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="reactive">Reactive</option>
                    <option value="non-reactive">Non-reactive</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Pap Smear Done?</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyPapSmear}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyPapSmear",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Infection Screening</label>
                  <input
                    type="text"
                    placeholder="e.g., RPR, HBsAg"
                    className="border p-2 w-full rounded"
                    value={formData.pregnancy.screening.pregnancyInfectionScreening}
                    onChange={e =>
                      handleInputChange(
                        "pregnancy",
                        "screening",
                        "pregnancyInfectionScreening",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Assessment & Recommendations */}
            {!isStaff && (
              <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
                <label className="block font-semibold mb-2 text-pink-700">Assessment</label>
                <textarea
                  className="border p-2 w-full rounded h-24 mb-4"
                  placeholder="Clinical summary..."
                  value={formData.pregnancy.pregnancyAssessment}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      pregnancy: {
                        ...prev.pregnancy,
                        pregnancyAssessment: e.target.value
                      }
                    }))
                  }
                />

                <label className="block font-semibold mb-2 text-pink-700">Recommendations</label>
                <textarea
                  className="border p-2 w-full rounded h-24 mb-2"
                  placeholder="Care plan & next steps..."
                  value={formData.pregnancy.pregnancyRecommendations}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      pregnancy: {
                        ...prev.pregnancy,
                        pregnancyRecommendations: e.target.value
                      }
                    }))
                  }
                />

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setConsultationType(null)}
                    className="bg-pink-400 text-white px-100 py-2 rounded hover:bg-pink-500 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


    {/* Prenatal Check-Up */}
    {consultationType === "prenatal" && (
      <div className="space-y-6 w-full max-w-4xl">

        {/* ─── Maternal Health Card ─── */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
          <h3 className="text-pink-700 font-semibold mb-4">Maternal Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blood Pressure */}
            <div>
              <label className="block mb-1">Blood Pressure</label>
              <input
                type="text"
                placeholder="e.g., 120/80"
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalBloodPressure}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalBloodPressure",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Weight Gain */}
            <div>
              <label className="block mb-1">Weight Gain (kg)</label>
              <input
                type="number"
                step="0.1"
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalWeightGain}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalWeightGain",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Hemoglobin */}
            <div>
              <label className="block mb-1">Hemoglobin (g/dL)</label>
              <input
                type="number"
                step="0.1"
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalHemoglobin}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalHemoglobin",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Uterine Height */}
            <div>
              <label className="block mb-1">Uterine Height (cm)</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalUterineHeight}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalUterineHeight",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Symptoms */}
            <div>
              <label className="block mb-1">Symptoms</label>
              <input
                type="text"
                placeholder="e.g., edema, headaches"
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalSymptoms}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalSymptoms",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Urine Analysis */}
            <div>
              <label className="block mb-1">Urine Analysis</label>
              <select
                className="border p-2 w-full rounded"
                value={formData.prenatal.maternalHealth.prenatalUrineAnalysis}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "maternalHealth",
                    "prenatalUrineAnalysis",
                    e.target.value
                  )
                }
              >
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="proteinuria">Proteinuria</option>
                <option value="glucosuria">Glucosuria</option>
                <option value="infection">Infection</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Fetal Health Card ─── */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
          <h3 className="text-pink-700 font-semibold mb-4">Fetal Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div>
              <label className="block mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalHeartRate}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalHeartRate",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Movement Frequency */}
            <div>
              <label className="block mb-1">Movement Frequency</label>
              <select
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalMovementFrequency}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalMovementFrequency",
                    e.target.value
                  )
                }
              >
                <option value="">Select</option>
                <option value="normal">Normal (≥10/day)</option>
                <option value="reduced">Reduced</option>
                <option value="excessive">Excessive</option>
              </select>
            </div>
            {/* Presentation */}
            <div>
              <label className="block mb-1">Presentation</label>
              <select
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalPresentation}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalPresentation",
                    e.target.value
                  )
                }
              >
                <option value="">Select</option>
                <option value="cephalic">Cephalic</option>
                <option value="breech">Breech</option>
                <option value="transverse">Transverse</option>
                <option value="unstable">Unstable</option>
              </select>
            </div>
            {/* Gestational Age */}
            <div>
              <label className="block mb-1">Gestational Age</label>
              <input
                type="text"
                placeholder="e.g., 32+4 weeks"
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalGestationalAge}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalGestationalAge",
                    e.target.value
                  )
                }
              />
            </div>
            {/* Amniotic Fluid */}
            <div>
              <label className="block mb-1">Amniotic Fluid</label>
              <select
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalAmnioticFluid}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalAmnioticFluid",
                    e.target.value
                  )
                }
              >
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="oligohydramnios">Oligohydramnios</option>
                <option value="polyhydramnios">Polyhydramnios</option>
              </select>
            </div>
            {/* Ultrasound Findings */}
            <div>
              <label className="block mb-1">Ultrasound Findings</label>
              <input
                type="text"
                placeholder="e.g., placenta anterior"
                className="border p-2 w-full rounded"
                value={formData.prenatal.fetalHealth.prenatalUltrasoundFindings}
                onChange={e =>
                  handleInputChange(
                    "prenatal",
                    "fetalHealth",
                    "prenatalUltrasoundFindings",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* ─── Assessment & Recommendations Card ─── */}
        {!isStaff && (
          <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow">
            <label className="block font-semibold mb-2 text-pink-700">Assessment</label>
            <textarea
              className="border p-2 w-full rounded h-24 mb-4"
              placeholder="Clinical summary..."
              value={formData.prenatal.prenatalAssessment}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  prenatal: {
                    ...prev.prenatal,
                    prenatalAssessment: e.target.value
                  }
                }))
              }
            />

            <label className="block font-semibold mb-2 text-pink-700">Recommendations</label>
            <textarea
              className="border p-2 w-full rounded h-24"
              placeholder="Care plan & next steps..."
              value={formData.prenatal.prenatalRecommendations}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  prenatal: {
                    ...prev.prenatal,
                    prenatalRecommendations: e.target.value
                  }
                }))
              }
            />
            {/* ─── Back Button ─── */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setConsultationType(null)}
                className="bg-pink-400 text-white px-100 py-2 rounded hover:bg-pink-500 transition"
              >
              Back
            </button>
          </div>
          </div>
        )}
      </div>
    )}

            {/* Emergency OB Check-Up */}
            {consultationType === "emergency" && (
  <div className="space-y-6 w-full max-w-4xl">
    {/* ─── Reason Selector ─── */}
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-pink-700">
        Reason for Emergency
      </label>
      <select
        className="border rounded p-2 w-full"
        value={emergencyReason}
        onChange={e => setEmergencyReason(e.target.value)}
      >
        <option value="">Select…</option>
        <option value="bleeding">Bleeding</option>
        <option value="fever">Fever</option>
        <option value="other">Other</option>
      </select>
    </div>

    {/* ─── Vital Signs ─── */}
    <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
      <h3 className="text-pink-700 font-semibold mb-4">Vital Signs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["bloodPressure","Blood Pressure (mmHg)","e.g., 120/80"],
          ["heartRate","Heart Rate (bpm)","e.g., 110"],
          ["respiratoryRate","Respiratory Rate (breaths/min)","e.g., 20"],
          ["temperature","Temperature (°C)","e.g., 38.5"],
          ["oxygenSaturation","O₂ Sat (%)","e.g., 95"]
        ].map(([f,label,ph]) => (
          <div key={f}>
            <label className="block mb-1">{label}</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              placeholder={ph}
              value={formData.emergency.vitalSigns[f]}
              onChange={e =>
                handleInputChange("emergency","vitalSigns",f,e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </div>

    {/* ─── Fetal Monitoring ─── */}
    <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
      <h3 className="text-pink-700 font-semibold mb-4">Fetal Monitoring</h3>
      <label className="block mb-1">Fetal Heart Rate (bpm)</label>
      <input
        type="text"
        className="border rounded p-2 w-full"
        placeholder="e.g., 140"
        value={formData.emergency.fetalMonitoring.fetalHeartRate}
        onChange={e =>
          handleInputChange("emergency","fetalMonitoring","fetalHeartRate",e.target.value)
        }
      />
    </div>

    {/* ─── Bleeding & Other ─── */}
    {(emergencyReason === "bleeding" || emergencyReason === "other") && (
      <>
        {/* Core Labs */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">Core Labs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["hemoglobin","Hemoglobin (g/dL)","e.g., 12.5"],
              ["hematocrit","Hematocrit (%)","e.g., 37"],
              ["whiteCellCount","WBC (cells/µL)","e.g., 8,000"],
              ["platelets","Platelets (cells/µL)","e.g., 250,000"],
              ["PT","PT (s)","e.g., 12"],
              ["aPTT","aPTT (s)","e.g., 30"],
              ["fibrinogen","Fibrinogen (mg/dL)","e.g., 300"]
            ].map(([f,label,ph]) => (
              <div key={f}>
                <label className="block mb-1">{label}</label>
                <input
                  type="text"
                  className="border rounded p-2 w-full"
                  placeholder={ph}
                  value={formData.emergency.labs[f]}
                  onChange={e =>
                    handleInputChange("emergency","labs",f,e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Type & Screen */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">Type &amp; Screen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Blood Type</label>
              <select
                className="border rounded p-2 w-full"
                value={formData.emergency.typeAndScreen.bloodType}
                onChange={e =>
                  handleInputChange("emergency","typeAndScreen","bloodType",e.target.value)
                }
              >
                <option value="">Select…</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Rh Status</label>
              <select
                className="border rounded p-2 w-full"
                value={formData.emergency.typeAndScreen.rhStatus}
                onChange={e =>
                  handleInputChange("emergency","typeAndScreen","rhStatus",e.target.value)
                }
              >
                <option value="">Select…</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Antibody Screen</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="e.g., anti-D"
                value={formData.emergency.typeAndScreen.antibodyScreen}
                onChange={e =>
                  handleInputChange("emergency","typeAndScreen","antibodyScreen",e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Blood Cultures & Ultrasound */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">
            Blood Cultures &amp; Ultrasound
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Blood Cultures Drawn?</label>
              <select
                className="border rounded p-2 w-full"
                value={formData.emergency.bloodCultures}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    emergency: {
                      ...prev.emergency,
                      bloodCultures: e.target.value
                    }
                  }))
                }
              >
                <option value="">Select…</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Ultrasound Findings</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="e.g., abruption"
                value={formData.emergency.ultrasoundFindings}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    emergency: {
                      ...prev.emergency,
                      ultrasoundFindings: e.target.value
                    }
                  }))
                }
              />
            </div>
          </div>
        </div>
      </>
    )}

    {/* ─── Fever Only ─── */}
    {emergencyReason === "fever" && (
      <>
        {/* CBC (WBC) */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">CBC (WBC)</h3>
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="e.g., 12,000"
            value={formData.emergency.labs.whiteCellCount}
            onChange={e =>
              handleInputChange("emergency","labs","whiteCellCount",e.target.value)
            }
          />
        </div>

        {/* Blood Cultures */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">Blood Cultures</h3>
          <select
            className="border rounded p-2 w-full"
            value={formData.emergency.bloodCultures}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                emergency: {
                  ...prev.emergency,
                  bloodCultures: e.target.value
                }
              }))
            }
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Urinalysis */}
        <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
          <h3 className="text-pink-700 font-semibold mb-4">Urinalysis</h3>
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="e.g., nitrites, leukocytes"
            value={formData.emergency.urinalysis}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                emergency: {
                  ...prev.emergency,
                  urinalysis: e.target.value
                }
              }))
            }
          />
        </div>
      </>
    )}

    {/* ─── Assessment & Recommendations ─── */}
    {!isStaff && (
      <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded shadow mb-6">
        <h3 className="text-pink-700 font-semibold mb-4">
          Assessment &amp; Recommendations
        </h3>
        <label className="block mb-1">Assessment</label>
        <textarea
          className="border rounded p-2 w-full h-24 mb-4"
          placeholder="Clinical summary…"
          value={formData.emergency.emergencyAssessment}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              emergency: {
                ...prev.emergency,
                emergencyAssessment: e.target.value
              }
            }))
          }
        />
        <label className="block mb-1">Recommendations</label>
        <textarea
          className="border rounded p-2 w-full h-24"
          placeholder="Plan of care…"
          value={formData.emergency.emergencyRecommendations}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              emergency: {
                ...prev.emergency,
                emergencyRecommendations: e.target.value
              }
            }))
          }
        />

        {/* ─── Back Button ─── */}
    <div className="text-center mb-6">
      <button
        onClick={() => {
          setConsultationType(null);
          setEmergencyReason("");
        }}
        className="bg-pink-400 text-white px-100 py-2 rounded hover:bg-pink-500 transition"
      >
        Back
      </button>
    </div>
      </div>
    )}
  </div>
)}

            {/* Submit Button */}
            <button
            onClick={handleAddNote}
            disabled={loading}
            className="mt-6 bg-[#DA79B9] text-white px-6 py-3 rounded w-full max-w-3xl hover:bg-[#C064A0] transition"
          >
            {loading ? "Saving..." : `Save ${getTitleForConsultation()}`}
          </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AddConsultationNote;
