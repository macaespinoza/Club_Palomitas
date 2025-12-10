require('dotenv').config()
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const { engine } = require('express-handlebars')
const PUERTO = process.env.PORT || 8080

const rutasAuth = require('./src/routes/auth')
const rutasListas = require('./src/routes/listas')
const rutasPeliculas = require('./src/routes/peliculas')

const { sequelize, Lista, Pelicula } = require('./src/models/associations')

const app = express()

// CONFIGURACION HANDLEBARS
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/views/layouts'),
    partialsDir: path.join(__dirname, 'src/views/partials'),
    helpers: {
        range: (start, end) => {
            const result = []
            for (let i = start; i < end; i++) {
                result.push(i)
            }
            return result
        },
        lte: (a, b) => a <= b,
        eq: (a, b) => a === b,
        or: (a, b) => a || b
    }
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'src/views'))

// MIDDLEWARES
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

// AUTENTICACION JWT
const { usuarioActual } = require('./src/middlewares/auth')
app.use(usuarioActual)

app.use((req, res, next) => {
    req.usuario = req.auth || null
    res.locals.usuario = req.usuario
    next()
})

// RUTAS DE VISTAS
app.get('/', (req, res) => {
    if (req.usuario) {
        res.redirect('/dashboard')
    } else {
        res.redirect('/auth/login')
    }
})

app.get('/dashboard', async (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('dashboard', {
        usuario: req.usuario,
        titulo: 'Mi Dashboard'
    })
})

app.get('/auth/login', (req, res) => {
    if (req.usuario) {
        return res.redirect('/dashboard')
    }
    res.render('auth/login', { titulo: 'Iniciar Sesión' })
})

app.get('/auth/register', (req, res) => {
    if (req.usuario) {
        return res.redirect('/dashboard')
    }
    res.render('auth/register', { titulo: 'Registrarse' })
})

app.get('/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/auth/login')
})

app.get('/buscar', (req, res) => {
    const query = req.query.q || ''
    res.render('buscar', {
        titulo: 'Buscar Películas',
        query,
        usuario: req.usuario
    })
})

app.get('/listas', (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('listas/index', {
        titulo: 'Mis Listas',
        usuario: req.usuario
    })
})

app.get('/listas/nueva', (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('listas/nueva', {
        titulo: 'Crear Nueva Lista',
        usuario: req.usuario
    })
})

// VISTA DE RESEÑA PARA COMPARTIR
app.get('/resena/:peliculaId', async (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    try {
        const { Calificacion, Comentario, Usuario } = require('./src/models/associations')

        const pelicula = await Pelicula.findByPk(req.params.peliculaId)
        if (!pelicula) {
            return res.status(404).render('error', {
                titulo: 'Película no encontrada',
                mensaje: 'La película que buscas no existe'
            })
        }

        const calificacion = await Calificacion.findOne({
            where: { usuario_id: req.usuario.id, pelicula_id: req.params.peliculaId }
        })

        const comentario = await Comentario.findOne({
            where: { usuario_id: req.usuario.id, pelicula_id: req.params.peliculaId }
        })

        const usuario = await Usuario.findByPk(req.usuario.id)

        // Obtener lista_id de la query string para el botón de volver
        const listaId = req.query.lista || null

        res.render('resena', {
            titulo: `Reseña: ${pelicula.titulo}`,
            pelicula: pelicula.get({ plain: true }),
            calificacion: calificacion?.puntuacion || null,
            comentario: comentario?.contenido || null,
            usuario: {
                nombre: usuario.nombre_usuario,
                avatar: usuario.avatar_url
            },
            listaId
        })
    } catch (error) {
        console.error('ERROR:', error)
        res.status(500).render('error', { mensaje: 'Error al cargar la reseña.' })
    }
})

