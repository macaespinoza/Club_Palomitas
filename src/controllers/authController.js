const { Usuario } = require('../models/associations')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// REGISTRO
exports.registro = async (req, res, next) => {
    try {
        const { nombre_usuario, email, contrasena } = req.body

        if (!nombre_usuario || !email || !contrasena) {
            return res.status(400).json({
                exito: false,
                error: 'Todos los campos son obligatorios (nombre_usuario, email, contrasena)'
            })
        }

        if (contrasena.length < 6) {
            return res.status(400).json({
                exito: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            })
        }

        const existeEmail = await Usuario.findOne({ where: { email } })
        if (existeEmail) {
            return res.status(409).json({
                exito: false,
                error: 'El email ya está registrado'
            })
        }

        const existeNombreUsuario = await Usuario.findOne({ where: { nombre_usuario } })
        if (existeNombreUsuario) {
            return res.status(409).json({
                exito: false,
                error: 'El nombre de usuario ya está en uso'
            })
        }

        const hash = await bcrypt.hash(contrasena, 12)

        const usuario = await Usuario.create({
            nombre_usuario,
            email,
            contrasena: hash,
            rol: 'usuario'
        })

        const token = generarToken(usuario)

        return res.status(201).json({
            exito: true,
            mensaje: 'Usuario registrado exitosamente',
            datos: {
                usuario: formatearUsuario(usuario),
                token
            }
        })
    } catch (error) {
        next(error)
    }
}

// LOGIN
exports.login = async (req, res, next) => {
    try {
        const { email, contrasena } = req.body

        if (!email || !contrasena) {
            return res.status(400).json({
                exito: false,
                error: 'Email y contraseña son requeridos'
            })
        }

        const usuario = await Usuario.findOne({ where: { email } })
        if (!usuario) {
            return res.status(401).json({
                exito: false,
                error: 'Credenciales inválidas'
            })
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena)
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                error: 'Credenciales inválidas'
            })
        }

        const token = generarToken(usuario)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        })

        return res.json({
            exito: true,
            mensaje: 'Inicio de sesión exitoso',
            datos: {
                usuario: formatearUsuario(usuario),
                token
            }
        })
    } catch (error) {
        next(error)
    }
}

// LOGOUT
exports.logout = (req, res) => {
    res.clearCookie('token')
    return res.json({
        exito: true,
        mensaje: 'Sesión cerrada exitosamente'
    })
}

// OBTENER PERFIL
exports.obtenerPerfil = async (req, res, next) => {
    try {
        const usuario = await Usuario.findByPk(req.auth.id)

        if (!usuario) {
            return res.status(404).json({
                exito: false,
                error: 'Usuario no encontrado'
            })
        }

        return res.json({
            exito: true,
            datos: formatearUsuario(usuario)
        })
    } catch (error) {
        next(error)
    }
}

// ACTUALIZAR PERFIL
exports.actualizarPerfil = async (req, res, next) => {
    try {
        const { nombre_usuario, avatar_url } = req.body
        const usuario = await Usuario.findByPk(req.auth.id)

        if (!usuario) {
            return res.status(404).json({
                exito: false,
                error: 'Usuario no encontrado'
            })
        }

        if (nombre_usuario && nombre_usuario !== usuario.nombre_usuario) {
            const existeNombreUsuario = await Usuario.findOne({ where: { nombre_usuario } })
            if (existeNombreUsuario) {
                return res.status(409).json({
                    exito: false,
                    error: 'El nombre de usuario ya está en uso'
                })
            }
        }

        await usuario.update({
            nombre_usuario: nombre_usuario || usuario.nombre_usuario,
            avatar_url: avatar_url !== undefined ? avatar_url : usuario.avatar_url
        })

        return res.json({
            exito: true,
            mensaje: 'Perfil actualizado exitosamente',
            datos: formatearUsuario(usuario)
        })
    } catch (error) {
        next(error)
    }
}

// CAMBIAR CONTRASEÑA
exports.cambiarContrasena = async (req, res, next) => {
    try {
        const { contrasena_actual, contrasena_nueva } = req.body

        if (!contrasena_actual || !contrasena_nueva) {
            return res.status(400).json({
                exito: false,
                error: 'Contraseña actual y nueva son requeridas'
            })
        }

        if (contrasena_nueva.length < 6) {
            return res.status(400).json({
                exito: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            })
        }

        const usuario = await Usuario.findByPk(req.auth.id)

        const contrasenaValida = await bcrypt.compare(contrasena_actual, usuario.contrasena)
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                error: 'La contraseña actual es incorrecta'
            })
        }

        const hash = await bcrypt.hash(contrasena_nueva, 12)
        await usuario.update({ contrasena: hash })

        return res.json({
            exito: true,
            mensaje: 'Contraseña actualizada exitosamente'
        })
    } catch (error) {
        next(error)
    }
}

// FUNCIONES AUXILIARES
function generarToken(usuario) {
    return jwt.sign(
        {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    )
}

function formatearUsuario(usuario) {
    return {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email,
        avatar_url: usuario.avatar_url,
        rol: usuario.rol,
        creado_en: usuario.creado_en
    }
}