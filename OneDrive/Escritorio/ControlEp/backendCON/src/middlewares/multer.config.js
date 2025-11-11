const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const processColaboradorImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const processedDir = path.join(__dirname, '..', '..', 'uploads', 'colaboradores', 'processed');
    
    // Crear directorio processed si no existe
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const outputPath = path.join(processedDir, fileName);

    // Procesar imagen con Sharp (redimensionar y optimizar)
    await sharp(filePath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // Reemplazar la imagen original con la procesada
    fs.unlinkSync(filePath);
    fs.renameSync(outputPath, filePath);

    next();
  } catch (error) {
    console.error('Error procesando imagen:', error);
    next(error);
  }
};

module.exports = processColaboradorImage;