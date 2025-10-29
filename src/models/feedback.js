const { getPool } = require('../config/db');

class Feedback {
    constructor(data) {
        this.id_feedback = data.id_feedback;
        this.id_avaliador = data.id_avaliador;
        this.id_avaliado = data.id_avaliado;
        this.data = data.data;
        this.classificacao = data.classificacao;
        this.observacoes = data.observacoes;
        // tipo_feedback removido da estrutura
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todos os feedbacks
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(`
                SELECT 
                  f.id_feedback,
                  f.id_avaliador,
                  f.id_avaliado,
                  DATE_FORMAT(f.data, "%Y-%m-%d") AS data,
                  f.classificacao,
                  f.observacoes,
                  f.created_at,
                  f.updated_at,
                  c1.nome AS avaliador_nome,
                  c2.nome AS avaliado_nome,
                  e.id_empresa AS id_empresa,
                  e.nome AS empresa_nome
                FROM feedback f
                JOIN colaborador c1 ON f.id_avaliador = c1.id_colaborador
                JOIN colaborador c2 ON f.id_avaliado = c2.id_colaborador
                JOIN empresa e ON c2.id_empresa = e.id_empresa
                ORDER BY f.data DESC
            `);
            return rows.map(row => new Feedback(row));
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks: ${error.message}`);
        }
    }

    // Buscar feedback por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(`
                SELECT 
                  f.id_feedback,
                  f.id_avaliador,
                  f.id_avaliado,
                  DATE_FORMAT(f.data, "%Y-%m-%d") AS data,
                  f.classificacao,
                  f.observacoes,
                  f.created_at,
                  f.updated_at,
                  c1.nome AS avaliador_nome,
                  c2.nome AS avaliado_nome,
                  e.id_empresa AS id_empresa,
                  e.nome AS empresa_nome
                FROM feedback f
                JOIN colaborador c1 ON f.id_avaliador = c1.id_colaborador
                JOIN colaborador c2 ON f.id_avaliado = c2.id_colaborador
                JOIN empresa e ON c2.id_empresa = e.id_empresa
                WHERE f.id_feedback = ?
            `, [id]);
            return rows.length > 0 ? new Feedback(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar feedback: ${error.message}`);
        }
    }

    // Buscar feedbacks recebidos por colaborador
    static async findByAvaliado(id_avaliado) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT f.*, c.nome as avaliador_nome FROM feedback f ' +
                'JOIN colaborador c ON f.id_avaliador = c.id_colaborador ' +
                'WHERE f.id_avaliado = ? ORDER BY f.data DESC',
                [id_avaliado]
            );
            return rows.map(row => new Feedback(row));
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks recebidos: ${error.message}`);
        }
    }

    // Filtro agregado
    static async findFiltered({ empresa_id, classificacao, data_inicio, data_fim, q }) {
        try {
            const pool = getPool();
            const where = [];
            const params = [];
            let sql = `
                SELECT 
                  f.id_feedback,
                  f.id_avaliador,
                  f.id_avaliado,
                  DATE_FORMAT(f.data, "%Y-%m-%d") AS data,
                  f.classificacao,
                  f.observacoes,
                  f.created_at,
                  f.updated_at,
                  c1.nome AS avaliador_nome,
                  c2.nome AS avaliado_nome,
                  e.id_empresa AS id_empresa,
                  e.nome AS empresa_nome
                FROM feedback f
                JOIN colaborador c1 ON f.id_avaliador = c1.id_colaborador
                JOIN colaborador c2 ON f.id_avaliado = c2.id_colaborador
                JOIN empresa e ON c2.id_empresa = e.id_empresa
            `;
            if (empresa_id) { where.push('e.id_empresa = ?'); params.push(empresa_id); }
            if (classificacao) { where.push('f.classificacao = ?'); params.push(classificacao); }
            // tipo_feedback removido
            if (data_inicio && data_fim) { where.push('f.data BETWEEN ? AND ?'); params.push(data_inicio, data_fim); }
            if (q) { where.push('(c1.nome LIKE ? OR c2.nome LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
            if (where.length) sql += ' WHERE ' + where.join(' AND ');
            sql += ' ORDER BY f.data DESC';
            const [rows] = await pool.execute(sql, params);
            return rows.map(r => new Feedback(r));
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks filtrados: ${error.message}`);
        }
    }

    // Buscar feedbacks dados por colaborador
    static async findByAvaliador(id_avaliador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT f.*, c.nome as avaliado_nome FROM feedback f ' +
                'JOIN colaborador c ON f.id_avaliado = c.id_colaborador ' +
                'WHERE f.id_avaliador = ? ORDER BY f.data DESC',
                [id_avaliador]
            );
            return rows.map(row => new Feedback(row));
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks dados: ${error.message}`);
        }
    }

    // Buscar feedbacks por tipo
    // findByTipo removido

    // Buscar feedbacks por classificação
    static async findByClassificacao(classificacao) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT f.*, c1.nome as avaliador_nome, c2.nome as avaliado_nome, e.nome as empresa_nome FROM feedback f ' +
                'JOIN colaborador c1 ON f.id_avaliador = c1.id_colaborador ' +
                'JOIN colaborador c2 ON f.id_avaliado = c2.id_colaborador ' +
                'JOIN empresa e ON c2.id_empresa = e.id_empresa ' +
                'WHERE f.classificacao = ? ORDER BY f.data DESC',
                [classificacao]
            );
            return rows.map(row => new Feedback(row));
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks por classificação: ${error.message}`);
        }
    }

    // Criar novo feedback
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO feedback (id_avaliador, id_avaliado, data, classificacao, observacoes) VALUES (?, ?, ?, ?, ?)',
                [data.id_avaliador, data.id_avaliado, data.data, data.classificacao, data.observacoes]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar feedback: ${error.message}`);
        }
    }

    // Atualizar feedback
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE feedback SET data = ?, classificacao = ?, observacoes = ? WHERE id_feedback = ?',
                [data.data, data.classificacao, data.observacoes, this.id_feedback]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar feedback: ${error.message}`);
        }
    }

    // Deletar feedback
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM feedback WHERE id_feedback = ?',
                [this.id_feedback]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar feedback: ${error.message}`);
        }
    }

    // Estatísticas de feedbacks por colaborador
    static async getEstatisticasColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT classificacao, COUNT(*) as total FROM feedback WHERE id_avaliado = ? GROUP BY classificacao',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar estatísticas de feedbacks: ${error.message}`);
        }
    }
}

module.exports = Feedback;
