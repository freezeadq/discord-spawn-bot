require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { USUARIOS_A_PINGUEAR } = require('./config.js');

// Configuración desde variables de entorno
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Validar configuración
if (!BOT_TOKEN || !CLIENT_ID) {
    console.error('❌ Error: Faltan DISCORD_TOKEN o CLIENT_ID en el archivo .env');
    process.exit(1);
}

console.log('🔍 Verificando configuración...');
console.log('Token cargado:', BOT_TOKEN ? 'SÍ (longitud: ' + BOT_TOKEN.length + ')' : 'NO');
console.log('Client ID cargado:', CLIENT_ID ? 'SÍ' : 'NO');

// Crear cliente del bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Definir comandos de forma más simple
const commands = [
    {
        name: 'spawn',
        description: 'Alerta a usuarios específicos sobre un spawn',
        options: [
            {
                name: 'mensaje',
                description: 'Mensaje adicional sobre el spawn',
                type: 3, // STRING type
                required: false
            },
            {
                name: 'ubicacion', 
                description: 'Ubicación del spawn',
                type: 3, // STRING type
                required: false
            }
        ]
    }
];

// Registrar comandos
async function deployCommands() {
    try {
        console.log('🔄 Registrando comandos slash...');
        
        const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
        
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log('✅ Comandos registrados para el servidor específico.');
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Comandos registrados globalmente.');
        }
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error.message);
    }
}

// Bot listo
client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}!`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Usuarios a pinguear configurados: ${USUARIOS_A_PINGUEAR.length}`);
    
    // Registrar comandos después de que el bot esté conectado
    await deployCommands();
});

// Manejar comando /spawn
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'spawn') {
        try {
            console.log(`📢 Comando /spawn ejecutado por ${interaction.user.tag}`);
            
            // Obtener opciones
            const mensaje = interaction.options.getString('mensaje') || '';
            const ubicacion = interaction.options.getString('ubicacion') || '';
            
            // Verificar usuarios configurados
            if (USUARIOS_A_PINGUEAR.length === 0) {
                await interaction.reply({
                    content: '❌ No hay usuarios configurados. Edita el archivo config.js',
                    ephemeral: true
                });
                return;
            }
            
            // Crear menciones
            const menciones = USUARIOS_A_PINGUEAR.map(userId => `<@${userId}>`).join(' ');
            
            // Construir mensaje
            let mensajeFinal = `🚨 **omosexuales detectados mantener distansia** 🚨\n\n${menciones}`;
            
            if (ubicacion) {
                mensajeFinal += `\n\n📍 **Ubicación:** ${ubicacion}`;
            }
            
            if (mensaje) {
                mensajeFinal += `\n\n💬 **Información:** ${mensaje}`;
            }
           
            
            // Responder
            await interaction.reply({
                content: mensajeFinal,
                allowedMentions: {
                    users: USUARIOS_A_PINGUEAR
                }
            });
            
            console.log('✅ Comando ejecutado exitosamente');
            
        } catch (error) {
            console.error('❌ Error al ejecutar /spawn:', error.message);
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Error al ejecutar el comando.',
                    flags: 64
                });
            }
        }
    }
});

// Manejo de errores
client.on('error', error => {
    console.error('❌ Error del cliente:', error.message);
});

// Conectar bot
console.log('🚀 Iniciando bot...');
client.login(BOT_TOKEN);

// Cierre limpio
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando bot...');
    client.destroy();
    process.exit(0);
});