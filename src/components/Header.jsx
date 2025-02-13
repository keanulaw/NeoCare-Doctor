import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Header = () => {
  return (
    <div className="absolute hidden w-[950px] h-20 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl md:transform md:translate-x-1/2 top-6 justify-center items-center md:flex">
      <div className="flex ms-14 items-center justify-center">
        <img src={Logo} alt="React logo" width="50" height="50" />
        <label className="font-medium text-3xl font-mono">NeoCare</label>
      </div>
      <div className="w-full gap-12 flex px-20">
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
      </div>
    </div>
  );
};

export default Header; 