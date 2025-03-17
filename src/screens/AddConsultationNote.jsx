import React, { useState } from "react";
import Header from "../components/Header";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../configs/firebase-config";
import { addDoc, collection } from "firebase/firestore";

const AddConsultationNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maternalHealth: {
      bloodPressure: "",
      weightGain: "",
      hemoglobin: "",
      uterineHeight: "",
      symptoms: "",
      urineAnalysis: "",
    },
    fetalHealth: {
      heartRate: "",
      movementFrequency: "",
      presentation: "",
      gestationalAge: "",
      amnioticFluid: "",
      ultrasoundFindings: "",
    },
    assessment: "",
    recommendations: "",
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAddNote = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "consultationNotes"), {
        clientId: id,
        ...formData,
        createdAt: new Date(),
      });
      navigate(`/clients/${id}`);
    } catch (error) {
      console.error("Error adding consultation note:", error);
    }
    setLoading(false);
  };

  return (
    <div className="w-auto overflow-y-auto relative">
      <Header />
      <div className="pt-24 w-full flex flex-col items-center bg-[#F5EFE8] min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">Prenatal Consultation Note</h1>
        
        <div className="w-full max-w-4xl space-y-8">
          {/* Maternal Health Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Maternal Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={formData.maternalHealth.bloodPressure}
                  onChange={(e) => handleInputChange('maternalHealth', 'bloodPressure', e.target.value)}
                  className="border rounded p-2 w-full"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block mb-2">Weight Gain (kg)</label>
                <input
                  type="number"
                  value={formData.maternalHealth.weightGain}
                  onChange={(e) => handleInputChange('maternalHealth', 'weightGain', e.target.value)}
                  className="border rounded p-2 w-full"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block mb-2">Hemoglobin (g/dL)</label>
                <input
                  type="number"
                  value={formData.maternalHealth.hemoglobin}
                  onChange={(e) => handleInputChange('maternalHealth', 'hemoglobin', e.target.value)}
                  className="border rounded p-2 w-full"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block mb-2">Uterine Height (cm)</label>
                <input
                  type="number"
                  value={formData.maternalHealth.uterineHeight}
                  onChange={(e) => handleInputChange('maternalHealth', 'uterineHeight', e.target.value)}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div>
                <label className="block mb-2">Urine Analysis</label>
                <select
                  value={formData.maternalHealth.urineAnalysis}
                  onChange={(e) => handleInputChange('maternalHealth', 'urineAnalysis', e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="">Select result</option>
                  <option value="normal">Normal</option>
                  <option value="proteinuria">Proteinuria</option>
                  <option value="glucosuria">Glucosuria</option>
                  <option value="infection">Infection</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Maternal Symptoms</label>
                <input
                  type="text"
                  value={formData.maternalHealth.symptoms}
                  onChange={(e) => handleInputChange('maternalHealth', 'symptoms', e.target.value)}
                  className="border rounded p-2 w-full"
                  placeholder="e.g., edema, headaches, visual disturbances"
                />
              </div>
            </div>
          </div>

          {/* Fetal Health Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Fetal Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Fetal Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formData.fetalHealth.heartRate}
                  onChange={(e) => handleInputChange('fetalHealth', 'heartRate', e.target.value)}
                  className="border rounded p-2 w-full"
                  min="100"
                  max="160"
                />
              </div>
              <div>
                <label className="block mb-2">Fetal Movements</label>
                <select
                  value={formData.fetalHealth.movementFrequency}
                  onChange={(e) => handleInputChange('fetalHealth', 'movementFrequency', e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="">Select frequency</option>
                  <option value="normal">Normal (≥10/day)</option>
                  <option value="reduced">Reduced</option>
                  <option value="excessive">Excessive</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Presentation</label>
                <select
                  value={formData.fetalHealth.presentation}
                  onChange={(e) => handleInputChange('fetalHealth', 'presentation', e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="">Select position</option>
                  <option value="cephalic">Cephalic</option>
                  <option value="breech">Breech</option>
                  <option value="transverse">Transverse</option>
                  <option value="unstable">Unstable</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Gestational Age</label>
                <input
                  type="text"
                  value={formData.fetalHealth.gestationalAge}
                  onChange={(e) => handleInputChange('fetalHealth', 'gestationalAge', e.target.value)}
                  className="border rounded p-2 w-full"
                  placeholder="e.g., 28+3 weeks"
                />
              </div>
              <div>
                <label className="block mb-2">Amniotic Fluid</label>
                <select
                  value={formData.fetalHealth.amnioticFluid}
                  onChange={(e) => handleInputChange('fetalHealth', 'amnioticFluid', e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="">Select volume</option>
                  <option value="normal">Normal</option>
                  <option value="oligohydramnios">Oligohydramnios</option>
                  <option value="polyhydramnios">Polyhydramnios</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Ultrasound Findings</label>
                <input
                  type="text"
                  value={formData.fetalHealth.ultrasoundFindings}
                  onChange={(e) => handleInputChange('fetalHealth', 'ultrasoundFindings', e.target.value)}
                  className="border rounded p-2 w-full"
                  placeholder="e.g., placental location, growth parameters"
                />
              </div>
            </div>
          </div>

          {/* Assessment & Recommendations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Clinical Evaluation</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Prenatal Assessment</label>
                <textarea
                  value={formData.assessment}
                  onChange={(e) => setFormData(prev => ({...prev, assessment: e.target.value}))}
                  className="border rounded p-2 w-full h-32"
                  placeholder="Overall pregnancy assessment, risk factors, concerns..."
                />
              </div>
              <div>
                <label className="block mb-2">Care Recommendations</label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({...prev, recommendations: e.target.value}))}
                  className="border rounded p-2 w-full h-32"
                  placeholder="Prenatal care plan, lifestyle advice, follow-up schedule..."
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAddNote}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 w-full"
          >
            {loading ? "Saving..." : "Save Prenatal Consultation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddConsultationNote;