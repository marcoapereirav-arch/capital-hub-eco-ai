import * as React from 'react'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from '@react-email/components'

interface PasswordChangedEmailProps {
  fullName: string
  changedAtFormatted: string
}

export function PasswordChangedEmail({ fullName, changedAtFormatted }: PasswordChangedEmailProps) {
  const firstName = fullName.split(' ')[0] || 'Hola'

  return (
    <Html lang="es">
      <Head />
      <Preview>Tu contraseña de Capital Hub OS se cambió correctamente</Preview>
      <Body style={{ backgroundColor: '#0a0a0c', fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif', color: '#e5e7eb', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
          <Section style={{ textAlign: 'center' as const, marginBottom: 32 }}>
            <Text style={{ fontSize: 11, letterSpacing: 4, color: '#71717a', textTransform: 'uppercase' as const, margin: 0 }}>
              Capital Hub OS
            </Text>
          </Section>

          <Heading style={{ fontSize: 22, fontWeight: 600, color: '#fafafa', margin: '0 0 16px 0' }}>
            {firstName}, tu contraseña se cambió correctamente.
          </Heading>

          <Text style={{ fontSize: 15, lineHeight: 1.6, color: '#d4d4d8', margin: '0 0 16px 0' }}>
            Confirmamos que tu contraseña fue actualizada el {changedAtFormatted}.
          </Text>

          <Text style={{ fontSize: 15, lineHeight: 1.6, color: '#d4d4d8', margin: '0 0 24px 0' }}>
            Ya puedes acceder al OS con tu nueva contraseña.
          </Text>

          <Hr style={{ borderColor: '#27272a', margin: '32px 0' }} />

          <Text style={{ fontSize: 13, lineHeight: 1.5, color: '#a1a1aa', margin: '0 0 8px 0' }}>
            <strong style={{ color: '#fafafa' }}>¿No fuiste tú?</strong>
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.5, color: '#a1a1aa', margin: 0 }}>
            Si no realizaste este cambio, contacta inmediatamente con Adrián o Marco. Tu cuenta podría estar comprometida.
          </Text>

          <Hr style={{ borderColor: '#27272a', margin: '32px 0' }} />

          <Text style={{ fontSize: 11, color: '#52525b', textAlign: 'center' as const, margin: 0 }}>
            © Capital Hub · Este es un email automático, no respondas.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
