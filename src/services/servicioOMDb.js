/**
 * Servicio para interactuar con la OMDb API
 * Documentación: http://www.omdbapi.com/
 */

const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_URL_BASE = process.env.OMDB_BASE_URL || 'http://www.omdbapi.com/'
// Endpoint for poster images
const OMDB_IMG_URL = process.env.OMDB_IMG_URL || 'http://img.omdbapi.com/'

class ServicioOMDb {
    /**
     * Buscar películas por título
     * @param {string} terminoBusqueda - Término de búsqueda
     * @param {number} pagina - Página de resultados (1-100)
     * @param {string} tipo - Tipo: pelicula, serie, episodio
     * @param {string} anio - Año de lanzamiento
     * @returns {Promise<Object>} - Resultados de búsqueda
     */
    async buscarPeliculas(terminoBusqueda, pagina = 1, tipo = null, anio = null) {
        const parametros = new URLSearchParams({
            apikey: OMDB_API_KEY,
            s: terminoBusqueda,
            page: pagina.toString()
        })

        // Mapear tipos en español a inglés para la API
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

        // Mapear tipos de inglés a español
        const tiposMapInverso = {
            'movie': 'pelicula',
            'series': 'serie',
            'episode': 'episodio'
        }

        return {
            exito: true,
            // Formatear resultados con campos en español y poster del endpoint de imágenes
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

    /**
     * Obtener detalles completos de una película por IMDb ID
     * @param {string} imdbId - ID de IMDb (ej: tt3896198)
     * @returns {Promise<Object>} - Detalles de la película
     */
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

    /**
     * Obtener detalles de una película por título exacto
     * @param {string} titulo - Título de la película
     * @param {string} anio - Año opcional
     * @returns {Promise<Object>} - Detalles de la película
     */
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

    /**
     * Formatea los datos de la película al esquema de nuestra BD
     * @param {Object} datosOMDb - Datos crudos de OMDb
     * @returns {Object} - Datos formateados
     */
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

    /**
     * Obtener películas populares aleatorias
     * @returns {Promise<Array>} - Array de películas populares
     */
    async obtenerPeliculasPopulares() {
        // Lista de películas populares conocidas por IMDb ID
        const peliculasPopulares = [
            'tt0111161', // The Shawshank Redemption
            'tt0068646', // The Godfather
            'tt0468569', // The Dark Knight
            'tt0108052', // Schindler's List
            'tt0167260', // The Lord of the Rings: The Return of the King
            'tt0110912', // Pulp Fiction
            'tt0060196', // The Good, the Bad and the Ugly
            'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
            'tt0109830', // Forrest Gump
            'tt0137523', // Fight Club
            'tt1375666', // Inception
            'tt0167261', // The Lord of the Rings: The Two Towers
            'tt0080684', // Star Wars: Episode V
            'tt0133093', // The Matrix
            'tt0099685', // Goodfellas
            'tt0073486', // One Flew Over the Cuckoo's Nest
            'tt0114369', // Se7en
            'tt0047478', // Seven Samurai
            'tt0076759', // Star Wars: Episode IV
            'tt0102926', // The Silence of the Lambs
            'tt0317248', // City of God
            'tt0114814', // The Usual Suspects
            'tt0120815', // Saving Private Ryan
            'tt0816692', // Interstellar
            'tt0245429', // Spirited Away
            'tt0110357', // The Lion King
            'tt0088763', // Back to the Future
            'tt0103064', // Terminator 2: Judgment Day
            'tt0172495', // Gladiator
            'tt0482571', // The Prestige
            'tt0407887', // The Departed
            'tt2582802', // Whiplash
            'tt1675434', // The Intouchables
            'tt6751668', // Parasite
            'tt7286456', // Joker
            'tt4154796', // Avengers: Endgame
            'tt4633694', // Spider-Man: Into the Spider-Verse
            'tt2380307', // Coco
            'tt0910970', // WALL·E
            'tt0114709', // Toy Story
            'tt0078748', // Alien
            'tt0081505', // The Shining
            'tt0054215', // Psycho
            'tt0034583', // Casablanca
            'tt0027977', // Modern Times
            'tt0095765', // Cinema Paradiso
            'tt0095327', // Grave of the Fireflies
            'tt0364569', // Oldboy
            'tt0211915', // Amélie
            'tt0457430', // Pan's Labyrinth
        ]

        // Seleccionar 8 películas aleatorias
        const seleccionadas = []
        const copiaIds = [...peliculasPopulares]

        for (let i = 0; i < 8 && copiaIds.length > 0; i++) {
            const indiceAleatorio = Math.floor(Math.random() * copiaIds.length)
            seleccionadas.push(copiaIds[indiceAleatorio])
            copiaIds.splice(indiceAleatorio, 1)
        }

        // Obtener detalles de cada película
        const promesas = seleccionadas.map(id => this.obtenerPeliculaPorId(id))
        const resultados = await Promise.all(promesas)

        return resultados
            .filter(r => r.exito)
            .map(r => r.pelicula)
    }
}

module.exports = new ServicioOMDb()
