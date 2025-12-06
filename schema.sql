-- ============================================
-- MovieApp - Esquema completo de Base de Datos
-- PostgreSQL
-- ============================================

-- Eliminar tablas existentes (en orden inverso por dependencias)
DROP TABLE IF EXISTS comentarios_likes CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS listas_peliculas CASCADE;
DROP TABLE IF EXISTS listas CASCADE;
DROP TABLE IF EXISTS peliculas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar tipos ENUM existentes
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS pelicula_tipo CASCADE;

-- ============================================
-- TIPOS ENUM
-- ============================================

CREATE TYPE user_role AS ENUM ('usuario', 'admin');
CREATE TYPE pelicula_tipo AS ENUM ('pelicula', 'serie', 'episodio');

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    avatar_url VARCHAR(500),
    rol user_role DEFAULT 'usuario',
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla: peliculas
CREATE TABLE peliculas (
    id SERIAL PRIMARY KEY,
    imdb_id VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    anio VARCHAR(10),
    clasificacion VARCHAR(10),
    duracion VARCHAR(20),
    genero VARCHAR(255),
    director VARCHAR(255),
    actores TEXT,
    sinopsis TEXT,
    poster VARCHAR(500),
    puntuacion_imdb VARCHAR(10),
    tipo pelicula_tipo,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla: listas
CREATE TABLE listas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_publica BOOLEAN DEFAULT false,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE RELACIÓN
-- ============================================

-- Tabla: listas_peliculas (junction table)
CREATE TABLE listas_peliculas (
    id SERIAL PRIMARY KEY,
    lista_id INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    pelicula_id INTEGER NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
    agregado_en TIMESTAMP DEFAULT NOW(),
    notas TEXT,
    UNIQUE (lista_id, pelicula_id)
);

-- Tabla: calificaciones
-- Un usuario puede calificar cada película una sola vez (1-5 estrellas)
CREATE TABLE calificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pelicula_id INTEGER NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
    puntuacion SMALLINT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, pelicula_id)
);

-- Tabla: comentarios (reviews)
-- Un usuario puede escribir una reseña por película
CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pelicula_id INTEGER NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    contiene_spoilers BOOLEAN DEFAULT false,
    me_gusta_count INTEGER DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, pelicula_id)
);

