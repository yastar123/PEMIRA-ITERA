"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCode, Scan, CheckCircle, Clock, AlertCircle, LogOut, RefreshCw, Search, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import QRScanner from "@/components/qr-scanner"

interface VotingSession {
  id: string
  userId: string
  qrCode: string
  redeemCode: string
  isValidated: boolean
  isUsed: boolean
  validatedBy?: string
  expiresAt: string
  createdAt: string
  user?: {
    name: string
    nim: string
    prodi: string
    email: string
  }
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [pendingSessions, setPendingSessions] = useState<VotingSession[]>([])
  const [recentValidations, setRecentValidations] = useState<VotingSession[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await ApiClient.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          router.push("/")
          return
        }

        setAdmin(user)
        await loadData()
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Set up polling for data updates (replacing real-time subscription)
    const interval = setInterval(() => {
      loadData()
    }, 10000) // Refresh every 10 seconds

    return () => {
      clearInterval(interval)
    }
  }, [router])

  const loadData = async () => {
    try {
      // We'll need to create these API endpoints
      // For now, we'll use placeholder data or create the endpoints
      const pendingResponse = await fetch('/api/admin/pending-sessions')
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingSessions(pendingData.sessions || [])
      }

      const recentResponse = await fetch('/api/admin/recent-validations')
      if (recentResponse.ok) {
        const recentData = await recentResponse.json()
        setRecentValidations(recentData.sessions || [])
      }
    } catch (err) {
      console.error("Error loading data:", err)
    }
  }

  const validateSession = async (sessionId: string, redeemCode?: string) => {
    setValidating(true)
    setError("")
    setSuccess("")

    try {
      const result = await ApiClient.validateSession(sessionId, redeemCode)
      setSuccess(result.message || "Session berhasil divalidasi")
      setManualCode("")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat validasi")
    } finally {
      setValidating(false)
    }
  }

  const handleQRScan = async (data: string) => {
    try {
      const qrData = JSON.parse(data)
      if (qrData.userId && qrData.redeemCode) {
        // Find session by user ID and redeem code via API
        const response = await fetch(`/api/admin/find-session?userId=${qrData.userId}&redeemCode=${qrData.redeemCode}`)
        if (response.ok) {
          const sessionData = await response.json()
          if (sessionData.session) {
            await validateSession(sessionData.session.id, qrData.redeemCode)
          } else {
            setError("Session tidak ditemukan atau sudah divalidasi")
          }
        } else {
          setError("Session tidak ditemukan atau sudah divalidasi")
        }
      } else {
        setError("Format QR code tidak valid")
      }
    } catch (err) {
      setError("QR code tidak valid")
    }
    setShowScanner(false)
  }

  const handleManualValidation = async () => {
    if (!manualCode.trim()) {
      setError("Masukkan kode redeem")
      return
    }

    try {
      const response = await fetch(`/api/admin/find-session?redeemCode=${manualCode.trim().toUpperCase()}`)
      if (response.ok) {
        const sessionData = await response.json()
        if (sessionData.session) {
          await validateSession(sessionData.session.id, manualCode.trim().toUpperCase())
        } else {
          setError("Kode redeem tidak ditemukan atau sudah divalidasi")
        }
      } else {
        setError("Kode redeem tidak ditemukan atau sudah divalidasi")
      }
    } catch (err) {
      setError("Kode redeem tidak valid")
    }
  }

  const handleLogout = async () => {
    try {
      await ApiClient.logout()
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err)
      router.push("/")
    }
  }

  const filteredPendingSessions = pendingSessions.filter(
    (session) =>
      session.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user?.nim.includes(searchTerm) ||
      session.redeemCode.includes(searchTerm.toUpperCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p>Memuat dashboard admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="container mx-auto max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Scan className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Validasi QR Code Pemilih</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{admin?.name}</p>
              <p className="text-sm text-muted-foreground">{admin?.role}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
            <TabsTrigger value="pending">Menunggu Validasi</TabsTrigger>
            <TabsTrigger value="recent">Validasi Terbaru</TabsTrigger>
          </TabsList>

          {/* QR Scanner Tab */}
          <TabsContent value="scan" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Scan QR Code
                  </CardTitle>
                  <CardDescription>Gunakan kamera untuk memindai QR code mahasiswa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!showScanner ? (
                      <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
                        <QrCode className="mr-2 h-5 w-5" />
                        Buka Scanner
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <QRScanner onScan={handleQRScan} onError={(err) => setError(err)} />
                        <Button variant="outline" onClick={() => setShowScanner(false)} className="w-full">
                          Tutup Scanner
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Input Manual
                  </CardTitle>
                  <CardDescription>Masukkan kode redeem secara manual jika QR tidak dapat dipindai</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-code">Kode Redeem (8 karakter)</Label>
                      <Input
                        id="manual-code"
                        placeholder="Contoh: ABC12345"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        disabled={validating}
                      />
                    </div>
                    <Button
                      onClick={handleManualValidation}
                      disabled={validating || !manualCode.trim()}
                      className="w-full"
                    >
                      {validating ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          Memvalidasi...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Validasi Kode
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Sessions Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Menunggu Validasi ({filteredPendingSessions.length})
                    </CardTitle>
                    <CardDescription>Daftar mahasiswa yang menunggu validasi kode</CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan nama, NIM, atau kode redeem..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahasiswa</TableHead>
                          <TableHead>Kode Redeem</TableHead>
                          <TableHead>Waktu Dibuat</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Tidak ada session yang menunggu validasi
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPendingSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>
                                <div>
                                  <p className="font-semibold">{session.user?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {session.user?.nim} • {session.user?.prodi}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {session.redeemCode}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(session.createdAt).toLocaleString("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </TableCell>
                              <TableCell>
                                {new Date(session.expiresAt).toLocaleString("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" onClick={() => validateSession(session.id)} disabled={validating}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Validasi
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Validations Tab */}
          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Validasi Terbaru ({recentValidations.length})
                </CardTitle>
                <CardDescription>10 validasi terakhir yang dilakukan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahasiswa</TableHead>
                        <TableHead>Kode Redeem</TableHead>
                        <TableHead>Waktu Validasi</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentValidations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Belum ada validasi yang dilakukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentValidations.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{session.user?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {session.user?.nim} • {session.user?.prodi}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {session.redeemCode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(session.createdAt).toLocaleString("id-ID", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Tervalidasi
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
