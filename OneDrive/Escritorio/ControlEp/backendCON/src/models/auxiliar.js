module.exports = (sequelize, DataTypes) => {
  const Auxiliar = sequelize.define('Auxiliar', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    equipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    numero_serie: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'auxiliares',
    timestamps: false
  });

  Auxiliar.associate = (models) => {
    Auxiliar.belongsTo(models.Equipo, { foreignKey: 'equipo_id' });
  };

  return Auxiliar;
};