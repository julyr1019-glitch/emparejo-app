/**
 * EMPAREJO — Backend (punto de partida)
 * -------------------------------------------------
 * Un pequeño servidor que recibe un cargo desde el buscador,
 * consulta la API de Jooble (que agrega elempleo, Computrabajo,
 * Indeed y otros portales de Colombia) y devuelve las vacantes
 * ya limpias y listas para pintar en el panel.
 *
 * Este es el "cerebro" que le faltaba al artefacto: es lo que
 * convierte la demo de ofertas fijas en un buscador de verdad.
 *
 * Para que funcione en vivo solo falta una cosa: la CLAVE de Jooble.
 * Se pide gratis en https://jooble.org/api/about y se pega abajo
 * (o mejor, en un archivo .env como explica el README).
 */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());              // permite que el frontend hable con este backend
app.use(express.json());
app.use(express.static("public")); // sirve el buscador y el optimizador de CV

// --- Configuración ---
const JOOBLE_KEY = process.env.JOOBLE_KEY || "PEGA_AQUI_TU_CLAVE_DE_JOOBLE";
const PORT = process.env.PORT || 3000;

// Jooble no tiene un filtro de "nivel", así que lo aproximamos revisando
// palabras clave típicas en el título de la vacante.
const NIVELES = {
  direccion: /\b(director|directora|gerente general|vicepresidente|presidente|ceo)\b/i,
  jefatura: /\b(jefe|jefa|coordinador|coordinadora|supervisor|supervisora|l[ií]der|encargad[oa])\b/i,
  operativo: /\b(analista|auxiliar|asistente|operari[oa]|operativ[oa]|ejecutiv[oa]|agente)\b/i,
};

async function buscarJooble(cargo, ciudad) {
  if (JOOBLE_KEY === "PEGA_AQUI_TU_CLAVE_DE_JOOBLE") {
    throw new Error("Falta configurar la clave de Jooble. Revisa el README, paso 3.");
  }

  // Jooble recibe un POST con la clave en la URL y el filtro en el cuerpo.
  const respuesta = await fetch(`https://co.jooble.org/api/${JOOBLE_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: cargo, location: ciudad }),
  });

  if (!respuesta.ok) {
    throw new Error(`Jooble respondió con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  // Normalizamos: dejamos solo lo que el panel necesita mostrar.
  return (datos.jobs || []).map((j) => ({
    titulo: j.title,
    empresa: j.company || "Empresa confidencial",
    ubicacion: j.location,
    salario: j.salary || "A convenir",
    fuente: j.source,
    publicada: j.updated,
    enlace: j.link,          // enlace directo y estable a la vacante real
    resumen: (j.snippet || "").replace(/<[^>]*>/g, "").slice(0, 220),
  }));
}

/**
 * Registro de fuentes de vacantes. Cada fuente normaliza sus resultados al
 * mismo formato ({titulo, empresa, ubicacion, salario, fuente, publicada,
 * enlace, resumen}) para que el frontend nunca tenga que saber de dónde vino
 * cada oferta.
 *
 * Computrabajo, elempleo y Magneto365 no tienen una API pública como Jooble:
 * conectarlas de verdad requiere gestionar acceso comercial directamente con
 * cada portal. Quedan aquí deshabilitadas como punto de extensión — cuando
 * se consiga acceso a alguna, se activa (`habilitada: true`) y se implementa
 * su `buscar()` con la documentación real de esa API.
 */
const FUENTES = {
  jooble: { habilitada: true, buscar: buscarJooble },
  computrabajo: { habilitada: false, buscar: null },
  elempleo: { habilitada: false, buscar: null },
  magneto365: { habilitada: false, buscar: null },
};

/**
 * Endpoint principal: /api/ofertas?cargo=Director de Cobranza&ciudad=Bogotá&nivel=direccion
 * El buscador del frontend llamará aquí en vez de usar ofertas fijas.
 */
app.get("/api/ofertas", async (req, res) => {
  const cargo = (req.query.cargo || "").trim();
  const ciudad = (req.query.ciudad || "Colombia").trim();
  const nivel = (req.query.nivel || "").trim().toLowerCase();

  if (!cargo) {
    return res.status(400).json({ error: "Escribe un cargo para buscar." });
  }

  const activas = Object.values(FUENTES).filter((f) => f.habilitada);

  const resultados = await Promise.allSettled(
    activas.map((f) => f.buscar(cargo, ciudad))
  );

  const exitosos = resultados.filter((r) => r.status === "fulfilled");
  if (exitosos.length === 0) {
    const primerError = resultados[0] && resultados[0].reason ? resultados[0].reason.message : null;
    console.error("Error consultando fuentes de empleo:", primerError);
    return res.status(502).json({
      error: primerError || "No se pudo consultar las ofertas ahora mismo.",
    });
  }

  let ofertas = exitosos.flatMap((r) => r.value);

  const patronNivel = NIVELES[nivel];
  if (patronNivel) {
    ofertas = ofertas.filter((o) => patronNivel.test(o.titulo));
  }

  res.json({ cargo, ciudad, nivel: nivel || null, total: ofertas.length, ofertas });
});

// Chequeo rápido de salud (útil para confirmar que el servidor está vivo)
app.get("/api/estado", (_req, res) => {
  const configurado = JOOBLE_KEY !== "PEGA_AQUI_TU_CLAVE_DE_JOOBLE";
  res.json({ ok: true, joobleConfigurado: configurado, fuentesActivas: Object.keys(FUENTES).filter((k) => FUENTES[k].habilitada) });
});

app.listen(PORT, () => {
  console.log(`Emparejo backend corriendo en http://localhost:${PORT}`);
  console.log(`Prueba: http://localhost:${PORT}/api/ofertas?cargo=Director%20de%20Cobranza`);
});
