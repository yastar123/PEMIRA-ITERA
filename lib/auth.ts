import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/types"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: userData, error: userError } = await supabase.from("User").select("*").eq("email", user.email).single()

  if (userError || !userData) {
    return null
  }

  return userData
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }
  return user
}
