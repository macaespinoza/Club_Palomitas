const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_URL_BASE = process.env.OMDB_BASE_URL || 'http://www.omdbapi.com/'
const OMDB_IMG_URL = process.env.OMDB_IMG_URL || 'http://img.omdbapi.com/'

class ServicioOMDb {
    // BUSCAR PELICULAS
    async buscarPeliculas(terminoBusqueda, pagina = 1, tipo = null, anio = null) {
        const parametros = new URLSearchParams({
            apikey: OMDB_API_KEY,
            s: terminoBusqueda,
            page: pagina.toString()
        })

        const tiposMap = {
            'pelicula': 'movie',
            'serie': 'series',
            'episodio': 'episode'
        }

        if (tipo) parametros.append('type', tiposMap[tipo] || tipo)
        if (anio) parametros.append('y', anio)

        const respuesta = await fetch(`${OMDB_URL_BASE}?${parametros}`)
        const datos = await respuesta.json()

        if (datos.Response === 'False') {
            return {
                exito: false,
                error: datos.Error,
                resultados: [],
                totalResultados: 0
            }
        }

        const tiposMapInverso = {
            'movie': 'pelicula',
            'series': 'serie',
            'episode': 'episodio'
        }

        return {
            exito: true,
            resultados: (datos.Search || []).map(item => ({
                imdb_id: item.imdbID,
                titulo: item.Title,
                anio: item.Year,
                tipo: tiposMapInverso[item.Type] || item.Type,
                poster: `${OMDB_IMG_URL}?apikey=${OMDB_API_KEY}&i=${item.imdbID}`
            })),
            totalResultados: parseInt(datos.totalResults) || 0,
            pagina: pagina
        }
    }

    // OBTENER PELICULA POR ID
    async obtenerPeliculaPorId(imdbId) {
        const parametros = new URLSearchParams({
            apikey: OMDB_API_KEY,
            i: imdbId,
            plot: 'short'
        })

        const respuesta = await fetch(`${OMDB_URL_BASE}?${parametros}`)
        const datos = await respuesta.json()

        if (datos.Response === 'False') {
            return {
                exito: false,
                error: datos.Error,
                pelicula: null
            }
        }

        return {
            exito: true,
            pelicula: this.formatearDatosPelicula(datos)
        }
    }

    // OBTENER PELICULA POR TITULO
    async obtenerPeliculaPorTitulo(titulo, anio = null) {
        const parametros = new URLSearchParams({
            apikey: OMDB_API_KEY,
            t: titulo,
            plot: 'short'
        })

        if (anio) parametros.append('y', anio)

        const respuesta = await fetch(`${OMDB_URL_BASE}?${parametros}`)
        const datos = await respuesta.json()

        if (datos.Response === 'False') {
            return {
                exito: false,
                error: datos.Error,
                pelicula: null
            }
        }

        return {
            exito: true,
            pelicula: this.formatearDatosPelicula(datos)
        }
    }

    // FORMATEAR DATOS DE PELICULA
    formatearDatosPelicula(datosOMDb) {
        const tiposMap = {
            'movie': 'pelicula',
            'series': 'serie',
            'episode': 'episodio'
        }

        return {
            imdb_id: datosOMDb.imdbID,
            titulo: datosOMDb.Title,
            anio: datosOMDb.Year,
            clasificacion: datosOMDb.Rated,
            duracion: datosOMDb.Runtime,
            genero: datosOMDb.Genre,
            director: datosOMDb.Director,
            actores: datosOMDb.Actors,
            sinopsis: datosOMDb.Plot,
            poster: `${OMDB_IMG_URL}?apikey=${OMDB_API_KEY}&i=${datosOMDb.imdbID}`,
            puntuacion_imdb: datosOMDb.imdbRating,
            tipo: tiposMap[datosOMDb.Type] || 'pelicula'
        }
    }

    // OBTENER PELICULAS POPULARES
    async obtenerPeliculasPopulares() {
        const peliculasPopulares = [
            'tt0111161', 'tt0068646', 'tt0468569', 'tt0108052', 'tt0167260',
            'tt0110912', 'tt0060196', 'tt0120737', 'tt0109830', 'tt0137523',
            'tt1375666', 'tt0167261', 'tt0080684', 'tt0133093', 'tt0099685',
            'tt0073486', 'tt0114369', 'tt0047478', 'tt0076759', 'tt0102926',
            'tt0317248', 'tt0114814', 'tt0120815', 'tt0816692', 'tt0245429',
            'tt0110357', 'tt0088763', 'tt0103064', 'tt0172495', 'tt0482571',
            'tt0407887', 'tt2582802', 'tt1675434', 'tt6751668', 'tt7286456',
            'tt4154796', 'tt4633694', 'tt2380307', 'tt0910970', 'tt0114709',
            'tt0078748', 'tt0081505', 'tt0054215', 'tt0034583', 'tt0027977',
            'tt0095765', 'tt0095327', 'tt0364569', 'tt0211915', 'tt0457430'
        ]

        const seleccionadas = []
        const copiaIds = [...peliculasPopulares]

        for (let i = 0; i < 8 && copiaIds.length > 0; i++) {
            const indiceAleatorio = Math.floor(Math.random() * copiaIds.length)
            seleccionadas.push(copiaIds[indiceAleatorio])
            copiaIds.splice(indiceAleatorio, 1)
        }

        const promesas = seleccionadas.map(id => this.obtenerPeliculaPorId(id))
        const resultados = await Promise.all(promesas)

        return resultados
            .filter(r => r.exito)
            .map(r => r.pelicula)
    }
}

module.exports = new ServicioOMDb()
