import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Vote, Users, Shield, Clock } from "@/lib/icons"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Vote className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">ITERA Election</h1>
                <p className="text-sm text-muted-foreground">Pemilihan Presiden Mahasiswa</p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Pemilihan Presiden Mahasiswa 2024
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 text-foreground">
            Suaramu, <span className="text-primary">Masa Depan</span> ITERA
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-8">
            Berpartisipasilah dalam pemilihan presiden mahasiswa ITERA 2024. Pilih pemimpin yang akan membawa perubahan
            positif untuk kampus kita.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Mulai Voting
                <Vote className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Aman & Terpercaya</CardTitle>
              <CardDescription>Sistem voting dengan keamanan tinggi dan verifikasi berlapis</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Mudah Digunakan</CardTitle>
              <CardDescription>Interface yang sederhana dan mudah dipahami untuk semua mahasiswa</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Real-time</CardTitle>
              <CardDescription>Hasil voting dapat dipantau secara real-time dengan transparansi penuh</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cara Voting</CardTitle>
            <CardDescription>Ikuti langkah-langkah sederhana berikut untuk memberikan suara Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Login</h3>
                <p className="text-sm text-muted-foreground">Masuk dengan akun mahasiswa ITERA Anda</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Registrasi</h3>
                <p className="text-sm text-muted-foreground">Lengkapi data diri dan dapatkan kode QR</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Validasi</h3>
                <p className="text-sm text-muted-foreground">Tunjukkan QR code ke panitia untuk validasi</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2">Vote</h3>
                <p className="text-sm text-muted-foreground">Pilih kandidat favorit Anda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Siap Memberikan Suara?</h2>
              <p className="text-lg mb-6 opacity-90">
                Bergabunglah dengan ribuan mahasiswa ITERA lainnya dalam menentukan masa depan kampus
              </p>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Mulai Sekarang
                  <Vote className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Institut Teknologi Sumatera. All rights reserved.</p>
            <p className="text-sm mt-2">Sistem Pemilihan Presiden Mahasiswa ITERA</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
