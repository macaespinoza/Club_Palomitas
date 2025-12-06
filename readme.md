# BOOTCAMP FULL STACK JAVASCRIPT
# MÓDULO 09 - EVALUACIÓN DE PORTAFOLIO 
## ALUMNA: MACARENA ESPINOZA GATICA
===================================================

# 🍿🍿🍿 Club Palomitas - Gestor de Listas de Películas 🍿🍿🍿

Aplicación web para gestionar listas personalizadas de películas favoritas. Permite buscar películas en tiempo real usando la API de OMDb, agregarlas a listas, calificarlas y dejar reseñas.

## ✨ Características

- **Autenticación de Usuarios**: Registro y Login seguro con encriptación de contraseñas.
- **Gestión de Listas**: Crea listas públicas o privadas (solo visibles para ti).
- **Integración con OMDb API**: Buscador integrado que obtiene datos reales de películas (títuo, año, poster, sinopsis).
- **Sistema de Reseñas y Calificaciones**:
    - Califica películas del 1 al 5 (estrellas).
    - Deja comentarios personales sobre cada película.
- **Interfaz Amigable**: Diseño responsivo utilizando Bootstrap, y estilo colorido personalizado desarrollado con CSS.
- **Persistencia**: Base de datos PostgreSQL con Sequelize ORM.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Base de Datos**: PostgreSQL, Sequelize ORM
- **Frontend**: Handlebars (SSR), Bootstrap 5, Vanilla JS
- **Seguridad**: JWT (JSON Web Tokens), BCrypt, Middleware de Cookies

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v18+)
- PostgreSQL instalado y corriendo

### Pasos

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según tu entorno):

    ```env
    PORT=8080
    
    # Base de Datos
    DB_NAME=movieapp_db
    DB_USER=postgres
    DB_PASS=tu_password
    DB_HOST=localhost
    
    # Seguridad
    JWT_SECRET=tu_secreto_super_seguro
    
    # OMDb API (Consigue tu key gratis en http://www.omdbapi.com/apikey.aspx)
    OMDB_API_KEY=tu_api_key
    OMDB_BASE_URL=http://www.omdbapi.com/
    OMDB_IMG_URL=http://img.omdbapi.com/
    ```

3.  **Inicializar Base de Datos**:
    Ejecuta el script SQL incluido para crear las tablas necesarias en tu base de datos PostgreSQL:
    - Archivo: `schema.sql`

4.  **Iniciar Servidor**:
    
    Modo producción:
    ```bash
    npm start
    ```

    Modo desarrollo (con reinicio automático w/ watch):
    ```bash
    npm run dev
    ```

5.  **Abrir en Navegador**:
    Visita `http://localhost:8080`

## 📂 Estructura del Proyecto

- `/src`: Código fuente del backend.
    - `/controllers`: Lógica de negocio (Listas, Películas, Auth).
    - `/models`: Definición de tablas y relaciones Sequelize.
    - `/routes`: Rutas de la API y Vistas.
    - `/views`: Plantillas Handlebars interactuando con el usuario.
- `/public`: Archivos estáticos (CSS, JS del cliente).
- `schema.sql`: Script de creación de la base de datos.
