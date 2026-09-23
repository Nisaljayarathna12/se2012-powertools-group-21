"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { loginUser } from "@/lib/api"
import { saveToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

interface FormErrors {
  email?: string
  password?: string
}

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): FormErrors {
    const next: FormErrors = {}

    if (!email.trim()) {
      next.email = "Email is required"
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address"
    }

    if (!password) {
      next.password = "Password is required"
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next = validate()
    setErrors(next)
    setFormError(null)

    if (Object.keys(next).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      })
      saveToken(res.token)
      router.push("/")
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      )
      setSubmitting(false)
    }
  }

  return (
    <>
      {registered ? (
        <div
          role="status"
          className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          Your account was created successfully. Sign in below to continue.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@example.com"
            autoComplete="email"
            className={cn(inputClass, errors.email && "border-destructive")}
          />
          {errors.email ? (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="Your password"
            autoComplete="current-password"
            className={cn(inputClass, errors.password && "border-destructive")}
          />
          {errors.password ? (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </>
  )
}