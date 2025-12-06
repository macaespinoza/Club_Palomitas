const { expressjwt: jwt } = require('express-jwt')

/**
 * Middleware para extraer y validar JWT del usuario actual
 * Soporta token en header Authorization (Bearer) y en cookies
 */
const usuarioActual = jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: false,
    getToken: (req) => {
        // Primero intentar Authorization header
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return req.headers.authorization.split(' ')[1]
        }

        // Luego intentar cookie
        if (req.cookies?.token) {
            return req.cookies.token
        }

        return null
    }
})

/**
 * Middleware que requiere autenticación
 * Retorna 401 si no hay usuario autenticado
 */
function requiereAuth(req, res, next) {
    if (!req.auth) {
        return res.status(401).json({
            exito: false,
            error: 'Autenticación requerida. Por favor inicia sesión.'
        })
    }
    next()
}

/**
 * Middleware que requiere un rol específico
 * @param {string|string[]} roles - Rol o array de roles permitidos
 */
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
