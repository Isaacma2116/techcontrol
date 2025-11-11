const Mantenimiento = require('../models/mantenimientos.model');

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const items = await Mantenimiento.getAll();
    res.json(items);
  } catch (err) {
    console.error('[ERROR][GET /api/mantenimientos]:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener uno por ID
exports.getById = async (req, res) => {
  try {
    const item = await Mantenimiento.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (err) {
    console.error('[ERROR][GET BY ID /api/mantenimientos/:id]:', err);
    res.status(500).json({ error: err.message });
  }
};

// Crear uno nuevo
exports.create = async (req, res) => {
  try {
    const insertId = await Mantenimiento.create(req.body);
    res.status(201).json({ id: insertId });
  } catch (err) {
    console.error('[ERROR][POST /api/mantenimientos]:', err);
    res.status(400).json({ error: err.message });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    const affected = await Mantenimiento.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Actualizado correctamente' });
  } catch (err) {
    console.error('[ERROR][PUT /api/mantenimientos/:id]:', err);
    res.status(400).json({ error: err.message });
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const affected = await Mantenimiento.remove(req.params.id);
    if (!affected) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    console.error('[ERROR][DELETE /api/mantenimientos/:id]:', err);
    res.status(500).json({ error: err.message });
  }
};