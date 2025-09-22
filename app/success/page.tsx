"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Vote, User, Calendar, LogOut, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface User {
  id: string
  name: string
  email: string
  nim: string
  hasVoted: boolean
}

interface VoteData {
  id: string
  candidateName: string
  candidateNim: string
  createdAt: string
}

interface VotingStats {
  candidateId: string
  candidateName: string
  voteCount: number
  percentage: string
}

export default function SuccessPage() {
  const [user, setUser] = useState<User | null>(null)
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [votingStats, setVotingStats] = useState<VotingStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!authResponse.ok) {
          router.push("/login")
          return
        }

        const userData = await authResponse.json()
        
        if (!userData.user?.hasVoted) {
          router.push("/generate-code")
          return
        }

        setUser(userData.user)

        // Get voting status including vote data
        const statusResponse = await fetch('/api/voting-status', {
          method: 'GET',
          credentials: 'include',
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.vote) {
            setVoteData(statusData.vote)
          }
        }

        // Get voting statistics
        const statsResponse = await fetch('/api/vote', {
          method: 'GET',
          credentials: 'include',
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setVotingStats(statsData.stats || [])
        }

      } catch (err) {
        console.error("Error loading data:", err)
        setError("Terjadi kesalahan saat memuat data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    try {
      // Call logout API if you have one, or just clear cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      // Redirect regardless of logout API response
      router.push("/")
    } catch (err) {
      // Still redirect even if logout fails
      router.push("/")
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Kembali ke Beranda
          </Button>
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
            <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Vote Berhasil</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Success Message */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800">Vote Berhasil Disimpan!</CardTitle>
              <CardDescription className="text-green-700">
                Terima kasih telah berpartisipasi dalam Pemilihan Presiden Mahasiswa ITERA 2024
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Vote Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Ringkasan Vote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pemilih</p>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu Vote</p>
                    <p className="font-semibold">
                      {voteData?.createdAt
                        ? new Date(voteData.createdAt).toLocaleString("id-ID", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })
                        : new Date().toLocaleString("id-ID", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                    </p>
                  </div>
                </div>

                {voteData && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Kandidat yang Dipilih</p>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="relative w-16 h-16">
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{voteData.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">
                          NIM: {voteData.candidateNim}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Status Pemilih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Status Vote</p>
                  <p className="text-sm text-muted-foreground">Anda telah berhasil memberikan suara</p>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Sudah Vote
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Voting Results Preview */}
          {votingStats.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Hasil Sementara</CardTitle>
                <CardDescription className="text-blue-600">
                  Data real-time dari sistem voting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {votingStats
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((candidate, index) => (
                      <div key={candidate.candidateId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-800">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{candidate.candidateName}</p>
                            <p className="text-xs text-muted-foreground">{candidate.percentage}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-800">{candidate.voteCount}</p>
                          <p className="text-xs text-muted-foreground">suara</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Informasi Penting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-yellow-700">
                <p>• Vote Anda telah tersimpan dengan aman dalam sistem</p>
                <p>• Identitas pemilih dijaga kerahasiaan sesuai prinsip pemilu</p>
                <p>• Hasil pemilihan akan diumumkan setelah periode voting berakhir</p>
                <p>• Terima kasih atas partisipasi Anda dalam demokrasi kampus</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
            <Button onClick={handleLogout} variant="secondary" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>Pemilihan Presiden Mahasiswa ITERA 2024</p>
            <p>Sistem Voting Digital - Institut Teknologi Sumatera</p>
          </div>
        </div>
      </div>
    </div>
  )
}