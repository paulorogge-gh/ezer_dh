const { getPool } = require('../config/db');

class Colaborador {
    constructor(data) {
        this.id_colaborador = data.id_colaborador;
        this.id_empresa = data.id_empresa;
        this.cpf = data.cpf;
        this.nome = data.nome;
    this.empresa_nome = data.empresa_nome; // garantir exibição na listagem
        this.data_nascimento = data.data_nascimento;
        this.email_pessoal = data.email_pessoal;
        this.email_corporativo = data.email_corporativo;
        this.telefone = data.telefone;
        this.cargo = data.cargo;
        this.remuneracao = data.remuneracao;
        this.data_admissao = data.data_admissao;
        this.tipo_contrato = data.tipo_contrato;
        this.status = data.status || 'Ativo';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todos os colaboradores
    static async findAll(filters = {}) {
        try {
            const pool = getPool();
            const params = [];
            let sql = 'SELECT c.*, e.nome as empresa_nome FROM colaborador c JOIN empresa e ON c.id_empresa = e.id_empresa ';
            if (filters && filters.status && (filters.status === 'Ativo' || filters.status === 'Inativo')) {
                sql += 'WHERE c.status = ? ';
                params.push(filters.status);
            }
            sql += 'ORDER BY c.nome';
            const [rows] = await pool.execute(sql, params);
            return rows.map(row => new Colaborador(row));
        } catch (error) {
            throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
        }
    }

    // Buscar colaborador por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT c.*, e.nome as empresa_nome FROM colaborador c ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE c.id_colaborador = ?',
                [id]
            );
            return rows.length > 0 ? new Colaborador(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar colaborador: ${error.message}`);
        }
    }

    // Buscar colaborador por CPF
    static async findByCpf(cpf) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM colaborador WHERE cpf = ?',
                [cpf]
            );
            return rows.length > 0 ? new Colaborador(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar colaborador por CPF: ${error.message}`);
        }
    }

    // Buscar colaboradores por empresa
    static async findByEmpresa(id_empresa) {
        try {
            const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT c.*, e.nome as empresa_nome FROM colaborador c ' +
        'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
        'WHERE c.id_empresa = ? AND c.status = "Ativo" ORDER BY c.nome',
        [id_empresa]
      );
            return rows.map(row => new Colaborador(row));
        } catch (error) {
            throw new Error(`Erro ao buscar colaboradores da empresa: ${error.message}`);
        }
    }

    // Criar novo colaborador
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO colaborador (id_empresa, cpf, nome, data_nascimento, email_pessoal, email_corporativo, telefone, cargo, remuneracao, data_admissao, tipo_contrato, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [data.id_empresa, data.cpf, data.nome, data.data_nascimento, data.email_pessoal, data.email_corporativo, data.telefone, data.cargo, data.remuneracao, data.data_admissao, data.tipo_contrato, data.status || 'Ativo']
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('CPF já cadastrado no sistema');
            }
            throw new Error(`Erro ao criar colaborador: ${error.message}`);
        }
    }

    // Atualizar colaborador
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE colaborador SET nome = ?, data_nascimento = ?, email_pessoal = ?, email_corporativo = ?, telefone = ?, cargo = ?, remuneracao = ?, data_admissao = ?, tipo_contrato = ?, status = ? WHERE id_colaborador = ?',
                [data.nome, data.data_nascimento, data.email_pessoal, data.email_corporativo, data.telefone, data.cargo, data.remuneracao, data.data_admissao, data.tipo_contrato, data.status, this.id_colaborador]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar colaborador: ${error.message}`);
        }
    }

    // Deletar colaborador (soft delete)
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE colaborador SET status = "Inativo" WHERE id_colaborador = ?',
                [this.id_colaborador]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar colaborador: ${error.message}`);
        }
    }

    // Buscar departamentos do colaborador
    async getDepartamentos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT d.* FROM departamento d ' +
                'JOIN colaborador_departamento cd ON d.id_departamento = cd.id_departamento ' +
                'WHERE cd.id_colaborador = ? ORDER BY d.nome',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar departamentos do colaborador: ${error.message}`);
        }
    }

    // Adicionar colaborador a departamento
    async addDepartamento(id_departamento) {
        try {
            const pool = getPool();
            await pool.execute(
                'INSERT INTO colaborador_departamento (id_colaborador, id_departamento) VALUES (?, ?)',
                [this.id_colaborador, id_departamento]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Colaborador já está neste departamento');
            }
            throw new Error(`Erro ao adicionar colaborador ao departamento: ${error.message}`);
        }
    }

    // Remover colaborador de departamento
    async removeDepartamento(id_departamento) {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM colaborador_departamento WHERE id_colaborador = ? AND id_departamento = ?',
                [this.id_colaborador, id_departamento]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover colaborador do departamento: ${error.message}`);
        }
    }

    // Buscar ocorrências do colaborador
    async getOcorrencias() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM ocorrencia WHERE id_colaborador = ? ORDER BY data DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar ocorrências do colaborador: ${error.message}`);
        }
    }

    // Buscar treinamentos do colaborador
    async getTreinamentos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM treinamento WHERE id_colaborador = ? ORDER BY data_inicio DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar treinamentos do colaborador: ${error.message}`);
        }
    }

    // Buscar feedbacks recebidos pelo colaborador
    async getFeedbacksRecebidos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT f.*, c.nome as avaliador_nome FROM feedback f ' +
                'JOIN colaborador c ON f.id_avaliador = c.id_colaborador ' +
                'WHERE f.id_avaliado = ? ORDER BY f.data DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks recebidos: ${error.message}`);
        }
    }

    // Buscar feedbacks dados pelo colaborador
    async getFeedbacksDados() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT f.*, c.nome as avaliado_nome FROM feedback f ' +
                'JOIN colaborador c ON f.id_avaliado = c.id_colaborador ' +
                'WHERE f.id_avaliador = ? ORDER BY f.data DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar feedbacks dados: ${error.message}`);
        }
    }

    // Buscar avaliações do colaborador
    async getAvaliacoes() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT a.*, c.nome as avaliador_nome FROM avaliacao a ' +
                'JOIN colaborador c ON a.id_avaliador = c.id_colaborador ' +
                'WHERE a.id_colaborador = ? ORDER BY a.data DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar avaliações do colaborador: ${error.message}`);
        }
    }

    // Buscar PDIs do colaborador
    async getPdis() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM pdi WHERE id_colaborador = ? ORDER BY created_at DESC',
                [this.id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs do colaborador: ${error.message}`);
        }
    }
}

module.exports = Colaborador;
