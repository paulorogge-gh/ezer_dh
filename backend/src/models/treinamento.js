const { getPool } = require('../config/db');

class Treinamento {
    constructor(data) {
        this.id_treinamento = data.id_treinamento;
        this.id_colaborador = data.id_colaborador;
        this.nome = data.nome;
        this.data_inicio = data.data_inicio;
        this.data_fim = data.data_fim;
        this.categoria = data.categoria;
        this.carga_horaria = data.carga_horaria;
        this.observacoes = data.observacoes;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todos os treinamentos
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT t.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM treinamento t ' +
                'JOIN colaborador c ON t.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'ORDER BY t.data_inicio DESC'
            );
            return rows.map(row => new Treinamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar treinamentos: ${error.message}`);
        }
    }

    // Buscar treinamento por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT t.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM treinamento t ' +
                'JOIN colaborador c ON t.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE t.id_treinamento = ?',
                [id]
            );
            return rows.length > 0 ? new Treinamento(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar treinamento: ${error.message}`);
        }
    }

    // Buscar treinamentos por colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM treinamento WHERE id_colaborador = ? ORDER BY data_inicio DESC',
                [id_colaborador]
            );
            return rows.map(row => new Treinamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar treinamentos do colaborador: ${error.message}`);
        }
    }

    // Buscar treinamentos por categoria
    static async findByCategoria(categoria) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT t.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM treinamento t ' +
                'JOIN colaborador c ON t.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE t.categoria = ? ORDER BY t.data_inicio DESC',
                [categoria]
            );
            return rows.map(row => new Treinamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar treinamentos por categoria: ${error.message}`);
        }
    }

    // Buscar treinamentos em andamento
    static async findEmAndamento() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT t.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM treinamento t ' +
                'JOIN colaborador c ON t.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE t.data_inicio <= CURDATE() AND t.data_fim >= CURDATE() ' +
                'ORDER BY t.data_fim ASC'
            );
            return rows.map(row => new Treinamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar treinamentos em andamento: ${error.message}`);
        }
    }

    // Criar novo treinamento
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO treinamento (id_colaborador, nome, data_inicio, data_fim, categoria, carga_horaria, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [data.id_colaborador, data.nome, data.data_inicio, data.data_fim, data.categoria, data.carga_horaria, data.observacoes]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar treinamento: ${error.message}`);
        }
    }

    // Atualizar treinamento
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE treinamento SET nome = ?, data_inicio = ?, data_fim = ?, categoria = ?, carga_horaria = ?, observacoes = ? WHERE id_treinamento = ?',
                [data.nome, data.data_inicio, data.data_fim, data.categoria, data.carga_horaria, data.observacoes, this.id_treinamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar treinamento: ${error.message}`);
        }
    }

    // Deletar treinamento
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM treinamento WHERE id_treinamento = ?',
                [this.id_treinamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar treinamento: ${error.message}`);
        }
    }

    // Estatísticas de treinamentos por colaborador
    static async getEstatisticasColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT categoria, COUNT(*) as total, SUM(carga_horaria) as total_horas FROM treinamento WHERE id_colaborador = ? GROUP BY categoria',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar estatísticas de treinamentos: ${error.message}`);
        }
    }
}

module.exports = Treinamento;
