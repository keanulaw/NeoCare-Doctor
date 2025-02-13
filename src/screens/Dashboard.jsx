import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Dashboard = () => {
  return (
    <div className="w-auto overflow-y-auto relative">
      {/*Header*/}
      <div className="absolute hidden w-[950px] h-20 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl md:transform md:translate-x-1/2 top-6 justify-center items-center md:flex">
        <div className="flex ms-14 items-center justify-center">
          <img src={Logo} alt="React logo" width="50" height="50" />
          <Link to="/landing" className="font-medium text-3xl font-mono">
            NeoCare
          </Link>
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

      <div className="absolute flex md:hidden flex-col gap-1 top-4 left-4">
        <div className="w-10 border-2 border-black"></div>
        <div className="w-10 border-2 border-black"></div>
        <div className="w-10 border-2 border-black"></div>
        <div className="w-10 border-2 border-black"></div>
      </div>

      {/*Dashboard Layer*/}
      <div className="w-full h-auto pt-80 pb-20 flex flex-col overflow-y-auto justify-center items-center gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4]">
        <div className="flex flex-col justify-center items-center gap-3">
          <label className="font-bold text-6xl"> Dashboard Overview </label>
        </div>

        <div className="w-[900px] text-center">
          <label className="font-medium text-lg font-mono ">
            {" "}
            Share your parenting aspirations—we're here to support your family's
            unique path.{" "}
          </label>
        </div>
      </div>

      <div className="h-auto w-full">
        <div className="flex flex-col gap-10 w-full h-auto items-center bg-[#F5EFE8] pb-20">
          <div className="w-[920px] h-[140px] bg-white rounded-2xl border-[#D584B2] border px-20 py-4 flex flex-col">
            <label className="text-[#D584B2] font-bold text-xl">
              Active Patients
            </label>
            <label className="text-5xl mt-2">25</label>
          </div>
          <div className="w-[920px] h-[140px] bg-white rounded-2xl border-[#D584B2] border px-20 py-4 flex flex-col">
            <label className="text-[#D584B2] font-bold text-xl">
              Pending Appointments
            </label>
            <label className="text-5xl mt-2">5</label>
          </div>
          <div className="w-[920px] h-[140px] bg-white rounded-2xl border-[#D584B2] border px-20 py-4 flex flex-col">
            <label className="text-[#D584B2] font-bold text-xl">
              New Messages
            </label>
            <label className="text-5xl mt-2">12</label>
          </div>
          <div className="w-[920px] h-[140px] bg-white rounded-2xl border-[#D584B2] border px-20 py-4 flex flex-col">
            <label className="text-[#D584B2] font-bold text-xl">
              Satisfaction Rate
            </label>
            <label className="text-5xl mt-2">98%</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
