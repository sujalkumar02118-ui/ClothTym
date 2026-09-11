"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup() {
    if (!name || !phone || !email || !password) {
      alert("Please fill all details");
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          role: "BUYER",
        }),
      });

      const data = await res.json();

      console.log(data);

      if (res.ok) {
        alert("Signup Successful");
        router.push("/login");
      } else {
        alert(data.message || "Signup Failed");
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <h1 className="text-4xl font-bold text-white text-center mb-8">
          ClothTym
        </h1>

        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <h2 className="text-3xl font-bold text-black text-center">
            Create Account
          </h2>

          <p className="text-black text-center mt-2">
            Join ClothTym and start shopping
          </p>

          <div className="mt-8">

            <label className="block text-black font-bold mb-2">
              Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black outline-none"
            />

            <label className="block text-black font-bold mt-5 mb-2">
              Mobile Number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black outline-none"
            />

            <label className="block text-black font-bold mt-5 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black outline-none"
            />

            <label className="block text-black font-bold mt-5 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black outline-none"
            />

            <button
              onClick={handleSignup}
              className="w-full bg-black text-white rounded-xl py-3 mt-6 font-bold text-lg"
            >
              Signup
            </button>
          </div>

          <p className="text-black text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold">
              Login
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}