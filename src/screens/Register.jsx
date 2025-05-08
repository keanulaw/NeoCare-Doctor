import React, { useState, useRef } from "react";
import Logo from "../assets/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Autocomplete,
  InfoWindow,
} from "@react-google-maps/api";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Sample custom map styles
const customMapStyles = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#193341" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#2c5a71" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#29768a" }, { lightness: 0 }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#406d80" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#406d80" }] },
  { elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#3e606f" }, { weight: 2 }, { gamma: 0.84 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
];

const mapContainerStyle = { width: "100%", height: "300px" };
const center = { lat: 10.3157, lng: 123.8854 };

const availableDaysOptions = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const consultationHoursOptions = [
  "8:00 AM to 9:00 AM","9:00 AM to 10:00 AM","10:00 AM to 11:00 AM","11:00 AM to 12:00 PM",
  "12:00 PM to 1:00 PM","1:00 PM to 2:00 PM","2:00 PM to 3:00 PM","3:00 PM to 4:00 PM","4:00 PM to 5:00 PM"
];
const platformOptions = ["In-person", "Online"];

function toRad(deg) { return deg * Math.PI / 180; }
function calculateDistance(loc1, loc2) {
  const R = 6371;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const lat1 = toRad(loc1.lat), lat2 = toRad(loc2.lat);
  const a = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1)*Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// lookup by name instead of address
const findMatchingClinicByName = async (name) => {
  const clinicsRef = collection(db, "users");
  const q = query(
    clinicsRef,
    where("role", "==", "clinic"),
    where("birthCenterName", "==", name)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, data: docSnap.data() };
};

