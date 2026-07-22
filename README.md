# Emparejo — Backend (arranque)

Este proyecto convierte tu demo de ofertas fijas en un buscador real.
Trae dos partes que ya se hablan entre sí:

- `server.js` — el "cerebro". Recibe un cargo, consulta la API de Jooble
  (que agrega elempleo, Computrabajo, Indeed y otros portales de Colombia)
  y devuelve vacantes reales y vigentes.
- `public/index.html` — el buscador, YA CONECTADO al cerebro. Cuando el
  usuario escribe un cargo, llama al backend y pinta las ofertas reales en
  tarjetas, cada una con su botón "Ver oferta" que lleva a la vacante.

Todo está probado y funcionando de punta a punta. Solo falta tu clave gratuita
de Jooble para que consulte en vivo.

Cuando enciendas el servidor (paso 4) y abras http://localhost:3000, verás
directamente el buscador funcionando.

---

## Antes de empezar (una sola vez)

1. **Instala Node.js** (versión 18 o superior).
   Descárgalo de https://nodejs.org (elige la versión "LTS").
   Para verificar que quedó bien, abre tu terminal y escribe:
   ```
   node --version
   ```
   Debe mostrar algo como `v22.x.x`.

2. **Instala Claude Code** con el instalador nativo (no requiere nada más).
   - En Mac/Linux: sigue https://docs.claude.com/en/docs/claude-code/overview
   - Necesitas una cuenta paga de Claude (Pro, Max, Team o Console). El plan
     gratuito no incluye Claude Code.

---

## Poner en marcha el backend

**Paso 1 — Abre la carpeta del proyecto en Claude Code.**
Copia esta carpeta (`emparejo-backend`) a tu computador, abre la terminal
dentro de ella y escribe:
```
claude
```
Claude Code leerá el proyecto y podrás pedirle cambios en lenguaje normal.

**Paso 2 — Instala las dependencias.**
Dentro de la carpeta, en la terminal:
```
npm install
```

**Paso 3 — Consigue tu clave gratuita de Jooble.**
Entra a https://jooble.org/api/about y pide la clave (es gratis).
Cuando la tengas, crea un archivo llamado `.env` en la carpeta con esta línea
(reemplaza las X por tu clave real):
```
JOOBLE_KEY=XXXXXXXXXXXXXXXX
```

**Paso 4 — Enciende el servidor.**
```
npm start
```
Verás el mensaje: `Emparejo backend corriendo en http://localhost:3000`.
Abre esa dirección en tu navegador añadiendo una búsqueda de prueba:
```
http://localhost:3000/api/ofertas?cargo=Director de Cobranza
```
Si ves una lista de ofertas reales, ¡el cerebro está funcionando!

---

## Lo que sigue (pídeselo a Claude Code)

Una vez tengas esto andando, estos son los siguientes encargos naturales.
Puedes copiarlos tal cual a Claude Code:

- "Conecta el buscador de `emparejo_buscador.html` a este backend, para que en
  vez de mostrar ofertas fijas llame a `/api/ofertas` con el cargo que escriba
  el usuario."
- "Añade un filtro por ciudad y por nivel (dirección, jefatura, operativo)."
- "Guarda en una base de datos las ofertas que el usuario marque como
  favoritas o de interés."
- "Prepara el proyecto para publicarlo en internet (por ejemplo en Render o
  Railway) para que otras personas puedan usarlo."

Cada uno de esos pasos es acotado. La parte más cara —la interfaz— ya la
tienes construida.
