const express = require('express')
const enrutador = express.Router()
const authController = require('../controllers/authController')
const { requiereAuth } = require('../middlewares/auth')

// Rutas públicas
enrutador.post('/registro', authController.registro)
enrutador.post('/login', authController.login)
enrutador.post('/logout', authController.logout)

// Rutas protegidas (requieren autenticación)
enrutador.get('/perfil', requiereAuth, authController.obtenerPerfil)
enrutador.put('/perfil', requiereAuth, authController.actualizarPerfil)
enrutador.put('/contrasena', requiereAuth, authController.cambiarContrasena)

module.exports = enrutador