// ===================== MOVIEAPP FRONTEND JS =====================

// Manejar formularios con fetch (AJAX)
document.addEventListener('DOMContentLoaded', () => {
    // ---------- Login ----------
    const loginForm = document.getElementById('loginForm')
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const submitBtn = loginForm.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML
            submitBtn.disabled = true
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...'
            const formData = new FormData(loginForm)
            const data = {
                email: formData.get('email'),
                contrasena: formData.get('contrasena')
            }
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                })
                const result = await response.json()
                if (result.exito) {
                    showAlert('success', '¡Bienvenido! Redirigiendo...')
                    setTimeout(() => { window.location.href = '/dashboard' }, 500)
                } else {
                    submitBtn.disabled = false
                    submitBtn.innerHTML = originalText
                    showAlert('danger', result.error || 'Error al iniciar sesión')
                }
            } catch (error) {
                console.error('Login error:', error)
                submitBtn.disabled = false
                submitBtn.innerHTML = originalText
                showAlert('danger', 'Error de conexión')
            }
        })
    }

    // ---------- Register ----------
    const registerForm = document.getElementById('registerForm')
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const submitBtn = registerForm.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML
            submitBtn.disabled = true
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...'
            const formData = new FormData(registerForm)
            const data = {
                nombre_usuario: formData.get('nombre_usuario'),
                email: formData.get('email'),
                contrasena: formData.get('contrasena')
            }
            try {
                const response = await fetch('/api/auth/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                })
                const result = await response.json()
                if (result.exito) {
                    showAlert('success', '¡Cuenta creada! Redirigiendo...')
                    setTimeout(() => { window.location.href = '/dashboard' }, 500)
                } else {
                    submitBtn.disabled = false
                    submitBtn.innerHTML = originalText
                    showAlert('danger', result.error || 'Error al registrarse')
                }
            } catch (error) {
                console.error('Register error:', error)
                submitBtn.disabled = false
                submitBtn.innerHTML = originalText
                showAlert('danger', 'Error de conexión')
            }
        })
    }

    // ---------- Crear Lista ----------
    const crearListaForm = document.getElementById('crearListaForm')
    if (crearListaForm) {
        crearListaForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const submitBtn = crearListaForm.querySelector('button[type="submit"]')
            const originalText = submitBtn.innerHTML
            submitBtn.disabled = true
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando...'
            const formData = new FormData(crearListaForm)
            const data = { nombre: formData.get('nombre') }
            try {
                const response = await fetch('/api/listas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(data)
                })
                const result = await response.json()
                if (result.exito) {
                    showAlert('success', 'Lista creada, redirigiendo...')
                    setTimeout(() => {
                        // Redirigir a la vista de la lista creada
                        window.location.href = `/listas/${result.datos.id}`
                    }, 500)
                } else {
                    submitBtn.disabled = false
                    submitBtn.innerHTML = originalText
                    showAlert('danger', result.error || 'Error al crear lista')
                }
            } catch (error) {
                console.error('Crear lista error:', error)
                submitBtn.disabled = false
                submitBtn.innerHTML = originalText
                showAlert('danger', 'Error de conexión')
            }
        })
    }

    // ---------- Auto‑search on /buscar page ----------
    if (window.location.pathname.includes('/buscar')) {
        const urlParams = new URLSearchParams(window.location.search)
        const q = urlParams.get('q') || ''
        if (q.trim()) {
            const resultadosDiv = document.getElementById('resultados')
            if (resultadosDiv) {
                resultadosDiv.innerHTML = '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>'
                buscarPeliculas(q).then(data => {
                    if (data.exito && data.datos && data.datos.length) {
                        renderResultados(data.datos)
                    } else {
                        resultadosDiv.innerHTML = `<p class="text-muted text-center">${data.error || 'No se encontraron resultados.'}</p>`
                    }
                })
            }
        }
    }
})

