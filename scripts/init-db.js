#!/usr/bin/env node
/**
 * Script de inicialización de la base de datos
 *
 * Este script ejecuta el archivo schema.sql para crear las tablas
 * y datos iniciales en la base de datos PostgreSQL.
 *
 * Uso:
 *   node scripts/init-db.js
 *
 * Asegúrate de tener configurada la variable de entorno DATABASE_URL
 * o las variables DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function inicializarBaseDeDatos() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL ||
            `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        ssl: process.env.DATABASE_URL ? {
            rejectUnauthorized: false
        } : false
    })

    try {
        console.log('🔌 Conectando a la base de datos...')
        await client.connect()
        console.log('✅ Conexión establecida')

        // Leer el archivo schema.sql
        const schemaPath = path.join(__dirname, '..', 'schema.sql')
        console.log(`📄 Leyendo schema desde: ${schemaPath}`)
        const schema = fs.readFileSync(schemaPath, 'utf8')

        // Ejecutar el schema
        console.log('🔄 Ejecutando schema.sql...')
        await client.query(schema)
        console.log('✅ Base de datos inicializada correctamente')
        console.log('📊 Tablas creadas y datos de ejemplo insertados')

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message)
        console.error(error)
        process.exit(1)
    } finally {
        await client.end()
        console.log('🔌 Conexión cerrada')
    }
}

// Ejecutar el script
inicializarBaseDeDatos()
    .then(() => {
        console.log('✨ Proceso completado exitosamente')
        process.exit(0)
    })
    .catch(error => {
        console.error('💥 Error fatal:', error)
        process.exit(1)
    })
