"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCode, Scan, CheckCircle, Clock, AlertCircle, LogOut, RefreshCw, Search, Camera, Users, UserCheck, TrendingUp, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import QRScannerTest from "@/components/QRScannerTest"
import { toast } from "@/hooks/use-toast"

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
  updatedAt: string
  user?: {
    name: string
    nim: string
    prodi: string
    email: string
  }
  validator?: {
    name: string
    role: string
  }
}

interface AdminStats {
  totalUsers: number
  totalPending: number
  totalValidated: number
  totalVoted: number
  todayValidations: number
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [, setError] = useState("")
  const [, setSuccess] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [pendingSessions, setPendingSessions] = useState<VotingSession[]>([])
  const [recentValidations, setRecentValidations] = useState<VotingSession[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPending: 0,
    totalValidated: 0,
    totalVoted: 0,
    todayValidations: 0
  })
  const [activeTab, setActiveTab] = useState("scan")
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
        console.error("Auth check error:", err)
        setError("Terjadi kesalahan saat memuat data")
        toast({ title: "Gagal", description: "Terjadi kesalahan saat memuat data" })
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Set up polling for data updates
    const interval = setInterval(() => {
      if (!loading) {
        loadData()
      }
    }, 15000) // Refresh every 15 seconds

    return () => {
      clearInterval(interval)
    }
  }, [router, loading])

  const loadData = async () => {
    try {
      const [pendingResponse, recentResponse, statsResponse] = await Promise.allSettled([
        ApiClient.getPendingSessions(),
        ApiClient.getRecentValidations(),
        ApiClient.getAdminStats()
      ])

      if (pendingResponse.status === 'fulfilled') {
        setPendingSessions(pendingResponse.value.sessions || [])
      } else {
        console.error("Failed to load pending sessions:", pendingResponse.reason)
      }

      if (recentResponse.status === 'fulfilled') {
        setRecentValidations(recentResponse.value.sessions || [])
      } else {
        console.error("Failed to load recent validations:", recentResponse.reason)
      }

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.stats || stats)
      } else {
        console.error("Failed to load stats:", statsResponse.reason)
      }
    } catch (err) {
      console.error("Error loading data:", err)
    }
  }

  const validateSession = async (sessionId?: string, redeemCode?: string, qrCode?: string) => {
    setValidating(true)
    setError("")
    setSuccess("")

    try {
      // Use existing ApiClient method with sessionId and redeemCode
      const result = await ApiClient.validateSession(sessionId || '', redeemCode)
      const message = result.message || "Session berhasil divalidasi"
      setSuccess(message)
      toast({ title: "Berhasil Validasi", description: message })
      setManualCode("")
      await loadData()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat validasi"
      setError(errorMessage)
      toast({ title: "Gagal Validasi", description: errorMessage })
      console.error("Validation error:", err)
    } finally {
      setValidating(false)
    }
  }

  // Alternative fix for admin/page.tsx - handleQRScan function
  const handleQRScan = async (data: string) => {
    console.log("QR Data received:", data)
    setShowScanner(false)

    try {
      setError("")
      setSuccess("")

      // Clean the data
      const cleanData = data.trim()

      let qrData
      let redeemCode = ""

      // Try to parse as JSON first (new format)
      try {
        qrData = JSON.parse(cleanData)
        if (qrData.redeemCode && qrData.sessionId) {
          console.log("Processing JSON QR data:", qrData)
          redeemCode = qrData.redeemCode

          // Use the sessionId and redeemCode from JSON
          await validateSession(qrData.sessionId, redeemCode)
          return
        }
      } catch (parseErr) {
        console.log("Data is not JSON, checking other formats...")
      }

      // Check if it's ITERA format (old format)
      if (cleanData.startsWith('ITERA') && cleanData.length > 13) {
        console.log("Processing ITERA format QR:", cleanData)

        // Find the session by qrCode field in database
        try {
          const response = await fetch('/api/admin/find-session-by-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ qrCode: cleanData })
          })

          if (response.ok) {
            const sessionData = await response.json()
            if (sessionData.session) {
              await validateSession(sessionData.session.id, sessionData.session.redeemCode)
              return
            }
          }
        } catch (err) {
          console.error("Error finding session by QR code:", err)
        }

        setError("Session tidak ditemukan untuk QR code ini")
        return
      }

      // Check if it's a direct redeem code (8 characters)
      if (/^[A-Z0-9]{8}$/.test(cleanData)) {
        console.log("Processing direct redeem code:", cleanData)
        await handleRedeemCodeValidation(cleanData)
        return
      }

      // If none of the formats match
      setError("Format QR code tidak dikenali")
      toast({ title: "QR Tidak Dikenali", description: "Format QR code tidak dikenali" })
      console.log("Unrecognized QR format:", cleanData)

    } catch (err) {
      console.error("QR scan error:", err)
      setError("Terjadi kesalahan saat memproses QR code")
      toast({ title: "Gagal", description: "Terjadi kesalahan saat memproses QR code" })
    }
  }

  const handleRedeemCodeValidation = async (redeemCode: string) => {
    try {
      // First find the session by redeem code
      const sessionData = await ApiClient.findSession({ redeemCode })

      if (sessionData.session) {
        await validateSession(sessionData.session.id, redeemCode)
      } else {
        setError("Kode redeem tidak ditemukan atau sudah divalidasi")
        toast({ title: "Gagal Validasi", description: "Kode redeem tidak ditemukan atau sudah divalidasi" })
      }
    } catch (err) {
      console.error("Redeem code validation error:", err)
      setError("Kode redeem tidak valid atau terjadi kesalahan")
      toast({ title: "Gagal Validasi", description: "Kode redeem tidak valid atau terjadi kesalahan" })
    }
  }

  const handleManualValidation = async () => {
    const code = manualCode.trim().toUpperCase()

    if (!code) {
      setError("Masukkan kode redeem")
      toast({ title: "Input Tidak Lengkap", description: "Masukkan kode redeem" })
      return
    }

    if (code.length !== 8) {
      setError("Kode redeem harus 8 karakter")
      toast({ title: "Format Salah", description: "Kode redeem harus 8 karakter" })
      return
    }

    await handleRedeemCodeValidation(code)
  }

  const handleScanError = (scanError: string) => {
    setError(`Scanner Error: ${scanError}`)
    toast({ title: "Scanner Error", description: scanError })
    console.error("Scanner error:", scanError)
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

  // Inline alerts removed in favor of toast popups

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full" />
          <div className="space-y-2">
            <p className="text-lg font-semibold">Memuat Dashboard Admin</p>
            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-7xl p-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Scan className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Sistem Validasi QR Code Pemilihan Presma</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-lg">{admin?.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {admin?.role}
                </Badge>
                <div className={`h-2 w-2 rounded-full ${showScanner ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  Scanner {showScanner ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="shadow-sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Alerts removed: using toast popups instead */}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Mahasiswa terdaftar</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingSessions.length}</div>
              <p className="text-xs text-muted-foreground">Menunggu validasi</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Tervalidasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalValidated}</div>
              <p className="text-xs text-muted-foreground">Total tervalidasi</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.todayValidations}</div>
              <p className="text-xs text-muted-foreground">Validasi hari ini</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sudah Voting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.totalVoted}</div>
              <p className="text-xs text-muted-foreground">Sudah memilih</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 shadow-sm">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scan QR Code
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Menunggu Validasi
              {pendingSessions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {pendingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Riwayat Validasi
            </TabsTrigger>
          </TabsList>

          {/* QR Scanner Tab */}
          <TabsContent value="scan" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* QR Scanner Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Scan QR Code
                  </CardTitle>
                  <CardDescription>
                    Gunakan kamera untuk memindai QR code mahasiswa yang ingin memilih
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!showScanner ? (
                      <div className="space-y-4">
                        <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                          <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground mb-4">Kamera belum aktif</p>
                        </div>
                        <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
                          <QrCode className="mr-2 h-5 w-5" />
                          Aktifkan Scanner
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Gunakan QRScannerTest dengan props yang benar */}
                        <QRScannerTest onScan={handleQRScan} onError={handleScanError} />
                        <Button
                          variant="outline"
                          onClick={() => setShowScanner(false)}
                          className="w-full"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Tutup Scanner
                        </Button>
                      </div>
                    )} 
                  </div>
                </CardContent>
              </Card>

              {/* Manual Input Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Input Manual
                  </CardTitle>
                  <CardDescription>
                    Masukkan kode redeem secara manual jika QR code tidak dapat dipindai
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-code">Kode Redeem</Label>
                      <Input
                        id="manual-code"
                        placeholder="Masukkan 8 karakter kode (contoh: ABC12345)"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        disabled={validating}
                        className="font-mono text-center text-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !validating && manualCode.trim() && manualCode.length === 8) {
                            handleManualValidation()
                          }
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Format: 8 karakter huruf/angka</span>
                        <span>{manualCode.length}/8</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleManualValidation}
                      disabled={validating || !manualCode.trim() || manualCode.length !== 8}
                      className="w-full"
                      size="lg"
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

            {/* Quick Instructions */}
            <Card className="shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Petunjuk Validasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Scan QR Code:
                    </h4>
                    <ul className="space-y-1 text-muted-foreground ml-6">
                      <li>• Aktifkan scanner kamera</li>
                      <li>• Arahkan ke QR code mahasiswa</li>
                      <li>• Tunggu hingga terdeteksi otomatis</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Input Manual:
                    </h4>
                    <ul className="space-y-1 text-muted-foreground ml-6">
                      <li>• Minta kode redeem dari mahasiswa</li>
                      <li>• Masukkan 8 karakter kode</li>
                      <li>• Tekan Enter atau klik tombol validasi</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Sessions Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      Menunggu Validasi ({filteredPendingSessions.length})
                    </CardTitle>
                    <CardDescription>
                      Daftar mahasiswa yang sudah generate QR code dan menunggu validasi
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadData} disabled={loading} className="shadow-sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan nama, NIM, atau kode redeem..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Mahasiswa</TableHead>
                          <TableHead className="font-semibold">Kode Redeem</TableHead>
                          <TableHead className="font-semibold">Dibuat</TableHead>
                          <TableHead className="font-semibold">Kadaluarsa</TableHead>
                          <TableHead className="font-semibold text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                              <div className="space-y-2">
                                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <p className="text-lg font-medium text-muted-foreground">
                                  {searchTerm ? "Tidak ada hasil pencarian" : "Tidak ada session pending"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {searchTerm
                                    ? "Coba kata kunci lain atau hapus filter pencarian"
                                    : "Semua mahasiswa sudah divalidasi atau belum ada yang generate QR"
                                  }
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPendingSessions.map((session) => (
                            <TableRow key={session.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">
                                    {session.user?.name || 'N/A'}
                                  </p>
                                  <div className="text-sm text-muted-foreground space-y-0.5">
                                    <p>NIM: {session.user?.nim || 'N/A'}</p>
                                    <p>Prodi: {session.user?.prodi || 'N/A'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                  {session.redeemCode}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDateTime(session.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`text-sm ${isExpired(session.expiresAt)
                                  ? 'text-red-600 font-semibold'
                                  : 'text-foreground'
                                  }`}>
                                  {formatDateTime(session.expiresAt)}
                                  {isExpired(session.expiresAt) && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Expired
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleRedeemCodeValidation(session.redeemCode)}
                                  disabled={validating || isExpired(session.expiresAt)}
                                  className="shadow-sm"
                                >
                                  {validating ? (
                                    <div className="mr-2 h-3 w-3 animate-spin border border-white border-t-transparent rounded-full" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  {isExpired(session.expiresAt) ? 'Expired' : 'Validasi'}
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
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Riwayat Validasi ({recentValidations.length})
                    </CardTitle>
                    <CardDescription>
                      50 validasi terakhir yang telah dilakukan oleh admin
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadData} disabled={loading} className="shadow-sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Mahasiswa</TableHead>
                        <TableHead className="font-semibold">Kode Redeem</TableHead>
                        <TableHead className="font-semibold">Dibuat</TableHead>
                        <TableHead className="font-semibold">Divalidasi</TableHead>
                        <TableHead className="font-semibold">Validator</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentValidations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="space-y-2">
                              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                              <p className="text-lg font-medium text-muted-foreground">
                                Belum ada validasi
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Riwayat validasi akan muncul di sini setelah admin memvalidasi QR code mahasiswa
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentValidations.map((session) => (
                          <TableRow key={session.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">
                                  {session.user?.name || 'N/A'}
                                </p>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                  <p>NIM: {session.user?.nim || 'N/A'}</p>
                                  <p>Prodi: {session.user?.prodi || 'N/A'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                {session.redeemCode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDateTime(session.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {session.updatedAt ? formatDateTime(session.updatedAt) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {session.validator?.name || admin?.name || 'N/A'}
                                </p>
                                {(session.validator?.role || admin?.role) && (
                                  <Badge variant="secondary" className="text-xs">
                                    {session.validator?.role || admin?.role}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center space-y-1">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 shadow-sm">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Tervalidasi
                                </Badge>
                                {session.isUsed && (
                                  <Badge variant="secondary" className="text-xs">
                                    Sudah Vote
                                  </Badge>
                                )}
                              </div>
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

        {/* Bottom Status Bar */}
        <Card className="mt-8 shadow-sm bg-gradient-to-r from-muted/30 to-muted/50">
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2 lg:space-y-0 lg:space-x-6 lg:flex lg:items-center">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Pending: <span className="font-bold">{pendingSessions.length}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Tervalidasi: <span className="font-bold">{stats.totalValidated}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Hari ini: <span className="font-bold">{stats.todayValidations}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${showScanner ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-muted-foreground">
                    QR Scanner {showScanner ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Auto-refresh setiap 15 detik</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Buttons for Mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden space-y-3">
          {activeTab === 'scan' && !showScanner && (
            <Button
              onClick={() => setShowScanner(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <QrCode className="h-6 w-6" />
            </Button>
          )}

          <Button
            onClick={loadData}
            variant="outline"
            size="lg"
            className="h-12 w-12 rounded-full shadow-lg bg-background"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading Overlay for actions */}
      {validating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 space-y-4 max-w-sm mx-4">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="font-semibold">Memvalidasi Session</p>
              <p className="text-sm text-muted-foreground">
                Mohon tunggu, sedang memproses validasi...
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}