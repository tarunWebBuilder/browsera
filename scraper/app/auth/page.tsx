"use client"

import * as Label from "@radix-ui/react-label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('hello');
    
    setLoading(true)
    setError("")

    const endpoint =
      mode === "signin"
        ? process.env.NEXT_PUBLIC_BACKEND_URL+"/signin"
        : process.env.NEXT_PUBLIC_BACKEND_URL+"/signup"

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      console.log(res);
      

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Authentication failed")
      }

      const data = await res.json()

      // Only signin returns token
      if (mode === "signin") {
        document.cookie = `auth-token=${data.access_token}; path=/`
        router.replace("/")
      } else {
        // After signup → switch to signin
        setMode("signin")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="space-y-1">
            <Label.Root htmlFor="email" className="text-sm font-medium">
              Email
            </Label.Root>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label.Root htmlFor="password" className="text-sm font-medium">
              Password
            </Label.Root>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-black"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-md bg-orange-600 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "signin" ? (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-medium text-orange-600 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="font-medium text-orange-600 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
