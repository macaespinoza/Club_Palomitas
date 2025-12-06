const { expressjwt: jwt } = require('express-jwt')

// MIDDLEWARE JWT - EXTRAE USUARIO ACTUAL
const usuarioActual = jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: false,
    getToken: (req) => {
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return req.headers.authorization.split(' ')[1]
        }
        if (req.cookies?.token) {
            return req.cookies.token
        }
        return null
    }
})

// REQUIERE AUTENTICACION
function requiereAuth(req, res, next) {
    if (!req.auth) {
        return res.status(401).json({
            exito: false,
            error: 'Autenticación requerida. Por favor inicia sesión.'
        })
    }
    next()
}

// REQUIERE ROL ESPECIFICO
function requiereRol(roles) {
    const rolesPermitidos = Array.isArray(roles) ? roles : [roles]

    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                exito: false,
                error: 'Autenticación requerida'
            })
        }

        if (!rolesPermitidos.includes(req.auth.rol)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permisos para realizar esta acción'
            })
        }

        next()
    }
}

module.exports = {
    usuarioActual,
    requiereAuth,
    requiereRol
}
