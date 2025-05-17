import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-v_mJdtVPXtHzZDabFUsKKOI_B_zrrdA",
  authDomain: "neocare-2434d.firebaseapp.com",
  projectId: "neocare-2434d",
  storageBucket: "neocare-2434d.firebasestorage.app",
  messagingSenderId: "398145643581",
  appId: "1:398145643581:web:24a113975ee6c198d9b654",
  measurementId: "G-BNZ2F5S6S4",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Set persistence across reloads
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to local");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// ✅ Export for app-wide use
export { auth, db };
