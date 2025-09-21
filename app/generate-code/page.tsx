"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { QrCode, RefreshCw, Clock, User, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface VotingSession {
  id: string
  qrCode: string
  redeemCode: string
  qrCodeImage: string
  isValidated: boolean
  isUsed: boolean
  expiresAt: string
}

interface User {
  id: string
  name: string
  email: string
  nim: string
  role: string
  hasVoted: boolean
}

export default function GenerateCodePage() {
  const [user, setUser] = useState<User | null>(null)
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timeRemaining, setTimeRemaining] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndData = async () => {
      try {
        console.log('Checking auth and data...')
        
        // Get user session
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Important untuk cookies
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Auth response status:', response.status)
        
        if (!response.ok) {
          console.log('Not authenticated, redirecting to login')
          router.push("/login")
          return
        }

        const userData = await response.json()
        console.log('User data:', userData)
        
        if (userData.hasVoted) {
          console.log('User already voted, redirecting to success')
          router.push("/success")
          return
        }

        setUser(userData)

        // Check for existing voting session
        console.log('Checking for existing voting session...')
        const sessionResponse = await fetch('/api/qr-code', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Session response status:', sessionResponse.status)
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          console.log('Session data:', sessionData)
          setVotingSession(sessionData.session)
          
          if (sessionData.session?.isValidated) {
            console.log('Session already validated, redirecting to vote')
            router.push("/vote")
            return
          }
        } else if (sessionResponse.status !== 404) {
          // 404 is expected if no session exists, other errors should be logged
          const errorData = await sessionResponse.json().catch(() => ({}))
          console.error('Session check error:', errorData)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError("Terjadi kesalahan saat memuat data: " + (err instanceof Error ? err.message : 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndData()
  }, [router])

  // Update time remaining every second
  useEffect(() => {
    if (!votingSession) return

    const updateTime = () => {
      const now = new Date()
      const expiresAt = new Date(votingSession.expiresAt)
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Expired")
        setVotingSession(null)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [votingSession])

  // Check for validation status periodically
  useEffect(() => {
    if (!votingSession || votingSession.isValidated) return

    const checkValidation = async () => {
      try {
        console.log('Checking validation status...')
        const response = await fetch('/api/qr-code', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Validation check response:', data)
          
          if (data.session?.isValidated && !votingSession.isValidated) {
            console.log('Session validated, updating state and redirecting')
            setVotingSession(data.session)
            setTimeout(() => {
              router.push("/vote")
            }, 1000) // Small delay to show success message
          }
        }
      } catch (err) {
        console.error('Validation check error:', err)
      }
    }

    const interval = setInterval(checkValidation, 3000) // Check every 3 seconds
    return () => clearInterval(interval)
  }, [votingSession, router])

  const generateQRCode = async () => {
    if (!user) {
      setError("User data tidak tersedia")
      return
    }

    setGenerating(true)
    setError("")
    setSuccess("")

    try {
      console.log('Generating QR code for user:', user.id)
      
      const response = await fetch('/api/qr-code', {
        method: 'POST',
        credentials: 'include', // Important untuk cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Generate QR response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Generate QR error response:', errorData)
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Generated QR data:', data)
      
      if (data.session) {
        setVotingSession(data.session)
        setSuccess("QR Code berhasil dibuat!")
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Generate QR error:', err)
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat kode QR"
      setError(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const refreshCode = async () => {
    if (!votingSession) return
    
    setVotingSession(null)
    await generateQRCode()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data...</p>
        </div>

        {/* Alert Messages */}
        <div className="mb-6 space-y-4">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Generate Kode Voting</p>
            </div>
          </div>
        </div>

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

        {/* User Info */}
        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pemilih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-semibold">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIM</p>
                  <p className="font-semibold">{user.nim}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={user.hasVoted ? "default" : "secondary"}>
                    {user.hasVoted ? "Sudah Voting" : "Belum Voting"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Section */}
        {!votingSession ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Generate Kode Voting</CardTitle>
              <CardDescription>
                Klik tombol di bawah untuk membuat kode QR dan kode redeem yang akan digunakan untuk validasi voting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button onClick={generateQRCode} disabled={generating} size="lg">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Membuat Kode...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Generate Kode QR
                  </>
                )}
              </Button>

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                  <h4 className="font-bold text-sm mb-2">Debug Info:</h4>
                  <div className="text-xs space-y-1">
                    <p>User ID: {user?.id || 'Not loaded'}</p>
                    <p>User Email: {user?.email || 'Not loaded'}</p>
                    <p>Has Voted: {user?.hasVoted ? 'Yes' : 'No'}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Generating: {generating ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* QR Code Display */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Kode QR Voting
                </CardTitle>
                <CardDescription>Tunjukkan kode QR ini kepada panitia untuk validasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <Image
                        src={votingSession.qrCodeImage}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="mx-auto"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Berlaku hingga: {timeRemaining}
                    </span>
                  </div>

                  {votingSession.isValidated ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Kode Anda sudah divalidasi! Anda akan diarahkan ke halaman voting.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={refreshCode} variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Ulang
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Redeem Code */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Kode Redeem</CardTitle>
                <CardDescription>Alternatif jika QR code tidak dapat dipindai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-4 bg-muted rounded-lg">
                    <span className="text-2xl font-mono font-bold tracking-wider">
                      {votingSession.redeemCode}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Berikan kode ini kepada panitia jika QR code tidak dapat dipindai
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Langkah Selanjutnya</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <p>Tunjukkan kode QR atau berikan kode redeem kepada panitia</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <p>Tunggu panitia memvalidasi identitas dan kode Anda</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p>Setelah divalidasi, Anda akan diarahkan ke halaman voting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}