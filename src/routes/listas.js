const express = require('express')
const enrutador = express.Router()
const listasController = require('../controllers/listasController')
const { requiereAuth } = require('../middlewares/auth')

// Rutas públicas
enrutador.get('/publicas', listasController.obtenerPublicas)

// Rutas protegidas
enrutador.use(requiereAuth) // Todas las rutas debajo requieren autenticación

enrutador.get('/', listasController.obtenerTodas)
enrutador.post('/', listasController.crear)
enrutador.get('/:id', listasController.obtenerUna)
enrutador.put('/:id', listasController.actualizar)
enrutador.delete('/:id', listasController.eliminar)

// Gestión de películas en listas
enrutador.post('/:id/peliculas', listasController.agregarPelicula)
enrutador.delete('/:id/peliculas/:peliculaId', listasController.removerPelicula)


module.exports = enrutador
