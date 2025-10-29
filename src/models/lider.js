const { getPool } = require('../config/db');

class Lider {
    constructor(data) {
        this.id_lider = data.id_lider;
        this.id_empresa = data.id_empresa;
        this.id_colaborador = data.id_colaborador;
        this.status = data.status || 'Ativo';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.colaborador_nome = data.colaborador_nome;
        this.empresa_nome = data.empresa_nome;
    }

    static async findAll(filters = {}) {
        try {
            const pool = getPool();
            const params = [];
            let sql = 'SELECT l.*, c.nome AS colaborador_nome, e.nome AS empresa_nome FROM lider l ' +
                      'JOIN colaborador c ON l.id_colaborador = c.id_colaborador ' +
                      'JOIN empresa e ON l.id_empresa = e.id_empresa ';
            const where = [];
            if (filters.id_empresa) { where.push('l.id_empresa = ?'); params.push(filters.id_empresa); }
            if (filters.status && (filters.status === 'Ativo' || filters.status === 'Inativo')) { where.push('l.status = ?'); params.push(filters.status); }
            if (where.length) sql += 'WHERE ' + where.join(' AND ') + ' ';
            sql += 'ORDER BY e.nome, c.nome';
            const [rows] = await pool.execute(sql, params);
            return rows.map(row => new Lider(row));
        } catch (error) {
            throw new Error(`Erro ao buscar líderes: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT l.*, c.nome AS colaborador_nome, e.nome AS empresa_nome FROM lider l ' +
                'JOIN colaborador c ON l.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON l.id_empresa = e.id_empresa WHERE l.id_lider = ?',
                [id]
            );
            return rows.length ? new Lider(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar líder: ${error.message}`);
        }
    }

    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO lider (id_empresa, id_colaborador, status) VALUES (?, ?, ?)',
                [data.id_empresa, data.id_colaborador, data.status || 'Ativo']
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Este colaborador já é um líder');
            }
            throw new Error(`Erro ao criar líder: ${error.message}`);
        }
    }

    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE lider SET id_empresa = ?, id_colaborador = ?, status = ? WHERE id_lider = ?',
                [data.id_empresa, data.id_colaborador, data.status || 'Ativo', this.id_lider]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar líder: ${error.message}`);
        }
    }

    async delete() {
        try {
            const pool = getPool();
            await pool.execute('DELETE FROM lider WHERE id_lider = ?', [this.id_lider]);
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar líder: ${error.message}`);
        }
    }

    async getMembros() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT c.* FROM colaborador c JOIN lider_membro lm ON c.id_colaborador = lm.id_liderado WHERE lm.id_lider = ? ORDER BY c.nome',
                [this.id_lider]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar liderados: ${error.message}`);
        }
    }

    async addMembro(id_liderado) {
        try {
            const pool = getPool();
            await pool.execute('INSERT INTO lider_membro (id_lider, id_liderado) VALUES (?, ?)', [this.id_lider, id_liderado]);
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Colaborador já está vinculado a este líder');
            }
            throw new Error(`Erro ao adicionar liderado: ${error.message}`);
        }
    }

    async removeMembro(id_liderado) {
        try {
            const pool = getPool();
            await pool.execute('DELETE FROM lider_membro WHERE id_lider = ? AND id_liderado = ?', [this.id_lider, id_liderado]);
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover liderado: ${error.message}`);
        }
    }

    async getDepartamentos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT d.* FROM departamento d JOIN lider_departamento ld ON d.id_departamento = ld.id_departamento WHERE ld.id_lider = ? ORDER BY d.nome',
                [this.id_lider]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos do líder: ${error.message}`);
        }
    }

    async addDepartamento(id_departamento) {
        try {
            const pool = getPool();
            await pool.execute('INSERT INTO lider_departamento (id_lider, id_departamento) VALUES (?, ?)', [this.id_lider, id_departamento]);
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Departamento já vinculado a este líder');
            }
            throw new Error(`Erro ao adicionar departamento ao líder: ${error.message}`);
        }
    }

    async removeDepartamento(id_departamento) {
        try {
            const pool = getPool();
            await pool.execute('DELETE FROM lider_departamento WHERE id_lider = ? AND id_departamento = ?', [this.id_lider, id_departamento]);
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover departamento do líder: ${error.message}`);
        }
    }
}

module.exports = Lider;


