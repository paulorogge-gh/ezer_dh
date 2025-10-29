const { getPool } = require('../config/db');

class OcorrenciaAnexo {
  constructor(data) {
    this.id_anexo = data.id_anexo;
    this.id_ocorrencia = data.id_ocorrencia;
    this.url = data.url;
    this.nome_arquivo = data.nome_arquivo;
    this.content_type = data.content_type;
    this.created_at = data.created_at;
  }

  static async create({ id_ocorrencia, url, nome_arquivo, content_type }) {
    const pool = getPool();
    const [res] = await pool.execute(
      'INSERT INTO ocorrencia_anexo (id_ocorrencia, url, nome_arquivo, content_type) VALUES (?, ?, ?, ?)',
      [id_ocorrencia, url, nome_arquivo, content_type || null]
    );
    return res.insertId;
  }

  static async findByOcorrencia(id_ocorrencia) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM ocorrencia_anexo WHERE id_ocorrencia = ? ORDER BY created_at DESC', [id_ocorrencia]);
    return rows.map(r => new OcorrenciaAnexo(r));
  }

  static async deleteByUrl(id_ocorrencia, url) {
    const pool = getPool();
    await pool.execute('DELETE FROM ocorrencia_anexo WHERE id_ocorrencia = ? AND url = ?', [id_ocorrencia, url]);
    return true;
  }

  static async deleteAllByOcorrencia(id_ocorrencia) {
    const pool = getPool();
    await pool.execute('DELETE FROM ocorrencia_anexo WHERE id_ocorrencia = ?', [id_ocorrencia]);
    return true;
  }
}

module.exports = OcorrenciaAnexo;


