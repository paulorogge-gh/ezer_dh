const { getPool } = require('../config/db');

async function run() {
    const pool = getPool();
    console.log('➡️ Iniciando migração: adicionar coluna id_colaborador em usuario');
    try {
        await pool.execute('ALTER TABLE usuario ADD COLUMN id_colaborador INT NULL AFTER id_empresa');
        console.log('✅ Coluna id_colaborador adicionada');
    } catch (e) {
        if (e && String(e.message).includes('Duplicate column')) {
            console.log('ℹ️ Coluna id_colaborador já existe; seguindo adiante');
        } else {
            throw e;
        }
    }
    try {
        await pool.execute('UPDATE usuario SET id_colaborador = id_referencia WHERE tipo_usuario = "colaborador" AND id_colaborador IS NULL');
        console.log('✅ Usuários do tipo colaborador atualizados com id_colaborador');
    } catch (e) {
        console.warn('⚠️ Falha ao atualizar registros existentes:', e.message);
    }
    try {
        await pool.execute('ALTER TABLE usuario ADD CONSTRAINT fk_usuario_colaborador FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador)');
        console.log('✅ FK fk_usuario_colaborador criada');
    } catch (e) {
        if (e && String(e.message).toLowerCase().includes('duplicate')) {
            console.log('ℹ️ FK fk_usuario_colaborador já existe; finalizando');
        } else {
            console.warn('⚠️ Não foi possível criar FK:', e.message);
        }
    }
    console.log('✅ Migração concluída');
    process.exit(0);
}

run().catch(err => { console.error('❌ Erro na migração:', err); process.exit(1); });

