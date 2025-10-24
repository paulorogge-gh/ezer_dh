const { getPool } = require('../config/db');
const { Usuario, Empresa, Colaborador, Consultoria } = require('../models');
const { logDatabase, logError, logAuth } = require('../utils/logger');

class UsuarioController {
    static sanitize(v) { return typeof v === 'string' ? v.trim() : v; }

    static async getAll(req, res) {
        try {
            const { tipo_usuario, status, empresa_id: empresaIdQuery } = req.query || {};
            let empresa_id = empresaIdQuery;
            try {
                if (req.user && (req.user.role === 'empresa' || req.user.role === 'colaborador')) {
                    empresa_id = req.user.empresa_id || empresa_id;
                }
            } catch {}
            const pool = getPool();
            const params = [];
            let sql = `SELECT u.* FROM usuario u`;
            // Filtro por empresa: inclui usuários tipo 'empresa' com id_empresa=empresa_id e tipo 'colaborador' cujo colaborador pertence à empresa
            if (empresa_id) {
                sql = `
                    SELECT u.*
                    FROM usuario u
                    WHERE (u.tipo_usuario = 'empresa' AND u.id_empresa = ?) OR (
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
            // Escopo: empresa/colaborador só acessam usuários da própria empresa
            try {
                if (req.user && (req.user.role === 'empresa' || req.user.role === 'colaborador')) {
                    const myEmpresaId = Number(req.user.empresa_id || 0);
                    if (user.tipo_usuario === 'empresa') {
                        if (Number(user.id_empresa) !== myEmpresaId) {
                            return res.status(403).json({ success: false, error: 'Acesso negado a usuário de outra empresa' });
                        }
                    } else if (user.tipo_usuario === 'colaborador') {
                        const col = await Colaborador.findById(user.id_referencia);
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
                id_referencia = Number(colaborador_id);
                id_empresa_to_save = Number(empresa_id);
            }

            const payload = { email, nome, senha, tipo_usuario, id_referencia, id_empresa: id_empresa_to_save, status };
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
            if (body.nome) updateData.nome = UsuarioController.sanitize(body.nome);
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



