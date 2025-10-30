const { getPool } = require('../config/db');
const { Usuario, Empresa, Colaborador, Consultoria } = require('../models');
const { logDatabase, logError, logAuth, logAudit } = require('../utils/logger');

class UsuarioController {
    static sanitize(v) { return typeof v === 'string' ? v.trim() : v; }

    static async getAll(req, res) {
        try {
            const { tipo_usuario, status, empresa_id: empresaIdQuery, q, limit: limitQuery, offset: offsetQuery } = req.query || {};
            const limit = Math.max(0, Math.min(Number(limitQuery || 50), 200));
            const offset = Math.max(0, Number(offsetQuery || 0));

            let empresa_id = empresaIdQuery;
            try {
                if (req.user && (req.user.role === 'empresa' || req.user.role === 'colaborador')) {
                    empresa_id = req.user.empresa_id || empresa_id;
                }
            } catch {}

            const pool = getPool();
            const whereClauses = [];
            const params = [];

            // Base SQL com JOIN opcional quando filtrando por empresa
            let sql = `SELECT u.* FROM usuario u`;
            let joinColaborador = false;

            if (empresa_id) {
                joinColaborador = true;
                sql = `
                    SELECT u.*
                    FROM usuario u
                    LEFT JOIN colaborador c ON c.id_colaborador = COALESCE(u.id_colaborador, u.id_referencia)
                `;
                whereClauses.push(`(
                    (u.tipo_usuario = 'empresa' AND u.id_empresa = ?) OR 
                    (u.tipo_usuario = 'colaborador' AND c.id_empresa = ?)
                )`);
                params.push(Number(empresa_id), Number(empresa_id));
            }

            if (tipo_usuario) {
                whereClauses.push(`u.tipo_usuario = ?`);
                params.push(tipo_usuario);
            }
            if (status) {
                whereClauses.push(`u.status = ?`);
                params.push(status);
            }
            if (q) {
                whereClauses.push(`(u.email LIKE ? OR u.nome LIKE ?)`);
                const like = `%${q}%`;
                params.push(like, like);
            }

            if (whereClauses.length > 0) {
                sql += ` WHERE ` + whereClauses.join(' AND ');
            }

            sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

            // Log detalhado de SQL e parâmetros
            logDatabase('SELECT', 'usuario', { sql, params });

            const [rows] = await pool.execute(sql, params);
            const users = rows.map(r => new Usuario(r).toSafeObject());
            logDatabase('SELECT', 'usuario', { count: users.length });
            res.json({ success: true, data: users, count: users.length, limit, offset });
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
            // Escopo: empresa/colaborador só acessam usuários da própria empresa
            try {
                if (req.user && (req.user.role === 'empresa' || req.user.role === 'colaborador')) {
                    const myEmpresaId = Number(req.user.empresa_id || 0);
                    if (user.tipo_usuario === 'empresa') {
                        if (Number(user.id_empresa) !== myEmpresaId) {
                            return res.status(403).json({ success: false, error: 'Acesso negado a usuário de outra empresa' });
                        }
                    } else if (user.tipo_usuario === 'colaborador') {
                        const colId = user.id_colaborador || user.id_referencia;
                        const col = await Colaborador.findById(colId);
                        if (!col || Number(col.id_empresa) !== myEmpresaId) {
                            return res.status(403).json({ success: false, error: 'Acesso negado a usuário de outra empresa' });
                        }
                    } else if (user.tipo_usuario === 'consultoria') {
                        return res.status(403).json({ success: false, error: 'Acesso negado a usuário de consultoria' });
                    }
                }
            } catch {}
            res.json({ success: true, data: user.toSafeObject() });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
        }
    }

