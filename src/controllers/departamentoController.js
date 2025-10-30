const { Departamento } = require('../models');
const { logDatabase, logError, logAudit } = require('../utils/logger');

class DepartamentoController {
    /**
     * Listar todos os departamentos
     */
    static async getAll(req, res) {
        try {
            const { empresa_id } = req.query;
            let departamentos;

            if (empresa_id) {
                departamentos = await Departamento.findByEmpresa(empresa_id);
            } else {
                departamentos = await Departamento.findAll();
            }
            
            logDatabase('SELECT', 'departamento', { count: departamentos.length });
            
            res.json({
                success: true,
                data: departamentos,
                count: departamentos.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar departamentos'
            });
        }
    }

    /**
     * Buscar departamento por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }
            
            logDatabase('SELECT', 'departamento', { id });
            
            res.json({
                success: true,
                data: departamento
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar departamento'
            });
        }
    }

    /**
     * Criar novo departamento
     */
    static async create(req, res) {
        try {
            const departamentoData = req.body;
            
            // Validação básica
            if (!departamentoData.nome || !departamentoData.id_empresa) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome e ID da empresa são obrigatórios'
                });
            }

            const departamentoId = await Departamento.create(departamentoData);
            const departamento = await Departamento.findById(departamentoId);
            try { logAudit(req.user?.id, 'create', 'departamento', departamentoId, { nome: departamento?.nome, id_empresa: departamento?.id_empresa }, req.ip); } catch {}
            
            logDatabase('INSERT', 'departamento', { id: departamentoId });
            
            res.status(201).json({
                success: true,
                data: departamento,
                message: 'Departamento criado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao criar departamento'
            });
        }
    }

    /**
     * Atualizar departamento
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const departamentoData = req.body;
            
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            await departamento.update(departamentoData);
            const departamentoAtualizado = await Departamento.findById(id);
            try { logAudit(req.user?.id, 'update', 'departamento', id, departamentoData, req.ip); } catch {}
            
            logDatabase('UPDATE', 'departamento', { id });
            
            res.json({
                success: true,
                data: departamentoAtualizado,
                message: 'Departamento atualizado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar departamento'
            });
        }
    }

    /**
     * Deletar departamento
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            // Verificar se há colaboradores no departamento
            const colaboradores = await departamento.getColaboradores();
            if (colaboradores.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Não é possível deletar departamento com colaboradores'
                });
            }

            await departamento.delete();
            
            logDatabase('DELETE', 'departamento', { id });
            try { logAudit(req.user?.id, 'delete', 'departamento', id, {}, req.ip); } catch {}
            
            res.json({
                success: true,
                message: 'Departamento deletado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao deletar departamento'
            });
        }
    }

    /**
     * Buscar colaboradores do departamento
     */
    static async getColaboradores(req, res) {
        try {
            const { id } = req.params;
            
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            const colaboradores = await departamento.getColaboradores();
            
            res.json({
                success: true,
                data: colaboradores,
                count: colaboradores.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar colaboradores do departamento'
            });
        }
    }

    /**
     * Adicionar colaborador ao departamento
     */
    static async addColaborador(req, res) {
        try {
            const { id } = req.params;
            const { colaborador_id } = req.body;
            
            if (!colaborador_id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do colaborador é obrigatório'
                });
            }

            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            await departamento.addColaborador(colaborador_id);
            
            logDatabase('INSERT', 'colaborador_departamento', { departamento_id: id, colaborador_id });
            try { logAudit(req.user?.id, 'add_member', 'departamento', id, { colaborador_id }, req.ip); } catch {}
            
            res.json({
                success: true,
                message: 'Colaborador adicionado ao departamento com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar colaborador ao departamento'
            });
        }
    }

    /**
     * Remover colaborador do departamento
     */
    static async removeColaborador(req, res) {
        try {
            const { id, colaborador_id } = req.params;
            
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            await departamento.removeColaborador(colaborador_id);
            
            logDatabase('DELETE', 'colaborador_departamento', { departamento_id: id, colaborador_id });
            try { logAudit(req.user?.id, 'remove_member', 'departamento', id, { colaborador_id }, req.ip); } catch {}
            
            res.json({
                success: true,
                message: 'Colaborador removido do departamento com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao remover colaborador do departamento'
            });
        }
    }

    /**
     * Estatísticas do departamento
     */
    static async getStats(req, res) {
        try {
            const { id } = req.params;
            
            const departamento = await Departamento.findById(id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            const colaboradores = await departamento.getColaboradores();
            
            res.json({
                success: true,
                data: {
                    totalColaboradores: colaboradores.length,
                    nome: departamento.nome,
                    descricao: departamento.descricao,
                    status: departamento.status
                }
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas do departamento'
            });
        }
    }
}

module.exports = DepartamentoController;