const Register = () => {
  // Account info
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName]                 = useState("");
  const [specialty, setSpecialty]       = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [consultationHours, setConsultationHours] = useState([]);
  const [platform, setPlatform]         = useState([]);
  const [contactInfo, setContactInfo]   = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ◀︎ Replaced fields:
  const [birthCenterLocation, setBirthCenterLocation] = useState(null);
  const [birthCenterName, setBirthCenterName]         = useState("");
  const [birthCenterAddress, setBirthCenterAddress]   = useState("");

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [autocomplete, setAutocomplete]     = useState(null);
  const navigate = useNavigate();
  const storage  = getStorage();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4",
    libraries: ["places"],
  });

  // geocode sets both name & address
  const geocodeLatLng = async (latLng) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    const service  = new window.google.maps.places.PlacesService(document.createElement("div"));

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const formatted = results[0].formatted_address;
        service.nearbySearch(
          { location: latLng, radius: 500, type: "hospital" },
          (placesResults, placesStatus) => {
            const name = (placesStatus === window.google.maps.places.PlacesServiceStatus.OK && placesResults[0])
              ? placesResults[0].name
              : formatted;
            setBirthCenterName(name);
            setBirthCenterAddress(name);
          }
        );
      }
    });
  };

  const handleMapClick = (e) => {
    const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setBirthCenterLocation(loc);
    setSelectedMarker(loc);
    geocodeLatLng(loc);
  };

  const onLoad = (auto) => setAutocomplete(auto);
  const onPlaceChanged = () => {
    if (!autocomplete) return console.log("Autocomplete not loaded");
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const loc = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setBirthCenterLocation(loc);
      setSelectedMarker(loc);
      // prefer the place's name:
      const display = place.name || place.formatted_address;
      setBirthCenterName(display);
      setBirthCenterAddress(display);
    }
  };

  const toggleCheckbox = (val, arr, setArr) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const register = async () => {
    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }
    if (
      !email || !password ||
      !name || !specialty ||
      !availableDays.length ||
      !consultationHours.length ||
      !platform.length ||
      !contactInfo ||
      !birthCenterLocation ||
      !birthCenterAddress
    ) {
      return alert("Please fill all fields and select your birth center.");
    }

    try {
      // create auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // upload photo if any
      let photoUrl = "";
      if (profilePhotoFile) {
        const snap = await uploadBytes(
          ref(storage, `profilePhotos/${user.uid}`),
          profilePhotoFile
        );
        photoUrl = await getDownloadURL(snap.ref);
      }

      // lookup clinic by name/address
      const clinic = await findMatchingClinicByName(
        birthCenterName,
        birthCenterAddress
      );
      if (!clinic) {
        return alert("No clinic found. Make sure your map selection matches a registered clinic.");
      }

      // write consultant profile
      await setDoc(doc(db, "consultants", user.uid), {
        userId: user.uid,
        email,
        name,
        specialty,
        contactInfo,
        profilePhoto: photoUrl,
        birthCenterName,
        birthCenterAddress,
        birthCenterLocation,
        availableDays,
        consultationHours,
        platform,
        approvalStatus: "pending",
        clinicId: clinic.id,
      });

      alert("Registration successful! Await clinic approval.");
      navigate("/");
    } catch (e) {
      console.error("Error signing up:", e);
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-white to-[#F2C2DE] p-4">
      {/* Header */}
      <div className="mb-8">
        <Link to="/">
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="NeoCare Logo" className="w-16 h-16" />
            <span className="text-4xl font-extrabold font-mono text-[#DA79B9]">
              NeoCare
            </span>
          </div>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white shadow-lg rounded-xl w-full max-w-5xl overflow-hidden md:flex">
        {/* Left Side – Form */}
        <div className="md:w-1/2 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Register as a Consultant</h2>
          {/* Account Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">Email</label>
              <input
                type="email" placeholder="Enter Email"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800">Name</label>
              <input
                type="text" placeholder="Enter Name"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800">Specialty</label>
              <input
                type="text" placeholder="Enter Specialty"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setSpecialty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800">Upload Profile Photo</label>
              <input
                type="file" accept="image/*"
                className="mt-1 block w-full"
                onChange={handleFileChange}
              />
              {previewImage && (
                <img src={previewImage} alt="Preview"
                  className="mt-2 w-24 h-24 object-cover rounded-full border" />
              )}
            </div>
          </div>

          {/* Passwords & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">Password</label>
              <input
                type="password" placeholder="Enter Password"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800">Confirm Password</label>
              <input
                type="password" placeholder="Confirm Password"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Phone Number</label>
            <input
              type="text" placeholder="Enter Phone Number"
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
                onChange={e => setContactInfo(e.target.value)}
            />
          </div>

          <hr className="border-gray-200" />
          <h3 className="text-lg font-semibold text-gray-800">Consultation Details</h3>
          <div className="space-y-4">
            {/* Available Days */}
            <div>
              <label className="block text-sm font-medium text-gray-800">Available Days</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableDaysOptions.map(day => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                      checked={availableDays.includes(day)}
                      onChange={() => toggleCheckbox(day, availableDays, setAvailableDays)}
                    />
                    <span className="text-sm text-gray-800">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Consultation Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-800">Consultation Hours</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {consultationHoursOptions.map(hour => (
                  <label key={hour} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                      checked={consultationHours.includes(hour)}
                      onChange={() => toggleCheckbox(hour, consultationHours, setConsultationHours)}
                    />
                    <span className="text-sm text-gray-800">{hour}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-800">Platform</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {platformOptions.map(opt => (
                  <label key={opt} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                      checked={platform.includes(opt)}
                      onChange={() => toggleCheckbox(opt, platform, setPlatform)}
                    />
                    <span className="text-sm text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={register}
            className="w-full py-3 mt-6 bg-[#DA79B9] text-white font-medium text-xl font-mono rounded-xl hover:bg-[#C064A0] transition-colors"
          >
            Sign Up
          </button>

          <p className="text-center text-sm text-gray-800">
            Already have an account?{" "}
            <Link to="/" className="underline text-[#DA79B9]">Sign In!</Link>
          </p>
        </div>

        {/* Right Side – Birth Center Map Picker */}
        <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Birth Center Location</h3>

          {isLoaded ? (
            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
              <input
                type="text"
                placeholder="Search for birth center"
                className="w-full mb-4 rounded-xl border border-[#DA79B9] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#DA79B9]"
              />
            </Autocomplete>
          ) : (
            <p className="text-gray-800">Loading map...</p>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={12}
              center={birthCenterLocation || center}
              onClick={handleMapClick}
              options={{ styles: customMapStyles }}
            >
              {birthCenterLocation && (
                <Marker
                  position={birthCenterLocation}
                  draggable
                  onDragEnd={handleMapClick}
                />
              )}
              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <p className="font-medium">{birthCenterName}</p>
                    <p className="text-sm">{birthCenterAddress}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Persistent display under map */}
          {birthCenterName && (
            <p className="mt-4 text-sm text-gray-700">
              <strong>Selected Center:</strong> {birthCenterName}
            </p>
          )}
          {birthCenterAddress && (
            <p className="text-sm text-gray-700">
              <strong>Address:</strong> {birthCenterAddress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
