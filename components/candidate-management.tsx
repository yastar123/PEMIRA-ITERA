import React, { useState, useEffect } from "react"
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

interface Candidate {
  id: string
  name: string
  nim: string
  prodi: string
  visi: string
  misi: string
  photo?: string
  isActive: boolean
  voteCount?: number
  createdAt: string
  updatedAt: string
}

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

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCandidates()
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const loadCandidates = async () => {
    try {
      setLoading(true)
      const data = await ApiClient.getCandidates()
      setCandidates(data.candidates || [])
    } catch (err) {
      console.error('Load candidates error:', err)
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) errors.name = 'Nama wajib diisi'
    if (!formData.nim.trim()) errors.nim = 'NIM wajib diisi'
    if (!formData.prodi.trim()) errors.prodi = 'Program Studi wajib diisi'
    if (!formData.visi.trim()) errors.visi = 'Visi wajib diisi'
    if (!formData.misi.trim()) errors.misi = 'Misi wajib diisi'

    // Validate NIM format (assuming it should be numeric and certain length)
    if (formData.nim.trim() && !/^\d+$/.test(formData.nim.trim())) {
      errors.nim = 'NIM harus berupa angka'
    }

    // Validate URL if photo is provided
    if (formData.photo.trim()) {
      try {
        new URL(formData.photo)
      } catch {
        errors.photo = 'URL foto tidak valid'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!validateForm()) {
      setError('Mohon perbaiki kesalahan pada form')
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      console.log('📤 Form submission:', { formData, editingCandidate })

      if (editingCandidate) {
        // Update existing candidate
        await ApiClient.updateCandidate(editingCandidate.id, formData)
        setSuccess("Kandidat berhasil diupdate")
      } else {
        // Create new candidate
        await ApiClient.createCandidate(formData)
        setSuccess("Kandidat berhasil ditambahkan")
      }

      // Reset form and close dialog
      resetForm()
      await loadCandidates()
    } catch (err) {
      console.error('Submit error:', err)
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
    setFormErrors({}) // Clear any previous errors
    setShowDialog(true)
  }

  const handleDelete = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId)
    if (!confirm(`Apakah Anda yakin ingin menghapus kandidat ${candidate?.name}?`)) return

    try {
      await ApiClient.deleteCandidate(candidateId)
      setSuccess("Kandidat berhasil dihapus")
      await loadCandidates()
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus kandidat")
    }
  }

  const toggleActive = async (candidateId: string, currentStatus: boolean) => {
    try {
      await ApiClient.updateCandidate(candidateId, { isActive: !currentStatus })
      setSuccess(`Kandidat berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`)
      await loadCandidates()
    } catch (err) {
      console.error('Toggle active error:', err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", nim: "", prodi: "", visi: "", misi: "", photo: "" })
    setFormErrors({})
    setEditingCandidate(null)
    setShowDialog(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
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
              <CardTitle>Manajemen Kandidat ({candidates.length})</CardTitle>
              <CardDescription>Kelola data kandidat presiden mahasiswa</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kandidat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCandidate ? "Edit Kandidat" : "Tambah Kandidat Baru"}</DialogTitle>
                  <DialogDescription>
                    {editingCandidate ? "Update informasi kandidat" : "Masukkan informasi kandidat baru"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className={formErrors.name ? 'border-red-500' : ''}
                      />
                      {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nim">NIM *</Label>
                      <Input
                        id="nim"
                        value={formData.nim}
                        onChange={(e) => handleInputChange('nim', e.target.value)}
                        placeholder="Masukkan NIM"
                        className={formErrors.nim ? 'border-red-500' : ''}
                      />
                      {formErrors.nim && <p className="text-sm text-red-500">{formErrors.nim}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prodi">Program Studi *</Label>
                    <Input
                      id="prodi"
                      value={formData.prodi}
                      onChange={(e) => handleInputChange('prodi', e.target.value)}
                      placeholder="Masukkan program studi"
                      className={formErrors.prodi ? 'border-red-500' : ''}
                    />
                    {formErrors.prodi && <p className="text-sm text-red-500">{formErrors.prodi}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photo">URL Foto</Label>
                    <Input
                      id="photo"
                      type="url"
                      value={formData.photo}
                      onChange={(e) => handleInputChange('photo', e.target.value)}
                      placeholder="https://example.com/photo.jpg (opsional)"
                      className={formErrors.photo ? 'border-red-500' : ''}
                    />
                    {formErrors.photo && <p className="text-sm text-red-500">{formErrors.photo}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="visi">Visi *</Label>
                    <Textarea
                      id="visi"
                      value={formData.visi}
                      onChange={(e) => handleInputChange('visi', e.target.value)}
                      rows={3}
                      placeholder="Masukkan visi kandidat"
                      className={formErrors.visi ? 'border-red-500' : ''}
                    />
                    {formErrors.visi && <p className="text-sm text-red-500">{formErrors.visi}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="misi">Misi *</Label>
                    <Textarea
                      id="misi"
                      value={formData.misi}
                      onChange={(e) => handleInputChange('misi', e.target.value)}
                      rows={4}
                      placeholder="Masukkan misi kandidat"
                      className={formErrors.misi ? 'border-red-500' : ''}
                    />
                    {formErrors.misi && <p className="text-sm text-red-500">{formErrors.misi}</p>}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Menyimpan...
                      </>
                    ) : (
                      editingCandidate ? "Update" : "Tambah"
                    )}
                  </Button>
                </DialogFooter>
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
                  <TableHead className="text-center">Aksi</TableHead>
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
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                            {candidate.photo ? (
                              <img
                                src={candidate.photo}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {candidate.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{candidate.name}</p>
                            {candidate.voteCount !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                {candidate.voteCount} suara
                              </p>
                            )}
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
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(candidate)}
                            title="Edit kandidat"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(candidate.id, candidate.isActive)}
                            title={candidate.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {candidate.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(candidate.id)}
                            title="Hapus kandidat"
                            className="text-red-600 hover:text-red-700"
                          >
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