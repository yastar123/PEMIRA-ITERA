"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, User, Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PRODI_OPTIONS = [
  "Teknik Informatika",
  "Teknik Sipil",
  "Teknik Elektro",
  "Teknik Kimia",
  "Teknik Mesin",
  "Teknik Industri",
  "Teknik Geologi",
  "Teknik Geofisika",
  "Teknik Lingkungan",
  "Arsitektur",
  "Perencanaan Wilayah dan Kota",
  "Teknik Biosistem",
  "Sains Aktuaria",
  "Matematika",
  "Fisika",
  "Kimia",
  "Biologi",
  "Farmasi",
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nim: "",
    name: "",
    prodi: "",
    gender: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateNIM = (nim: string) => {
    // Basic NIM validation for ITERA (usually 9 digits starting with specific patterns)
    const nimPattern = /^[0-9]{9}$/
    return nimPattern.test(nim)
  }

  const validatePhone = (phone: string) => {
    // Indonesian phone number validation
    const phonePattern = /^(\+62|62|0)[0-9]{9,12}$/
    return phonePattern.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!validateNIM(formData.nim)) {
      setError("NIM harus berupa 9 digit angka")
      setLoading(false)
      return
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError("Format nomor telepon tidak valid")
      setLoading(false)
      return
    }

    try {
      // Call register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nim: formData.nim,
          name: formData.name,
          prodi: formData.prodi,
          gender: formData.gender,
          phone: formData.phone || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Terjadi kesalahan saat registrasi")
        return
      }

      // Registration successful, redirect to login
      router.push("/login")
    } catch (err) {
      setError("Terjadi kesalahan saat registrasi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            ← Kembali ke Beranda
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Vote className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Registrasi Pemilih</p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              Daftar Akun Baru
            </CardTitle>
            <CardDescription>
              Isi data lengkap untuk membuat akun dan berpartisipasi dalam pemilihan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* NIM */}
              <div className="space-y-2">
                <Label htmlFor="nim">NIM (Nomor Induk Mahasiswa) *</Label>
                <Input
                  id="nim"
                  type="text"
                  placeholder="Contoh: 121450001"
                  value={formData.nim}
                  onChange={(e) => handleInputChange("nim", e.target.value)}
                  required
                  disabled={loading}
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground">Masukkan 9 digit NIM Anda</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap sesuai KTM"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Program Studi */}
              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi *</Label>
                <Select
                  value={formData.prodi}
                  onValueChange={(value) => handleInputChange("prodi", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih program studi Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODI_OPTIONS.map((prodi) => (
                      <SelectItem key={prodi} value={prodi}>
                        {prodi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Opsional - untuk keperluan komunikasi jika diperlukan</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Daftar Akun
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Login di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Informasi Penting</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Pastikan data yang Anda masukkan sesuai dengan KTM</p>
                <p>• NIM yang sudah terdaftar tidak dapat digunakan lagi</p>
                <p>• Setelah registrasi berhasil, silakan login untuk melanjutkan</p>
                <p>• Hubungi panitia jika mengalami kesulitan: pemilu@itera.ac.id</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
