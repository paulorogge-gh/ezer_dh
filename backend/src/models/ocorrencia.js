const { getPool } = require('../config/db');

class Ocorrencia {
    constructor(data) {
        this.id_ocorrencia = data.id_ocorrencia;
        this.id_colaborador = data.id_colaborador;
        this.data = data.data;
        this.classificacao = data.classificacao;
        this.tipo = data.tipo;
        this.subtipo = data.subtipo;
        this.observacoes = data.observacoes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // Campos agregados
    this.colaborador_nome = data.colaborador_nome;
    this.empresa_nome = data.empresa_nome;
    this.id_empresa = data.id_empresa;
    }

    // Buscar todas as ocorrências
  static async findAll() {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa 
         ORDER BY o.data DESC
      `);
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências: ${error.message}`);
        }
    }

    // Buscar ocorrência por ID
  static async findById(id) {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa 
         WHERE o.id_ocorrencia = ?
      `, [id]);
            return rows.length > 0 ? new Ocorrencia(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrência: ${error.message}`);
        }
    }

    // Buscar ocorrências por colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           id_ocorrencia,
           id_colaborador,
           DATE_FORMAT(data, "%Y-%m-%d") AS data,
           classificacao,
           tipo,
           subtipo,
           observacoes,
           created_at,
           updated_at
         FROM ocorrencia WHERE id_colaborador = ? ORDER BY data DESC
      `, [id_colaborador]);
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências do colaborador: ${error.message}`);
        }
    }

    // Buscar ocorrências por período
    static async findByPeriodo(data_inicio, data_fim) {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa 
         WHERE o.data BETWEEN ? AND ? ORDER BY o.data DESC
      `, [data_inicio, data_fim]);
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências por período: ${error.message}`);
        }
    }

    // Buscar ocorrências por classificação
    static async findByClassificacao(classificacao) {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa 
         WHERE o.classificacao = ? ORDER BY o.data DESC
      `, [classificacao]);
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências por classificação: ${error.message}`);
        }
    }

  // Buscar por empresa
  static async findByEmpresa(id_empresa) {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(`
        SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa 
         WHERE e.id_empresa = ? ORDER BY o.data DESC
      `, [id_empresa]);
      return rows.map(row => new Ocorrencia(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ocorrências da empresa: ${error.message}`);
    }
  }

  static async findFiltered({ empresa_id, tipo, classificacao, data_inicio, data_fim }) {
    try {
      const pool = getPool();
      const where = [];
      const params = [];
      let sql = `SELECT 
           o.id_ocorrencia,
           o.id_colaborador,
           DATE_FORMAT(o.data, "%Y-%m-%d") AS data,
           o.classificacao,
           o.tipo,
           o.subtipo,
           o.observacoes,
           o.created_at,
           o.updated_at,
           c.nome as colaborador_nome,
           e.id_empresa as id_empresa,
           e.nome as empresa_nome
         FROM ocorrencia o 
         JOIN colaborador c ON o.id_colaborador = c.id_colaborador 
         JOIN empresa e ON c.id_empresa = e.id_empresa `;
      if (empresa_id) { where.push('e.id_empresa = ?'); params.push(empresa_id); }
      if (tipo) { where.push('o.tipo = ?'); params.push(tipo); }
      if (classificacao) { where.push('o.classificacao = ?'); params.push(classificacao); }
      if (data_inicio && data_fim) { where.push('o.data BETWEEN ? AND ?'); params.push(data_inicio, data_fim); }
      if (where.length) sql += 'WHERE ' + where.join(' AND ') + ' ';
      sql += 'ORDER BY o.data DESC';
      const [rows] = await pool.execute(sql, params);
      return rows.map(row => new Ocorrencia(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ocorrências filtradas: ${error.message}`);
    }
  }

    // Criar nova ocorrência
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO ocorrencia (id_colaborador, data, classificacao, tipo, subtipo, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
                [data.id_colaborador, data.data, data.classificacao, data.tipo, data.subtipo, data.observacoes]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar ocorrência: ${error.message}`);
        }
    }

    // Atualizar ocorrência
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE ocorrencia SET data = ?, classificacao = ?, tipo = ?, subtipo = ?, observacoes = ? WHERE id_ocorrencia = ?',
                [data.data, data.classificacao, data.tipo, data.subtipo, data.observacoes, this.id_ocorrencia]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar ocorrência: ${error.message}`);
        }
    }

    // Deletar ocorrência
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM ocorrencia WHERE id_ocorrencia = ?',
                [this.id_ocorrencia]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar ocorrência: ${error.message}`);
        }
    }

    // Estatísticas de ocorrências por colaborador
    static async getEstatisticasColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT classificacao, COUNT(*) as total FROM ocorrencia WHERE id_colaborador = ? GROUP BY classificacao',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar estatísticas de ocorrências: ${error.message}`);
        }
    }
}

module.exports = Ocorrencia;
