const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Usuario = sequelize.define('usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    contrasena: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rol: {
        type: DataTypes.ENUM('usuario', 'admin'),
        allowNull: false,
        defaultValue: 'usuario'
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en'
})

module.exports = Usuario