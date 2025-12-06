const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Pelicula = sequelize.define('pelicula', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    imdb_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    anio: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    clasificacion: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    duracion: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    genero: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    director: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    actores: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sinopsis: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    poster: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    puntuacion_imdb: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    tipo: {
        type: DataTypes.ENUM('pelicula', 'serie', 'episodio'),
        defaultValue: 'pelicula'
    }
}, {
    tableName: 'peliculas',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en'
})

module.exports = Pelicula
