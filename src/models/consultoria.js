const { getPool } = require('../config/db');

class Consultoria {
    constructor(data) {
        this.id_consultoria = data.id_consultoria;
        this.nome = data.nome;
        this.email = data.email;
        this.telefone = data.telefone;
        this.status = data.status || 'Ativo';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todas as consultorias
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM consultoria WHERE status = "Ativo" ORDER BY nome'
            );
            return rows.map(row => new Consultoria(row));
        } catch (error) {
            throw new Error(`Erro ao buscar consultorias: ${error.message}`);
        }
    }

    // Buscar consultoria por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM consultoria WHERE id_consultoria = ?',
                [id]
            );
            return rows.length > 0 ? new Consultoria(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar consultoria: ${error.message}`);
        }
    }

    // Criar nova consultoria
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO consultoria (nome, email, telefone, status) VALUES (?, ?, ?, ?)',
                [data.nome, data.email, data.telefone, data.status || 'Ativo']
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar consultoria: ${error.message}`);
        }
    }

    // Atualizar consultoria
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE consultoria SET nome = ?, email = ?, telefone = ?, status = ? WHERE id_consultoria = ?',
                [data.nome, data.email, data.telefone, data.status, this.id_consultoria]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar consultoria: ${error.message}`);
        }
    }

    // Deletar consultoria (soft delete)
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE consultoria SET status = "Inativo" WHERE id_consultoria = ?',
                [this.id_consultoria]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar consultoria: ${error.message}`);
        }
    }

    // Buscar empresas da consultoria
    async getEmpresas() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM empresa WHERE id_consultoria = ? AND status = "Ativo" ORDER BY nome',
                [this.id_consultoria]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar empresas da consultoria: ${error.message}`);
        }
    }
}

module.exports = Consultoria;
