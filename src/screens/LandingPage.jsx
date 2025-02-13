import { Link } from "react-router-dom";
import React from "react";
import Logo from "../assets/Logo.png";
import Babyhead from "../assets/Babyhead.png";
import Question from "../assets/Question.png";

const LandingPage = () => {
  return (
    <div className="w-auto overflow-y-auto">
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

      {/*First Layer*/}
      <div className="w-full h-screen flex flex-col justify-center items-center gap-15 bg-[#F5EFE8]">
        <div className="flex flex-col justify-center items-center gap-3">
          <label className="font-bold text-4xl">
            {" "}
            Welcome to NeoCare Consultant Portal{" "}
          </label>
          <label className="font-light text-3xl text-[#6bc4c1]">
            {" "}
            Empowering parents through expert guidance and support{" "}
          </label>
        </div>

        <div className="w-[900px] text-center">
          <label className="font-medium text-lg font-mono ">
            {" "}
            NeoCare is a trusted resource for new parents, offering expert
            advice and support that feels like having a personal parenting coach
            — but only costs a fraction of it.{" "}
          </label>
        </div>
      </div>

      {/*Second Layer*/}
      <div className="w-full h-[615px] flex flex-col justify-center items-center gap-15 bg-white">
        <label className="text-3xl font-light text-[#6bc4c1]">
          {" "}
          Dashboard{" "}
        </label>
        <label className="font-bold text-4xl"> Your Impact Dashboard </label>
        <div className="flex flex-row gap-3">
          <div className="flex justify-center relative gap-2  flex-col px-4 w-64 h-64  border-white bg-[#F5EFE8]">
            <img
              className="absolute top-2 left-2"
              src={Babyhead}
              alt="Baby"
              width="50"
              height="50"
            />
            <div className="flex flex-col">
              <label className="font-medium text-3xl font-mono text-[#6bc4c1]">
                150+
              </label>
              <label className="font-medium text-lg font-mono">
                Families Supported
              </label>
            </div>
          </div>
          <div className="flex justify-center relative flex-col px-4 w-64 h-64 border-white bg-[#F5EFE8]">
            <img
              className="absolute top-2 left-2"
              src={Babyhead}
              alt="Baby"
              width="50"
              height="50"
            />
            <div className="flex flex-col">
              <label className="font-medium text-3xl font-mono text-[#6bc4c1]">
                98%
              </label>
              <label className="font-medium text-lg font-mono">
                Client Satisfaction
              </label>
            </div>
          </div>
          <div className="flex justify-center relative flex-col px-4 w-64 h-64  border-white bg-[#F5EFE8]">
            <img
              className="absolute top-2 left-2"
              src={Babyhead}
              alt="Baby"
              width="50"
              height="50"
            />
            <div className="flex flex-col">
              <label className="font-medium text-3xl font-mono text-[#6bc4c1]">
                500+
              </label>
              <label className="font-medium text-lg font-mono">
                Consultantions Given
              </label>
            </div>
          </div>
          <div className="flex justify-center relative flex-col px-4 w-64 h-64  border-white bg-[#F5EFE8]">
            <img
              className="absolute top-2 left-2"
              src={Babyhead}
              alt="Baby"
              width="50"
              height="50"
            />
            <div className="flex flex-col">
              <label className="font-medium text-3xl font-mono text-[#6bc4c1]">
                25+
              </label>
              <label className="font-medium text-lg font-mono">
                Years Combined Experiences
              </label>
            </div>
          </div>
        </div>
      </div>

      {/*Third Layer*/}
      <div className="w-full h-screen flex flex-row justify-center items-center gap-15 bg-gradient-to-b to-[#F5EFE8] from-[#d5e8d4]">
        <div className="rounded-lg flex justify-center gap-2  flex-col p-8 w-[650px] h-auto bg-white">
          <div className="w-full flex justify-center items-center">
            <img src={Question} alt="Baby" width="100" height="100" />
          </div>
          <div className="flex flex-col">
            <label className="text-center w-full font-medium text-3xl font-mono text-[#6bc4c1]">
              Our Mission
            </label>
            <label className="font-medium text-lg font-mono">
              At NeoCare, we're dedicated to providing comprehensive support to
              parents, fostering healthier families and happier children. Our
              platform empowers consultants like you to make a meaningful
              difference in the lives of families around the world.
            </label>
          </div>
        </div>

        <div className="rounded-lg flex justify-center gap-2 flex-col p-8 w-[650px] h-auto bg-white">
          <div className="w-full flex justify-center items-center">
            <img src={Question} alt="Baby" width="100" height="100" />
          </div>
          <div className="flex flex-col">
            <label className="text-center w-full font-medium text-3xl font-mono text-[#6bc4c1]">
              Your Role
            </label>
            <label className="font-medium text-lg font-mono">
              As a NeoCare consultant, you play a crucial role in shaping the
              future of families and communities. Your expertise and guidance
              help parents navigate the challenges of raising children,
              promoting positive parenting practices, and fostering healthy
              child development.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
