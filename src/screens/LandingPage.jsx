import React from "react";
import Header from "../components/Header";
import Babyhead from "../assets/Babyhead.png";
import Question from "../assets/Question.png";

const LandingPage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-[#F2C2DE]">
      <Header />

      {/* ---------------- First Section ---------------- */}
      <section className="w-full h-screen flex flex-col justify-center items-center gap-8 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to NeoCare Consultant Portal
          </h1>
          <p className="text-2xl text-[#DA79B9] font-light">
            Empowering parents through expert guidance and support
          </p>
        </div>
        <p className="max-w-2xl text-center text-gray-700">
          NeoCare is a trusted resource for new parents, offering expert advice and
          support that feels like having a personal parenting coach — but only costs a
          fraction of it.
        </p>
      </section>

      {/* ---------------- Dashboard Section ---------------- */}
      <section className="w-full bg-white py-16 px-4">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl text-[#DA79B9] font-light">Dashboard</h2>
          <h3 className="text-4xl font-bold text-gray-800">Your Impact Dashboard</h3>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {[
            ["150+", "Families Supported"],
            ["98%", "Client Satisfaction"],
            ["500+", "Consultations Given"],
            ["25+", "Years Combined Experience"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="w-64 h-64 bg-[#F5EFE8] rounded-xl p-6 flex flex-col justify-center items-start relative shadow"
            >
              <img
                src={Babyhead}
                alt=""
                className="w-12 h-12 absolute top-4 left-4"
              />
              <span className="mt-8 text-3xl font-mono font-medium text-[#DA79B9]">
                {value}
              </span>
              <span className="text-lg text-gray-800 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Mission & Role Section ---------------- */}
      <section className="w-full py-16 px-4 bg-gradient-to-br from-[#F5EFE8] to-[#F2C2DE] flex flex-col md:flex-row justify-center items-center gap-8">
        {[
          [
            "Our Mission",
            "At NeoCare, we're dedicated to providing comprehensive support to parents, fostering healthier families and happier children. Our platform empowers consultants like you to make a meaningful difference in the lives of families around the world.",
          ],
          [
            "Your Role",
            "As a NeoCare consultant, you play a crucial role in shaping the future of families and communities. Your expertise and guidance help parents navigate the challenges of raising children, promoting positive parenting practices, and fostering healthy child development.",
          ],
        ].map(([title, text]) => (
          <div
            key={title}
            className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg space-y-4"
          >
            <div className="flex justify-center">
              <img src={Question} alt="" className="w-16 h-16" />
            </div>
            <h4 className="text-2xl font-mono font-medium text-[#DA79B9] text-center">
              {title}
            </h4>
            <p className="text-gray-800 text-center">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