-- Tabla: comentarios_likes
-- Permite que usuarios den "me gusta" a las reseñas de otros
CREATE TABLE comentarios_likes (
    id SERIAL PRIMARY KEY,
    comentario_id INTEGER NOT NULL REFERENCES comentarios(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (comentario_id, usuario_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_listas_usuario ON listas(usuario_id);
CREATE INDEX idx_listas_peliculas_lista ON listas_peliculas(lista_id);
CREATE INDEX idx_listas_peliculas_pelicula ON listas_peliculas(pelicula_id);
CREATE INDEX idx_calificaciones_pelicula ON calificaciones(pelicula_id);
CREATE INDEX idx_calificaciones_usuario ON calificaciones(usuario_id);
CREATE INDEX idx_comentarios_pelicula ON comentarios(pelicula_id);
CREATE INDEX idx_comentarios_usuario ON comentarios(usuario_id);
CREATE INDEX idx_comentarios_likes_comentario ON comentarios_likes(comentario_id);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Usuarios (contraseña: 123456 hasheada con bcrypt)
INSERT INTO usuarios (nombre_usuario, email, contrasena, avatar_url, rol) VALUES
('macarena', 'maca.creates@gmail.com', '$2b$12$ZOUv5b7J0wyRuSzHVp64COpVtiLRSnXI/t/G8ujB83.qSDz2Pi3T2', NULL, 'usuario'),
('admin', 'admin@email.com', '$2b$12$ZOUv5b7J0wyRuSzHVp64COpVtiLRSnXI/t/G8ujB83.qSDz2Pi3T2', NULL, 'admin'),
('cinefilo99', 'cinefilo@email.com', '$2b$12$ZOUv5b7J0wyRuSzHVp64COpVtiLRSnXI/t/G8ujB83.qSDz2Pi3T2', NULL, 'usuario');

-- Películas
INSERT INTO peliculas (imdb_id, titulo, anio, clasificacion, duracion, genero, director, actores, sinopsis, poster, puntuacion_imdb, tipo) VALUES
('tt0111161', 'The Shawshank Redemption', '1994', 'R', '142 min', 'Drama', 'Frank Darabont', 'Tim Robbins, Morgan Freeman', 'Two imprisoned men bond over a number of years.', 'https://example.com/shawshank.jpg', '9.3', 'pelicula'),
('tt0068646', 'The Godfather', '1972', 'R', '175 min', 'Crime, Drama', 'Francis Ford Coppola', 'Marlon Brando, Al Pacino', 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 'https://example.com/godfather.jpg', '9.2', 'pelicula'),
('tt0468569', 'The Dark Knight', '2008', 'PG-13', '152 min', 'Action, Crime, Drama', 'Christopher Nolan', 'Christian Bale, Heath Ledger', 'When the menace known as the Joker wreaks havoc on Gotham, Batman must face one of the greatest tests.', 'https://example.com/darkknight.jpg', '9.0', 'pelicula'),
('tt0944947', 'Game of Thrones', '2011', 'TV-MA', '57 min', 'Action, Adventure, Drama', 'David Benioff, D.B. Weiss', 'Emilia Clarke, Peter Dinklage', 'Nine noble families fight for control over the lands of Westeros.', 'https://example.com/got.jpg', '9.2', 'serie');

-- Listas
INSERT INTO listas (usuario_id, nombre, descripcion, es_publica) VALUES
(1, 'Mis favoritas', 'Lista de mis películas favoritas de todos los tiempos', true),
(1, 'Para ver después', 'Películas que quiero ver pronto', false),
(2, 'Top admin', 'Películas recomendadas por el administrador', true),
(3, 'Clásicos imperdibles', 'Los clásicos que todos deberían ver', true);

-- Listas_peliculas
INSERT INTO listas_peliculas (lista_id, pelicula_id, notas) VALUES
(1, 1, 'Una obra maestra absoluta'),
(1, 2, 'Clásico del cine'),
(1, 3, 'La mejor película de superhéroes'),
(2, 4, 'Tengo que terminar de verla'),
(3, 1, 'Recomendación especial'),
(4, 2, 'El clásico de los clásicos');

-- Calificaciones
INSERT INTO calificaciones (usuario_id, pelicula_id, puntuacion) VALUES
(1, 1, 5),
(1, 2, 4),
(1, 3, 5),
(2, 1, 5),
(2, 2, 5),
(3, 1, 4),
(3, 2, 5),
(3, 3, 4);

-- Comentarios
INSERT INTO comentarios (usuario_id, pelicula_id, contenido, contiene_spoilers) VALUES
(1, 1, 'Una película que te hace reflexionar sobre la esperanza y la libertad. La actuación de Tim Robbins es impecable y la dirección de Darabont logra transmitir cada emoción.', false),
(1, 2, 'El clásico por excelencia del cine de mafia. La escena del bautizo mientras ocurren los asesinatos es cinematográficamente perfecta.', true),
(2, 1, 'Simplemente perfecta. Una historia de redención que nunca pasa de moda.', false),
(3, 3, 'Heath Ledger entrega una actuación que definió al personaje del Joker para siempre. Su interpretación es escalofriante y fascinante al mismo tiempo.', false);

-- Comentarios_likes
INSERT INTO comentarios_likes (comentario_id, usuario_id) VALUES
(1, 2),
(1, 3),
(2, 3),
(3, 1),
(4, 1),
(4, 2);

-- Actualizar contadores de me_gusta
UPDATE comentarios SET me_gusta_count = 2 WHERE id = 1;
UPDATE comentarios SET me_gusta_count = 1 WHERE id = 2;
UPDATE comentarios SET me_gusta_count = 1 WHERE id = 3;
UPDATE comentarios SET me_gusta_count = 2 WHERE id = 4;