'use client'

import { useEffect, useRef, useState } from 'react'

/* ========================================
   CAPITAL HUB — FUNNEL HUB
   Adrián Villanueva Newsletter
   Brandkit V3.0 Monochrome
   ======================================== */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function UserPlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      color: '#6B7280',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={48}
        height={48}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="#3F3F46"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
      {label}
    </div>
  )
}

/* ---- NAVIGATION ---- */
function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(15, 15, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #2A2D34',
    }}>
      <div style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <a
          href="#"
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: '#F5F6F7',
            textDecoration: 'none',
            whiteSpace: 'nowrap' as const,
          }}
        >
          Adrián Villanueva
        </a>

        {/* Desktop links */}
        <ul style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }} className="nav-desktop">
          {['Inicio', 'Sobre mí', 'Contacto'].map((item) => (
            <li key={item}>
              <a
                href={item === 'Sobre mí' ? '#about' : item === 'Contacto' ? '#contacto' : '#'}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#6B7280',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F6F7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="nav-mobile-toggle"
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: 5,
            cursor: 'pointer',
            padding: 4,
            background: 'none',
            border: 'none',
          }}
          aria-label="Menu"
        >
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#F5F6F7' }} />
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#F5F6F7' }} />
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#F5F6F7' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{
          display: 'none',
          flexDirection: 'column',
          background: 'rgba(15, 15, 18, 0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #2A2D34',
          padding: 24,
          gap: 20,
        }}>
          {['Inicio', 'Sobre mí', 'Contacto'].map((item) => (
            <a
              key={item}
              href={item === 'Sobre mí' ? '#about' : item === 'Contacto' ? '#contacto' : '#'}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: '#9CA3AF',
                textDecoration: 'none',
              }}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

/* ---- HERO ---- */
function Hero() {
  return (
    <section style={{
      padding: '140px 0 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(42, 45, 52, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(42, 45, 52, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)',
        pointerEvents: 'none' as const,
      }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div className="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Content */}
          <div className="hero-content-animate" style={{ animationDelay: '0s' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: '#6B7280',
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span className="pulse-dot" style={{
                width: 6,
                height: 6,
                background: '#FFFFFF',
                borderRadius: '50%',
              }} />
              Newsletter semanal &middot; Gratis
            </div>

            <h1 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#F5F6F7',
              marginBottom: 20,
            }}>
              Aquí hablamos de ganar dinero.
            </h1>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: '#9CA3AF',
              marginBottom: 32,
              maxWidth: 480,
            }}>
              Mientras lees esto, alguien con la mitad de tu IQ está ganando (mucho) dinero por internet.
              <br /><br />
              Cada semana te cuento exactamente cómo hacer lo mismo. Gratis.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="optin-form-row"
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: 14,
                maxWidth: 440,
              }}
            >
              <input
                type="email"
                placeholder="Tu email"
                required
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  background: '#18181B',
                  border: '1px solid #2A2D34',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  color: '#F5F6F7',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  background: '#FFFFFF',
                  color: '#0F0F12',
                  border: '1px solid #FFFFFF',
                  borderRadius: '0 4px 4px 0',
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  letterSpacing: '0.01em',
                }}
              >
                Suscribirme &rarr;
              </button>
            </form>

            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#6B7280',
              letterSpacing: '0.02em',
            }}>
              El que no se suscriba es gay.
            </p>
          </div>

          {/* Image */}
          <div className="hero-visual-animate" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              <div style={{
                width: '100%',
                aspectRatio: '3 / 4',
                background: '#18181B',
                border: '1px solid #2A2D34',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserPlaceholder label="Foto de Adrián" />
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  padding: '10px 14px',
                  background: 'rgba(15, 15, 18, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #2A2D34',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  <span style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#F5F6F7',
                    letterSpacing: '0.04em',
                  }}>Adrián Villanueva</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: '#6B7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                  }}>Aspiracional / Lifestyle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- CTA SECTION ---- */
