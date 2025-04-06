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
  height: "500px",
};

// Set default center to Cebu, Philippines
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
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  // We'll store the URL here if the user provides one or uploads a file.
  const [photoUrl, setPhotoUrl] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [consultationHours, setConsultationHours] = useState([]);
  const [platform, setPlatform] = useState([]);
  const [contactInfo, setContactInfo] = useState("");
  // New state for the uploaded file
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4", // Replace with your API key
    libraries: ["places"],
  });

  const storage = getStorage();

  // Geocode the clicked location and search for a nearby hospital
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

  // Handler for file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhotoFile(e.target.files[0]);
    }
  };

  const register = async () => {
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Username:", username);
    console.log("Name:", name);
    console.log("Specialty:", specialty);
    console.log("Available Days:", availableDays);
    console.log("Consultation Hours:", consultationHours);
    console.log("Platform:", platform);
    console.log("Contact Info:", contactInfo);
    console.log("Hospital Location:", hospitalLocation);
    console.log("Hospital Address:", hospitalAddress);
    console.log("Confirm Password:", confirmPassword);
    console.log("Profile Photo File:", profilePhotoFile);

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (
      !email ||
      !password ||
      !username ||
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

      // If a file was uploaded, upload it to Firebase Storage and get the URL.
      let uploadedPhotoUrl = "";
      if (profilePhotoFile) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, profilePhotoFile);
        uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
      }
      // Save the consultant data with the uploaded photo URL (or blank if not provided)
      await setDoc(doc(db, "consultants", user.uid), {
        userId: user.uid,
        email,
        username,
        name,
        photoUrl: uploadedPhotoUrl, // Blank if no file was uploaded
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
    <div className="w-full h-auto overflow-y-auto py-25 px-8 flex flex-col gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4] relative">
      <div className="w-full h-auto flex justify-center items-center">
        <div className="w-[300px] h-15 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl flex justify-center items-center">
          <div className="flex items-center justify-center">
            <img src={Logo} alt="React logo" width="50" height="50" />
            <label className="font-medium text-3xl font-mono ml-2">NeoCare</label>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-row gap-2">
        {/* Left Side - Form Fields */}
        <div className="w-1/2 h-auto p-8 flex flex-col gap-4">
          <label>Email</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Username</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Username"
            type="text"
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Name</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Name"
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
          <label>Photo URL (optional)</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Photo URL or leave blank"
            type="text"
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <label>Or Upload Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <label>Password</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Confirm Password</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Confirm Password"
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label>Specialty</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter your Specialty"
            type="text"
            onChange={(e) => setSpecialty(e.target.value)}
          />
          {/* Available Days Checkboxes */}
          <label>Available Days</label>
          <div className="flex flex-wrap gap-4">
            {availableDaysOptions.map((day) => (
              <label key={day} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6bc4c1]"
                  checked={availableDays.includes(day)}
                  onChange={() => toggleCheckbox(day, availableDays, setAvailableDays)}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
          {/* Consultation Hours Checkboxes */}
          <label>Consultation Hours</label>
          <div className="flex flex-wrap gap-4">
            {consultationHoursOptions.map((hour) => (
              <label key={hour} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6bc4c1]"
                  checked={consultationHours.includes(hour)}
                  onChange={() => toggleCheckbox(hour, consultationHours, setConsultationHours)}
                />
                <span>{hour}</span>
              </label>
            ))}
          </div>
          {/* Platform Checkboxes */}
          <label>Platform</label>
          <div className="flex flex-wrap gap-4">
            {platformOptions.map((option) => (
              <label key={option} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6bc4c1]"
                  checked={platform.includes(option)}
                  onChange={() => toggleCheckbox(option, platform, setPlatform)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <label>Contact Information (Phone Number)</label>
          <input
            className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Phone Number"
            type="text"
            onChange={(e) => setContactInfo(e.target.value)}
          />
          <button
            type="button"
            onClick={register}
            className="w-full h-10 rounded-xl bg-[#6bc4c1] text-white font-medium text-xl mt-5 font-mono cursor-pointer duration-300 hover:bg-[#48817f]"
          >
            SIGN UP
          </button>
          <div className="flex flex-col justify-center items-center gap-5">
            <label>
              Already have an Account?{" "}
              <Link to="/" className="underline">
                Sign In!
              </Link>
            </label>
          </div>
        </div>
        {/* Right Side - Map */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="w-full">
            <label>Hospital Location</label>
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
              <p>Loading map...</p>
            )}
            {hospitalLocation && (
              <p>
                Selected Location: Latitude: {hospitalLocation.lat}, Longitude: {hospitalLocation.lng}
              </p>
            )}
            {hospitalAddress && <p>Hospital Address: {hospitalAddress}</p>}
            <input
              type="text"
              placeholder="Hospital Name (auto-filled)"
              value={hospitalAddress}
              onChange={(e) => setHospitalAddress(e.target.value)}
              readOnly
              className="w-full h-10 rounded-xl border border-[#6bc4c1] bg-white px-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
