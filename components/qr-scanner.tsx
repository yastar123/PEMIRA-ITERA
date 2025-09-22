"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, CameraOff, AlertCircle, CheckCircle, Bug, Download } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onError: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState("")
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [jsQRLoaded, setJsQRLoaded] = useState<boolean>(false)
  const [frameCount, setFrameCount] = useState(0)
  const [lastFrameTime, setLastFrameTime] = useState(0)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setDebugLogs(prev => [...prev.slice(-15), logMessage])
  }

  // Load jsQR with multiple fallbacks
  const loadJsQR = async () => {
    try {
      // Method 1: Check global window
      if ((window as any).jsQR) {
        addDebugLog("✅ jsQR found in window")
        setJsQRLoaded(true)
        return (window as any).jsQR
      }

      // Method 2: Dynamic import
      try {
        const jsQRModule = await import('jsqr')
        addDebugLog("✅ jsQR loaded via import")
        setJsQRLoaded(true)
        return jsQRModule.default
      } catch (importError) {
        addDebugLog(`❌ Import failed: ${importError}`)
      }

      // Method 3: Load from CDN
      addDebugLog("Loading jsQR from CDN...")
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'

      return new Promise((resolve, reject) => {
        script.onload = () => {
          if ((window as any).jsQR) {
            addDebugLog("✅ jsQR loaded from CDN")
            setJsQRLoaded(true)
            resolve((window as any).jsQR)
          } else {
            reject(new Error("jsQR not available after CDN load"))
          }
        }
        script.onerror = () => reject(new Error("Failed to load jsQR from CDN"))
        document.head.appendChild(script)
      })

    } catch (error) {
      addDebugLog(`❌ jsQR load failed: ${error}`)
      setJsQRLoaded(false)
      throw error
    }
  }

  const startCamera = async () => {
    try {
      setError("")
      addDebugLog("🎥 Starting camera...")

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }

      // Try multiple camera constraints
      const constraints = [
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        { video: { width: 640, height: 480 } },
        { video: true }
      ]

      let mediaStream = null
      for (let i = 0; i < constraints.length; i++) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints[i])
          addDebugLog(`✅ Camera constraint ${i + 1} worked`)
          break
        } catch (err) {
          addDebugLog(`❌ Constraint ${i + 1} failed`)
        }
      }

      if (!mediaStream) {
        throw new Error("No camera constraints worked")
      }

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!
          video.onloadedmetadata = async () => {
            try {
              await video.play()
              addDebugLog(`🎬 Video: ${video.videoWidth}x${video.videoHeight}`)
              resolve()
            } catch (playError) {
              reject(playError)
            }
          }
          video.onerror = reject
        })

        setIsScanning(true)
        await startScanning()
      }

    } catch (err) {
      addDebugLog(`❌ Camera error: ${err}`)
      let errorMessage = "Camera access failed"

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied"
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera found"
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      onError(errorMessage)
    }
  }

  const stopCamera = () => {
    addDebugLog("🛑 Stopping camera")

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    setIsScanning(false)
    setFrameCount(0)
  }

  // Aggressive QR scanning with multiple techniques
  const startScanning = async () => {
    try {
      const jsQR = await loadJsQR()
      if (!jsQR) {
        throw new Error("jsQR not available")
      }

      addDebugLog("🔍 Starting aggressive scan...")
      let scanCount = 0

      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) {
          return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const debugCanvas = debugCanvasRef.current
        const context = canvas.getContext("2d")
        const debugContext = debugCanvas?.getContext("2d")

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
          if (isScanning) {
            scanIntervalRef.current = setTimeout(scanFrame, 50)
          }
          return
        }

        try {
          scanCount++
          const now = Date.now()

          // Update frame rate info
          if (scanCount % 20 === 0) {
            const fps = lastFrameTime ? 1000 / (now - lastFrameTime) : 0
            addDebugLog(`📊 Frame ${scanCount}, FPS: ${fps.toFixed(1)}`)
            setFrameCount(scanCount)
          }
          setLastFrameTime(now)

          // Set canvas size to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw original image
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Get image data for scanning
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Create debug visualization
          if (debugCanvas && debugContext) {
            debugCanvas.width = canvas.width
            debugCanvas.height = canvas.height
            debugContext.putImageData(imageData, 0, 0)
          }

          // Try multiple scanning techniques
          const techniques = [
            // Original image
            { data: imageData, name: "original" },

            // High contrast
            {
              data: applyHighContrast(imageData),
              name: "high-contrast"
            },

            // Grayscale with threshold
            {
              data: applyThreshold(imageData, 128),
              name: "threshold-128"
            },

            // Different threshold
            {
              data: applyThreshold(imageData, 100),
              name: "threshold-100"
            },

            // Edge detection
            {
              data: applyEdgeDetection(imageData),
              name: "edge-detection"
            }
          ]

          for (const technique of techniques) {
            const scanOptions = [
              { inversionAttempts: "dontInvert" },
              { inversionAttempts: "onlyInvert" },
              { inversionAttempts: "attemptBoth" },
              { inversionAttempts: "invertFirst" }
            ]

            for (const options of scanOptions) {
              try {
                const code = jsQR(
                  technique.data.data,
                  technique.data.width,
                  technique.data.height,
                  options as any
                )

                if (code && code.data) {
                  addDebugLog(`🎯 QR FOUND! Method: ${technique.name}, Option: ${options.inversionAttempts}`)
                  addDebugLog(`📄 Data: "${code.data.substring(0, 100)}..."`)

                  // Show detection in debug canvas
                  if (debugContext) {
                    drawQRLocation(debugContext, code.location)
                  }

                  onScan(code.data)
                  stopCamera()
                  return
                }
              } catch (scanError) {
                // Silent - too many errors to log
              }
            }
          }

        } catch (frameError) {
          if (scanCount % 50 === 0) { // Only log occasionally
            addDebugLog(`⚠️ Frame error: ${frameError}`)
          }
        }

        // Continue scanning
        if (isScanning) {
          scanIntervalRef.current = setTimeout(scanFrame, 50) // Faster scan rate
        }
      }

      scanFrame()

    } catch (err) {
      addDebugLog(`❌ Scan init failed: ${err}`)
      setError("Scanner initialization failed")
      onError("Scanner initialization failed")
    }
  }

  // Image processing functions
  const applyHighContrast = (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const contrast = gray > 128 ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = contrast
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  const applyThreshold = (imageData: ImageData, threshold: number): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const value = gray > threshold ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = value
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  const applyEdgeDetection = (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Simple Sobel edge detection
        const gx = -1 * data[((y - 1) * width + (x - 1)) * 4] + 1 * data[((y - 1) * width + (x + 1)) * 4] +
          -2 * data[(y * width + (x - 1)) * 4] + 2 * data[(y * width + (x + 1)) * 4] +
          -1 * data[((y + 1) * width + (x - 1)) * 4] + 1 * data[((y + 1) * width + (x + 1)) * 4]

        const gy = -1 * data[((y - 1) * width + (x - 1)) * 4] - 2 * data[((y - 1) * width + x) * 4] - 1 * data[((y - 1) * width + (x + 1)) * 4] +
          1 * data[((y + 1) * width + (x - 1)) * 4] + 2 * data[((y + 1) * width + x) * 4] + 1 * data[((y + 1) * width + (x + 1)) * 4]

        const magnitude = Math.sqrt(gx * gx + gy * gy)
        const value = magnitude > 50 ? 255 : 0

        data[idx] = data[idx + 1] = data[idx + 2] = value
      }
    }
    return new ImageData(data, width, height)
  }

  const drawQRLocation = (context: CanvasRenderingContext2D, location: any) => {
    context.strokeStyle = "red"
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(location.topLeftCorner.x, location.topLeftCorner.y)
    context.lineTo(location.topRightCorner.x, location.topRightCorner.y)
    context.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y)
    context.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y)
    context.closePath()
    context.stroke()
  }

  const captureFrame = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `frame-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      addDebugLog("📸 Frame captured for debugging")
    }
  }

  const testScan = () => {
    addDebugLog("🧪 Testing scan callback...")
    const testData = JSON.stringify({
      userId: "test-123",
      redeemCode: "TEST1234",
      sessionId: "session-456",
      timestamp: Date.now()
    })
    onScan(testData)
  }

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera View */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full max-w-md mx-auto rounded-lg bg-black"
          style={{ aspectRatio: "1/1" }}
          playsInline
          muted
          autoPlay
        />

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Debug visualization canvas */}
        <canvas
          ref={debugCanvasRef}
          className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
          style={{ aspectRatio: "1/1" }}
        />

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-green-500 rounded-lg animate-pulse">
              <div className="w-full h-full border border-dashed border-green-500/50 rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        {isScanning ? (
          <Button variant="outline" onClick={stopCamera}>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop ({frameCount} frames)
          </Button>
        ) : (
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        )}

        <Button variant="secondary" onClick={testScan}>
          Test Callback
        </Button>

        {isScanning && (
          <Button variant="outline" onClick={captureFrame}>
            <Download className="mr-2 h-4 w-4" />
            Capture Frame
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-2 text-sm bg-gray-100 p-3 rounded">
        <div>jsQR: {jsQRLoaded ? "✅" : "❌"}</div>
        <div>Frames: {frameCount}</div>
        <div>Scanning: {isScanning ? "✅" : "❌"}</div>
        <div>Stream: {stream ? "✅" : "❌"}</div>
      </div>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debug Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-32 overflow-y-auto bg-black text-green-400 p-2 rounded font-mono text-xs">
            {debugLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}