const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const ListaPelicula = sequelize.define('lista_pelicula', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    lista_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'listas',
            key: 'id'
        }
    },
    pelicula_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'peliculas',
            key: 'id'
        }
    },
    agregado_en: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
    // Simplification: Removing fields not present in initial SQL schema
    // calificacion: { ... },
    // comentario: { ... }
}, {
    tableName: 'listas_peliculas',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['lista_id', 'pelicula_id']
        }
    ]
})

module.exports = ListaPelicula