app.get('/listas/:id', async (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    try {
        const { Calificacion, Comentario } = require('./src/models/associations')

        const lista = await Lista.findByPk(req.params.id, {
            include: [{
                model: Pelicula,
                as: 'peliculas',
                include: [
                    {
                        model: Calificacion,
                        as: 'calificaciones',
                        where: { usuario_id: req.usuario.id },
                        required: false
                    },
                    {
                        model: Comentario,
                        as: 'comentarios',
                        where: { usuario_id: req.usuario.id },
                        required: false
                    }
                ]
            }]
        })

        if (!lista) {
            return res.status(404).render('error', {
                titulo: 'Lista no encontrada',
                mensaje: 'La lista que buscas no existe'
            })
        }

        const listaPlain = lista.get({ plain: true })

        if (listaPlain.peliculas) {
            listaPlain.peliculas = listaPlain.peliculas.map(p => {
                const calif = p.calificaciones && p.calificaciones.length > 0 ? p.calificaciones[0].puntuacion : null
                const com = p.comentarios && p.comentarios.length > 0 ? p.comentarios[0].contenido : null
                return {
                    ...p,
                    mi_calificacion: calif,
                    mi_comentario: com
                }
            })
        }

        res.render('listas/detalle', {
            titulo: listaPlain.nombre,
            lista: listaPlain,
            usuario: req.usuario,
            esPropietario: lista.usuario_id === req.usuario.id
        })
    } catch (error) {
        console.error('ERROR:', error)
        res.status(500).render('error', { mensaje: 'Error al cargar la lista. Intenta nuevamente.' })
    }

})

// RUTAS API
app.use('/api/auth', rutasAuth)
app.use('/api/listas', rutasListas)
app.use('/api/peliculas', rutasPeliculas)

app.get('/api', (req, res) => {
    res.json({
        nombre: 'API de Listas de Películas',
        version: '1.0.0',
        descripcion: 'API para gestionar listas de películas personalizadas con OMDb',
        endpoints: {
            autenticacion: {
                registro: 'POST /api/auth/registro',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                obtenerPerfil: 'GET /api/auth/perfil',
                actualizarPerfil: 'PUT /api/auth/perfil',
                cambiarContrasena: 'PUT /api/auth/contrasena'
            },
            peliculas: {
                buscar: 'GET /api/peliculas/buscar?q=batman&pagina=1&tipo=pelicula',
                populares: 'GET /api/peliculas/populares',
                obtenerDeOMDb: 'GET /api/peliculas/omdb/:imdbId',
                listar: 'GET /api/peliculas',
                obtenerUna: 'GET /api/peliculas/:id',
                guardar: 'POST /api/peliculas',
                agregarALista: 'POST /api/peliculas/agregar-a-lista'
            },
            listas: {
                misListas: 'GET /api/listas',
                listasPublicas: 'GET /api/listas/publicas',
                obtenerUna: 'GET /api/listas/:id',
                crear: 'POST /api/listas',
                actualizar: 'PUT /api/listas/:id',
                eliminar: 'DELETE /api/listas/:id',
                agregarPelicula: 'POST /api/listas/:id/peliculas',
                removerPelicula: 'DELETE /api/listas/:id/peliculas/:peliculaId',
                actualizarReview: 'PUT /api/listas/:id/peliculas/:peliculaId/review'
            }
        }
    })
})

// 404
app.use((req, res) => {
    res.status(404).render('error', {
        titulo: 'Página no encontrada',
        mensaje: 'La página que buscas no existe'
    })
})

// MANEJO DE ERRORES
app.use((err, req, res, next) => {
    console.error('Error:', err.message)
    console.error(err.stack)

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            exito: false,
            error: 'Token inválido o expirado'
        })
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            exito: false,
            error: 'Error de validación',
            detalles: err.errors.map(e => e.message)
        })
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            exito: false,
            error: 'El registro ya existe',
            detalles: err.errors.map(e => e.message)
        })
    }

    res.status(500).json({
        exito: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message
    })
})

// INICIAR SERVIDOR
sequelize.sync()
    .then(() => {
        console.log('Base de datos sincronizada')
        app.listen(PUERTO, () => {
            console.log(`Servidor corriendo en http://localhost:${PUERTO}`)
            console.log(`API disponible en http://localhost:${PUERTO}/api`)
        })
    })
    .catch(err => {
        console.error('Error de conexión:', err)
        process.exit(1)
    })