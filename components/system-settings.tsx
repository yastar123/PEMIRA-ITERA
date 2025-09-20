"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SystemSetting {
  key: string
  value: string
  description?: string
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("Settings").select("*").order("key")

      if (error) {
        setError("Gagal memuat pengaturan sistem")
        return
      }

      setSettings(data || [])
    } catch (err) {
      setError("Terjadi kesalahan saat memuat pengaturan")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase.from("Settings").update({ value }).eq("key", key)

      if (error) {
        setError("Gagal mengupdate pengaturan: " + error.message)
        return
      }

      // Update local state
      setSettings((prev) => prev.map((setting) => (setting.key === key ? { ...setting, value } : setting)))
    } catch (err) {
      setError("Terjadi kesalahan saat mengupdate pengaturan")
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Update all settings
      for (const setting of settings) {
        const { error } = await supabase.from("Settings").update({ value: setting.value }).eq("key", setting.key)

        if (error) {
          setError("Gagal menyimpan pengaturan: " + error.message)
          return
        }
      }

      setSuccess("Semua pengaturan berhasil disimpan")
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value || ""
  }

  const updateLocalSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((setting) => (setting.key === key ? { ...setting, value } : setting)))
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
        <p>Memuat pengaturan sistem...</p>
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
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan Sistem
              </CardTitle>
              <CardDescription>Konfigurasi sistem pemilihan</CardDescription>
            </div>
            <Button onClick={handleSaveAll} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Semua"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Voting Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kontrol Voting</h3>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktifkan Voting</Label>
                    <p className="text-sm text-muted-foreground">Mengizinkan mahasiswa untuk memberikan suara</p>
                  </div>
                  <Switch
                    checked={getSetting("voting_enabled") === "true"}
                    onCheckedChange={(checked) => updateLocalSetting("voting_enabled", checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktifkan Registrasi</Label>
                    <p className="text-sm text-muted-foreground">
                      Mengizinkan mahasiswa untuk mendaftar sebagai pemilih
                    </p>
                  </div>
                  <Switch
                    checked={getSetting("registration_enabled") === "true"}
                    onCheckedChange={(checked) => updateLocalSetting("registration_enabled", checked.toString())}
                  />
                </div>
              </div>
            </div>

            {/* Voting Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Periode Voting</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voting_start">Tanggal Mulai</Label>
                  <Input
                    id="voting_start"
                    type="datetime-local"
                    value={getSetting("voting_start_date").replace("Z", "")}
                    onChange={(e) => updateLocalSetting("voting_start_date", e.target.value + "Z")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voting_end">Tanggal Berakhir</Label>
                  <Input
                    id="voting_end"
                    type="datetime-local"
                    value={getSetting("voting_end_date").replace("Z", "")}
                    onChange={(e) => updateLocalSetting("voting_end_date", e.target.value + "Z")}
                  />
                </div>
              </div>
            </div>

            {/* QR Code Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pengaturan QR Code</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qr_expiry">Waktu Expired QR (menit)</Label>
                  <Input
                    id="qr_expiry"
                    type="number"
                    min="1"
                    max="60"
                    value={getSetting("qr_expiry_minutes")}
                    onChange={(e) => updateLocalSetting("qr_expiry_minutes", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">QR code akan expired setelah waktu ini</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_votes">Maksimal Vote per User</Label>
                  <Input
                    id="max_votes"
                    type="number"
                    min="1"
                    max="5"
                    value={getSetting("max_votes_per_user")}
                    onChange={(e) => updateLocalSetting("max_votes_per_user", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Jumlah maksimal vote yang dapat diberikan per user</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status Sistem</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {getSetting("voting_enabled") === "true" ? "AKTIF" : "NONAKTIF"}
                      </div>
                      <p className="text-sm text-muted-foreground">Status Voting</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getSetting("registration_enabled") === "true" ? "AKTIF" : "NONAKTIF"}
                      </div>
                      <p className="text-sm text-muted-foreground">Status Registrasi</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
