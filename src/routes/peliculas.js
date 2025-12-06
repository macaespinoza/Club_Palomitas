const express = require('express')
const enrutador = express.Router()
const peliculasController = require('../controllers/peliculasController')
const { requiereAuth } = require('../middlewares/auth')

// RUTAS PUBLICAS
enrutador.get('/buscar', peliculasController.buscar)
enrutador.get('/populares', peliculasController.obtenerPopulares)
enrutador.get('/omdb/:imdbId', peliculasController.obtenerDeOMDb)
enrutador.get('/', peliculasController.obtenerTodas)
enrutador.get('/:id', peliculasController.obtenerUna)

// RUTAS PROTEGIDAS
enrutador.post('/', requiereAuth, peliculasController.guardarDeOMDb)
enrutador.post('/agregar-a-lista', requiereAuth, peliculasController.buscarYAgregarALista)
enrutador.post('/:id/review', requiereAuth, peliculasController.guardarReview)

module.exports = enrutador
