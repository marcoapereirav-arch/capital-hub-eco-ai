'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveConnection } from '../actions'
import type { PlatformDefinition } from '../types'

interface ConnectFormProps {
  definition: PlatformDefinition
  onDone?: () => void
}

export function ConnectForm({ definition, onDone }: ConnectFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('platform', definition.platform)

    const result = await saveConnection(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onDone?.()
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{definition.description}</p>
      {definition.credentialFields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <label htmlFor={`cred_${field.key}`} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Input
            id={`cred_${field.key}`}
            name={`cred_${field.key}`}
            type={field.type === 'password' ? 'password' : 'text'}
            placeholder={field.placeholder}
            required={field.required}
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <a
          href={definition.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Docs de {definition.displayName}
        </a>
        <Button type="submit" disabled={loading}>
          {loading ? 'Conectando...' : 'Conectar'}
        </Button>
      </div>
    </form>
  )
}
