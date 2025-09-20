"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export default function QRCodeDisplay({ value, size = 200, className }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    }
  }, [value, size])

  return (
    <div className={`inline-block p-4 bg-white rounded-lg shadow-sm ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}
