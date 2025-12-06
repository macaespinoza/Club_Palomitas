const { Pelicula, Lista, ListaPelicula, Calificacion, Comentario } = require('../models/associations')
const servicioOMDb = require('../services/servicioOMDb')
const { Op } = require('sequelize')

/**
 * GET /api/peliculas/buscar
 * Buscar películas en OMDb API
 */
exports.buscar = async (req, res, next) => {
    try {
        const { q, pagina = 1, tipo, anio } = req.query

        if (!q || q.trim() === '') {
            return res.status(400).json({
                exito: false,
                error: 'El término de búsqueda (q) es requerido'
            })
        }

        const resultado = await servicioOMDb.buscarPeliculas(q.trim(), pagina, tipo, anio)

        if (!resultado.exito) {
            return res.status(404).json({
                exito: false,
                error: resultado.error
            })
        }

        return res.json({
            exito: true,
            datos: resultado.resultados,
            paginacion: {
                total: resultado.totalResultados,
                pagina: resultado.pagina,
                paginas: Math.ceil(resultado.totalResultados / 10)
            }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * GET /api/peliculas/omdb/:imdbId
 * Obtener detalles de una película desde OMDb API
 */
exports.obtenerDeOMDb = async (req, res, next) => {
    try {
        const { imdbId } = req.params

        if (!imdbId || !imdbId.startsWith('tt')) {
            return res.status(400).json({
                exito: false,
                error: 'IMDb ID inválido. Debe comenzar con "tt"'
            })
        }

        const resultado = await servicioOMDb.obtenerPeliculaPorId(imdbId)

        if (!resultado.exito) {
            return res.status(404).json({
                exito: false,
                error: resultado.error
            })
        }

        return res.json({
            exito: true,
            datos: resultado.pelicula
        })
    } catch (error) {
        next(error)
    }
}

/**
 * POST /api/peliculas
 * Guardar una película de OMDb en nuestra base de datos
 */
exports.guardarDeOMDb = async (req, res, next) => {
    try {
        const { imdb_id } = req.body

        if (!imdb_id) {
            return res.status(400).json({
                exito: false,
                error: 'El imdb_id es requerido'
            })
        }

        // Verificar si ya existe en nuestra BD
        let pelicula = await Pelicula.findOne({ where: { imdb_id } })

        if (pelicula) {
            return res.json({
                exito: true,
                mensaje: 'Película ya existe en la base de datos',
                datos: pelicula
            })
        }

        // Obtener datos de OMDb
        const resultado = await servicioOMDb.obtenerPeliculaPorId(imdb_id)

        if (!resultado.exito) {
            return res.status(404).json({
                exito: false,
                error: resultado.error
            })
        }

        // Guardar en nuestra BD
        pelicula = await Pelicula.create(resultado.pelicula)

        return res.status(201).json({
            exito: true,
            mensaje: 'Película guardada exitosamente',
            datos: pelicula
        })
    } catch (error) {
        next(error)
    }
}

/**
 * GET /api/peliculas
 * Obtener todas las películas guardadas en nuestra BD
 */
exports.obtenerTodas = async (req, res, next) => {
    try {
        const { pagina = 1, limite = 20, tipo, genero } = req.query
        const offset = (pagina - 1) * limite

        const where = {}
        if (tipo) where.tipo = tipo
        if (genero) where.genero = { [Op.iLike]: `%${genero}%` }

        const { count, rows: peliculas } = await Pelicula.findAndCountAll({
            where,
            order: [['creado_en', 'DESC']],
            limit: parseInt(limite),
            offset: parseInt(offset)
        })

        return res.json({
            exito: true,
            datos: peliculas,
            paginacion: {
                total: count,
                pagina: parseInt(pagina),
                paginas: Math.ceil(count / limite)
            }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * GET /api/peliculas/:id
 * Obtener una película específica por ID interno
 */
exports.obtenerUna = async (req, res, next) => {
    try {
        const pelicula = await Pelicula.findByPk(req.params.id, {
            include: [{
                model: Lista,
                as: 'listas',
                where: { es_publica: true },
                required: false,
                through: { attributes: [] },
                attributes: ['id', 'nombre', 'usuario_id']
            }]
        })

        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada'
            })
        }

        return res.json({
            exito: true,
            datos: pelicula
        })
    } catch (error) {
        next(error)
    }
}

/**
 * POST /api/peliculas/agregar-a-lista
 * Buscar película en OMDb, guardarla y agregarla a una lista en un solo paso
 */
exports.buscarYAgregarALista = async (req, res, next) => {
    try {
        const { imdb_id, lista_id, notas } = req.body

        if (!imdb_id || !lista_id) {
            return res.status(400).json({
                exito: false,
                error: 'imdb_id y lista_id son requeridos'
            })
        }

        // Verificar que la lista pertenece al usuario
        const lista = await Lista.findByPk(lista_id)

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (lista.usuario_id !== req.auth.id) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para modificar esta lista'
            })
        }

        // Buscar o crear la película
        let pelicula = await Pelicula.findOne({ where: { imdb_id } })

        if (!pelicula) {
            // Obtener de OMDb
            const resultado = await servicioOMDb.obtenerPeliculaPorId(imdb_id)

            if (!resultado.exito) {
                return res.status(404).json({
                    exito: false,
                    error: `Película no encontrada en OMDb: ${resultado.error}`
                })
            }

            pelicula = await Pelicula.create(resultado.pelicula)
        }

        // Verificar si ya está en la lista
        const existente = await ListaPelicula.findOne({
            where: { lista_id: lista.id, pelicula_id: pelicula.id }
        })

        if (existente) {
            return res.status(409).json({
                exito: false,
                error: 'Esta película ya está en la lista'
            })
        }

        // Agregar a la lista
        await ListaPelicula.create({
            lista_id: lista.id,
            pelicula_id: pelicula.id,
            notas: notas?.trim() || null
        })

        return res.status(201).json({
            exito: true,
            mensaje: 'Película agregada a la lista exitosamente',
            datos: {
                pelicula,
                lista: {
                    id: lista.id,
                    nombre: lista.nombre
                }
            }
        })
    } catch (error) {
        next(error)
    }
}

/**
 * GET /api/peliculas/populares
 * Obtener películas populares aleatorias para sugerencias
 */
exports.obtenerPopulares = async (req, res, next) => {
    try {
        const peliculas = await servicioOMDb.obtenerPeliculasPopulares()

        return res.json({
            exito: true,
            datos: peliculas
        })
    } catch (error) {
        next(error)
    }
}
/**
 * POST /api/peliculas/:id/review
 * Guardar o actualizar review (calificación y comentario) de una película
 */
exports.guardarReview = async (req, res, next) => {
    try {
        const { id } = req.params
        const { calificacion, comentario } = req.body
        const usuario_id = req.auth.id

        // Validar película
        const pelicula = await Pelicula.findByPk(id)
        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada'
            })
        }

        // Manejar Calificación
        if (calificacion) {
            if (calificacion < 1 || calificacion > 5) {
                return res.status(400).json({
                    exito: false,
                    error: 'La calificación debe estar entre 1 y 5'
                })
            }

            const [calif, created] = await Calificacion.findOrCreate({
                where: { usuario_id, pelicula_id: id },
                defaults: { puntuacion: calificacion }
            })

            if (!created) {
                calif.puntuacion = calificacion
                await calif.save()
            }
        }

        // Manejar Comentario
        if (comentario !== undefined) {
            const [comment, created] = await Comentario.findOrCreate({
                where: { usuario_id, pelicula_id: id },
                defaults: { contenido: comentario }
            })

            if (!created) {
                comment.contenido = comentario
                await comment.save()
            }
        }

        return res.json({
            exito: true,
            mensaje: 'Review guardado exitosamente'
        })
    } catch (error) {
        next(error)
    }
}
