const Licencia = require('../models/licencia.model');
const LicenciaEquipo = require('../models/licenciaEquipo.model');

exports.getById = async (req, res) => {
  const licencia = await Licencia.getById(req.params.id);
  if (!licencia) return res.status(404).json({ error: 'No encontrado' });
  licencia.equipos = await LicenciaEquipo.getEquiposByLicencia(licencia.id);
  res.json(licencia);
};

exports.create = async (req, res) => {
  const data = req.body;
  const licencia = await Licencia.create(data);
  await LicenciaEquipo.setEquipos(licencia.id, data.equipos || []);
  licencia.equipos = data.equipos || [];
  res.status(201).json(licencia);
};

exports.update = async (req, res) => {
  const data = req.body;
  await Licencia.update(req.params.id, data);
  await LicenciaEquipo.setEquipos(req.params.id, data.equipos || []);
  res.json({ id: req.params.id, ...data });
};

exports.delete = async (req, res) => {
  await Licencia.delete(req.params.id);
  res.sendStatus(204);
};