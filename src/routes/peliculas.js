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

// RUTAS PARA COMPARTIR RESEÑAS
enrutador.get('/:id/share-image', requiereAuth, peliculasController.generarImagenResena)
enrutador.get('/:id/share-data', requiereAuth, peliculasController.obtenerDatosResena)

module.exports = enrutador
