const { getPool } = require('../config/db');

async function migrate() {
  const pool = getPool();
  console.log('Iniciando migração: adicionar e popular usuario.id_empresa...');
  try {
    // Adicionar coluna id_empresa se não existir
    await pool.execute('ALTER TABLE usuario ADD COLUMN IF NOT EXISTS id_empresa INT NULL AFTER tipo_usuario');
  } catch (e) {
    // Alguns MySQL não suportam IF NOT EXISTS em ADD COLUMN; tentar detectar manualmente
    try {
      const [cols] = await pool.execute('SHOW COLUMNS FROM usuario LIKE "id_empresa"');
      if (!cols || cols.length === 0) {
        await pool.execute('ALTER TABLE usuario ADD COLUMN id_empresa INT NULL AFTER tipo_usuario');
      }
    } catch (err) {
      console.error('Falha ao adicionar coluna id_empresa:', err.message);
      throw err;
    }
  }

  // Popular id_empresa para usuários empresa (id_referencia já é id_empresa)
  await pool.execute('UPDATE usuario SET id_empresa = id_referencia WHERE tipo_usuario = "empresa"');

  // Popular id_empresa para usuários colaborador (buscar da tabela colaborador)
  await pool.execute(
    'UPDATE usuario u JOIN colaborador c ON c.id_colaborador = u.id_referencia ' +
    'SET u.id_empresa = c.id_empresa WHERE u.tipo_usuario = "colaborador"'
  );

  // Consultoria: deixar id_empresa NULL
  console.log('Migração concluída com sucesso.');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrate };

