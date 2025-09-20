'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApiClient } from '@/lib/api-client'
import { ArrowLeft } from '@/lib/icons'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Email harus diisi')
      return
    }

    if (!email.endsWith('@student.itera.ac.id')) {
      setError('Gunakan email ITERA (@student.itera.ac.id)')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await ApiClient.forgotPassword(email)
      setMessage(result.message)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim kode OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !newPassword || !confirmPassword) {
      setError('Semua field harus diisi')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama')
      return
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await ApiClient.verifyOtpAndResetPassword(email, otp, newPassword)
      setMessage(result.message)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="text-2xl">Lupa Password</CardTitle>
              <CardDescription>
                {step === 'email' 
                  ? 'Masukkan email ITERA untuk reset password'
                  : 'Masukkan kode OTP dan password baru'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email ITERA</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@student.itera.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Kode OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Masukkan 6 digit kode OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-600">
                  Cek email Anda (termasuk folder spam)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Memproses...' : 'Reset Password'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                >
                  Kembali ke Input Email
                </Button>
              </div>
            </form>
          )}

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Kembali ke Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}