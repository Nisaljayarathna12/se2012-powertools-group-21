"use client"

import { CheckCircle2 } from "lucide-react"
import { useToast } from "@/lib/toast"

export function Toaster() {
  const toast = useToast()

  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50"
      key={toast.id}
    >
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        <span>{toast.message}</span>
      </div>
    </div>
  )
}