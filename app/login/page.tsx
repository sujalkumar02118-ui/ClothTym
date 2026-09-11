"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      alert("Please fill all details");
      return;
    }

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        alert("Invalid email or password");
        return;
      }

      if (result?.ok) {
        alert("Login Successful");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
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
            Login
          </h2>

          <p className="text-black text-center mt-2">
            Welcome back! Login to continue
          </p>

          <div className="mt-8">

            <label className="block text-black font-bold mb-2">
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
              placeholder="Enter your password"
              className="w-full border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black outline-none"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3 mt-6 font-bold text-lg disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </div>

          <p className="text-black text-center mt-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold underline"
            >
              Signup
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}