import Link from "next/link"
import { SignIn, SignUp } from "@clerk/nextjs"

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string
  }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams
  const isSignUp = mode === "sign-up"

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-black">
      <div className="min-h-screen bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:88px_88px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl border border-black bg-white">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-black bg-[#f53d00] p-8 text-white lg:border-b-0 lg:border-r lg:p-12">
              <Link href="/" className="text-3xl font-semibold tracking-tight">
                Browsera
              </Link>
              <p className="mt-10 text-sm uppercase tracking-[0.24em] text-white/70">
                Authentication
              </p>
              <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
                {isSignUp
                  ? "Create your first Browsera account."
                  : "Sign in to continue into the dashboard."}
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-white/85">
                Clerk is running in keyless mode here, so you can test signup and sign-in
                immediately without wiring keys first.
              </p>
            </div>

            <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
              <div className="w-full max-w-md">
                {isSignUp ? (
                  <SignUp signInUrl="/auth" />
                ) : (
                  <SignIn signUpUrl="/auth?mode=sign-up" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
