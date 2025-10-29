const { getPool } = require('../config/db');

class Avaliacao {
    constructor(data) {
        this.id_avaliacao = data.id_avaliacao;
        this.id_colaborador = data.id_colaborador;
        this.id_avaliador = data.id_avaliador;
        this.data = data.data;
        this.tipo = data.tipo;
        this.nota = data.nota;
        this.comentario = data.comentario;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todas as avaliações
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c1.nome as colaborador_nome, c2.nome as avaliador_nome, e.nome as empresa_nome FROM avaliacao a ' +
                'JOIN colaborador c1 ON a.id_colaborador = c1.id_colaborador ' +
                'JOIN colaborador c2 ON a.id_avaliador = c2.id_colaborador ' +
                'JOIN empresa e ON c1.id_empresa = e.id_empresa ' +
                'ORDER BY a.data DESC'
            );
            return rows.map(row => new Avaliacao(row));
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações: ${error.message}`);
        }
    }

    // Buscar avaliação por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c1.nome as colaborador_nome, c2.nome as avaliador_nome, e.nome as empresa_nome FROM avaliacao a ' +
                'JOIN colaborador c1 ON a.id_colaborador = c1.id_colaborador ' +
                'JOIN colaborador c2 ON a.id_avaliador = c2.id_colaborador ' +
                'JOIN empresa e ON c1.id_empresa = e.id_empresa ' +
                'WHERE a.id_avaliacao = ?',
                [id]
            );
            return rows.length > 0 ? new Avaliacao(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar avaliação: ${error.message}`);
        }
    }

    // Buscar avaliações por colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c.nome as avaliador_nome FROM avaliacao a ' +
                'JOIN colaborador c ON a.id_avaliador = c.id_colaborador ' +
                'WHERE a.id_colaborador = ? ORDER BY a.data DESC',
                [id_colaborador]
            );
            return rows.map(row => new Avaliacao(row));
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações do colaborador: ${error.message}`);
        }
    }

    // Buscar avaliações por avaliador
    static async findByAvaliador(id_avaliador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c.nome as colaborador_nome FROM avaliacao a ' +
                'JOIN colaborador c ON a.id_colaborador = c.id_colaborador ' +
                'WHERE a.id_avaliador = ? ORDER BY a.data DESC',
                [id_avaliador]
            );
            return rows.map(row => new Avaliacao(row));
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações do avaliador: ${error.message}`);
        }
    }

    // Buscar avaliações por tipo
    static async findByTipo(tipo) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c1.nome as colaborador_nome, c2.nome as avaliador_nome, e.nome as empresa_nome FROM avaliacao a ' +
                'JOIN colaborador c1 ON a.id_colaborador = c1.id_colaborador ' +
                'JOIN colaborador c2 ON a.id_avaliador = c2.id_colaborador ' +
                'JOIN empresa e ON c1.id_empresa = e.id_empresa ' +
                'WHERE a.tipo = ? ORDER BY a.data DESC',
                [tipo]
            );
            return rows.map(row => new Avaliacao(row));
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações por tipo: ${error.message}`);
        }
    }

    // Buscar avaliações por período
    static async findByPeriodo(data_inicio, data_fim) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c1.nome as colaborador_nome, c2.nome as avaliador_nome, e.nome as empresa_nome FROM avaliacao a ' +
                'JOIN colaborador c1 ON a.id_colaborador = c1.id_colaborador ' +
                'JOIN colaborador c2 ON a.id_avaliador = c2.id_colaborador ' +
                'JOIN empresa e ON c1.id_empresa = e.id_empresa ' +
                'WHERE a.data BETWEEN ? AND ? ORDER BY a.data DESC',
                [data_inicio, data_fim]
            );
            return rows.map(row => new Avaliacao(row));
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações por período: ${error.message}`);
        }
    }

    // Criar nova avaliação
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO avaliacao (id_colaborador, id_avaliador, data, tipo, nota, comentario) VALUES (?, ?, ?, ?, ?, ?)',
                [data.id_colaborador, data.id_avaliador, data.data, data.tipo, data.nota, data.comentario]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar avaliação: ${error.message}`);
        }
    }

    // Atualizar avaliação
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE avaliacao SET data = ?, tipo = ?, nota = ?, comentario = ? WHERE id_avaliacao = ?',
                [data.data, data.tipo, data.nota, data.comentario, this.id_avaliacao]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar avaliação: ${error.message}`);
        }
    }

    // Deletar avaliação
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM avaliacao WHERE id_avaliacao = ?',
                [this.id_avaliacao]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar avaliação: ${error.message}`);
        }
    }

    // Calcular média de avaliações por colaborador
    static async getMediaColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT AVG(nota) as media, COUNT(*) as total FROM avaliacao WHERE id_colaborador = ?',
                [id_colaborador]
            );
            return rows[0];
        } catch (error) {
            throw new Error(`Erro ao calcular média de avaliações: ${error.message}`);
        }
    }

    // Estatísticas de avaliações por colaborador
    static async getEstatisticasColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT tipo, AVG(nota) as media, COUNT(*) as total FROM avaliacao WHERE id_colaborador = ? GROUP BY tipo',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar estatísticas de avaliações: ${error.message}`);
        }
    }
}

module.exports = Avaliacao;
