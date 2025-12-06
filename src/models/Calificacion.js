const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Calificacion = sequelize.define('calificacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pelicula_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    puntuacion: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    }
}, {
    tableName: 'calificaciones',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    indexes: [
        {
            unique: true,
            fields: ['usuario_id', 'pelicula_id']
        }
    ]
})

module.exports = Calificacion
