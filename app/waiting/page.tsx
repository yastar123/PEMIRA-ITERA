"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function WaitingPage() {
  const [user, setUser] = useState<any>(null)
  const [votingSession, setVotingSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!authUser) {
          router.push("/login")
          return
        }

        const { data: userData } = await supabase.from("User").select("*").eq("email", authUser.email).single()

        if (!userData) {
          router.push("/register")
          return
        }

        if (userData.hasVoted) {
          router.push("/success")
          return
        }

        setUser(userData)

        // Get current voting session
        const { data: sessionData } = await supabase
          .from("VotingSession")
          .select("*")
          .eq("userId", userData.id)
          .eq("isUsed", false)
          .order("createdAt", { ascending: false })
          .limit(1)
          .single()

        if (!sessionData) {
          router.push("/generate-code")
          return
        }

        if (sessionData.isValidated) {
          router.push("/vote")
          return
        }

        setVotingSession(sessionData)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndData()

    // Set up real-time subscription
    const channel = supabase
      .channel("waiting-validation")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "VotingSession",
        },
        (payload) => {
          if (payload.new.userId === user?.id && payload.new.isValidated) {
            router.push("/vote")
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase, user?.id])

  useEffect(() => {
    if (!votingSession) return

    const updateTimer = () => {
      const now = new Date()
      const expiresAt = new Date(votingSession.expiresAt)
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Expired")
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [votingSession])

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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Menunggu Validasi</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Menunggu Validasi Panitia
              </CardTitle>
              <CardDescription>Kode Anda sedang menunggu untuk divalidasi oleh panitia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status Kode</p>
                  <Badge variant="secondary" className="text-orange-600 bg-orange-50">
                    Menunggu Validasi
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Waktu Tersisa</p>
                  <div className="text-2xl font-mono font-bold">{timeRemaining}</div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Kode Redeem</p>
                  <div className="inline-flex items-center justify-center p-2 bg-muted rounded">
                    <span className="text-lg font-mono font-bold">{votingSession?.redeemCode}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Apa yang harus dilakukan?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Kode QR atau redeem code Anda sudah diterima oleh sistem. Silakan tunggu panitia untuk memvalidasi
                    identitas Anda.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <p>Kode berhasil dibuat dan siap untuk validasi</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      ⏳
                    </div>
                    <p>Menunggu panitia memvalidasi identitas Anda</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p>Setelah divalidasi, Anda akan otomatis diarahkan ke halaman voting</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Butuh Bantuan?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>Jika Anda menunggu terlalu lama atau mengalami masalah:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Pastikan Anda berada di lokasi yang telah ditentukan</li>
                  <li>Tunjukkan kode redeem kepada panitia jika QR code bermasalah</li>
                  <li>Hubungi panitia jika kode sudah expired</li>
                </ul>
                <div className="pt-2 border-t">
                  <p>
                    <strong>Kontak Panitia:</strong>
                  </p>
                  <p>Email: pemilu@itera.ac.id</p>
                  <p>WhatsApp: +62 812-3456-7890</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Generate Code */}
          <div className="text-center">
            <Button variant="outline" onClick={() => router.push("/generate-code")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Kembali ke Generate Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
