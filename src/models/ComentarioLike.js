const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const ComentarioLike = sequelize.define('comentarios_likes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    comentario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'comentarios_likes',
    timestamps: true,
    updatedAt: false,
    createdAt: 'creado_en',
    indexes: [
        {
            unique: true,
            fields: ['comentario_id', 'usuario_id']
        }
    ]
})
module.exports = ComentarioLike
