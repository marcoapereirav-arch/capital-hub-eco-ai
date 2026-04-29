"use client"

import { useEffect, useRef } from "react"

/**
 * Animación de confetti durante 4s. Replica del script original de thanks-v2.
 * Solo se monta una vez al cargar la página.
 */
export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    type Particle = { x: number; y: number; r: number; d: number; color: string; tilt: number; tiltAngle: number; tiltAngleIncremental: number }
    const particles: Particle[] = []
    const colors = ["#FFFFFF", "#9CA3AF", "#F3F4F6"]

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 4 + 1,
        d: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      })
    }

    let animationId: number
    const startTime = Date.now()

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (Date.now() - startTime > 4000) {
        cancelAnimationFrame(animationId)
        canvas.style.opacity = "0"
        setTimeout(() => canvas.remove(), 1000)
        return
      }
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2
        p.tilt = Math.sin(p.tiltAngle) * 15
        ctx.beginPath()
        ctx.lineWidth = p.r
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2)
        ctx.stroke()
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width
          p.y = -10
          p.tilt = Math.floor(Math.random() * 10) - 10
        }
      })
      animationId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return <canvas ref={canvasRef} id="lt8-confetti-canvas" />
}
