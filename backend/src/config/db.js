const mysql = require('mysql2/promise');
require('dotenv').config();

// Validação das variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

const isProduction = process.env.NODE_ENV === 'production';

if (missingVars.length > 0 && isProduction) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('🔧 Configure as variáveis no arquivo .env');
    process.exit(1);
}

// Configuração da conexão com o banco de dados (apenas variáveis de ambiente)
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de conexões (em dev, se env faltar, cria pool mock)
let pool;
if (missingVars.length > 0 && !isProduction) {
    console.warn('⚠️ Variáveis de DB ausentes em desenvolvimento; inicializando pool mock.');
    pool = {
        getConnection: async () => { throw new Error('Pool mock: DB não configurado'); },
        end: async () => {}
    };
} else {
    pool = mysql.createPool(dbConfig);
}

// Função para testar a conexão
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com MySQL estabelecida com sucesso!');
        console.log(`📊 Banco de dados: ${dbConfig.database}`);
        console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`👤 Usuário: ${dbConfig.user}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com o banco de dados:');
        console.error(`   ${error.message}`);
        console.error('🔧 Verifique suas credenciais no arquivo .env');
        return false;
    }
}

// Função para obter o pool de conexões
function getPool() {
    return pool;
}

// Função para fechar todas as conexões
async function closePool() {
    try {
        await pool.end();
        console.log('🔌 Pool de conexões fechado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao fechar pool de conexões:', error.message);
    }
}

module.exports = {
    getPool,
    testConnection,
    closePool,
    dbConfig
};
