"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, ArrowLeft, Loader2 } from "@/lib/icons"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock user data from seeder for testing
const MOCK_USERS = [
  {
    email: "superadmin@itera.ac.id",
    password: "superadmin123",
    role: "SUPER_ADMIN",
    name: "Super Administrator",
    hasVoted: false,
  },
  {
    email: "admin1@itera.ac.id",
    password: "admin123",
    role: "ADMIN",
    name: "Admin Panitia 1",
    hasVoted: false,
  },
  {
    email: "admin2@itera.ac.id",
    password: "admin123",
    role: "ADMIN",
    name: "Admin Panitia 2",
    hasVoted: false,
  },
  {
    email: "mahasiswa1@student.itera.ac.id",
    password: "mahasiswa123",
    role: "VOTER",
    name: "Budi Santoso",
    hasVoted: false,
  },
  {
    email: "mahasiswa2@student.itera.ac.id",
    password: "mahasiswa123",
    role: "VOTER",
    name: "Siti Nurhaliza",
    hasVoted: false,
  },
  {
    email: "mahasiswa3@student.itera.ac.id",
    password: "mahasiswa123",
    role: "VOTER",
    name: "Andi Wijaya",
    hasVoted: false,
  },
  {
    email: "mahasiswa4@student.itera.ac.id",
    password: "mahasiswa123",
    role: "VOTER",
    name: "Maya Sari",
    hasVoted: false,
  },
  {
    email: "mahasiswa5@student.itera.ac.id",
    password: "mahasiswa123",
    role: "VOTER",
    name: "Reza Pratama",
    hasVoted: false,
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Find user in mock data
      const user = MOCK_USERS.find((u) => u.email === email && u.password === password)

      if (!user) {
        setError("Email atau password salah")
        return
      }

      // Store user session in localStorage for mock auth
      localStorage.setItem("mockUser", JSON.stringify(user))

      // Redirect based on role
      switch (user.role) {
        case "SUPER_ADMIN":
          router.push("/super-admin")
          break
        case "ADMIN":
          router.push("/admin")
          break
        default:
          if (user.hasVoted) {
            router.push("/success")
          } else {
            router.push("/generate-code")
          }
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Vote className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Pemilihan Presiden Mahasiswa</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Masuk ke Akun Anda</CardTitle>
            <CardDescription>Gunakan email dan password mahasiswa ITERA untuk masuk</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Mahasiswa</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@student.itera.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <Vote className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Button variant="link" className="p-0 h-auto font-normal">
                  Hubungi admin untuk registrasi
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Accounts Info */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Akun Testing</h3>
              <div className="text-sm space-y-2">
                <div className="p-2 bg-background rounded">
                  <p>
                    <strong>Super Admin:</strong>
                  </p>
                  <p>Email: superadmin@itera.ac.id</p>
                  <p>Password: superadmin123</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p>
                    <strong>Admin:</strong>
                  </p>
                  <p>Email: admin1@itera.ac.id</p>
                  <p>Password: admin123</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p>
                    <strong>Mahasiswa:</strong>
                  </p>
                  <p>Email: mahasiswa1@student.itera.ac.id</p>
                  <p>Password: mahasiswa123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Butuh Bantuan?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Jika Anda mengalami kesulitan saat login, silakan hubungi panitia pemilihan.
              </p>
              <div className="text-sm">
                <p>
                  <strong>Email:</strong> pemilu@itera.ac.id
                </p>
                <p>
                  <strong>WhatsApp:</strong> +62 812-3456-7890
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