function CTASection() {
  const left = useScrollReveal()
  const right = useScrollReveal()

  return (
    <section style={{
      padding: '80px 0',
      borderTop: '1px solid #2A2D34',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div className="cta-grid-layout" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          {/* Profesionales */}
          <div
            ref={left.ref}
            style={{
              background: '#18181B',
              border: '1px solid #2A2D34',
              borderRadius: 4,
              padding: 40,
              opacity: left.visible ? 1 : 0,
              transform: left.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: '#6B7280',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #2A2D34',
            }}>Para profesionales</div>
            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#F5F6F7',
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}>Quiero una carrera digital</h2>
            <p style={{
              fontSize: 14,
              color: '#9CA3AF',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>Fórmate, certifícate y consigue trabajo.</p>
            <a
              href="#"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #FFFFFF',
                borderRadius: 3,
                color: '#FFFFFF',
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.02em',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Empieza hoy <ArrowIcon />
            </a>
          </div>

          {/* Empresas */}
          <div
            ref={right.ref}
            style={{
              background: '#18181B',
              border: '1px solid #2A2D34',
              borderRadius: 4,
              padding: 40,
              opacity: right.visible ? 1 : 0,
              transform: right.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: '#6B7280',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #2A2D34',
            }}>Para empresas</div>
            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#F5F6F7',
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}>Busco talento digital</h2>
            <p style={{
              fontSize: 14,
              color: '#9CA3AF',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>Accede a profesionales certificados listos para trabajar.</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {['Nombre', 'Empresa', 'Email'].map((ph) => (
                <input
                  key={ph}
                  type={ph === 'Email' ? 'email' : 'text'}
                  placeholder={ph}
                  required
                  style={{
                    padding: '12px 16px',
                    background: '#0F0F12',
                    border: '1px solid #2A2D34',
                    borderRadius: 3,
                    color: '#F5F6F7',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              ))}
              <button
                type="submit"
                style={{
                  padding: '13px 24px',
                  background: '#FFFFFF',
                  color: '#0F0F12',
                  border: '1px solid #FFFFFF',
                  borderRadius: 3,
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  marginTop: 4,
                }}
              >
                Quiero talento &rarr;
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- ABOUT ---- */
function AboutSection() {
  const img = useScrollReveal()
  const text = useScrollReveal()

  return (
    <section id="about" style={{
      padding: '80px 0',
      borderTop: '1px solid #2A2D34',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div className="about-grid-layout" style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 64,
          alignItems: 'start',
        }}>
          {/* Image */}
          <div
            ref={img.ref}
            style={{
              position: 'sticky',
              top: 100,
              opacity: img.visible ? 1 : 0,
              transform: img.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="about-img-wrapper"
          >
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: '#18181B',
              border: '1px solid #2A2D34',
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserPlaceholder label="Foto de Adrián" />
            </div>
            <p style={{
              marginTop: 12,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#6B7280',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}>Adrián &middot; Cercana / Real</p>
          </div>

          {/* Text */}
          <div
            ref={text.ref}
            style={{
              paddingTop: 8,
              opacity: text.visible ? 1 : 0,
              transform: text.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: '#6B7280',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid #2A2D34',
            }}>Sobre Adrián</div>

            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: '#F5F6F7',
              marginBottom: 32,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}>De trabajo fijo y deudas a construir el lugar de referencia número 1 para ganar dinero online en España.</h2>

            <div style={{ fontSize: 15, lineHeight: 1.8, color: '#9CA3AF' }}>
              <p style={{ marginBottom: 20 }}>Crecí en una familia de clase baja. Mi madre limpiaba casas. Mi padre era camarero. Intentaron montar una cafetería cuando yo era pequeño. Duró dos años. Se arruinaron.</p>
              <p style={{ marginBottom: 20 }}>Pasé años intentando salir de eso. Network marketing, puerta fría, trading, criptomonedas, agencias, eventos. Todo falló. Acabé con deudas, sin ingresos y volviendo a casa de mi madre con 21 años.</p>
              <p style={{ marginBottom: 20 }}><strong style={{ color: '#F5F6F7', fontWeight: 500 }}>Entonces descubrí que había otra forma.</strong></p>
              <p style={{ marginBottom: 20 }}>Aprendí lo que hoy llaman &ldquo;una habilidad de alto ingreso&rdquo;. Dejé mi trabajo en diciembre de 2021. En enero gané 4.000€. Casi cuatro veces más que antes y desde casa.</p>
              <p style={{ marginBottom: 20 }}>Hoy, casi 5 años después, puedo decir que salí del camino al que estaba predestinado. Vivo inviernos en Dubai y veranos en Alicante, trabajo con mis hermanos de otra madre a mi lado. Hemos construido una tribu de inconformistas que han elegido vivir diferente.</p>
              <p>Ahora me dedico a ayudar a jóvenes como yo a ganarse la vida con una profesión digital, y ayudar a empresas a encontrar el talento que necesitan para crecer.</p>
            </div>

            <div style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #2A2D34',
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#F5F6F7',
              letterSpacing: '0.02em',
            }}>Life is good.</div>

            <a
              href="#"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 24,
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: '#F5F6F7',
                borderBottom: '1px solid #2A2D34',
                paddingBottom: 4,
                textDecoration: 'none',
              }}
            >
              Leer mi historia completa <ArrowIcon size={12} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- SECOND OPT-IN ---- */
function SecondOptin() {
  const reveal = useScrollReveal()

  return (
    <section id="contacto" style={{
      padding: '64px 0',
      borderTop: '1px solid #2A2D34',
      borderBottom: '1px solid #2A2D34',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div
          ref={reveal.ref}
          className="second-optin-layout"
          style={{
            background: '#18181B',
            border: '1px solid #2A2D34',
            borderRadius: 4,
            padding: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
            position: 'relative',
            overflow: 'hidden',
            opacity: reveal.visible ? 1 : 0,
            transform: reveal.visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Top glow line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }} />

          <div style={{ flexShrink: 0 }}>
            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: '#F5F6F7',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}>¿Todavía no estás suscrito?</h2>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>
              Cada semana una idea que vale más que 4 años de carrera.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="second-optin-form-row"
            style={{
              display: 'flex',
              gap: 0,
              flex: 1,
              maxWidth: 400,
            }}
          >
            <input
              type="email"
              placeholder="Tu email"
              required
              style={{
                flex: 1,
                padding: '14px 18px',
                background: '#0F0F12',
                border: '1px solid #2A2D34',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                color: '#F5F6F7',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 28px',
                background: '#FFFFFF',
                color: '#0F0F12',
                border: '1px solid #FFFFFF',
                borderRadius: '0 4px 4px 0',
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
                letterSpacing: '0.01em',
              }}
            >
              Suscribirme &rarr;
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

/* ---- FOOTER ---- */
function Footer() {
  return (
    <footer style={{ padding: '32px 0' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div className="footer-layout" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#6B7280',
            letterSpacing: '0.02em',
          }}>Adrián Villanueva &copy; 2025</p>
          <ul style={{
            display: 'flex',
            gap: 24,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}>
            {['Términos', 'Privacidad', 'Login'].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#6B7280',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F6F7')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

/* ========================================
   MAIN PAGE COMPONENT
   ======================================== */
export default function FunnelHubPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        body { background-color: #0F0F12; color: #F5F6F7; font-family: 'Inter', sans-serif; overflow-x: hidden; }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          50% { box-shadow: 0 0 12px 3px rgba(255,255,255,0.08); }
        }
        .pulse-dot { animation: pulseGlow 3s ease-in-out infinite; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-content-animate { animation: heroFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-visual-animate { animation: heroFadeUp 1s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-visual-animate { order: -1; }
          .hero-visual-animate > div { max-width: 280px !important; margin: 0 auto; }
          .cta-grid-layout { grid-template-columns: 1fr !important; }
          .about-grid-layout { grid-template-columns: 1fr !important; gap: 40px !important; }
          .about-img-wrapper { position: static !important; max-width: 220px; margin: 0 auto; }
          .second-optin-layout { flex-direction: column !important; text-align: center; padding: 36px 28px !important; gap: 24px !important; }
          .second-optin-form-row { width: 100%; max-width: 100% !important; }
        }

        @media (max-width: 600px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .nav-mobile-menu { display: flex !important; }
          .optin-form-row { flex-direction: column !important; gap: 10px !important; }
          .optin-form-row input { border-right: 1px solid #2A2D34 !important; border-radius: 4px !important; }
          .optin-form-row button { border-radius: 4px !important; }
          .footer-layout { flex-direction: column !important; gap: 16px; text-align: center; }
          .second-optin-form-row { flex-direction: column !important; gap: 10px !important; }
          .second-optin-form-row input { border-right: 1px solid #2A2D34 !important; border-radius: 4px !important; }
          .second-optin-form-row button { border-radius: 4px !important; }
        }
      `}</style>

      <Nav />
      <Hero />
      <CTASection />
      <AboutSection />
      <SecondOptin />
      <Footer />
    </>
  )
}
