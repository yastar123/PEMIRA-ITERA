"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Vote, TrendingUp, Clock, RefreshCw, AlertCircle, LogOut, Server, Activity } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DashboardStats {
  totalUsers: number
  totalVotes: number
  totalCandidates: number
  pendingValidations: number
  votingPercentage: number
}

interface VoteStatsItem {
  candidateId: string
  candidateName: string
  voteCount: number
  percentage: number
}

interface SystemStatusPayload {
  serverTime: string
  nodeVersion: string
  environment: string
  requestDurationMs: number
  database: { ok: boolean; latencyMs: number }
  stats: { totalUsers: number; totalVotes: number; totalCandidates: number; pendingValidations: number }
  runtime: { uptimeSec: number; memory: { rss: number; heapUsed: number; heapTotal: number } | null }
}

export default function MonitoringPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVotes: 0,
    totalCandidates: 0,
    pendingValidations: 0,
    votingPercentage: 0,
  })
  const [voteStats, setVoteStats] = useState<VoteStatsItem[]>([])
  const [recentValidations, setRecentValidations] = useState<any[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatusPayload | null>(null)
  const [logs, setLogs] = useState<any[]>([])

  // Helpers (user-friendly formatters)
  const nf = new Intl.NumberFormat('id-ID')
  const pf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
  const formatDate = (v?: string | Date) => {
    if (!v) return '-'
    const d = typeof v === 'string' ? new Date(v) : v
    return d.toLocaleString('id-ID', { hour12: false })
  }
  const formatMinutes = (s?: number) => {
    if (!s && s !== 0) return '-'
    const m = Math.floor((s || 0) / 60)
    const h = Math.floor(m / 60)
    const rem = m % 60
    return h > 0 ? `${h} jam ${rem} mnt` : `${m} mnt`
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await ApiClient.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        const role = String(user.role)
        if (!(role === "SUPER_ADMIN" || role === "MONITORING")) {
          router.push("/")
          return
        }
        setUser(user)
        await Promise.all([loadStats(), loadRecentValidations(), loadSystemStatus(), loadLogs()])
      } catch (e) {
        console.error(e)
        setError("Terjadi kesalahan saat memuat data monitoring")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    init()

    const interval = setInterval(() => {
      loadStats()
      loadRecentValidations()
      loadSystemStatus()
      loadLogs()
    }, 15000)

    return () => clearInterval(interval)
  }, [router])

  const loadStats = async () => {
    try {
      const res = await ApiClient.getMonitoringStats()
      setStats(res.stats)
      setVoteStats(res.voteStats || [])
    } catch (e) {
      console.warn("Failed loading stats", e)
    }
  }

  const loadRecentValidations = async () => {
    try {
      const res = await ApiClient.getMonitoringRecentValidations()
      setRecentValidations(res.sessions || [])
    } catch (e) {
      console.warn("Failed loading recent validations", e)
    }
  }

  const loadSystemStatus = async () => {
    try {
      const res = await ApiClient.getMonitoringSystemStatus()
      setSystemStatus(res)
    } catch (e) {
      console.warn("Failed loading system status", e)
    }
  }

  const loadLogs = async () => {
    try {
      const res = await ApiClient.getMonitoringLogs()
      setLogs(res.logs || [])
    } catch (e) {
      console.warn("Failed loading logs", e)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p>Memuat halaman monitoring...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Monitoring Dashboard</h1>
              <p className="text-sm text-muted-foreground">Pantau kondisi sistem dan aktivitas secara sederhana dan mudah dipahami</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => { loadStats(); loadRecentValidations(); loadSystemStatus(); loadLogs() }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.role}</p>
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="validations">Validasi</TabsTrigger>
            <TabsTrigger value="charts">Grafik</TabsTrigger>
            <TabsTrigger value="system">Status Sistem</TabsTrigger>
            <TabsTrigger value="logs">Aktivitas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pemilih</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{nf.format(stats.totalUsers)}</div>
                  <p className="text-xs text-muted-foreground">Jumlah mahasiswa yang terdaftar sebagai pemilih</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{nf.format(stats.totalVotes)}</div>
                  <p className="text-xs text-muted-foreground">Total suara yang sudah masuk</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partisipasi</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pf.format(stats.votingPercentage)}%</div>
                  <p className="text-xs text-muted-foreground">Persentase pemilih yang sudah memberikan suara</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{nf.format(stats.pendingValidations)}</div>
                  <p className="text-xs text-muted-foreground">Kode voting yang masih menunggu validasi</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perolehan Suara per Kandidat</CardTitle>
                <CardDescription>Semakin tinggi batang, semakin banyak suara yang diterima kandidat</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={voteStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="candidateName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Jumlah Suara" dataKey="voteCount" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validasi Terbaru</CardTitle>
                <CardDescription>Daftar pemilih yang baru saja divalidasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 px-1 py-2 text-xs text-muted-foreground">
                    <div>Nama Pemilih</div>
                    <div>NIM</div>
                    <div className="hidden md:block">Validator</div>
                    <div>Waktu</div>
                  </div>
                  <div className="divide-y">
                    {recentValidations.map((s) => (
                      <div key={s.id} className="grid grid-cols-3 md:grid-cols-4 gap-3 px-1 py-3 items-center">
                        <div className="font-medium truncate">{s.user?.name || '-'}</div>
                        <div className="truncate">{s.user?.nim || '-'}</div>
                        <div className="hidden md:block truncate">{s.validator?.name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</div>
                      </div>
                    ))}
                    {recentValidations.length === 0 && (
                      <div className="text-sm text-muted-foreground px-1 py-3">Belum ada validasi.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Status Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2"><Server className="h-4 w-4"/>Kondisi Sistem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Status Sistem</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${systemStatus?.database?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {systemStatus?.database?.ok ? 'Sehat' : 'Gangguan'}
                      </span>
                    </div>
                    <div className="flex justify-between"><span>Waktu Server</span><span className="font-medium">{systemStatus ? formatDate(systemStatus.serverTime) : '-'}</span></div>
                    <div className="flex justify-between"><span>Versi Sistem</span><span className="font-medium">{systemStatus?.nodeVersion || '-'}</span></div>
                    <div className="flex justify-between"><span>Uptime</span><span className="font-medium">{formatMinutes(systemStatus?.runtime?.uptimeSec)}</span></div>
                    <div className="flex justify-between"><span>Respon Permintaan</span><span className="font-medium">{systemStatus?.requestDurationMs ?? '-'} ms</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Basis Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${systemStatus?.database?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {systemStatus?.database?.ok ? 'Normal' : 'Gangguan'}
                      </span>
                    </div>
                    <div className="flex justify-between"><span>Respon Basis Data</span><span className="font-medium">{systemStatus?.database?.latencyMs ?? '-'} ms</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Penggunaan Memori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Total</span><span className="font-medium">{systemStatus?.runtime?.memory ? nf.format(Math.round(systemStatus.runtime.memory.rss/1024/1024)) : 0} MB</span></div>
                    <div className="flex justify-between"><span>Terpakai</span><span className="font-medium">{systemStatus?.runtime?.memory ? nf.format(Math.round(systemStatus.runtime.memory.heapUsed/1024/1024)) : 0} MB</span></div>
                    <div className="flex justify-between"><span>Tersedia</span><span className="font-medium">{systemStatus?.runtime?.memory ? nf.format(Math.max(0, Math.round((systemStatus.runtime.memory.heapTotal - systemStatus.runtime.memory.heapUsed)/1024/1024))) : 0} MB</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Data</CardTitle>
                <CardDescription>Status basis data saat ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Users</span><span className="font-medium">{systemStatus?.stats.totalUsers ?? '-'}</span></div>
                    <div className="flex justify-between"><span>Total Votes</span><span className="font-medium">{systemStatus?.stats.totalVotes ?? '-'}</span></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Candidates</span><span className="font-medium">{systemStatus?.stats.totalCandidates ?? '-'}</span></div>
                    <div className="flex justify-between"><span>Pending Validations</span><span className="font-medium">{systemStatus?.stats.pendingValidations ?? '-'}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/>Aktivitas Terbaru</CardTitle>
                <CardDescription>Ringkasan 100 aktivitas terakhir (login, validasi, dan lainnya)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 px-1 py-2 text-xs text-muted-foreground">
                    <div>Waktu</div>
                    <div>Aktivitas</div>
                    <div>Pelaku</div>
                    <div className="hidden md:block">Target</div>
                    <div className="hidden md:block">IP</div>
                  </div>
                  <div className="divide-y">
                    {logs.map((log: any) => (
                      <div key={log.id} className="grid grid-cols-3 md:grid-cols-5 gap-3 px-1 py-3 items-center">
                        <div className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</div>
                        <div className="font-medium truncate">{log.action}</div>
                        <div className="truncate">
                          <span className="mr-2">{log.admin?.name || 'Tidak diketahui'}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-muted">{log.admin?.role}</span>
                        </div>
                        <div className="hidden md:block truncate">{log.target || '-'}</div>
                        <div className="hidden md:block truncate">{log.ipAddress || '-'}</div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-sm text-muted-foreground px-1 py-3">Belum ada aktivitas.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
