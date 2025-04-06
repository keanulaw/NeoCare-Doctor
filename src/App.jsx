import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "./App.css";
import LandingPage from "./screens/LandingPage";
import Dashboard from "./screens/Dashboard";
import Forum from "./screens/Forum";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Requests from "./screens/Requests";
import ChatPage from "./screens/ChatPage";
import ChatComponent from "./components/ChatComponent";
import { auth } from "./configs/firebase-config";
import Clients from "./screens/Clients";
import AddConsultationNote from "./screens/AddConsultationNote";
import ClientDetails from "./screens/ClientDetails";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/register" element={<Register />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/chat" element={currentUser ? <ChatPage /> : <Navigate to="/" replace />} />
        <Route path="/chat/:chatId" element={currentUser ? <ChatComponent /> : <Navigate to="/" replace />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/add-consultation-note/:id" element={<AddConsultationNote />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
