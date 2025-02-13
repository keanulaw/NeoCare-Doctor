import { useState } from "react";
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
import ChatComponent from "./components/ChatComponent";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/register" element={<Register />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/chat/:consultantId" element={<ChatComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
