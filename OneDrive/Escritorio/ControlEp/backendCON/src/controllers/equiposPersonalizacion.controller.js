const EquiposPersonalizacion = require('../models/equiposPersonalizacion.model');

// Obtener personalización de un equipo
exports.getByEquipoId = async (req, res) => {
  try {
    const equipo_id = req.params.equipo_id;
    const item = await EquiposPersonalizacion.getByEquipoId(equipo_id);
    if (!item) return res.status(404).json({ error: "No personalización encontrada" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear o actualizar personalización de equipo
exports.upsert = async (req, res) => {
  try {
    const { equipo_id, color, icono } = req.body;
    if (!equipo_id) return res.status(400).json({ error: "equipo_id es requerido" });
    await EquiposPersonalizacion.upsert(equipo_id, color, icono);
    res.json({ message: "Personalización guardada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todas las personalizaciones
exports.getAll = async (req, res) => {
  try {
    const items = await EquiposPersonalizacion.getAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};