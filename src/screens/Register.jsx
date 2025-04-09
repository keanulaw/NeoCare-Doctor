import React, { useState } from "react";
import Logo from "../assets/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const center = {
  lat: 10.3157,
  lng: 123.8854,
};

const availableDaysOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const consultationHoursOptions = [
  "8:00 AM to 9:00 AM",
  "9:00 AM to 10:00 AM",
  "10:00 AM to 11:00 AM",
  "11:00 AM to 12:00 PM",
  "12:00 PM to 1:00 PM",
  "1:00 PM to 2:00 PM",
  "2:00 PM to 3:00 PM",
  "3:00 PM to 4:00 PM",
  "4:00 PM to 5:00 PM",
];

const platformOptions = ["In-person", "Online"];

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [consultationHours, setConsultationHours] = useState([]);
  const [platform, setPlatform] = useState([]);
  const [contactInfo, setContactInfo] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4", // Replace with your API key
    libraries: ["places"],
  });

  const storage = getStorage();

  // Geocode the clicked location and fetch nearby hospital details
  const geocodeLatLng = async (latLng) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
    try {
      const geocodeResponse = await geocoder.geocode({ location: latLng });
      const formattedAddress = geocodeResponse.results[0]?.formatted_address || "";
      const placesResponse = await new Promise((resolve, reject) => {
        placesService.nearbySearch(
          { location: latLng, radius: 100, type: "hospital" },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results);
            } else {
              reject(status);
            }
          }
        );
      });
      if (placesResponse.length > 0) {
        const hospitalName = placesResponse[0].name;
        setHospitalAddress(hospitalName);
      } else {
        setHospitalAddress(formattedAddress);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error fetching hospital details.");
    }
  };

  const handleMapClick = (event) => {
    const latLng = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setHospitalLocation(latLng);
    geocodeLatLng(latLng);
    console.log("Hospital Location Set:", latLng);
  };

  const toggleCheckbox = (value, currentArray, setArray) => {
    if (currentArray.includes(value)) {
      setArray(currentArray.filter((item) => item !== value));
    } else {
      setArray([...currentArray, value]);
    }
  };

  // Handle profile photo file selection and set image preview
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhotoFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const register = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (
      !email ||
      !password ||
      !name ||
      !specialty ||
      availableDays.length === 0 ||
      consultationHours.length === 0 ||
      platform.length === 0 ||
      !contactInfo ||
      !hospitalLocation ||
      !hospitalAddress
    ) {
      alert("Please fill in all fields and select a hospital location.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let uploadedPhotoUrl = "";
      if (profilePhotoFile) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, profilePhotoFile);
        uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
      }
      await setDoc(doc(db, "consultants", user.uid), {
        userId: user.uid,
        email,
        name,
        specialty,
        hospitalLocation,
        hospitalAddress,
        availableDays,
        consultationHours,
        platform,
        contactInfo,
      });

      alert("Registration successful!");
      navigate("/");
    } catch (error) {
      console.error("Error signing up:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EFE8] to-[#d5e8d4] flex flex-col items-center py-10">
      {/* Header */}
      <div className="mb-8">
        <Link to="/">
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="NeoCare Logo" className="w-16 h-16" />
            <span className="text-4xl font-bold text-gray-800">NeoCare</span>
          </div>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl overflow-hidden md:flex">
        {/* Left Side - Registration Form */}
        <div className="md:w-1/2 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-700">Register as a Consultant</h2>
          
          {/* Account Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Enter Email"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <input
                type="text"
                placeholder="Enter Name"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Specialty</label>
              <input
                type="text"
                placeholder="Enter your Specialty"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Upload Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full"
                onChange={handleFileChange}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="mt-2 w-20 h-20 object-cover rounded-full border"
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="Enter Password"
                  className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Contact Information (Phone Number)</label>
              <input
                type="text"
                placeholder="Enter Phone Number"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:border-[#6bc4c1] focus:ring focus:ring-[#6bc4c1] focus:ring-opacity-50"
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Consultation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Consultation Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600">Available Days</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {availableDaysOptions.map((day) => (
                  <label key={day} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-[#6bc4c1] border-gray-300 rounded"
                      checked={availableDays.includes(day)}
                      onChange={() => toggleCheckbox(day, availableDays, setAvailableDays)}
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Consultation Hours</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {consultationHoursOptions.map((hour) => (
                  <label key={hour} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-[#6bc4c1] border-gray-300 rounded"
                      checked={consultationHours.includes(hour)}
                      onChange={() => toggleCheckbox(hour, consultationHours, setConsultationHours)}
                    />
                    <span className="text-sm text-gray-700">{hour}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Platform</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {platformOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-[#6bc4c1] border-gray-300 rounded"
                      checked={platform.includes(option)}
                      onChange={() => toggleCheckbox(option, platform, setPlatform)}
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={register}
            className="w-full py-3 mt-6 bg-[#6bc4c1] text-white font-semibold rounded-md hover:bg-[#48817f] transition-colors"
          >
            Sign Up
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/" className="underline text-[#6bc4c1] hover:text-[#48817f]">
              Sign In!
            </Link>
          </p>
        </div>

        {/* Right Side - Map for Hospital Location */}
        <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 p-8 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Hospital Location</h3>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={10}
              center={center}
              onClick={handleMapClick}
            >
              {hospitalLocation && <Marker position={hospitalLocation} />}
            </GoogleMap>
          ) : (
            <p className="text-gray-600">Loading map...</p>
          )}
          {hospitalLocation && (
            <div className="mt-4">
              <p className="text-sm text-gray-700">
                Selected Location: Latitude: {hospitalLocation.lat}, Longitude: {hospitalLocation.lng}
              </p>
            </div>
          )}
          {hospitalAddress && (
            <div className="mt-2">
              <p className="text-sm text-gray-700">Hospital Address:</p>
              <input
                type="text"
                value={hospitalAddress}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 p-2 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
