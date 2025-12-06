/**
 * Script para hashear las contraseñas existentes en la base de datos
 * Ejecutar con: node scripts/hashear-contrasenas.js
 */

require('dotenv').config()
const bcrypt = require('bcryptjs')
const { Usuario } = require('../src/models/associations')

async function hashearContrasenas() {
    try {
        console.log('Conectando a la base de datos...')

        // Obtener todos los usuarios
        const usuarios = await Usuario.findAll()

        console.log(`Encontrados ${usuarios.length} usuarios`)

        for (const usuario of usuarios) {
            // Verificar si la contraseña ya está hasheada (bcrypt empieza con $2)
            if (!usuario.contrasena.startsWith('$2')) {
                console.log(`Hasheando contraseña para: ${usuario.nombre_usuario}`)

                const hash = await bcrypt.hash(usuario.contrasena, 12)
                await usuario.update({ contrasena: hash })

                console.log(`✓ Contraseña actualizada para ${usuario.nombre_usuario}`)
            } else {
                console.log(`- ${usuario.nombre_usuario} ya tiene contraseña hasheada`)
            }
        }

        console.log('\n✅ Proceso completado exitosamente')
        process.exit(0)
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

hashearContrasenas()
