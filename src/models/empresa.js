const { getPool } = require('../config/db');

class Empresa {
    constructor(data) {
        this.id_empresa = data.id_empresa;
        this.id_consultoria = data.id_consultoria;
        this.nome = data.nome;
        this.cnpj = data.cnpj;
        this.email = data.email;
        this.telefone = data.telefone;
        this.endereco = data.endereco;
        this.responsavel = data.responsavel;
        this.status = data.status || 'Ativo';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todas as empresas
    static async findAll(filters = {}) {
        try {
            const pool = getPool();
            const params = [];
            let where = [];
            let sql = 'SELECT e.*, c.nome as consultoria_nome FROM empresa e ' +
                      'JOIN consultoria c ON e.id_consultoria = c.id_consultoria ';
            if (filters && filters.status && (filters.status === 'Ativo' || filters.status === 'Inativo')) {
                where.push('e.status = ?');
                params.push(filters.status);
            }
            if (filters && filters.consultoria_id) {
                where.push('e.id_consultoria = ?');
                params.push(filters.consultoria_id);
            }
            if (where.length) {
                sql += 'WHERE ' + where.join(' AND ') + ' ';
            }
            sql += 'ORDER BY e.nome';
            const [rows] = await pool.execute(sql, params);
            return rows.map(row => new Empresa(row));
        } catch (error) {
            throw new Error(`Erro ao buscar empresas: ${error.message}`);
        }
    }

    // Buscar empresa por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT e.*, c.nome as consultoria_nome FROM empresa e ' +
                'JOIN consultoria c ON e.id_consultoria = c.id_consultoria ' +
                'WHERE e.id_empresa = ?',
                [id]
            );
            return rows.length > 0 ? new Empresa(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar empresa: ${error.message}`);
        }
    }

    // Buscar empresa por CNPJ
    static async findByCnpj(cnpj) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM empresa WHERE cnpj = ?',
                [cnpj]
            );
            return rows.length > 0 ? new Empresa(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar empresa por CNPJ: ${error.message}`);
        }
    }

    // Criar nova empresa
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO empresa (id_consultoria, nome, cnpj, email, telefone, endereco, responsavel, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    (data.id_consultoria ?? null),
                    data.nome,
                    data.cnpj,
                    (data.email ?? null),
                    (data.telefone ?? null),
                    (data.endereco ?? null),
                    (data.responsavel ?? null),
                    (data.status ?? 'Ativo')
                ]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('CNPJ já cadastrado no sistema');
            }
            throw new Error(`Erro ao criar empresa: ${error.message}`);
        }
    }

    // Atualizar empresa
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE empresa SET nome = ?, cnpj = ?, email = ?, telefone = ?, endereco = ?, responsavel = ?, status = ? WHERE id_empresa = ?',
                [data.nome, data.cnpj, data.email, data.telefone, data.endereco, data.responsavel, data.status, this.id_empresa]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('CNPJ já cadastrado no sistema');
            }
            throw new Error(`Erro ao atualizar empresa: ${error.message}`);
        }
    }

    // Deletar empresa (hard delete)
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM empresa WHERE id_empresa = ?',
                [this.id_empresa]
            );
            return true;
        } catch (error) {
            // Tratar violação de chave estrangeira (MySQL)
            if (error && (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451)) {
                throw new Error('Não é possível excluir: existem registros vinculados (colaboradores, departamentos, ocorrências, feedbacks, etc.)');
            }
            throw new Error(`Erro ao excluir empresa: ${error.message}`);
        }
    }

    // Buscar departamentos da empresa
    async getDepartamentos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM departamento WHERE id_empresa = ? ORDER BY nome',
                [this.id_empresa]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos da empresa: ${error.message}`);
        }
    }

    // Buscar colaboradores da empresa
    async getColaboradores() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM colaborador WHERE id_empresa = ? AND status = "Ativo" ORDER BY nome',
                [this.id_empresa]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar colaboradores da empresa: ${error.message}`);
        }
    }

    // Contar colaboradores ativos
    async countColaboradores() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as total FROM colaborador WHERE id_empresa = ? AND status = "Ativo"',
                [this.id_empresa]
            );
            return rows[0].total;
        } catch (error) {
            throw new Error(`Erro ao contar colaboradores: ${error.message}`);
        }
    }

    // Contagens globais de empresas
    static async getGlobalCounts() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS total, SUM(status = "Ativo") AS ativos, SUM(status = "Inativo") AS inativos FROM empresa'
            );
            const row = rows && rows[0] ? rows[0] : { total: 0, ativos: 0, inativos: 0 };
            return {
                total: Number(row.total || 0),
                ativos: Number(row.ativos || 0),
                inativos: Number(row.inativos || 0)
            };
        } catch (error) {
            throw new Error(`Erro ao obter contagens de empresas: ${error.message}`);
        }
    }
}

module.exports = Empresa;
