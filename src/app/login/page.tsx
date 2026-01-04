"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) {
      setError("Invalid credentials");
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold">Armanet Admin</h1>
          <p className="text-sm text-slate-400">Sign in with the admin email and password</p>
        </div>
        {error && <div className="rounded border border-red-500 bg-red-900/30 p-2 text-sm text-red-200">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-100" />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-100" />
        </div>
        <button type="submit" className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500">Sign In</button>
      </form>
    </div>
  );
}
