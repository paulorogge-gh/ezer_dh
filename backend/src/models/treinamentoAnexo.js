const { getPool } = require('../config/db');

class TreinamentoAnexo {
  constructor(data) {
    this.id_anexo = data.id_anexo;
    this.id_treinamento = data.id_treinamento;
    this.url = data.url;
    this.nome_arquivo = data.nome_arquivo;
    this.content_type = data.content_type;
    this.created_at = data.created_at;
  }

  static async create({ id_treinamento, url, nome_arquivo, content_type }) {
    const pool = getPool();
    const sql = `
      INSERT INTO treinamento_anexo (id_treinamento, url, nome_arquivo, content_type)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [id_treinamento, url, nome_arquivo, content_type]);
    return result.insertId;
  }

  static async findByTreinamento(id_treinamento) {
    const pool = getPool();
    const sql = `SELECT * FROM treinamento_anexo WHERE id_treinamento = ? ORDER BY id_anexo DESC`;
    const [rows] = await pool.execute(sql, [id_treinamento]);
    return rows.map(r => new TreinamentoAnexo(r));
  }

  static async deleteByUrl(id_treinamento, url) {
    const pool = getPool();
    const sql = `DELETE FROM treinamento_anexo WHERE id_treinamento = ? AND url = ?`;
    const [result] = await pool.execute(sql, [id_treinamento, url]);
    return result.affectedRows > 0;
  }

  static async deleteAllByTreinamento(id_treinamento) {
    const pool = getPool();
    const sql = `DELETE FROM treinamento_anexo WHERE id_treinamento = ?`;
    const [result] = await pool.execute(sql, [id_treinamento]);
    return result.affectedRows > 0;
  }
}

module.exports = TreinamentoAnexo;


