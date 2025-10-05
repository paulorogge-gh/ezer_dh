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
    }

    // Buscar todas as ocorrências
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT o.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM ocorrencia o ' +
                'JOIN colaborador c ON o.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'ORDER BY o.data DESC'
            );
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências: ${error.message}`);
        }
    }

    // Buscar ocorrência por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT o.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM ocorrencia o ' +
                'JOIN colaborador c ON o.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE o.id_ocorrencia = ?',
                [id]
            );
            return rows.length > 0 ? new Ocorrencia(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrência: ${error.message}`);
        }
    }

    // Buscar ocorrências por colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM ocorrencia WHERE id_colaborador = ? ORDER BY data DESC',
                [id_colaborador]
            );
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências do colaborador: ${error.message}`);
        }
    }

    // Buscar ocorrências por período
    static async findByPeriodo(data_inicio, data_fim) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT o.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM ocorrencia o ' +
                'JOIN colaborador c ON o.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE o.data BETWEEN ? AND ? ORDER BY o.data DESC',
                [data_inicio, data_fim]
            );
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências por período: ${error.message}`);
        }
    }

    // Buscar ocorrências por classificação
    static async findByClassificacao(classificacao) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT o.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM ocorrencia o ' +
                'JOIN colaborador c ON o.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE o.classificacao = ? ORDER BY o.data DESC',
                [classificacao]
            );
            return rows.map(row => new Ocorrencia(row));
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências por classificação: ${error.message}`);
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
