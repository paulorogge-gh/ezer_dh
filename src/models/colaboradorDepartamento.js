const { getPool } = require('../config/db');

class ColaboradorDepartamento {
    constructor(data) {
        this.id_colaborador = data.id_colaborador;
        this.id_departamento = data.id_departamento;
    }

    // Criar relação colaborador-departamento
    static async create(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'INSERT INTO colaborador_departamento (id_colaborador, id_departamento) VALUES (?, ?)',
                [data.id_colaborador, data.id_departamento]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Colaborador já está neste departamento');
            }
            throw new Error(`Erro ao criar relação colaborador-departamento: ${error.message}`);
        }
    }

    // Deletar relação colaborador-departamento
    static async delete(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM colaborador_departamento WHERE id_colaborador = ? AND id_departamento = ?',
                [data.id_colaborador, data.id_departamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar relação colaborador-departamento: ${error.message}`);
        }
    }

    // Verificar se relação existe
    static async exists(data) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM colaborador_departamento WHERE id_colaborador = ? AND id_departamento = ?',
                [data.id_colaborador, data.id_departamento]
            );
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Erro ao verificar relação colaborador-departamento: ${error.message}`);
        }
    }

    // Buscar departamentos de um colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT d.* FROM departamento d ' +
                'JOIN colaborador_departamento cd ON d.id_departamento = cd.id_departamento ' +
                'WHERE cd.id_colaborador = ? ORDER BY d.nome',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos do colaborador: ${error.message}`);
        }
    }

    // Buscar colaboradores de um departamento
    static async findByDepartamento(id_departamento) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT c.* FROM colaborador c ' +
                'JOIN colaborador_departamento cd ON c.id_colaborador = cd.id_colaborador ' +
                'WHERE cd.id_departamento = ? AND c.status = "Ativo" ORDER BY c.nome',
                [id_departamento]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar colaboradores do departamento: ${error.message}`);
        }
    }
}

module.exports = ColaboradorDepartamento;
