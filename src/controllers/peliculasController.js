const { Pelicula, Lista, ListaPelicula, Calificacion, Comentario, Usuario } = require('../models/associations')
const servicioOMDb = require('../services/servicioOMDb')
const { Op } = require('sequelize')
const { generateShareImage } = require('../services/shareImageService')

// BUSCAR PELICULAS EN OMDB
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

// OBTENER PELICULA DE OMDB POR ID
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

// GUARDAR PELICULA DE OMDB EN BD
exports.guardarDeOMDb = async (req, res, next) => {
    try {
        const { imdb_id } = req.body

        if (!imdb_id) {
            return res.status(400).json({
                exito: false,
                error: 'El imdb_id es requerido'
            })
        }

        let pelicula = await Pelicula.findOne({ where: { imdb_id } })

        if (pelicula) {
            return res.json({
                exito: true,
                mensaje: 'Película ya existe en la base de datos',
                datos: pelicula
            })
        }

        const resultado = await servicioOMDb.obtenerPeliculaPorId(imdb_id)

        if (!resultado.exito) {
            return res.status(404).json({
                exito: false,
                error: resultado.error
            })
        }

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

// OBTENER TODAS LAS PELICULAS
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

// OBTENER UNA PELICULA
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

// BUSCAR Y AGREGAR A LISTA
exports.buscarYAgregarALista = async (req, res, next) => {
    try {
        const { imdb_id, lista_id, notas } = req.body

        if (!imdb_id || !lista_id) {
            return res.status(400).json({
                exito: false,
                error: 'imdb_id y lista_id son requeridos'
            })
        }

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

        let pelicula = await Pelicula.findOne({ where: { imdb_id } })

        if (!pelicula) {
            const resultado = await servicioOMDb.obtenerPeliculaPorId(imdb_id)

            if (!resultado.exito) {
                return res.status(404).json({
                    exito: false,
                    error: `Película no encontrada en OMDb: ${resultado.error}`
                })
            }

            pelicula = await Pelicula.create(resultado.pelicula)
        }

        const existente = await ListaPelicula.findOne({
            where: { lista_id: lista.id, pelicula_id: pelicula.id }
        })

        if (existente) {
            return res.status(409).json({
                exito: false,
                error: 'Esta película ya está en la lista'
            })
        }

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

// OBTENER PELICULAS POPULARES
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

// GUARDAR REVIEW
exports.guardarReview = async (req, res, next) => {
    try {
        const { id } = req.params
        const { calificacion, comentario } = req.body
        const usuario_id = req.auth.id

        const pelicula = await Pelicula.findByPk(id)
        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada'
            })
        }

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

// GENERAR IMAGEN DE RESEÑA PARA COMPARTIR
exports.generarImagenResena = async (req, res, next) => {
    try {
        const { id } = req.params
        const usuario_id = req.auth.id

        // Obtener película
        const pelicula = await Pelicula.findByPk(id)
        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada'
            })
        }

        // Obtener calificación del usuario
        const calificacion = await Calificacion.findOne({
            where: { usuario_id, pelicula_id: id }
        })

        // Obtener comentario del usuario
        const comentario = await Comentario.findOne({
            where: { usuario_id, pelicula_id: id }
        })

        // Obtener datos del usuario
        const usuario = await Usuario.findByPk(usuario_id)

        if (!calificacion && !comentario) {
            return res.status(400).json({
                exito: false,
                error: 'No tienes una reseña para esta película'
            })
        }

        // Generar imagen
        const imageBuffer = await generateShareImage({
            posterUrl: pelicula.poster,
            rating: calificacion?.puntuacion || 0,
            comment: comentario?.contenido || '',
            movieTitle: pelicula.titulo,
            movieYear: pelicula.anio,
            username: usuario.nombre_usuario
        })

        // Responder con la imagen
        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="resena-${pelicula.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.png"`,
            'Cache-Control': 'no-cache'
        })

        return res.send(imageBuffer)
    } catch (error) {
        console.error('Error generando imagen:', error)
        next(error)
    }
}

// OBTENER DATOS DE RESEÑA PARA COMPARTIR
exports.obtenerDatosResena = async (req, res, next) => {
    try {
        const { id } = req.params
        const usuario_id = req.auth.id

        const pelicula = await Pelicula.findByPk(id)
        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada'
            })
        }

        const calificacion = await Calificacion.findOne({
            where: { usuario_id, pelicula_id: id }
        })

        const comentario = await Comentario.findOne({
            where: { usuario_id, pelicula_id: id }
        })

        const usuario = await Usuario.findByPk(usuario_id, {
            attributes: ['nombre_usuario', 'avatar_url']
        })

        return res.json({
            exito: true,
            datos: {
                pelicula: {
                    id: pelicula.id,
                    titulo: pelicula.titulo,
                    anio: pelicula.anio,
                    poster: pelicula.poster,
                    genero: pelicula.genero,
                    director: pelicula.director
                },
                calificacion: calificacion?.puntuacion || null,
                comentario: comentario?.contenido || null,
                usuario: {
                    nombre: usuario.nombre_usuario,
                    avatar: usuario.avatar_url
                }
            }
        })
    } catch (error) {
        next(error)
    }
}
