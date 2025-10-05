const { getPool } = require('../config/db');

async function checkDatabase() {
    try {
        console.log('🔍 Verificando conexão com o banco de dados...');
        
        const pool = getPool();
        
        // Testar conexão
        const connection = await pool.getConnection();
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Verificar se o banco existe
        const [databases] = await connection.execute('SHOW DATABASES LIKE "ezer_dh"');
        if (databases.length === 0) {
            console.log('❌ Banco de dados "ezer_dh" não existe!');
            console.log('🔧 Criando banco de dados...');
            await connection.execute('CREATE DATABASE ezer_dh');
            console.log('✅ Banco de dados criado!');
        } else {
            console.log('✅ Banco de dados "ezer_dh" existe!');
        }
        
        // Verificar tabelas existentes no banco ezer_dh
        const [tables] = await connection.execute('SHOW TABLES FROM ezer_dh');
        console.log(`📋 Tabelas encontradas (${tables.length}):`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });
        
        connection.release();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao verificar banco de dados:', error.message);
        process.exit(1);
    }
}

checkDatabase();