    static async create(req, res) {
        try {
            const body = req.body || {};
            const email = UsuarioController.sanitize(body.email);
            const nome = UsuarioController.sanitize(body.nome);
            const senha = UsuarioController.sanitize(body.senha);
            const tipo_usuario = UsuarioController.sanitize(body.tipo_usuario);
            const status = (body.status === 'Inativo') ? 'Inativo' : 'Ativo';
            const empresa_id = body.empresa_id ? Number(body.empresa_id) : null;
            const colaborador_id = body.colaborador_id ? Number(body.colaborador_id) : null;

            const missing = [];
            if (!email) missing.push('E-mail');
            if (!senha || String(senha).length < 6) missing.push('Senha');
            if (!tipo_usuario) missing.push('Tipo de Usuário');
            if (missing.length) return res.status(400).json({ success: false, error: `Campos obrigatórios: ${missing.join(', ')}` });
            if (!['consultoria','empresa','colaborador'].includes(tipo_usuario)) {
                return res.status(400).json({ success: false, error: 'Tipo de usuário inválido' });
            }

            let id_referencia = null;
            let id_empresa_to_save = null;
            let id_colaborador_to_save = null;
            if (tipo_usuario === 'consultoria') {
                if (req.user && req.user.role === 'consultoria' && req.user.consultoria_id) {
                    id_referencia = Number(req.user.consultoria_id);
                } else {
                    return res.status(400).json({ success: false, error: 'Consultoria não identificada para criação de usuário' });
                }
            } else if (tipo_usuario === 'empresa') {
                if (!empresa_id) return res.status(400).json({ success: false, error: 'Empresa é obrigatória para usuário do tipo empresa' });
                const e = await Empresa.findById(empresa_id);
                if (!e) return res.status(400).json({ success: false, error: 'Empresa inválida' });
                if (req.user && req.user.role === 'empresa' && Number(req.user.empresa_id) !== Number(empresa_id)) {
                    return res.status(403).json({ success: false, error: 'Sem permissão para criar usuário de outra empresa' });
                }
                id_referencia = Number(empresa_id);
                id_empresa_to_save = Number(empresa_id);
            } else if (tipo_usuario === 'colaborador') {
                if (!empresa_id) return res.status(400).json({ success: false, error: 'Empresa é obrigatória para usuário do tipo colaborador' });
                if (!colaborador_id) return res.status(400).json({ success: false, error: 'Colaborador é obrigatório para usuário do tipo colaborador' });
                const col = await Colaborador.findById(colaborador_id);
                if (!col) return res.status(400).json({ success: false, error: 'Colaborador inválido' });
                if (Number(col.id_empresa) !== Number(empresa_id)) {
                    return res.status(400).json({ success: false, error: 'Colaborador não pertence à empresa selecionada' });
                }
                if (req.user && req.user.role === 'empresa' && Number(req.user.empresa_id) !== Number(empresa_id)) {
                    return res.status(403).json({ success: false, error: 'Sem permissão para criar usuário de outra empresa' });
                }
                id_referencia = Number(colaborador_id); // legado para compatibilidade
                id_empresa_to_save = Number(empresa_id);
                id_colaborador_to_save = Number(colaborador_id);
            }

            const payload = { email, nome, senha, tipo_usuario, id_referencia, id_empresa: id_empresa_to_save, id_colaborador: id_colaborador_to_save, status };
            const id = await Usuario.create(payload);
            logDatabase('INSERT', 'usuario', { id });
            const created = await Usuario.findById(id);
            try { logAudit('create_usuario', req.user?.id, { id, email, tipo_usuario, id_empresa: id_empresa_to_save, id_colaborador: id_colaborador_to_save }, req.ip); } catch {}
            res.status(201).json({ success: true, data: created ? created.toSafeObject() : { id_usuario: id }, message: 'Usuário criado com sucesso' });
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
            if (req.user.role === 'colaborador' && Number(req.user.id) !== Number(id)) {
                return res.status(403).json({ success: false, error: 'Sem permissão' });
            }
            const updateData = {};
            if (body.nome) updateData.nome = UsuarioController.sanitize(body.nome);
            if (body.email) updateData.email = UsuarioController.sanitize(body.email);
            if (body.senha) updateData.senha = UsuarioController.sanitize(body.senha);
            if (body.status) updateData.status = (body.status === 'Inativo') ? 'Inativo' : 'Ativo';
            if (req.user.role === 'colaborador') delete updateData.status;
            // Atualizar vínculo de colaborador quando tipo for colaborador
            if (usuario.tipo_usuario === 'colaborador') {
                const empresa_id = body.empresa_id ? Number(body.empresa_id) : usuario.id_empresa || null;
                const colaborador_id = body.colaborador_id ? Number(body.colaborador_id) : (usuario.id_colaborador || usuario.id_referencia || null);
                if (!empresa_id || !colaborador_id) {
                    return res.status(400).json({ success: false, error: 'Empresa e Colaborador são obrigatórios para usuário colaborador' });
                }
                const col = await Colaborador.findById(colaborador_id);
                if (!col || Number(col.id_empresa) !== Number(empresa_id)) {
                    return res.status(400).json({ success: false, error: 'Colaborador não pertence à empresa informada' });
                }
                if (req.user && req.user.role === 'empresa' && Number(req.user.empresa_id) !== Number(empresa_id)) {
                    return res.status(403).json({ success: false, error: 'Sem permissão para atualizar para outra empresa' });
                }
                updateData.id_empresa = empresa_id;
                updateData.id_colaborador = colaborador_id;
                updateData.id_referencia = colaborador_id; // compatibilidade
            }
            const ok = await usuario.update(updateData);
            logDatabase('UPDATE', 'usuario', { id });
            const updated = await Usuario.findById(id);
            try {
                const auditDetails = { id };
                const { senha, ...rest } = body || {};
                auditDetails.changes = rest;
                logAudit('update_usuario', req.user?.id, auditDetails, req.ip);
            } catch {}
            res.json({ success: true, data: updated ? updated.toSafeObject() : { id_usuario: Number(id) }, message: 'Usuário atualizado com sucesso' });
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
            try { logAudit('update_usuario_status', req.user?.id, { id, status }, req.ip); } catch {}
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
            try { logAudit('reset_password', req.user?.id, { id }, req.ip); } catch {}
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
            try { logAudit('delete_usuario', req.user?.id, { id }, req.ip); } catch {}
            res.json({ success: true, message: 'Usuário excluído com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao excluir usuário' });
        }
    }
}

module.exports = UsuarioController;



