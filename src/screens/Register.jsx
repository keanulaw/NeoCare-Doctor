import React from "react";
import Logo from "../assets/Logo.png";
import { Link } from "react-router-dom";
import { auth } from "../configs/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="w-full h-auto overflow-y py-25 flex flex-col justify-center items-center gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4] relative">
      {/*Header*/}
      <div className="absolute w-[300px] h-15 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl top-6 justify-center items-center flex ">
        <div className="flex items-center justify-center">
          <img src={Logo} alt="React logo" width="50" height="50" />
          <label className="font-medium text-3xl font-mono">NeoCare</label>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-3 w-[800px] text-center">
        <label className="font-bold text-6xl">
          Provide guidance to those
          <label className="text-[#6bc4c1]"> parents </label>
          in need
        </label>
      </div>

      <div className="w-[600px] text-center">
        <label className="font-medium text-lg font-mono ">
          Share your professionality and consult the ones who needs guidance in
          their journey
        </label>
      </div>

      <div className="w-[600px] h-auto p-8 flex gap-2 flex-col">
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
        <label>Password</label>
        <input
          className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
          placeholder="Enter Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <label>Re-enter Password</label>
        <input
          className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
          placeholder="Enter Password Again"
          type="password"
        />
        <label>Role</label>
        <input
          className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
          placeholder="Enter your Profession"
          type="text"
          onChange={(e) => setRole(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full h-10 rounded-xl bg-[#6bc4c1] text-white font-medium text-xl mt-5 font-mono cursor-pointer duration-300 hover:bg-[#48817f]"
        >
          SIGN UP
        </button>
      </div>
      <div className="flex-col flex justify-center items-center gap-5">
        <label>
          Already have an Account?{" "}
          <Link to="/" className="underline">
            Sign In!
          </Link>
        </label>
      </div>
    </div>
  );
};

export default Register;
