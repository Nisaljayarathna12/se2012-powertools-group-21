import { useSyncExternalStore } from "react"

export interface Toast {
  id: number
  message: string
}

let current: Toast | null = null
let listeners: Array<() => void> = []
let timer: ReturnType<typeof setTimeout> | null = null

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function notify(message: string): void {
  current = { id: Date.now(), message }
  emit()

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    emit()
  }, 3000)
}

export function dismissToast(): void {
  if (timer) clearTimeout(timer)
  current = null
  emit()
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter((listener) => listener !== callback)
  }
}

function getSnapshot(): Toast | null {
  return current
}

function getServerSnapshot(): Toast | null {
  return null
}

export function useToast(): Toast | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}