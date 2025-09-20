"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "@/lib/icons"

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

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setIsScanning(true)
        startScanning()
      }
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.")
      onError("Tidak dapat mengakses kamera")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    const scanInterval = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanning) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Simple QR code detection simulation
          // In a real implementation, you would use a QR code library like jsQR
          try {
            // This is a placeholder - you would integrate with jsQR or similar library
            // For demo purposes, we'll simulate QR detection
            const mockQRData = detectMockQR(imageData)
            if (mockQRData) {
              onScan(mockQRData)
              clearInterval(scanInterval)
              stopCamera()
            }
          } catch (err) {
            // Continue scanning
          }
        }
      }
    }, 500)

    return () => clearInterval(scanInterval)
  }

  // Mock QR detection for demo purposes
  // In production, replace this with actual QR code detection library
  const detectMockQR = (imageData: ImageData): string | null => {
    // This is just a placeholder
    // In real implementation, use jsQR library:
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // return code ? code.data : null;
    return null
  }

  const handleManualInput = () => {
    // For demo purposes, simulate a successful QR scan
    const mockQRData = JSON.stringify({
      userId: "demo-user-id",
      redeemCode: "DEMO1234",
      timestamp: Date.now(),
    })
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
        />
        <canvas ref={canvasRef} className="hidden" />

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-primary rounded-lg">
              <div className="w-full h-full border border-dashed border-primary/50 rounded-lg animate-pulse" />
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

        {/* Demo button for testing */}
        <Button variant="secondary" onClick={handleManualInput}>
          Demo Scan
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Arahkan kamera ke QR code mahasiswa</p>
        <p>Pastikan QR code berada dalam frame kotak</p>
      </div>
    </div>
  )
}
