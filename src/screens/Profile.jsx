/* src/screens/Profile.jsx */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs
} from "firebase/firestore";
import {
  GoogleMap, Marker, useLoadScript,
  Autocomplete, InfoWindow
} from "@react-google-maps/api";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db } from "../configs/firebase-config";
import Header from "../components/Header";
import Logo from "../assets/Logo.png";

/* ───── constants ───── */
const customMapStyles = [ /* same snazzy map styles as Register */ ];
const mapStyle = { width: "100%", height: "300px" };
const center = { lat: 10.3157, lng: 123.8854 };

const daysOpt  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const hrsOpt   = [
  "8:00 AM to 9:00 AM","9:00 AM to 10:00 AM","10:00 AM to 11:00 AM","11:00 AM to 12:00 PM",
  "12:00 PM to 1:00 PM","1:00 PM to 2:00 PM","2:00 PM to 3:00 PM","3:00 PM to 4:00 PM","4:00 PM to 5:00 PM",
];
const platOpt  = ["In-person", "Online"];

/* ───── utils ───── */
const toRad = d => d*Math.PI/180;
const distKm = (a,b)=>{
  const R=6371,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng);
  const lat1=toRad(a.lat),lat2=toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2*Math.cos(lat1)*Math.cos(lat2);
  return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
};

