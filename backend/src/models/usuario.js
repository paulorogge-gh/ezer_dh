const { getPool } = require('../config/db');
const bcrypt = require('bcryptjs');

class Usuario {
    constructor(data) {
        this.id_usuario = data.id_usuario;
        this.email = data.email;
        this.senha = data.senha;
        this.tipo_usuario = data.tipo_usuario;
        this.id_referencia = data.id_referencia;
        this.status = data.status;
        this.ultimo_login = data.ultimo_login;
        this.tentativas_login = data.tentativas_login;
        this.bloqueado_ate = data.bloqueado_ate;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Criar novo usuário
     */
    static async create(usuarioData) {
        const pool = getPool();
        
        // Criptografar senha
        const senhaHash = await bcrypt.hash(usuarioData.senha, 12);
        
        const sql = `
            INSERT INTO usuario (email, senha, tipo_usuario, id_referencia, status)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const values = [
            usuarioData.email,
            senhaHash,
            usuarioData.tipo_usuario,
            usuarioData.id_referencia,
            usuarioData.status || 'Ativo'
        ];
        
        const [result] = await pool.execute(sql, values);
        return result.insertId;
    }

    /**
     * Buscar usuário por email
     */
    static async findByEmail(email) {
        const pool = getPool();
        
        const sql = `
            SELECT * FROM usuario 
            WHERE email = ? AND status = 'Ativo'
        `;
        
        const [rows] = await pool.execute(sql, [email]);
        return rows.length > 0 ? new Usuario(rows[0]) : null;
    }

    /**
     * Buscar usuário por ID
     */
    static async findById(id) {
        const pool = getPool();
        
        const sql = `
            SELECT * FROM usuario 
            WHERE id_usuario = ?
        `;
        
        const [rows] = await pool.execute(sql, [id]);
        return rows.length > 0 ? new Usuario(rows[0]) : null;
    }

    /**
     * Buscar usuário por tipo e referência
     */
    static async findByTipoReferencia(tipo_usuario, id_referencia) {
        const pool = getPool();
        
        const sql = `
            SELECT * FROM usuario 
            WHERE tipo_usuario = ? AND id_referencia = ?
        `;
        
        const [rows] = await pool.execute(sql, [tipo_usuario, id_referencia]);
        return rows.length > 0 ? new Usuario(rows[0]) : null;
    }

    /**
     * Listar todos os usuários
     */
    static async findAll(filters = {}) {
        const pool = getPool();
        
        let sql = 'SELECT * FROM usuario WHERE 1=1';
        const values = [];
        
        if (filters.tipo_usuario) {
            sql += ' AND tipo_usuario = ?';
            values.push(filters.tipo_usuario);
        }
        
        if (filters.status) {
            sql += ' AND status = ?';
            values.push(filters.status);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(sql, values);
        return rows.map(row => new Usuario(row));
    }

    /**
     * Verificar senha
     */
    async verificarSenha(senha) {
        return await bcrypt.compare(senha, this.senha);
    }

    /**
     * Atualizar usuário
     */
    async update(updateData) {
        const pool = getPool();
        
        const fields = [];
        const values = [];
        
        if (updateData.email) {
            fields.push('email = ?');
            values.push(updateData.email);
        }
        
        if (updateData.senha) {
            fields.push('senha = ?');
            values.push(await bcrypt.hash(updateData.senha, 12));
        }
        
        if (updateData.status) {
            fields.push('status = ?');
            values.push(updateData.status);
        }
        
        if (updateData.tentativas_login !== undefined) {
            fields.push('tentativas_login = ?');
            values.push(updateData.tentativas_login);
        }
        
        if (updateData.bloqueado_ate !== undefined) {
            fields.push('bloqueado_ate = ?');
            values.push(updateData.bloqueado_ate);
        }
        
        if (fields.length === 0) {
            return false;
        }
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(this.id_usuario);
        
        const sql = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;
        
        const [result] = await pool.execute(sql, values);
        return result.affectedRows > 0;
    }

    /**
     * Atualizar último login
     */
    async atualizarUltimoLogin() {
        const pool = getPool();
        
        const sql = `
            UPDATE usuario 
            SET ultimo_login = CURRENT_TIMESTAMP, tentativas_login = 0, bloqueado_ate = NULL
            WHERE id_usuario = ?
        `;
        
        const [result] = await pool.execute(sql, [this.id_usuario]);
        return result.affectedRows > 0;
    }

    /**
     * Incrementar tentativas de login
     */
    async incrementarTentativasLogin() {
        const pool = getPool();
        
        const sql = `
            UPDATE usuario 
            SET tentativas_login = tentativas_login + 1
            WHERE id_usuario = ?
        `;
        
        const [result] = await pool.execute(sql, [this.id_usuario]);
        return result.affectedRows > 0;
    }

    /**
     * Bloquear usuário
     */
    async bloquear(minutos = 30) {
        const pool = getPool();
        
        const sql = `
            UPDATE usuario 
            SET bloqueado_ate = DATE_ADD(NOW(), INTERVAL ? MINUTE)
            WHERE id_usuario = ?
        `;
        
        const [result] = await pool.execute(sql, [minutos, this.id_usuario]);
        return result.affectedRows > 0;
    }

    /**
     * Verificar se usuário está bloqueado
     */
    isBloqueado() {
        if (!this.bloqueado_ate) {
            return false;
        }
        
        const agora = new Date();
        const bloqueadoAte = new Date(this.bloqueado_ate);
        
        return agora < bloqueadoAte;
    }

    /**
     * Deletar usuário
     */
    async delete() {
        const pool = getPool();
        
        const sql = 'DELETE FROM usuario WHERE id_usuario = ?';
        const [result] = await pool.execute(sql, [this.id_usuario]);
        
        return result.affectedRows > 0;
    }

    /**
     * Buscar dados completos do usuário (com dados da tabela de referência)
     */
    async getDadosCompletos() {
        const pool = getPool();
        
        let sql = '';
        let values = [];
        
        switch (this.tipo_usuario) {
            case 'consultoria':
                sql = `
                    SELECT u.*, c.nome, c.telefone, c.status as status_consultoria
                    FROM usuario u
                    JOIN consultoria c ON c.id_consultoria = u.id_referencia
                    WHERE u.id_usuario = ?
                `;
                break;
                
            case 'empresa':
                sql = `
                    SELECT u.*, e.nome, e.cnpj, e.telefone, e.status as status_empresa,
                           c.nome as consultoria_nome
                    FROM usuario u
                    JOIN empresa e ON e.id_empresa = u.id_referencia
                    JOIN consultoria c ON c.id_consultoria = e.id_consultoria
                    WHERE u.id_usuario = ?
                `;
                break;
                
            case 'colaborador':
                sql = `
                    SELECT u.*, col.nome, col.cpf, col.cargo, col.status as status_colaborador,
                           e.nome as empresa_nome, c.nome as consultoria_nome
                    FROM usuario u
                    JOIN colaborador col ON col.id_colaborador = u.id_referencia
                    JOIN empresa e ON e.id_empresa = col.id_empresa
                    JOIN consultoria c ON c.id_consultoria = e.id_consultoria
                    WHERE u.id_usuario = ?
                `;
                break;
                
            default:
                return null;
        }
        
        values = [this.id_usuario];
        
        const [rows] = await pool.execute(sql, values);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Converter para objeto seguro (sem senha)
     */
    toSafeObject() {
        const obj = { ...this };
        delete obj.senha;
        return obj;
    }
}

module.exports = Usuario;
