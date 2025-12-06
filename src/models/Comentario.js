const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Comentario = sequelize.define('comentario', {
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
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    contiene_spoilers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    me_gusta_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'comentarios',
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

module.exports = Comentario
