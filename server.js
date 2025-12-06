require('dotenv').config()
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const { engine } = require('express-handlebars')
const PUERTO = process.env.PORT || 8080

// Importar rutas API
const rutasAuth = require('./src/routes/auth')
const rutasListas = require('./src/routes/listas')
const rutasPeliculas = require('./src/routes/peliculas')

// Importar modelos con asociaciones (esto sincroniza las relaciones)
const { sequelize, Lista, Pelicula } = require('./src/models/associations')

const app = express()

// Configurar Handlebars como motor de vistas
app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/views/layouts'),
    partialsDir: path.join(__dirname, 'src/views/partials'),
    helpers: {
        // Helper para generar rango de números
        range: (start, end) => {
            const result = []
            for (let i = start; i < end; i++) {
                result.push(i)
            }
            return result
        },
        // Helper para comparar valores
        lte: (a, b) => a <= b,
        eq: (a, b) => a === b,
        or: (a, b) => a || b
    }
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'src/views'))

// Middlewares básicos
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

// Middleware de autenticación JWT
const { usuarioActual } = require('./src/middlewares/auth')
app.use(usuarioActual)

// Middleware para pasar usuario a todas las vistas (req.auth -> req.usuario)
app.use((req, res, next) => {
    req.usuario = req.auth || null
    res.locals.usuario = req.usuario
    next()
})

// ===================== RUTAS DE VISTAS =====================

// Página principal - redirige a login si no está autenticado
app.get('/', (req, res) => {
    if (req.usuario) {
        res.redirect('/dashboard')
    } else {
        res.redirect('/auth/login')
    }
})

// Dashboard principal (requiere autenticación)
app.get('/dashboard', async (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('dashboard', {
        usuario: req.usuario,
        titulo: 'Mi Dashboard'
    })
})

// Rutas de autenticación (vistas)
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

// Logout desde navegador
app.get('/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/auth/login')
})

// Ruta de búsqueda de películas (vista)
app.get('/buscar', (req, res) => {
    const query = req.query.q || ''
    res.render('buscar', {
        titulo: 'Buscar Películas',
        query,
        usuario: req.usuario
    })
})

// Ruta para ver todas las listas del usuario (vista)
app.get('/listas', (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('listas/index', {
        titulo: 'Mis Listas',
        usuario: req.usuario
    })
})

// Ruta para crear nueva lista (vista)
app.get('/listas/nueva', (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    res.render('listas/nueva', {
        titulo: 'Crear Nueva Lista',
        usuario: req.usuario
    })
})

// Ruta para ver detalle de lista (vista)
// Ruta para ver detalle de lista (vista)
app.get('/listas/:id', async (req, res) => {
    if (!req.usuario) {
        return res.redirect('/auth/login')
    }
    try {
        const { Calificacion, Comentario } = require('./src/models/associations') // Ensure these are imported or available

        // Simplificado: obtener lista con sus películas
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

        // Convertir a objeto plano simple
        const listaPlain = lista.get({ plain: true })

        // Aplanar calificaciones y comentarios
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
            // Simple check de propiedad
            esPropietario: lista.usuario_id === req.usuario.id
        })
    } catch (error) {
        console.error('SERVER ERROR LOG:', error); // Ensuring this logs to terminal
        res.status(500).render('error', { mensaje: 'Error al cargar la lista. Intenta nuevamente.' })
    }

})

// ===================== RUTAS DE LA API =====================
app.use('/api/auth', rutasAuth)
app.use('/api/listas', rutasListas)
app.use('/api/peliculas', rutasPeliculas)

// Ruta API info
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

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).render('error', {
        titulo: 'Página no encontrada',
        mensaje: 'La página que buscas no existe'
    })
})

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.message)
    console.error(err.stack)

    // Errores de JWT
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            exito: false,
            error: 'Token inválido o expirado'
        })
    }

    // Errores de validación de Sequelize
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            exito: false,
            error: 'Error de validación',
            detalles: err.errors.map(e => e.message)
        })
    }

    // Errores de constraint único
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            exito: false,
            error: 'El registro ya existe',
            detalles: err.errors.map(e => e.message)
        })
    }

    // Error genérico
    res.status(500).json({
        exito: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message
    })
})

// Sincronizar base de datos e iniciar servidor (tablas ya creadas en PostgreSQL)
sequelize.sync()
    .then(() => {
        console.log('Base de datos sincronizada correctamente')
        app.listen(PUERTO, () => {
            console.log(`Servidor corriendo en http://localhost:${PUERTO}`)
            console.log(`Documentación de API disponible en http://localhost:${PUERTO}/api`)
        })
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err)
        process.exit(1)
    })