const { getPool } = require('../config/db');

class Pdi {
    constructor(data) {
        this.id_pdi = data.id_pdi;
        this.id_colaborador = data.id_colaborador;
        this.objetivo = data.objetivo;
        this.acao = data.acao;
        this.prazo = data.prazo;
        this.responsavel = data.responsavel;
        this.status = data.status || 'Em Andamento';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Buscar todos os PDIs
    static async findAll() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT p.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM pdi p ' +
                'JOIN colaborador c ON p.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'ORDER BY p.created_at DESC'
            );
            return rows.map(row => new Pdi(row));
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs: ${error.message}`);
        }
    }

    // Buscar PDI por ID
    static async findById(id) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT p.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM pdi p ' +
                'JOIN colaborador c ON p.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE p.id_pdi = ?',
                [id]
            );
            return rows.length > 0 ? new Pdi(rows[0]) : null;
        } catch (error) {
            throw new Error(`Erro ao buscar PDI: ${error.message}`);
        }
    }

    // Buscar PDIs por colaborador
    static async findByColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT * FROM pdi WHERE id_colaborador = ? ORDER BY created_at DESC',
                [id_colaborador]
            );
            return rows.map(row => new Pdi(row));
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs do colaborador: ${error.message}`);
        }
    }

    // Buscar PDIs por status
    static async findByStatus(status) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT p.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM pdi p ' +
                'JOIN colaborador c ON p.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE p.status = ? ORDER BY p.prazo ASC',
                [status]
            );
            return rows.map(row => new Pdi(row));
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs por status: ${error.message}`);
        }
    }

    // Buscar PDIs vencidos
    static async findVencidos() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT p.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM pdi p ' +
                'JOIN colaborador c ON p.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE p.prazo < CURDATE() AND p.status = "Em Andamento" ' +
                'ORDER BY p.prazo ASC'
            );
            return rows.map(row => new Pdi(row));
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs vencidos: ${error.message}`);
        }
    }

    // Buscar PDIs próximos do vencimento (próximos 30 dias)
    static async findProximosVencimento() {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT p.*, c.nome as colaborador_nome, e.nome as empresa_nome FROM pdi p ' +
                'JOIN colaborador c ON p.id_colaborador = c.id_colaborador ' +
                'JOIN empresa e ON c.id_empresa = e.id_empresa ' +
                'WHERE p.prazo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ' +
                'AND p.status = "Em Andamento" ' +
                'ORDER BY p.prazo ASC'
            );
            return rows.map(row => new Pdi(row));
        } catch (error) {
            throw new Error(`Erro ao buscar PDIs próximos do vencimento: ${error.message}`);
        }
    }

    // Criar novo PDI
    static async create(data) {
        try {
            const pool = getPool();
            const [result] = await pool.execute(
                'INSERT INTO pdi (id_colaborador, objetivo, acao, prazo, responsavel, status) VALUES (?, ?, ?, ?, ?, ?)',
                [data.id_colaborador, data.objetivo, data.acao, data.prazo, data.responsavel, data.status || 'Em Andamento']
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Erro ao criar PDI: ${error.message}`);
        }
    }

    // Atualizar PDI
    async update(data) {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE pdi SET objetivo = ?, acao = ?, prazo = ?, responsavel = ?, status = ? WHERE id_pdi = ?',
                [data.objetivo, data.acao, data.prazo, data.responsavel, data.status, this.id_pdi]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao atualizar PDI: ${error.message}`);
        }
    }

    // Deletar PDI
    async delete() {
        try {
            const pool = getPool();
            await pool.execute(
                'DELETE FROM pdi WHERE id_pdi = ?',
                [this.id_pdi]
            );
            return true;
        } catch (error) {
            throw new Error(`Erro ao deletar PDI: ${error.message}`);
        }
    }

    // Marcar PDI como concluído
    async marcarConcluido() {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE pdi SET status = "Concluído" WHERE id_pdi = ?',
                [this.id_pdi]
            );
            this.status = 'Concluído';
            return true;
        } catch (error) {
            throw new Error(`Erro ao marcar PDI como concluído: ${error.message}`);
        }
    }

    // Marcar PDI como cancelado
    async marcarCancelado() {
        try {
            const pool = getPool();
            await pool.execute(
                'UPDATE pdi SET status = "Cancelado" WHERE id_pdi = ?',
                [this.id_pdi]
            );
            this.status = 'Cancelado';
            return true;
        } catch (error) {
            throw new Error(`Erro ao marcar PDI como cancelado: ${error.message}`);
        }
    }

    // Estatísticas de PDIs por colaborador
    static async getEstatisticasColaborador(id_colaborador) {
        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT status, COUNT(*) as total FROM pdi WHERE id_colaborador = ? GROUP BY status',
                [id_colaborador]
            );
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar estatísticas de PDIs: ${error.message}`);
        }
    }
}

module.exports = Pdi;
