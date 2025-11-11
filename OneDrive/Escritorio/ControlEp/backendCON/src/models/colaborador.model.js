const mongoose = require('mongoose');

const colaboradorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  foto: {
    type: String,
    default: ''
  },
  telefono: {
    type: String,
    trim: true
  },
  departamento: {
    type: String,
    trim: true
  },
  creado_en: {
    type: Date,
    default: Date.now
  },
  actualizado_en: {
    type: Date,
    default: Date.now
  }
});

// Actualizar fecha de modificación antes de guardar
colaboradorSchema.pre('save', function(next) {
  this.actualizado_en = Date.now();
  next();
});

module.exports = mongoose.model('Colaborador', colaboradorSchema);