// ---------- Helper: showAlert ----------
function showAlert(type, message) {
    const container = document.querySelector('.card-body') || document.querySelector('main') || document.querySelector('.container')
    if (!container) return
    const existing = container.querySelector('.alert')
    if (existing) existing.remove()
    const icon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'
    const alert = document.createElement('div')
    alert.className = `alert alert-${type} fade-in mb-3`
    alert.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`

    // Insert at top of container
    container.insertBefore(alert, container.firstChild)

    if (type !== 'success') setTimeout(() => alert.remove(), 5000)
}

// ---------- API: buscarPeliculas ----------
async function buscarPeliculas(query) {
    try {
        const response = await fetch(`/api/peliculas/buscar?q=${encodeURIComponent(query)}`, { credentials: 'same-origin' })
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error buscando películas:', error)
        return { exito: false, error: 'Error de conexión' }
    }
}

// ---------- Render results on /buscar ----------
function renderResultados(peliculas) {
    const container = document.getElementById('resultados')
    if (!container) return
    const placeholderImg = 'https://via.placeholder.com/300x450/081f21/eefbfb?text=Poster+No+Encontrado'
    container.innerHTML = peliculas.map(pelicula => {
        const posterSrc = (pelicula.poster && pelicula.poster !== 'N/A') ? pelicula.poster : placeholderImg
        return `
                <div class="col">
                    <div class="card movie-card h-100 d-flex flex-column">
                        <img src="${posterSrc}" class="card-img-top" alt="${pelicula.titulo}"
                            onerror="this.src='${placeholderImg}'">
                        <div class="card-body d-flex flex-column">
                            <!-- PARTE SUPERIOR: Título, Tag, Año, Rating -->
                            <div class="card-content-top">
                                <h6 class="card-title-container mb-1">
                                    <span class="card-title-text" tabindex="0" data-bs-toggle="popover"
                                        data-bs-trigger="hover focus" data-bs-placement="top"
                                        data-bs-content="${pelicula.titulo}">${pelicula.titulo}</span>
                                </h6>
                                <span class="badge badge-tipo mb-1">${pelicula.tipo}</span>
                                <p class="card-text small mb-0 text-ink-black">
                                    ${pelicula.anio} 
                                    <span class="mx-1 text-muted">|</span> 
                                    <i class="bi bi-star-fill text-warning"></i> ${pelicula.puntuacion_imdb || 'N/A'}
                                </p>
                            </div>

                            <!-- SEPARADOR -->
                            <div class="card-separator my-2"></div>

                            <!-- PARTE INFERIOR: Botón grande -->
                            <div class="mt-auto">
                                <button class="btn btn-card-action w-100 py-2"
                                    onclick="mostrarModalAgregar('${pelicula.imdb_id}', '${pelicula.titulo.replace(/'/g, "\\'")}')">
                                    <i class="bi bi-plus-circle-fill me-2" style="font-size: 1.2rem;"></i>
                                    Agregar a una lista
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
    }).join('')

    // Wrap in row with same classes as dashboard
    const wrapper = document.createElement('div')
    wrapper.className = 'row row-cols-2 row-cols-md-4 row-cols-lg-4 g-3'
    wrapper.innerHTML = container.innerHTML
    container.innerHTML = ''
    container.appendChild(wrapper)

    // Inicializar popovers
    setTimeout(() => {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    }, 100)
}

// ---------- API: agregarALista (used by other pages) ----------
async function agregarALista(listaId, peliculaId) {
    try {
        const response = await fetch(`/api/listas/${listaId}/peliculas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ pelicula_id: peliculaId })
        })
        return await response.json()
    } catch (error) {
        console.error('Error agregando película:', error)
        return { exito: false, error: 'Error de conexión' }
    }
}

// ---------- Modal para agregar películas a listas ----------
let peliculaSeleccionada = { imdb_id: '', titulo: '' }

function mostrarModalAgregar(imdbId, titulo) {
    peliculaSeleccionada = { imdb_id: imdbId, titulo }

    fetch('/api/listas', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
            if (data.exito && data.datos.length > 0) {
                const opciones = data.datos.map(lista =>
                    `<option value="${lista.id}">${lista.nombre}</option>`
                ).join('')

                const contenido = `
                <div class="modal fade" id="modalAgregarLista" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content bg-dark text-light">
                            <div class="modal-header border-secondary">
                                <h5 class="modal-title">Agregar "${titulo}" a lista</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <select id="listaSelect" class="form-select bg-secondary text-light border-dark">
                                    ${opciones}
                                </select>
                            </div>
                            <div class="modal-footer border-secondary">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" onclick="agregarPeliculaALista()">Agregar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `

                const modalAnterior = document.getElementById('modalAgregarLista')
                if (modalAnterior) modalAnterior.remove()

                document.body.insertAdjacentHTML('beforeend', contenido)
                const modal = new bootstrap.Modal(document.getElementById('modalAgregarLista'))
                modal.show()
            } else {
                alert('Primero debes crear una lista')
                window.location.href = '/listas/nueva'
            }
        })
        .catch(error => {
            console.error(error)
            alert('Error al cargar las listas')
        })
}

async function agregarPeliculaALista() {
    const listaId = document.getElementById('listaSelect').value

    try {
        const res = await fetch('/api/peliculas/agregar-a-lista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                imdb_id: peliculaSeleccionada.imdb_id,
                lista_id: parseInt(listaId)
            })
        })

        const data = await res.json()

        if (data.exito) {
            alert(`"${peliculaSeleccionada.titulo}" agregada a la lista`)
            bootstrap.Modal.getInstance(document.getElementById('modalAgregarLista')).hide()
        } else {
            alert(data.error || 'Error al agregar película')
        }
    } catch (error) {
        console.error(error)
        alert('Error de conexión')
    }
}
