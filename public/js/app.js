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
    const cards = peliculas.map(p => {
        const poster = p.poster && p.poster !== 'N/A' ? p.poster : '/img/no-image.png'
        return `
        <div class="col-md-4 mb-4">
            <div class="card movie-card h-100">
                <img src="${poster}" class="card-img-top" alt="${p.titulo}">
                <div class="card-body">
                    <h5 class="card-title">${p.titulo}</h5>
                    <p class="card-text"><strong>Año:</strong> ${p.anio || 'N/D'}</p>
                    <p class="card-text"><strong>Tipo:</strong> ${p.tipo || 'N/D'}</p>
                    <a href="/peliculas/${p.imdb_id}" class="btn btn-primary btn-sm">Ver detalle</a>
                </div>
            </div>
        </div>`
    }).join('')
    container.innerHTML = `<div class="row">${cards}</div>`
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
