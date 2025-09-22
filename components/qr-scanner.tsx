"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onError: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState("")
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

  const loadJsQR = async () => {
    try {
      // Try to import jsQR
      if (typeof window !== 'undefined') {
        // Check if jsQR is available via CDN first
        if ((window as any).jsQR) {
          return (window as any).jsQR
        }
        
        // Try dynamic import
        const jsQR = (await import('jsqr')).default
        return jsQR
      }
      throw new Error('Window not available')
    } catch (err) {
      console.error('Failed to load jsQR:', err)
      throw new Error('QR Scanner library not available. Please install jsqr: npm install jsqr')
    }
  }

  const startCamera = async () => {
    try {
      setError("")
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by this browser')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        setIsScanning(true)
        startScanning()
      }
    } catch (err) {
      console.error('Camera error:', err)
      let errorMessage = "Tidak dapat mengakses kamera"
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Izin kamera ditolak. Silakan izinkan akses kamera dan coba lagi."
        } else if (err.name === 'NotFoundError') {
          errorMessage = "Kamera tidak ditemukan pada perangkat ini."
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Kamera sedang digunakan oleh aplikasi lain."
        }
      }
      
      setError(errorMessage)
      onError(errorMessage)
    }
  }

  const stopCamera = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    setIsScanning(false)
  }

  const startScanning = async () => {
    try {
      const jsQR = await loadJsQR()
      
      const scanFrame = () => {
        if (videoRef.current && canvasRef.current && isScanning) {
          const video = videoRef.current
          const canvas = canvasRef.current
          const context = canvas.getContext("2d")

          if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            
            try {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              })

              if (code && code.data) {
                console.log("QR Code detected:", code.data)
                
                // Validate that this looks like a valid QR code for our system
                if (code.data.startsWith('ITERA') || code.data.length >= 8) {
                  onScan(code.data)
                  stopCamera()
                  return
                }
              }
            } catch (err) {
              console.error("QR scanning error:", err)
            }
          }
        }

        // Continue scanning if still active
        if (isScanning) {
          scanIntervalRef.current = setTimeout(scanFrame, 100) // Check every 100ms
        }
      }

      // Start the scanning loop
      scanFrame()
      
    } catch (err) {
      console.error("Failed to initialize QR scanner:", err)
      setError("Gagal menginisialisasi scanner QR")
      onError("Gagal menginisialisasi scanner QR")
    }
  }

  // Stop scanning when isScanning changes to false
  useEffect(() => {
    if (!isScanning && scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }, [isScanning])

  const handleManualInput = () => {
    // For demo purposes, simulate a successful QR scan
    // Generate a valid-looking ITERA QR code for testing
    const timestamp = Date.now().toString()
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
    const mockQRData = `ITERA${timestamp}${randomString}`
    onScan(mockQRData)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <video
          ref={videoRef}
          className="w-full max-w-md mx-auto rounded-lg bg-black"
          style={{ aspectRatio: "1/1" }}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-primary rounded-lg">
              <div className="w-full h-full border border-dashed border-primary/50 rounded-lg animate-pulse" />
            </div>
          </div>
        )}

        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Kamera tidak aktif</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {isScanning ? (
          <Button variant="outline" onClick={stopCamera}>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Camera
          </Button>
        ) : (
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        )}

        {/* Demo button for testing - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button variant="secondary" onClick={handleManualInput}>
            Demo Scan
          </Button>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Arahkan kamera ke QR code mahasiswa</p>
        <p>Pastikan QR code berada dalam frame kotak</p>
        <p className="text-xs mt-1">
          Pastikan pencahayaan cukup dan QR code tidak buram
        </p>
      </div>
    </div>
  )
}
