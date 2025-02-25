import React, { useState } from "react";
import Logo from "../assets/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 37.7749, // Default latitude
  lng: -122.4194, // Default longitude
};

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [availableDays, setAvailableDays] = useState("");
  const [consultationHours, setConsultationHours] = useState("");
  const [platform, setPlatform] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4", // Replace with your API key
    libraries: ["places"], // Load the Places library
  });

  const geocodeLatLng = async (latLng) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const placesService = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    try {
      const geocodeResponse = await geocoder.geocode({ location: latLng });
      const formattedAddress =
        geocodeResponse.results[0]?.formatted_address || "";

      const placesResponse = await new Promise((resolve, reject) => {
        placesService.nearbySearch(
          {
            location: latLng,
            radius: 100,
            type: "hospital",
          },
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
      !availableDays ||
      !consultationHours ||
      !platform ||
      !contactInfo ||
      !hospitalLocation ||
      !hospitalAddress
    ) {
      alert("Please fill in all fields and select a hospital location.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const consultantRef = doc(db, "consultants", user.uid);
      await setDoc(consultantRef, {
        userId: user.uid, // Add userId field
        email,
        username,
        name,
        photoUrl,
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
    <div className="w-full h-auto overflow-y py-25 px-8 flex flex-col  gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4] relative">
      <div className="w-full h-auto flex justify-center items-center">
        <div className="w-[300px] h-15 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl justify-center items-center flex">
          <div className="flex items-center justify-center">
            <img src={Logo} alt="React logo" width="50" height="50" />
            <label className="font-medium text-3xl font-mono">NeoCare</label>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-row gap-2">
        <div className="w-1/2 h-auto p-8 flex gap-2 flex-col">
          <label>Email</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Email"
            type="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Username</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Username"
            type="text"
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Name</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Name"
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
          <label>Photo URL</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Photo URL"
            type="text"
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <label>Password</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Confirm Password</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Confirm Password"
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label>Specialty</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter your Specialty"
            type="text"
            onChange={(e) => setSpecialty(e.target.value)}
          />

          <label>Available Days</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="e.g., Monday to Friday"
            type="text"
            onChange={(e) => setAvailableDays(e.target.value)}
          />
          <label>Consultation Hours</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="e.g., 9:00 AM to 5:00 PM"
            type="text"
            onChange={(e) => setConsultationHours(e.target.value)}
          />
          <label>Platform (In-person/Online)</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="e.g., In-person, Online, or Both"
            type="text"
            onChange={(e) => setPlatform(e.target.value)}
          />
          <label>Contact Information (Phone Number)</label>
          <input
            className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
            placeholder="Enter Phone Number"
            type="text"
            onChange={(e) => setContactInfo(e.target.value)}
          />
          <button
            onClick={register}
            className="w-full h-10 rounded-xl bg-[#6bc4c1] text-white font-medium text-xl mt-5 font-mono cursor-pointer duration-300 hover:bg-[#48817f]"
          >
            SIGN UP
          </button>
          <div className="flex-col flex justify-center items-center gap-5">
            <label>
              Already have an Account?{" "}
              <Link to="/" className="underline">
                Sign In!
              </Link>
            </label>
          </div>
        </div>

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
                Selected Location: Latitude: {hospitalLocation.lat}, Longitude:{" "}
                {hospitalLocation.lng}
              </p>
            )}
            {hospitalAddress && <p>Hospital Address: {hospitalAddress}</p>}

            <input
              type="text"
              placeholder="Hospital Name (auto-filled)"
              value={hospitalAddress}
              onChange={(e) => setHospitalAddress(e.target.value)}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;