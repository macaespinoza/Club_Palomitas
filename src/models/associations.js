const Usuario = require('./Usuario')
const Lista = require('./Lista')
const Pelicula = require('./Pelicula')
const ListaPelicula = require('./ListaPelicula')
const Calificacion = require('./Calificacion')
const Comentario = require('./Comentario')
const ComentarioLike = require('./ComentarioLike')
const sequelize = require('../config/db')

// USUARIO -> LISTAS (1:N)
Usuario.hasMany(Lista, { foreignKey: 'usuario_id', as: 'listas', onDelete: 'CASCADE' })
Lista.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario', onDelete: 'CASCADE' })

// LISTA <-> PELICULA (N:M)
Lista.belongsToMany(Pelicula, { through: ListaPelicula, foreignKey: 'lista_id', otherKey: 'pelicula_id', as: 'peliculas' })
Pelicula.belongsToMany(Lista, { through: ListaPelicula, foreignKey: 'pelicula_id', otherKey: 'lista_id', as: 'listas' })

// TABLA INTERMEDIA
Lista.hasMany(ListaPelicula, { foreignKey: 'lista_id', as: 'listaPeliculas' })
ListaPelicula.belongsTo(Lista, { foreignKey: 'lista_id' })
Pelicula.hasMany(ListaPelicula, { foreignKey: 'pelicula_id', as: 'peliculaListas' })
ListaPelicula.belongsTo(Pelicula, { foreignKey: 'pelicula_id' })

// CALIFICACIONES
Usuario.hasMany(Calificacion, { foreignKey: 'usuario_id', as: 'calificaciones', onDelete: 'CASCADE' })
Calificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })

Pelicula.hasMany(Calificacion, { foreignKey: 'pelicula_id', as: 'calificaciones', onDelete: 'CASCADE' })
Calificacion.belongsTo(Pelicula, { foreignKey: 'pelicula_id', as: 'pelicula' })

// COMENTARIOS
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id', as: 'comentarios', onDelete: 'CASCADE' })
Comentario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })

Pelicula.hasMany(Comentario, { foreignKey: 'pelicula_id', as: 'comentarios', onDelete: 'CASCADE' })
Comentario.belongsTo(Pelicula, { foreignKey: 'pelicula_id', as: 'pelicula' })

// LIKES EN COMENTARIOS
Comentario.hasMany(ComentarioLike, { foreignKey: 'comentario_id', as: 'likes', onDelete: 'CASCADE' })
ComentarioLike.belongsTo(Comentario, { foreignKey: 'comentario_id' })

Usuario.hasMany(ComentarioLike, { foreignKey: 'usuario_id', as: 'comentarioLikes', onDelete: 'CASCADE' })
ComentarioLike.belongsTo(Usuario, { foreignKey: 'usuario_id' })

module.exports = {
    sequelize,
    Usuario,
    Lista,
    Pelicula,
    ListaPelicula,
    Calificacion,
    Comentario,
    ComentarioLike
}