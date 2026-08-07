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
      <p className="text-[15px] text-muted-foreground">{definition.description}</p>
      {definition.credentialFields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <label htmlFor={`cred_${field.key}`} className="block text-sm font-medium text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>
          <Input
            id={`cred_${field.key}`}
            name={`cred_${field.key}`}
            type={field.type === 'password' ? 'password' : 'text'}
            placeholder={field.placeholder}
            required={field.required}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      ))}
      {error && <p className="text-[15px] text-destructive">{error}</p>}
      {/* La accion principal queda pegada abajo dentro del contenedor que se
          desplaza (sticky, no fixed): con el teclado abierto el boton sigue a
          la vista. En el monitor vuelve a la fila junto al enlace de docs. */}
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:static md:mx-0 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0 md:pt-2">
        <a
          href={definition.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline md:h-8"
        >
          Docs de {definition.displayName}
        </a>
        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          {loading ? 'Conectando...' : 'Conectar'}
        </Button>
      </div>
    </form>
  )
}
