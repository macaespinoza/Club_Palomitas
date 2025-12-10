const express = require('express')
const enrutador = express.Router()
const listasController = require('../controllers/listasController')
const { requiereAuth } = require('../middlewares/auth')

// RUTAS PUBLICAS
enrutador.get('/publicas', listasController.obtenerPublicas)

// RUTAS PROTEGIDAS
enrutador.use(requiereAuth)

enrutador.get('/', listasController.obtenerTodas)
enrutador.post('/', listasController.crear)
enrutador.get('/:id', listasController.obtenerUna)
enrutador.put('/:id', listasController.actualizar)
enrutador.delete('/:id', listasController.eliminar)

// GESTION DE PELICULAS EN LISTAS
enrutador.post('/:id/peliculas', listasController.agregarPelicula)
enrutador.delete('/:id/peliculas/:peliculaId', listasController.removerPelicula)

module.exports = enrutador
