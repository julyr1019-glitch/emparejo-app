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

/**
 * Endpoint principal: /api/ofertas?cargo=Director de Cobranza&ciudad=Bogotá
 * El buscador del frontend llamará aquí en vez de usar ofertas fijas.
 */
app.get("/api/ofertas", async (req, res) => {
  const cargo = (req.query.cargo || "").trim();
  const ciudad = (req.query.ciudad || "Colombia").trim();

  if (!cargo) {
    return res.status(400).json({ error: "Escribe un cargo para buscar." });
  }

  if (JOOBLE_KEY === "PEGA_AQUI_TU_CLAVE_DE_JOOBLE") {
    return res.status(500).json({
      error: "Falta configurar la clave de Jooble. Revisa el README, paso 3.",
    });
  }

  try {
    // Jooble recibe un POST con la clave en la URL y el filtro en el cuerpo.
    const respuesta = await fetch(`https://jooble.org/api/${JOOBLE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: cargo, location: ciudad }),
    });

    if (!respuesta.ok) {
      throw new Error(`Jooble respondió con estado ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    // Normalizamos: dejamos solo lo que el panel necesita mostrar.
    const ofertas = (datos.jobs || []).map((j) => ({
      titulo: j.title,
      empresa: j.company || "Empresa confidencial",
      ubicacion: j.location,
      salario: j.salary || "A convenir",
      fuente: j.source,
      publicada: j.updated,
      enlace: j.link,          // enlace directo y estable a la vacante real
      resumen: (j.snippet || "").replace(/<[^>]*>/g, "").slice(0, 220),
    }));

    res.json({ cargo, ciudad, total: ofertas.length, ofertas });
  } catch (err) {
    console.error("Error consultando Jooble:", err.message);
    res.status(502).json({ error: "No se pudo consultar las ofertas ahora mismo." });
  }
});

// Chequeo rápido de salud (útil para confirmar que el servidor está vivo)
app.get("/api/estado", (_req, res) => {
  const configurado = JOOBLE_KEY !== "PEGA_AQUI_TU_CLAVE_DE_JOOBLE";
  res.json({ ok: true, joobleConfigurado: configurado });
});

app.listen(PORT, () => {
  console.log(`Emparejo backend corriendo en http://localhost:${PORT}`);
  console.log(`Prueba: http://localhost:${PORT}/api/ofertas?cargo=Director%20de%20Cobranza`);
});
