"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Shield, Users, Vote, TrendingUp, Clock, AlertCircle, LogOut, RefreshCw, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import CandidateManagement from "@/components/candidate-management"
import UserManagement from "@/components/user-management"
import SystemSettings from "@/components/system-settings"

interface DashboardStats {
  totalUsers: number
  totalVotes: number
  totalCandidates: number
  pendingValidations: number
  votingPercentage: number
}

interface VoteStats {
  candidateId: string
  candidateName: string
  voteCount: number
  percentage: number
}

export default function SuperAdminPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVotes: 0,
    totalCandidates: 0,
    pendingValidations: 0,
    votingPercentage: 0,
  })
  const [voteStats, setVoteStats] = useState<VoteStats[]>([])
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await ApiClient.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        if (user.role !== "SUPER_ADMIN") {
          router.push("/")
          return
        }

        setAdmin(user)
        await loadDashboardData()
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
      loadDashboardData()
    }, 15000) // Refresh every 15 seconds

    return () => {
      clearInterval(interval)
    }
  }, [router])

  const loadDashboardData = async () => {
    try {
      // We'll use the stats API endpoint
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setVoteStats(data.voteStats || [])
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err)
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

  const exportData = async (type: "users" | "votes" | "all") => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        setError("Gagal mengekspor data")
      }
    } catch (err) {
      setError("Gagal mengekspor data")
    }
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "object" ? JSON.stringify(value) : value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p>Memuat dashboard super admin...</p>
        </div>
      </div>
    )
  }

  const COLORS = ["#6366f1", "#4b5563", "#ea580c", "#0891b2", "#374151"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="container mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Super Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manajemen Sistem Pemilihan</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Kandidat</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pemilih</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Mahasiswa terdaftar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVotes}</div>
                  <p className="text-xs text-muted-foreground">Suara masuk</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partisipasi</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.votingPercentage}%</div>
                  <p className="text-xs text-muted-foreground">Tingkat partisipasi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingValidations}</div>
                  <p className="text-xs text-muted-foreground">Menunggu validasi</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Perolehan Suara per Kandidat</CardTitle>
                  <CardDescription>Distribusi suara real-time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={voteStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="candidateName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="voteCount" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Persentase Suara</CardTitle>
                  <CardDescription>Proporsi suara per kandidat</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={voteStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ candidateName, percentage }) => `${candidateName}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="voteCount"
                      >
                        {voteStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Hasil</CardTitle>
                <CardDescription>Perolehan suara terkini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {voteStats.map((candidate, index) => (
                    <div key={candidate.candidateId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{candidate.candidateName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{candidate.voteCount} suara</Badge>
                        <Badge variant="outline">{candidate.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates">
            <CandidateManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>Download data pemilihan dalam format CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button onClick={() => exportData("users")} variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Export Data Pemilih
                  </Button>
                  <Button onClick={() => exportData("votes")} variant="outline" className="w-full">
                    <Vote className="mr-2 h-4 w-4" />
                    Export Data Voting
                  </Button>
                  <Button onClick={() => exportData("all")} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export Semua Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Lengkap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Statistik Pemilih</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Mahasiswa Terdaftar:</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sudah Memberikan Suara:</span>
                        <span className="font-medium">{stats.totalVotes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Belum Memberikan Suara:</span>
                        <span className="font-medium">{stats.totalUsers - stats.totalVotes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tingkat Partisipasi:</span>
                        <span className="font-medium">{stats.votingPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Statistik Kandidat</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Kandidat Aktif:</span>
                        <span className="font-medium">{stats.totalCandidates}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Suara Masuk:</span>
                        <span className="font-medium">{stats.totalVotes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Validasi:</span>
                        <span className="font-medium">{stats.pendingValidations}</span>
                      </div>
                    </div>
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
