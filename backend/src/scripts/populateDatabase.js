const fs = require('fs');
const path = require('path');
const { getPool } = require('../config/db');

async function populateDatabase() {
    try {
        console.log('🔍 Lendo arquivo SQL...');
        
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, '../../../database/ezer_dh.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📊 Executando script SQL...');
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        const pool = getPool();
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    // Pular comandos USE e CREATE DATABASE
                    if (command.toUpperCase().startsWith('USE ') || 
                        command.toUpperCase().startsWith('CREATE DATABASE')) {
                        console.log(`⏭️  Pulando comando: ${command.substring(0, 50)}...`);
                        continue;
                    }
                    
                    await pool.execute(command);
                    console.log(`✅ Comando executado: ${command.substring(0, 50)}...`);
                } catch (error) {
                    // Ignorar erros de tabela já existe
                    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⚠️  Tabela já existe: ${command.substring(0, 50)}...`);
                    } else {
                        console.error(`❌ Erro no comando: ${command.substring(0, 50)}...`);
                        console.error(`   ${error.message}`);
                    }
                }
            }
        }
        
        console.log('🎉 Script SQL executado com sucesso!');
        
        // Verificar se as tabelas foram criadas
        console.log('🔍 Verificando tabelas criadas...');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('📋 Tabelas encontradas:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao popular banco de dados:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    populateDatabase();
}

module.exports = populateDatabase;
