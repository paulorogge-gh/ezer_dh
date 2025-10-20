const { Lider, Colaborador, Departamento } = require('../models');
const { logDatabase, logError } = require('../utils/logger');

class LiderController {
    static sanitizeString(v) { return typeof v === 'string' ? v.trim() : v; }

    // Listar líderes (opcionalmente por empresa)
    static async getAll(req, res) {
        try {
            const { empresa_id, status } = req.query;
            const filtros = {};
            if (empresa_id) filtros.id_empresa = Number(empresa_id);
            if (status && (status === 'Ativo' || status === 'Inativo')) filtros.status = status;
            const lideres = await Lider.findAll(filtros);
            logDatabase('SELECT', 'lider', { count: lideres.length, filtros });
            res.json({ success: true, data: lideres, count: lideres.length });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar líderes' });
        }
    }

    // Buscar líder por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            logDatabase('SELECT', 'lider', { id });
            res.json({ success: true, data: lider });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar líder' });
        }
    }

    // Criar líder (associar colaborador como líder da empresa)
    static async create(req, res) {
        try {
            const body = req.body || {};
            const payload = {
                id_empresa: Number(body.id_empresa),
                id_colaborador: Number(body.id_colaborador),
                status: body.status === 'Inativo' ? 'Inativo' : 'Ativo'
            };

            if (!payload.id_empresa || !payload.id_colaborador) {
                return res.status(400).json({ success: false, error: 'Empresa e Colaborador são obrigatórios' });
            }

            // Validar que colaborador pertence à empresa
            const colaborador = await Colaborador.findById(payload.id_colaborador);
            if (!colaborador) return res.status(404).json({ success: false, error: 'Colaborador não encontrado' });
            if (Number(colaborador.id_empresa) !== payload.id_empresa) {
                return res.status(400).json({ success: false, error: 'Colaborador não pertence à empresa informada' });
            }

            const liderId = await Lider.create(payload);
            const lider = await Lider.findById(liderId);
            logDatabase('INSERT', 'lider', { id: liderId });
            res.status(201).json({ success: true, data: lider, message: 'Líder criado com sucesso' });
        } catch (error) {
            logError(error, req);
            if (error.message.includes('já é um líder')) {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: 'Erro ao criar líder' });
        }
    }

    // Atualizar líder
    static async update(req, res) {
        try {
            const { id } = req.params;
            const body = req.body || {};
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });

            const merged = {
                id_empresa: body.id_empresa ? Number(body.id_empresa) : lider.id_empresa,
                id_colaborador: body.id_colaborador ? Number(body.id_colaborador) : lider.id_colaborador,
                status: body.status === 'Inativo' ? 'Inativo' : 'Ativo'
            };

            // Validar coerência empresa/colaborador
            const colaborador = await Colaborador.findById(merged.id_colaborador);
            if (!colaborador) return res.status(404).json({ success: false, error: 'Colaborador não encontrado' });
            if (Number(colaborador.id_empresa) !== merged.id_empresa) {
                return res.status(400).json({ success: false, error: 'Colaborador não pertence à empresa informada' });
            }
            await lider.update(merged);
            const atualizado = await Lider.findById(id);
            logDatabase('UPDATE', 'lider', { id });
            res.json({ success: true, data: atualizado, message: 'Líder atualizado com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao atualizar líder' });
        }
    }

    // Deletar líder
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            await lider.delete();
            logDatabase('DELETE', 'lider', { id });
            res.json({ success: true, message: 'Líder excluído com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao excluir líder' });
        }
    }

    // Listar membros (liderados)
    static async getMembros(req, res) {
        try {
            const { id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            const membros = await lider.getMembros();
            res.json({ success: true, data: membros, count: membros.length });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar liderados' });
        }
    }

    // Adicionar membro
    static async addMembro(req, res) {
        try {
            const { id } = req.params;
            const { liderado_id } = req.body;
            if (!liderado_id) return res.status(400).json({ success: false, error: 'ID do liderado é obrigatório' });
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            if (Number(lider.id_colaborador) === Number(liderado_id)) {
                return res.status(400).json({ success: false, error: 'Líder não pode ser seu próprio liderado' });
            }
            // Validar empresa do liderado
            const liderado = await Colaborador.findById(liderado_id);
            if (!liderado) return res.status(404).json({ success: false, error: 'Colaborador (liderado) não encontrado' });
            if (Number(liderado.id_empresa) !== Number(lider.id_empresa)) {
                return res.status(400).json({ success: false, error: 'Liderado não pertence à empresa do líder' });
            }
            await lider.addMembro(Number(liderado_id));
            logDatabase('INSERT', 'lider_membro', { id_lider: id, id_liderado: liderado_id });
            res.json({ success: true, message: 'Liderado adicionado com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao adicionar liderado' });
        }
    }

    // Remover membro
    static async removeMembro(req, res) {
        try {
            const { id, liderado_id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            await lider.removeMembro(Number(liderado_id));
            logDatabase('DELETE', 'lider_membro', { id_lider: id, id_liderado: liderado_id });
            res.json({ success: true, message: 'Liderado removido com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao remover liderado' });
        }
    }

    // Listar departamentos gerenciados
    static async getDepartamentos(req, res) {
        try {
            const { id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            const departamentos = await lider.getDepartamentos();
            res.json({ success: true, data: departamentos, count: departamentos.length });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao buscar departamentos do líder' });
        }
    }

    // Adicionar departamento ao líder
    static async addDepartamento(req, res) {
        try {
            const { id } = req.params;
            const { departamento_id } = req.body;
            if (!departamento_id) return res.status(400).json({ success: false, error: 'ID do departamento é obrigatório' });
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            const departamento = await Departamento.findById(departamento_id);
            if (!departamento) return res.status(404).json({ success: false, error: 'Departamento não encontrado' });
            if (Number(departamento.id_empresa) !== Number(lider.id_empresa)) {
                return res.status(400).json({ success: false, error: 'Departamento não pertence à empresa do líder' });
            }
            await lider.addDepartamento(Number(departamento_id));
            logDatabase('INSERT', 'lider_departamento', { id_lider: id, id_departamento: departamento_id });
            res.json({ success: true, message: 'Departamento adicionado ao líder com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao adicionar departamento ao líder' });
        }
    }

    // Remover departamento do líder
    static async removeDepartamento(req, res) {
        try {
            const { id, departamento_id } = req.params;
            const lider = await Lider.findById(id);
            if (!lider) return res.status(404).json({ success: false, error: 'Líder não encontrado' });
            await lider.removeDepartamento(Number(departamento_id));
            logDatabase('DELETE', 'lider_departamento', { id_lider: id, id_departamento: departamento_id });
            res.json({ success: true, message: 'Departamento removido do líder com sucesso' });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao remover departamento do líder' });
        }
    }
}

module.exports = LiderController;


