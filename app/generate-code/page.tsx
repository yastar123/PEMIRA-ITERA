"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { QrCode, RefreshCw, Clock, User, Loader2, CheckCircle, AlertCircle } from "@/lib/icons"
import { useRouter } from "next/navigation"
import QRCodeDisplay from "@/components/qr-code-display"
import { getMockUser, mockDatabase } from "@/lib/mock-auth"

export default function GenerateCodePage() {
  const [user, setUser] = useState<any>(null)
  const [votingSession, setVotingSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndData = async () => {
      try {
        const mockUser = getMockUser()
        if (!mockUser) {
          router.push("/login")
          return
        }

        if (mockUser.hasVoted) {
          router.push("/success")
          return
        }

        setUser(mockUser)

        // Check for existing voting session
        if (mockDatabase.votingSession) {
          const now = new Date()
          const expiresAt = new Date(mockDatabase.votingSession.expiresAt)

          if (now < expiresAt && !mockDatabase.votingSession.isUsed) {
            setVotingSession(mockDatabase.votingSession)
            if (mockDatabase.votingSession.isValidated) {
              router.push("/vote")
              return
            }
          } else {
            // Clear expired session
            mockDatabase.votingSession = null
          }
        }
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data")
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
        // Clear expired session
        mockDatabase.votingSession = null
        setVotingSession(null)
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [votingSession])

  // Check for validation status periodically
  useEffect(() => {
    if (!votingSession || votingSession.isValidated) return

    const checkValidation = () => {
      if (mockDatabase.votingSession?.isValidated) {
        setVotingSession({ ...mockDatabase.votingSession })
        router.push("/vote")
      }
    }

    const interval = setInterval(checkValidation, 2000)
    return () => clearInterval(interval)
  }, [votingSession, router])

  const generateQRCode = async () => {
    if (!user) return

    setGenerating(true)
    setError("")

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const session = mockDatabase.generateQRCode()
      if (session) {
        setVotingSession(session)
      } else {
        setError("Gagal membuat kode QR")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat membuat kode QR")
    } finally {
      setGenerating(false)
    }
  }

  const refreshCode = async () => {
    if (!votingSession) return

    // Clear current session and generate new one
    mockDatabase.votingSession = null
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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* User Info */}
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
                <p className="font-semibold">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-semibold">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary">Belum Voting</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        {!votingSession ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Generate Kode Voting</CardTitle>
              <CardDescription>
                Klik tombol di bawah untuk membuat kode QR dan kode redeem yang akan digunakan untuk validasi voting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
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
                  <QRCodeDisplay value={votingSession.qrCode} size={200} />

                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Berlaku hingga: {timeRemaining}</span>
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
                    <span className="text-2xl font-mono font-bold tracking-wider">{votingSession.redeemCode}</span>
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

            {/* Mock Validation Button for Testing */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">Testing Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 mb-4">
                  Untuk testing, klik tombol di bawah untuk mensimulasikan validasi oleh admin:
                </p>
                <Button
                  onClick={() => {
                    mockDatabase.validateQRCode(votingSession.redeemCode)
                    setVotingSession({ ...mockDatabase.votingSession })
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={votingSession.isValidated}
                >
                  {votingSession.isValidated ? "Sudah Divalidasi" : "Simulasi Validasi Admin"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
