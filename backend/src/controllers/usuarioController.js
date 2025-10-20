const { getPool } = require('../config/db');
const { Usuario, Empresa, Colaborador, Consultoria } = require('../models');
const { logDatabase, logError, logAuth } = require('../utils/logger');

class UsuarioController {
    static sanitize(v) { return typeof v === 'string' ? v.trim() : v; }

    static async getAll(req, res) {
        try {
            const { tipo_usuario, status, empresa_id } = req.query || {};
            const pool = getPool();
            const params = [];
            let sql = `SELECT u.* FROM usuario u`;
            // Filtro por empresa: inclui usuários tipo 'empresa' com id_referencia=empresa_id e tipo 'colaborador' cujo colaborador pertence à empresa
            if (empresa_id) {
                sql = `
                    SELECT u.*
                    FROM usuario u
                    WHERE (u.tipo_usuario = 'empresa' AND u.id_referencia = ?) OR (
                        u.tipo_usuario = 'colaborador' AND u.id_referencia IN (
                            SELECT c.id_colaborador FROM colaborador c WHERE c.id_empresa = ?
                        )
                    )
                `;
                params.push(Number(empresa_id), Number(empresa_id));
                if (tipo_usuario) {
                    sql = `SELECT * FROM (${sql}) as x WHERE x.tipo_usuario = ?`;
                    params.push(tipo_usuario);
                }
                if (status) {
                    sql += ` AND status = ?`;
                    params.push(status);
                }
                sql += ` ORDER BY created_at DESC`;
            } else {
                const where = [];
                if (tipo_usuario) { where.push('u.tipo_usuario = ?'); params.push(tipo_usuario); }
                if (status) { where.push('u.status = ?'); params.push(status); }
                if (where.length) sql += ' WHERE ' + where.join(' AND ');
                sql += ' ORDER BY u.created_at DESC';
            }
            const [rows] = await pool.execute(sql, params);
            const users = rows.map(r => new Usuario(r).toSafeObject());
            logDatabase('SELECT', 'usuario', { count: users.length });
            res.json({ success: true, data: users, count: users.length });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await Usuario.findById(id);
            if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            // Se colaborador, ocultar hash
            res.json({ success: true, data: user.toSafeObject() });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
        }
    }

    static async create(req, res) {
        try {
            const body = req.body || {};
            const payload = {
                email: UsuarioController.sanitize(body.email),
                senha: UsuarioController.sanitize(body.senha),
                tipo_usuario: UsuarioController.sanitize(body.tipo_usuario),
                id_referencia: Number(body.id_referencia),
                status: (body.status === 'Inativo') ? 'Inativo' : 'Ativo'
            };
            const missing = [];
            if (!payload.email) missing.push('E-mail');
            if (!payload.senha) missing.push('Senha');
            if (!payload.tipo_usuario) missing.push('Tipo de Usuário');
            if (!payload.id_referencia) missing.push('Referência');
            if (missing.length) return res.status(400).json({ success: false, error: `Campos obrigatórios: ${missing.join(', ')}` });
            if (!['consultoria','empresa','colaborador'].includes(payload.tipo_usuario)) {
                return res.status(400).json({ success: false, error: 'Tipo de usuário inválido' });
            }
            // Validar referência existente e escopo do solicitante
            if (payload.tipo_usuario === 'consultoria') {
                const c = await Consultoria.findById ? Consultoria.findById(payload.id_referencia) : null;
                if (!c) return res.status(400).json({ success: false, error: 'Consultoria de referência inválida' });
            } else if (payload.tipo_usuario === 'empresa') {
                const e = await Empresa.findById(payload.id_referencia);
                if (!e) return res.status(400).json({ success: false, error: 'Empresa de referência inválida' });
                if (req.user.role === 'empresa' && Number(req.user.empresa_id) !== Number(e.id_empresa)) {
                    return res.status(403).json({ success: false, error: 'Sem permissão para criar usuário de outra empresa' });
                }
            } else if (payload.tipo_usuario === 'colaborador') {
                const col = await Colaborador.findById(payload.id_referencia);
                if (!col) return res.status(400).json({ success: false, error: 'Colaborador de referência inválido' });
                if (req.user.role === 'empresa' && Number(req.user.empresa_id) !== Number(col.id_empresa)) {
                    return res.status(403).json({ success: false, error: 'Sem permissão para criar usuário de outra empresa' });
                }
            }
            const id = await Usuario.create(payload);
            logDatabase('INSERT', 'usuario', { id });
            res.status(201).json({ success: true, data: { id_usuario: id }, message: 'Usuário criado com sucesso' });
        } catch (error) {
            logError(error, req);
            if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('duplicate'))) {
                return res.status(400).json({ success: false, error: 'E-mail já cadastrado' });
            }
            res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const body = req.body || {};
            const usuario = await Usuario.findById(id);
            if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            // Controle: colaborador só pode atualizar campos próprios e permitidos
            if (req.user.role === 'colaborador' && Number(req.user.id) !== Number(id)) {
                return res.status(403).json({ success: false, error: 'Sem permissão' });
            }
            const updateData = {};
            if (body.email) updateData.email = UsuarioController.sanitize(body.email);
            if (body.senha) updateData.senha = UsuarioController.sanitize(body.senha);
            if (body.status) updateData.status = (body.status === 'Inativo') ? 'Inativo' : 'Ativo';
            // Colaborador não pode alterar status
            if (req.user.role === 'colaborador') delete updateData.status;
            const ok = await usuario.update(updateData);
            logDatabase('UPDATE', 'usuario', { id });
            res.json({ success: true, data: { id_usuario: Number(id) }, message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao atualizar usuário' });
        }
    }

    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body || {};
            if (!['Ativo','Inativo'].includes(status)) return res.status(400).json({ success: false, error: 'Status inválido' });
            const usuario = await Usuario.findById(id);
            if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            await usuario.update({ status });
            logDatabase('UPDATE', 'usuario', { id, status });
            res.json({ success: true, message: 'Status atualizado com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao atualizar status do usuário' });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { id } = req.params;
            const { nova_senha } = req.body || {};
            if (!nova_senha || nova_senha.length < 6) return res.status(400).json({ success: false, error: 'Nova senha inválida' });
            const usuario = await Usuario.findById(id);
            if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            await usuario.update({ senha: nova_senha, tentativas_login: 0, bloqueado_ate: null });
            logAuth('password_reset', Number(id), req.ip);
            res.json({ success: true, message: 'Senha redefinida com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao redefinir senha' });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const usuario = await Usuario.findById(id);
            if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            await usuario.delete();
            logDatabase('DELETE', 'usuario', { id });
            res.json({ success: true, message: 'Usuário excluído com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao excluir usuário' });
        }
    }
}

module.exports = UsuarioController;



