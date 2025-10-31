const { getPool } = require('../config/db');

class AuditLog {
  constructor(row) {
    this.id = row.id;
    this.action = row.action;
    this.user_id = row.user_id;
    this.ip = row.ip;
    this.details = row.details ? (typeof row.details === 'string' ? JSON.parse(row.details) : row.details) : null;
    this.created_at = row.created_at;
  }

  static async create({ action, user_id = null, ip = null, details = null }) {
    const pool = getPool();
    const sql = `INSERT INTO audit_log (action, user_id, ip, details) VALUES (?, ?, ?, ?)`;
    const params = [String(action), user_id ? Number(user_id) : null, ip || null, details ? JSON.stringify(details) : null];
    const [res] = await pool.execute(sql, params);
    return res.insertId;
  }

  static async findFiltered({ action, user_id, from, to, q, limit = 100, offset = 0 }) {
    const pool = getPool();
    const where = [];
    const params = [];
    if (action) { where.push('action = ?'); params.push(String(action)); }
    if (user_id) { where.push('user_id = ?'); params.push(Number(user_id)); }
    if (from) { where.push('created_at >= ?'); params.push(from); }
    if (to) { where.push('created_at <= ?'); params.push(to); }
    if (q) { where.push('(details IS NOT NULL AND CAST(details AS CHAR) LIKE ?)'); params.push(`%${q}%`); }
    let sql = 'SELECT * FROM audit_log';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    // Sanitizar limit/offset e incorporar diretamente (evitar placeholders que podem falhar em alguns ambientes)
    const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 100));
    const safeOffset = Math.max(0, Number(offset) || 0);
    sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new AuditLog(r));
  }
}

module.exports = AuditLog;

