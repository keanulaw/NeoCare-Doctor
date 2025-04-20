import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

/* screens */
import LandingPage         from "./screens/LandingPage";
import Dashboard           from "./screens/Dashboard";
import Forum               from "./screens/Forum";
import Login               from "./screens/Login";
import Register            from "./screens/Register";
import Requests            from "./screens/Requests";
import Clients             from "./screens/Clients";
import ChatPage            from "./screens/ChatPage";
import ChatComponent       from "./components/ChatComponent";
import AddConsultationNote from "./screens/AddConsultationNote";
import ClientDetails       from "./screens/ClientDetails";
import Profile             from "./screens/Profile";      // ← NEW

/* firebase */
import { auth } from "./configs/firebase-config";

/* optional: global header */
/* import Header from "./components/Header"; */

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setCurrentUser);
    return unsub;
  }, []);

  /* helper to protect routes */
  const Private = (child) =>
    currentUser ? child : <Navigate to="/" replace />;

  return (
    <Router>
      {/* <Header /> */}{/* ← uncomment if you want one global header */}
      <Routes>
        {/* public */}
        <Route path="/"           element={<Login />} />
        <Route path="/register"   element={<Register />} />

        {/* un‑protected (but normally reached after login) */}
        <Route path="/landing"    element={<LandingPage />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/forum"      element={<Forum />} />
        <Route path="/requests"   element={<Requests />} />
        <Route path="/clients"    element={<Clients />} />
        <Route path="/clients/add-consultation-note/:id" element={<AddConsultationNote />} />
        <Route path="/clients/:id"                        element={<ClientDetails />} />

        {/* protected routes */}
        <Route path="/chat"        element={Private(<ChatPage />)} />
        <Route path="/chat/:chatId"element={Private(<ChatComponent />)} />
        <Route path="/profile"     element={Private(<Profile />)} /> {/* ← NEW */}
      </Routes>
    </Router>
  );
}

export default App;
