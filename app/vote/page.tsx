"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Vote, User, CheckCircle, Loader2, AlertCircle, Eye } from "@/lib/icons"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getMockUser, mockDatabase } from "@/lib/mock-auth"

interface Candidate {
  id: string
  name: string
  nim: string
  prodi: string
  visi: string
  misi: string
  photo?: string
  isActive: boolean
}

export default function VotePage() {
  const [user, setUser] = useState<any>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
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

        // Check if user has validated voting session
        if (
          !mockDatabase.votingSession ||
          !mockDatabase.votingSession.isValidated ||
          mockDatabase.votingSession.isUsed
        ) {
          router.push("/generate-code")
          return
        }

        setUser(mockUser)

        // Load candidates from mock database
        setCandidates(mockDatabase.candidates.filter((c) => c.isActive))
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  const handleVoteSubmit = async () => {
    if (!selectedCandidate || !user) return

    setVoting(true)
    setError("")

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Submit vote using mock database
      const success = mockDatabase.submitVote(selectedCandidate)

      if (!success) {
        setError("Gagal menyimpan vote")
        setVoting(false)
        return
      }

      // Success - redirect to success page
      router.push("/success")
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan vote")
      setVoting(false)
    }
  }

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidate(candidateId)
  }

  const handleShowDetail = (candidate: Candidate) => {
    setDetailCandidate(candidate)
    setShowDetailDialog(true)
  }

  const handleConfirmVote = () => {
    if (!selectedCandidate) return
    setShowConfirmDialog(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data kandidat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Vote className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-xl text-foreground">ITERA Election</h1>
              <p className="text-sm text-muted-foreground">Pilih Kandidat</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voter Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pemilih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Petunjuk Voting:</strong> Pilih salah satu kandidat di bawah ini dengan mengklik kartu kandidat.
            Setelah memilih, klik tombol "Vote" untuk mengonfirmasi pilihan Anda. Pilihan tidak dapat diubah setelah
            dikonfirmasi.
          </AlertDescription>
        </Alert>

        {/* Candidates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedCandidate === candidate.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
              }`}
              onClick={() => handleCandidateSelect(candidate.id)}
            >
              <CardHeader className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={candidate.photo || "/placeholder.svg?height=128&width=128"}
                    alt={candidate.name}
                    fill
                    className="rounded-full object-cover"
                  />
                  {selectedCandidate === candidate.id && (
                    <div className="absolute -top-2 -right-2">
                      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{candidate.name}</CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <p>NIM: {candidate.nim}</p>
                    <p>{candidate.prodi}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Visi:</p>
                    <p className="text-sm line-clamp-3">{candidate.visi}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShowDetail(candidate)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vote Button */}
        <div className="text-center">
          <Button size="lg" onClick={handleConfirmVote} disabled={!selectedCandidate || voting} className="min-w-48">
            {voting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan Vote...
              </>
            ) : (
              <>
                <Vote className="mr-2 h-5 w-5" />
                Vote Sekarang
              </>
            )}
          </Button>
          {selectedCandidate && (
            <p className="text-sm text-muted-foreground mt-2">
              Anda akan memilih: <strong>{candidates.find((c) => c.id === selectedCandidate)?.name}</strong>
            </p>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pilihan</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin memilih kandidat berikut? Pilihan tidak dapat diubah setelah dikonfirmasi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedCandidate && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={
                            candidates.find((c) => c.id === selectedCandidate)?.photo ||
                            "/placeholder.svg?height=64&width=64" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={candidates.find((c) => c.id === selectedCandidate)?.name || ""}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {candidates.find((c) => c.id === selectedCandidate)?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {candidates.find((c) => c.id === selectedCandidate)?.nim} •{" "}
                          {candidates.find((c) => c.id === selectedCandidate)?.prodi}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleVoteSubmit} disabled={voting}>
                {voting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Ya, Vote Sekarang"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Kandidat</DialogTitle>
            </DialogHeader>
            {detailCandidate && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <Image
                      src={detailCandidate.photo || "/placeholder.svg?height=96&width=96"}
                      alt={detailCandidate.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{detailCandidate.name}</h3>
                    <p className="text-muted-foreground">
                      NIM: {detailCandidate.nim} • {detailCandidate.prodi}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Visi</h4>
                    <p className="text-sm leading-relaxed">{detailCandidate.visi}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Misi</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{detailCandidate.misi}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Tutup
              </Button>
              {detailCandidate && (
                <Button
                  onClick={() => {
                    handleCandidateSelect(detailCandidate.id)
                    setShowDetailDialog(false)
                  }}
                >
                  Pilih Kandidat Ini
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
