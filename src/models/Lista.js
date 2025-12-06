const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Lista = sequelize.define('lista', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [1, 100]
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    es_publica: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'listas',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en'
})

module.exports = Lista
