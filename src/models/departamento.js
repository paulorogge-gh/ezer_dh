const { getPool } = require('../config/db');

class Departamento {
    constructor(data) {
        this.id_departamento = data.id_departamento;
        this.id_empresa = data.id_empresa;
        this.nome = data.nome;
        this.descricao = data.descricao;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todos os departamentos
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT d.*, e.nome as empresa_nome FROM departamento d ' +
                'JOIN empresa e ON d.id_empresa = e.id_empresa ' +
                'ORDER BY e.nome, d.nome'
            );
            return rows.map(row => new Departamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos: ${error.message}`);
        }
    }

    // Buscar departamento por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT d.*, e.nome as empresa_nome FROM departamento d ' +
                'JOIN empresa e ON d.id_empresa = e.id_empresa ' +
                'WHERE d.id_departamento = ?',
                [id]
            );
            return rows.length > 0 ? new Departamento(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar departamento: ${error.message}`);
        }
    }

    // Buscar departamentos por empresa
    static async findByEmpresa(id_empresa) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM departamento WHERE id_empresa = ? ORDER BY nome',
                [id_empresa]
            );
            return rows.map(row => new Departamento(row));
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos da empresa: ${error.message}`);
        }
    }

    // Criar novo departamento
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO departamento (id_empresa, nome, descricao) VALUES (?, ?, ?)',
                [data.id_empresa, data.nome, data.descricao]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar departamento: ${error.message}`);
        }
    }

    // Atualizar departamento
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE departamento SET nome = ?, descricao = ? WHERE id_departamento = ?',
                [data.nome, data.descricao, this.id_departamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar departamento: ${error.message}`);
        }
    }

    // Deletar departamento
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM departamento WHERE id_departamento = ?',
                [this.id_departamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar departamento: ${error.message}`);
        }
    }

    // Buscar colaboradores do departamento
    async getColaboradores() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT c.* FROM colaborador c ' +
                'JOIN colaborador_departamento cd ON c.id_colaborador = cd.id_colaborador ' +
                'WHERE cd.id_departamento = ? AND c.status = "Ativo" ' +
                'ORDER BY c.nome',
                [this.id_departamento]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar colaboradores do departamento: ${error.message}`);
        }
    }

    // Contar colaboradores do departamento
    async countColaboradores() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as total FROM colaborador c ' +
                'JOIN colaborador_departamento cd ON c.id_colaborador = cd.id_colaborador ' +
                'WHERE cd.id_departamento = ? AND c.status = "Ativo"',
                [this.id_departamento]
            );
            return rows[0].total;
        } catch (error) {
            throw new Error(`Erro ao contar colaboradores do departamento: ${error.message}`);
        }
    }

    // Adicionar colaborador ao departamento
    async addColaborador(id_colaborador) {
        try {
            const pool = getPool();
            await pool.execute(
                'INSERT INTO colaborador_departamento (id_colaborador, id_departamento) VALUES (?, ?)',
                [id_colaborador, this.id_departamento]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Colaborador já está neste departamento');
            }
            throw new Error(`Erro ao adicionar colaborador ao departamento: ${error.message}`);
        }
    }

    // Remover colaborador do departamento
    async removeColaborador(id_colaborador) {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM colaborador_departamento WHERE id_colaborador = ? AND id_departamento = ?',
                [id_colaborador, this.id_departamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover colaborador do departamento: ${error.message}`);
        }
    }
}

module.exports = Departamento;
