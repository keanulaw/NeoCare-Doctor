import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../configs/firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        console.log("Successfully logged in:", userCredential.user.uid);
        navigate("/landing");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4] relative">
      {/*Header*/}
      <div className="absolute w-[300px] h-15 border border-white rounded-full bg-[#d5e8d4] shadow-black drop-shadow-xl top-6 justify-center items-center flex ">
        <div className="flex items-center justify-center">
          <img src={Logo} alt="React logo" width="50" height="50" />
          <label className="font-medium text-3xl font-mono">NeoCare</label>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-3 w-[800px] text-center">
        <label className="font-bold text-6xl">
          Launch your professionality
          <label className="text-[#6bc4c1]"> chapter </label>
          as a consultant
        </label>
      </div>

      <div className="w-[600px] text-center">
        <label className="font-medium text-lg font-mono ">
          "Making the decision to have a child is momentous. It is to decide
          forever to have your heart go walking around outside your body." -
          Elizabeth Stone
        </label>
      </div>

      <div className="w-[600px] h-auto p-8 flex gap-2 flex-col">
        <label>Email</label>
        <input
          className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
          placeholder="Enter Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Password</label>
        <input
          className="w-full h-10 rounded-xl border-1 border-[#6bc4c1] bg-white px-4"
          placeholder="Enter Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full h-10 rounded-xl bg-[#6bc4c1] text-white font-medium text-xl mt-5 font-mono cursor-pointer duration-300 hover:bg-[#48817f]"
        >
          SIGN IN
        </button>

        <div className="w-full flex justify-end">
          <Link className="font-medium text-sm font-mono underline">
            Forgot Password?
          </Link>
        </div>
      </div>
      <div className="flex-col flex justify-center items-center gap-5">
        <label className="underline">Need Help?</label>
        <label>
          Don't have an account?{" "}
          <Link to="/register" className="underline">
            Sign Up!
          </Link>
        </label>
      </div>
    </div>
  );
};

export default Login;