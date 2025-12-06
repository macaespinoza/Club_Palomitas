# 🎬 MovieApp - Gestor de Listas de Películas

Aplicación web para gestionar listas personalizadas de películas favoritas. Permite buscar películas en tiempo real usando la API de OMDb, agregarlas a listas, calificarlas y dejar reseñas.

## ✨ Características

- **Autenticación de Usuarios**: Registro y Login seguro con encriptación de contraseñas.
- **Gestión de Listas**: Crea listas públicas o privadas (solo visibles para ti).
- **Integración con OMDb API**: Buscador integrado que obtiene datos reales de películas (títuo, año, poster, sinopsis).
- **Sistema de Reseñas y Calificaciones**:
    - Califica películas del 1 al 5 (estrellas).
    - Deja comentarios personales sobre cada película.
- **Interfaz Moderna**: Diseño responsivo utilizando Bootstrap y temas oscuros.
- **Persistencia**: Base de datos PostgreSQL con Sequelize ORM.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Base de Datos**: PostgreSQL, Sequelize ORM
- **Frontend**: Handlebars (SSR), Bootstrap 5, Vanilla JS
- **Seguridad**: JWT (JSON Web Tokens), BCrypt, Middleware de Cookies

## 🚀 Instalación y Configuración

### Desarrollo Local

#### Prerrequisitos
- Node.js (v18+)
- PostgreSQL instalado y corriendo

#### Pasos

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Edita `.env` y ajusta los valores según tu entorno:

    ```env
    PORT=8080
    NODE_ENV=development

    # Base de Datos (local)
    DB_NAME=club_palomitas
    DB_USER=postgres
    DB_PASSWORD=tu_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_DIALECT=postgres

    # JWT
    JWT_SECRET=tu_secreto_super_seguro
    JWT_EXPIRES_IN=7d

    # OMDb API (obtén tu key gratis en http://www.omdbapi.com/apikey.aspx)
    OMDB_API_KEY=tu_api_key
    ```

3.  **Inicializar Base de Datos**:
    Ejecuta el script de inicialización para crear las tablas y datos de ejemplo:

    ```bash
    npm run init-db
    ```

4.  **Iniciar Servidor**:

    Modo producción:
    ```bash
    npm start
    ```

    Modo desarrollo (con reinicio automático):
    ```bash
    npm run dev
    ```

5.  **Abrir en Navegador**:
    Visita `http://localhost:8080`

### 🚂 Despliegue en Railway

Railway es una plataforma de despliegue que facilita la implementación de aplicaciones web con bases de datos PostgreSQL integradas.

#### Paso 1: Preparar el Proyecto

El proyecto ya está configurado para Railway con los siguientes archivos:
- ✅ `railway.json` - Configuración de despliegue
- ✅ `Procfile` - Comando de inicio
- ✅ `.env.example` - Ejemplo de variables de entorno
- ✅ `scripts/init-db.js` - Script de inicialización de BD

#### Paso 2: Crear Cuenta en Railway

1. Ve a [Railway.app](https://railway.app)
2. Regístrate con GitHub (recomendado)

#### Paso 3: Crear Nuevo Proyecto

1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Selecciona este repositorio

#### Paso 4: Añadir PostgreSQL

1. En tu proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará automáticamente la base de datos y configurará `DATABASE_URL`

#### Paso 5: Configurar Variables de Entorno

En la pestaña **Variables** de tu servicio, añade las siguientes variables:

```env
NODE_ENV=production
JWT_SECRET=genera_un_secreto_seguro_aqui
JWT_EXPIRES_IN=7d
OMDB_API_KEY=tu_api_key_de_omdb
```

**Nota importante**:
- `DATABASE_URL` se configura automáticamente por Railway cuando añades PostgreSQL
- `PORT` también se configura automáticamente

#### Paso 6: Inicializar la Base de Datos

Una vez desplegada la aplicación, necesitas ejecutar el script de inicialización:

1. En Railway, ve a tu servicio
2. Abre la pestaña **"Settings"**
3. En la sección **"Service"**, busca **"Deploy"**
4. O usa Railway CLI:

```bash
# Instala Railway CLI
npm i -g @railway/cli

# Inicia sesión
railway login

# Vincula tu proyecto
railway link

# Ejecuta el script de inicialización
railway run npm run init-db
```

Alternativamente, puedes conectarte directamente a la base de datos PostgreSQL de Railway y ejecutar el archivo `schema.sql` manualmente.

#### Paso 7: Verificar Despliegue

1. Railway generará automáticamente una URL pública para tu aplicación
2. Visita la URL y verifica que la aplicación funcione correctamente
3. Crea una cuenta de usuario y prueba las funcionalidades

#### Comandos Útiles de Railway CLI

```bash
# Ver logs en tiempo real
railway logs

# Abrir la aplicación en el navegador
railway open

# Conectar a la base de datos
railway connect postgres

# Ver variables de entorno
railway variables
```

### 🔧 Solución de Problemas

#### La aplicación no inicia
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Railway: `railway logs`

#### Error de conexión a la base de datos
- Confirma que PostgreSQL esté añadido al proyecto
- Verifica que `DATABASE_URL` esté configurada automáticamente

#### Error 404 en todas las rutas
- Asegúrate de que el `Procfile` esté en la raíz del proyecto
- Verifica que el comando `web: node server.js` sea correcto

## 📂 Estructura del Proyecto

- `/src`: Código fuente del backend.
    - `/controllers`: Lógica de negocio (Listas, Películas, Auth).
    - `/models`: Definición de tablas y relaciones Sequelize.
    - `/routes`: Rutas de la API y Vistas.
    - `/views`: Plantillas Handlebars interactuando con el usuario.
- `/public`: Archivos estáticos (CSS, JS del cliente).
- `schema.sql`: Script de creación de la base de datos.
