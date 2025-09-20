"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { Candidate } from "@/lib/types"

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    prodi: "",
    visi: "",
    misi: "",
    photo: "",
  })

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      const data = await ApiClient.getCandidates()
      setCandidates(data.candidates || [])
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (editingCandidate) {
        // Update existing candidate
        await ApiClient.updateCandidate(editingCandidate.id, formData)
        setSuccess("Kandidat berhasil diupdate")
      } else {
        // Create new candidate
        await ApiClient.createCandidate(formData)
        setSuccess("Kandidat berhasil ditambahkan")
      }

      setShowDialog(false)
      setEditingCandidate(null)
      setFormData({ name: "", nim: "", prodi: "", visi: "", misi: "", photo: "" })
      await loadCandidates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setFormData({
      name: candidate.name,
      nim: candidate.nim,
      prodi: candidate.prodi,
      visi: candidate.visi,
      misi: candidate.misi,
      photo: candidate.photo || "",
    })
    setShowDialog(true)
  }

  const handleDelete = async (candidateId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) return

    try {
      await ApiClient.deleteCandidate(candidateId)
      setSuccess("Kandidat berhasil dihapus")
      await loadCandidates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus kandidat")
    }
  }

  const toggleActive = async (candidateId: string, currentStatus: boolean) => {
    try {
      await ApiClient.updateCandidate(candidateId, { isActive: !currentStatus })
      setSuccess(`Kandidat berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`)
      await loadCandidates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", nim: "", prodi: "", visi: "", misi: "", photo: "" })
    setEditingCandidate(null)
    setShowDialog(false)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
        <p>Memuat data kandidat...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Kandidat</CardTitle>
              <CardDescription>Kelola data kandidat presiden mahasiswa</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kandidat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCandidate ? "Edit Kandidat" : "Tambah Kandidat Baru"}</DialogTitle>
                  <DialogDescription>
                    {editingCandidate ? "Update informasi kandidat" : "Masukkan informasi kandidat baru"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nim">NIM *</Label>
                        <Input
                          id="nim"
                          value={formData.nim}
                          onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prodi">Program Studi *</Label>
                      <Input
                        id="prodi"
                        value={formData.prodi}
                        onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo">URL Foto</Label>
                      <Input
                        id="photo"
                        type="url"
                        value={formData.photo}
                        onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visi">Visi *</Label>
                      <Textarea
                        id="visi"
                        value={formData.visi}
                        onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="misi">Misi *</Label>
                      <Textarea
                        id="misi"
                        value={formData.misi}
                        onChange={(e) => setFormData({ ...formData, misi: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Menyimpan..." : editingCandidate ? "Update" : "Tambah"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kandidat</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada kandidat yang terdaftar
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10">
                            <img
                              src={candidate.photo || "/placeholder.svg?height=40&width=40"}
                              alt={candidate.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{candidate.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.nim}</TableCell>
                      <TableCell>{candidate.prodi}</TableCell>
                      <TableCell>
                        <Badge variant={candidate.isActive ? "default" : "secondary"}>
                          {candidate.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(candidate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(candidate.id, candidate.isActive)}
                          >
                            {candidate.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(candidate.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}
