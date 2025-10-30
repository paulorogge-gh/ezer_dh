const { getPool } = require('../config/db');

async function migrateAuditLog() {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT NOT NULL AUTO_INCREMENT,
      action VARCHAR(128) NOT NULL,
      user_id INT NULL,
      ip VARCHAR(64) NULL,
      details JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_action (action),
      KEY idx_user (user_id),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `;
  await pool.execute(sql);
  console.log('✅ Tabela audit_log criada/verificada.');
}

if (require.main === module) {
  migrateAuditLog().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { migrateAuditLog };

