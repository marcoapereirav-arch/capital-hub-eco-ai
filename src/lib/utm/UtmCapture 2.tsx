"use client"

import { useEffect } from "react"
import { captureUtmsIfPresent } from "./utm-capture"

/**
 * Componente que se monta en layout publico y captura UTMs del query string
 * al primer landing. No renderiza nada, solo side-effect.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmsIfPresent()
  }, [])
  return null
}