/* ───── main component ───── */
const Profile = () => {
  /* firestore + auth */
  const user = auth.currentUser;
  const nav  = useNavigate();

  /* state */
  const [docId, setDocId] = useState("");
  const [loading, setLoading] = useState(true);

  const [email, setEmail]                 = useState("");
  const [name, setName]                   = useState("");
  const [specialty, setSpecialty]         = useState("");
  const [contactInfo, setContactInfo]     = useState("");
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [hospitalAddress, setHospitalAddress]   = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [consultationHours, setConsultationHours] = useState([]);
  const [platform, setPlatform]           = useState([]);
  const [photoUrl, setPhotoUrl]           = useState("");
  const [newPhotoFile, setNewPhotoFile]   = useState(null);
  const [previewImg, setPreviewImg]       = useState(null);

  /* map helpers */
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [autocomplete, setAutocomplete]     = useState(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBcJDGxtpPyKTJaH8VsPdWq3RkohUNkfd4", libraries: ["places"],
  });

  /* ─── fetch consultant info ─── */
  useEffect(()=>{
    if(!user){ nav("/"); return; }
    const load = async()=>{
      const snap = await getDoc(doc(db,"consultants",user.uid));
      if(!snap.exists()){ alert("Consultant profile not found."); return; }
      const d = snap.data();
      setDocId(snap.id);
      setEmail(d.email || "");
      setName(d.name || "");
      setSpecialty(d.specialty || "");
      setContactInfo(d.contactInfo || "");
      setAvailableDays(d.availableDays||[]);
      setConsultationHours(d.consultationHours||[]);
      setPlatform(d.platform||[]);
      setHospitalLocation(d.hospitalLocation||null);
      setHospitalAddress(d.hospitalAddress||"");
      setPhotoUrl(d.profilePhoto||"");
      setLoading(false);
    };
    load();
  },[user,nav]);

  /* ─── checkbox toggler ─── */
  const toggle = (val, arr, setArr) =>
    setArr(arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]);

  /* ─── map handlers ─── */
  const onMapClick = e =>{
    const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setHospitalLocation(loc); setSelectedMarker(loc);
    revGeo(loc);
  };
  const onAutoLoad = a => setAutocomplete(a);
  const onPlaceChanged = ()=>{
    if(!autocomplete) return;
    const plc = autocomplete.getPlace();
    if(plc.geometry){
      const loc={lat:plc.geometry.location.lat(),lng:plc.geometry.location.lng()};
      setHospitalLocation(loc); setSelectedMarker(loc);
      setHospitalAddress(plc.formatted_address||plc.name);
    }
  };
  /* quick reverse‑geocode using Maps JS API */
  const revGeo = async loc=>{
    if(!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    const [geo] = await geocoder.geocode({ location: loc });
    setHospitalAddress(geo?.formatted_address||"");
  };

  /* ─── update profile ─── */
  const saveProfile = async()=>{
    try{
      let pic = photoUrl;
      if(newPhotoFile){
        const st = getStorage();
        const snap = await uploadBytes(ref(st,`profilePhotos/${user.uid}`),newPhotoFile);
        pic = await getDownloadURL(snap.ref);
      }
      /* optional: match clinic again if location changed */
      let clinicId = undefined;
      if(hospitalLocation){
        const q = query(collection(db,"users"),where("role","==","clinic"));
        const ss = await getDocs(q);
        ss.forEach(c=>{
          if(!clinicId && c.data().location){
            if(distKm(hospitalLocation,c.data().location)<1) clinicId=c.id;
          }
        });
      }

      await updateDoc(doc(db,"consultants",docId),{
        name,specialty,contactInfo,
        availableDays,consultationHours,platform,
        hospitalLocation,hospitalAddress,
        profilePhoto:pic,
        ...(clinicId && {clinicId})
      });
      alert("Profile updated!");
    }catch(e){ console.error(e); alert("Update failed."); }
  };

  if(loading){
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xl text-gray-600">Loading profile…</span>
        </div>
      </div>
    );
  }

  /* ─── UI ─── */
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-[#F2C2DE] flex flex-col">
      <Header />

      {/* logo+title bar (reuse Register’s style) */}
      <div className="flex items-center justify-center mt-8 mb-6">
        <img src={Logo} alt="NeoCare" className="w-16 h-16" />
        <span className="ml-3 text-4xl font-extrabold font-mono text-[#DA79B9]">NeoCare</span>
      </div>

      <main className="flex-1 flex justify-center px-4 pb-10">
        <div className="bg-white shadow-lg rounded-xl w-full max-w-5xl overflow-hidden md:flex">
          {/* LEFT – editable form */}
          <div className="md:w-1/2 p-8 space-y-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>

            {/* core fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800">Email</label>
                <input value={email} disabled
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Name</label>
                <input value={name}
                  onChange={e=>setName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:ring-2 focus:ring-[#DA79B9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Specialty</label>
                <input value={specialty}
                  onChange={e=>setSpecialty(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:ring-2 focus:ring-[#DA79B9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Profile Photo</label>
                <input type="file" accept="image/*" onChange={e=>{
                  const f=e.target.files?.[0]; if(f){ setNewPhotoFile(f); setPreviewImg(URL.createObjectURL(f));}
                }} />
                {(previewImg||photoUrl) && (
                  <img src={previewImg||photoUrl} alt="Preview"
                       className="mt-2 w-24 h-24 object-cover rounded-full border" />
                )}
              </div>
            </div>

            {/* contact */}
            <div>
              <label className="block text-sm font-medium text-gray-800">Phone Number</label>
              <input value={contactInfo}
                onChange={e=>setContactInfo(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 focus:ring-2 focus:ring-[#DA79B9]" />
            </div>

            <hr className="border-gray-200" />
            <h3 className="text-lg font-semibold text-gray-800">Consultation Details</h3>

            {/* checkboxes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800">Available Days</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {daysOpt.map(d=>(
                    <label key={d} className="flex items-center space-x-2">
                      <input type="checkbox"
                        className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                        checked={availableDays.includes(d)}
                        onChange={()=>toggle(d,availableDays,setAvailableDays)} />
                      <span className="text-sm text-gray-800">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Consultation Hours</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hrsOpt.map(h=>(
                    <label key={h} className="flex items-center space-x-2">
                      <input type="checkbox"
                        className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                        checked={consultationHours.includes(h)}
                        onChange={()=>toggle(h,consultationHours,setConsultationHours)} />
                      <span className="text-sm text-gray-800">{h}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Platform</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {platOpt.map(p=>(
                    <label key={p} className="flex items-center space-x-2">
                      <input type="checkbox"
                        className="h-5 w-5 text-[#DA79B9] border-gray-300 rounded"
                        checked={platform.includes(p)}
                        onChange={()=>toggle(p,platform,setPlatform)} />
                      <span className="text-sm text-gray-800">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              className="w-full py-3 bg-[#DA79B9] text-white font-medium text-xl font-mono rounded-xl hover:bg-[#C064A0] transition-colors"
            >
              Save Changes
            </button>
          </div>

          {/* RIGHT – map picker */}
          <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Hospital Location</h3>

            {isLoaded ? (
              <>
                <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                  <input
                    placeholder="Search hospital"
                    className="w-full mb-4 rounded-xl border border-[#DA79B9] px-4 py-2 focus:ring-2 focus:ring-[#DA79B9]"
                  />
                </Autocomplete>

                <GoogleMap
                  mapContainerStyle={mapStyle}
                  zoom={12}
                  center={hospitalLocation||center}
                  onClick={onMapClick}
                  options={{ styles: customMapStyles }}
                >
                  {hospitalLocation && (
                    <Marker position={hospitalLocation} onClick={()=>setSelectedMarker(hospitalLocation)} />
                  )}
                  {selectedMarker && (
                    <InfoWindow position={selectedMarker} onCloseClick={()=>setSelectedMarker(null)}>
                      <div>
                        <h4 className="font-medium text-gray-800">Selected</h4>
                        <p className="text-sm text-gray-800">{hospitalAddress}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>

                {hospitalAddress && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-800">Address</label>
                    <input readOnly value={hospitalAddress}
                      className="mt-1 block w-full rounded-xl border border-[#DA79B9] px-4 py-2 bg-gray-100" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-800">Loading map…</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
