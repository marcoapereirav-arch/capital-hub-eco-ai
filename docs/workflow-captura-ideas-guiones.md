# Workflow de captura de ideas y guiones

> Objetivo: poder capturar ideas caminando con el movil, convertirlas despues en guiones con IA y archivar los guiones pulidos en Google Drive.

## Decision esencialista

Usar **Obsidian** como bandeja de captura y desarrollo, con una carpeta sincronizada en el Mac. La IA lee esa carpeta como archivos Markdown. Google Drive queda como archivo final de guiones pulidos.

No usar Google Docs como lugar de captura diaria: es lento para ideas sueltas, peor para busqueda estructurada y menos comodo para que un agente trabaje sobre muchas notas.

## Estructura recomendada

```
Capital Hub Content OS/
├── 00-inbox/
├── 01-ideas/
├── 02-briefs/
├── 03-guiones-draft/
├── 04-guiones-ready/
└── 99-feedback/
```

## Uso diario

### Captura caminando

En el movil, abrir Obsidian y dictar una nota rapida en `00-inbox/`.

Formato minimo:

```
Idea:
Por que importa:
Para quien:
Energia: viral / tactico / conexion
```

Si hay prisa, basta con una frase. Mejor una idea imperfecta capturada que una idea perfecta olvidada.

### Sesion de guiones

Cuando toque producir, pedir a Claude Code:

```
Lee mi carpeta de ideas de contenido. Mira especialmente 00-inbox, 01-ideas y 99-feedback.

Quiero 5 ideas de guion para Capital Hub:
- 3 virales sin CTA
- 1 tactico con CTA
- 1 conexion personal

Usa mi voz: directo, anti-humo, con profundidad filosofica y orientado a hombres 22-30 que no encajan en el sistema laboral tradicional.

Devuelveme:
1. Titulo interno
2. Hook
3. Tesis
4. Guion de 30-60s
5. CTA si aplica
```

### Pulido

Los guiones que merezcan grabarse pasan a `04-guiones-ready/`.

Formato recomendado por archivo:

```
# [Titulo interno]

Estado: ready
Pilar: mentalidad-disciplina / biologia / transurfing / libre
Tipo: viral / tactico / conexion
Fecha:

## Hook

## Guion

## CTA

## Notas de grabacion
```

### Archivo final

Cuando un guion ya este pulido, exportarlo o copiarlo a la carpeta final de Google Drive donde viven los guiones definitivos.

Google Drive no es la bandeja de pensamiento. Google Drive es la estanteria final.

## Regla de oro

Captura en Obsidian. Produce con IA leyendo Markdown. Archiva en Google Drive.

## Setup rapido en 10 minutos

1. Instalar Obsidian en iPhone y Mac.
2. Crear un vault llamado `Capital Hub Content OS`.
3. Crear las 6 carpetas del sistema.
4. En el movil, poner Obsidian en la pantalla principal.
5. Crear una primera nota en `00-inbox/` con 3 ideas reales.
6. En el Mac, comprobar que la carpeta aparece localmente.
7. Decirle a Claude Code que lea esa carpeta y genere los primeros guiones.

## Version avanzada, no necesaria hoy

Mas adelante se puede conectar Google Drive mediante MCP o automatizaciones para crear documentos finales directamente. No es el primer paso porque mete friccion, permisos y puntos de fallo.
