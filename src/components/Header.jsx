import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { auth } from '../configs/firebase-config';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/');
    });
  };

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-[1200px] h-20 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl flex justify-center items-center">
      <div className="flex items-center justify-center">
        <img src={Logo} alt="React logo" width="50" height="50" />
      </div>
      <div className="w-full gap-12 flex px-20 justify-center">
        <Link className="font-medium text-xl font-mono" to="/dashboard">
          Dashboard
        </Link>
        <Link className="font-medium text-xl font-mono" to="/clients">
          Clients
        </Link>
        <Link className="font-medium text-xl font-mono" to="/requests">
          Requests
        </Link>
        <Link className="font-medium text-xl font-mono" to="/forum">
          Forum
        </Link>
        <Link className="font-medium text-xl font-mono" to="/profile">
          Profile
        </Link>
        <Link className="font-medium text-xl font-mono" to="/chat">
          Chat
        </Link>
        <button className="font-medium text-xl font-mono" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header; 