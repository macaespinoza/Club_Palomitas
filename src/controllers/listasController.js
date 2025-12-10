const { Lista, Pelicula, ListaPelicula, Usuario, Calificacion, Comentario } = require('../models/associations')

// OBTENER TODAS LAS LISTAS DEL USUARIO
exports.obtenerTodas = async (req, res, next) => {
    try {
        const listas = await Lista.findAll({
            where: { usuario_id: req.auth.id },
            include: [{
                model: Pelicula,
                as: 'peliculas'
            }],
            order: [['creado_en', 'DESC']]
        })

        return res.json({
            exito: true,
            datos: listas.map(lista => formatearLista(lista))
        })
    } catch (error) {
        next(error)
    }
}

// OBTENER LISTAS PUBLICAS
exports.obtenerPublicas = async (req, res, next) => {
    try {
        const { pagina = 1, limite = 10 } = req.query
        const offset = (pagina - 1) * limite

        const { count, rows: listas } = await Lista.findAndCountAll({
            where: { es_publica: true },
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre_usuario', 'avatar_url']
                },
                {
                    model: Pelicula,
                    as: 'peliculas'
                }
            ],
            order: [['creado_en', 'DESC']],
            limit: parseInt(limite),
            offset: parseInt(offset)
        })

        return res.json({
            exito: true,
            datos: listas.map(lista => formatearLista(lista)),
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

// OBTENER UNA LISTA
exports.obtenerUna = async (req, res, next) => {
    try {
        const lista = await Lista.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre_usuario', 'avatar_url']
                },
                {
                    model: Pelicula,
                    as: 'peliculas',
                    include: [
                        {
                            model: Calificacion,
                            as: 'calificaciones',
                            required: false
                        },
                        {
                            model: Comentario,
                            as: 'comentarios',
                            required: false
                        }
                    ]
                }
            ]
        })

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (!lista.es_publica && lista.usuario_id !== (req.auth?.id ? parseInt(req.auth.id) : null)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para ver esta lista'
            })
        }

        return res.json({
            exito: true,
            datos: formatearLista(lista)
        })
    } catch (error) {
        next(error)
    }
}

// CREAR LISTA
exports.crear = async (req, res, next) => {
    try {
        const { nombre, descripcion, es_publica } = req.body

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                exito: false,
                error: 'El nombre de la lista es requerido'
            })
        }

        const lista = await Lista.create({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null,
            es_publica: es_publica || false,
            usuario_id: req.auth.id
        })

        return res.status(201).json({
            exito: true,
            mensaje: 'Lista creada exitosamente',
            datos: formatearLista(lista)
        })
    } catch (error) {
        next(error)
    }
}

// ACTUALIZAR LISTA
exports.actualizar = async (req, res, next) => {
    try {
        const { nombre, descripcion, es_publica } = req.body

        const lista = await Lista.findByPk(req.params.id)

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (lista.usuario_id !== parseInt(req.auth.id)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para editar esta lista'
            })
        }

        await lista.update({
            nombre: nombre?.trim() || lista.nombre,
            descripcion: descripcion !== undefined ? descripcion?.trim() : lista.descripcion,
            es_publica: es_publica !== undefined ? es_publica : lista.es_publica
        })

        return res.json({
            exito: true,
            mensaje: 'Lista actualizada exitosamente',
            datos: formatearLista(lista)
        })
    } catch (error) {
        next(error)
    }
}

// ELIMINAR LISTA
exports.eliminar = async (req, res, next) => {
    try {
        const lista = await Lista.findByPk(req.params.id)

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (lista.usuario_id !== parseInt(req.auth.id)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para eliminar esta lista'
            })
        }

        await lista.destroy()

        return res.json({
            exito: true,
            mensaje: 'Lista eliminada exitosamente'
        })
    } catch (error) {
        next(error)
    }
}

// AGREGAR PELICULA A LISTA
exports.agregarPelicula = async (req, res, next) => {
    try {
        const { pelicula_id, notas } = req.body

        const lista = await Lista.findByPk(req.params.id)

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (lista.usuario_id !== parseInt(req.auth.id)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para modificar esta lista'
            })
        }

        const pelicula = await Pelicula.findByPk(pelicula_id)
        if (!pelicula) {
            return res.status(404).json({
                exito: false,
                error: 'Película no encontrada. Primero debes buscarla y guardarla.'
            })
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
            mensaje: 'Película agregada a la lista exitosamente'
        })
    } catch (error) {
        next(error)
    }
}

// REMOVER PELICULA DE LISTA
exports.removerPelicula = async (req, res, next) => {
    try {
        const { id, peliculaId } = req.params

        const lista = await Lista.findByPk(id)

        if (!lista) {
            return res.status(404).json({
                exito: false,
                error: 'Lista no encontrada'
            })
        }

        if (lista.usuario_id !== parseInt(req.auth.id)) {
            return res.status(403).json({
                exito: false,
                error: 'No tienes permiso para modificar esta lista'
            })
        }

        const eliminado = await ListaPelicula.destroy({
            where: { lista_id: id, pelicula_id: peliculaId }
        })

        if (!eliminado) {
            return res.status(404).json({
                exito: false,
                error: 'La película no está en esta lista'
            })
        }

        return res.json({
            exito: true,
            mensaje: 'Película removida de la lista exitosamente'
        })
    } catch (error) {
        next(error)
    }
}

// FORMATEAR LISTA
function formatearLista(lista) {
    const formateado = {
        id: lista.id,
        nombre: lista.nombre,
        descripcion: lista.descripcion,
        es_publica: lista.es_publica,
        creado_en: lista.creado_en,
        actualizado_en: lista.actualizado_en,
        cantidad_peliculas: lista.peliculas?.length || 0
    }

    if (lista.usuario) {
        formateado.usuario = {
            id: lista.usuario.id,
            nombre_usuario: lista.usuario.nombre_usuario,
            avatar_url: lista.usuario.avatar_url
        }
    }

    if (lista.peliculas) {
        formateado.peliculas = lista.peliculas.map(pelicula => {
            let miCalificacion = null
            let miComentario = null

            if (pelicula.calificaciones && pelicula.calificaciones.length > 0) {
                const calif = pelicula.calificaciones.find(c => c.usuario_id === lista.usuario_id)
                if (calif) miCalificacion = calif.puntuacion
            }

            if (pelicula.comentarios && pelicula.comentarios.length > 0) {
                const coment = pelicula.comentarios.find(c => c.usuario_id === lista.usuario_id)
                if (coment) miComentario = coment.contenido
            }

            return {
                id: pelicula.id,
                imdb_id: pelicula.imdb_id,
                titulo: pelicula.titulo,
                anio: pelicula.anio,
                poster: pelicula.poster,
                puntuacion_imdb: pelicula.puntuacion_imdb,
                tipo: pelicula.tipo,
                agregado_en: pelicula.ListaPelicula?.agregado_en,
                notas: pelicula.ListaPelicula?.notas,
                mi_calificacion: miCalificacion,
                mi_comentario: miComentario
            }
        })
    }

    return formateado
}
