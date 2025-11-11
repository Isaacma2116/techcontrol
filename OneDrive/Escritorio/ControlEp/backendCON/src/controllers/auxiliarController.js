const { Auxiliar } = require('../models/auxiliar');

exports.createAuxiliar = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.create(req.body);
    res.status(201).json(auxiliar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAuxiliares = async (req, res) => {
  try {
    const auxiliares = await Auxiliar.findAll();
    res.json(auxiliares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAuxiliarById = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ error: 'No encontrado' });
    res.json(auxiliar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAuxiliar = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ error: 'No encontrado' });
    await auxiliar.update(req.body);
    res.json(auxiliar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAuxiliar = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ error: 'No encontrado' });
    await auxiliar.destroy();
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};