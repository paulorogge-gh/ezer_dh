const bcrypt = require('bcryptjs');
const { Colaborador, Departamento } = require('../models');
const { logDatabase, logError } = require('../utils/logger');

class ColaboradorController {
    /**
     * Listar todos os colaboradores
     */
    static async getAll(req, res) {
        try {
            const { empresa_id, departamento_id, status } = req.query;
            let colaboradores;

            if (empresa_id) {
                colaboradores = await Colaborador.findByEmpresa(empresa_id);
            } else if (departamento_id) {
                colaboradores = await Colaborador.findByDepartamento(departamento_id);
            } else {
                colaboradores = await Colaborador.findAll();
            }

            // Filtrar por status se especificado
            if (status) {
                colaboradores = colaboradores.filter(c => c.status === status);
            }
            
            logDatabase('SELECT', 'colaborador', { count: colaboradores.length });
            
            res.json({
                success: true,
                data: colaboradores,
                count: colaboradores.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar colaboradores'
            });
        }
    }

    /**
     * Buscar colaborador por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }
            
            logDatabase('SELECT', 'colaborador', { id });
            
            res.json({
                success: true,
                data: colaborador
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar colaborador'
            });
        }
    }

    /**
     * Criar novo colaborador
     */
    static async create(req, res) {
        try {
            const colaboradorData = req.body;
            
            // Validação básica
            if (!colaboradorData.nome || !colaboradorData.cpf || !colaboradorData.id_empresa) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome, CPF e ID da empresa são obrigatórios'
                });
            }

            // Criptografar senha se fornecida
            if (colaboradorData.senha) {
                colaboradorData.senha = await bcrypt.hash(colaboradorData.senha, 12);
            }

            const colaboradorId = await Colaborador.create(colaboradorData);
            const colaborador = await Colaborador.findById(colaboradorId);
            
            logDatabase('INSERT', 'colaborador', { id: colaboradorId });
            
            res.status(201).json({
                success: true,
                data: colaborador,
                message: 'Colaborador criado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            
            if (error.message.includes('CPF já cadastrado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Erro ao criar colaborador'
            });
        }
    }

    /**
     * Atualizar colaborador
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const colaboradorData = req.body;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            // Criptografar nova senha se fornecida
            if (colaboradorData.senha) {
                colaboradorData.senha = await bcrypt.hash(colaboradorData.senha, 12);
            }

            await colaborador.update(colaboradorData);
            const colaboradorAtualizado = await Colaborador.findById(id);
            
            logDatabase('UPDATE', 'colaborador', { id });
            
            res.json({
                success: true,
                data: colaboradorAtualizado,
                message: 'Colaborador atualizado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            
            if (error.message.includes('CPF já cadastrado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar colaborador'
            });
        }
    }

    /**
     * Deletar colaborador
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            await colaborador.delete();
            
            logDatabase('DELETE', 'colaborador', { id });
            
            res.json({
                success: true,
                message: 'Colaborador deletado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao deletar colaborador'
            });
        }
    }

    /**
     * Buscar departamentos do colaborador
     */
    static async getDepartamentos(req, res) {
        try {
            const { id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const departamentos = await colaborador.getDepartamentos();
            
            res.json({
                success: true,
                data: departamentos,
                count: departamentos.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar departamentos do colaborador'
            });
        }
    }

    /**
     * Adicionar colaborador ao departamento
     */
    static async addToDepartamento(req, res) {
        try {
            const { id } = req.params;
            const { departamento_id } = req.body;
            
            if (!departamento_id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do departamento é obrigatório'
                });
            }

            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const departamento = await Departamento.findById(departamento_id);
            
            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento não encontrado'
                });
            }

            await colaborador.addToDepartamento(departamento_id);
            
            logDatabase('INSERT', 'colaborador_departamento', { colaborador_id: id, departamento_id });
            
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
    static async removeFromDepartamento(req, res) {
        try {
            const { id, departamento_id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            await colaborador.removeFromDepartamento(departamento_id);
            
            logDatabase('DELETE', 'colaborador_departamento', { colaborador_id: id, departamento_id });
            
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
     * Buscar ocorrências do colaborador
     */
    static async getOcorrencias(req, res) {
        try {
            const { id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const ocorrencias = await colaborador.getOcorrencias();
            
            res.json({
                success: true,
                data: ocorrencias,
                count: ocorrencias.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar ocorrências do colaborador'
            });
        }
    }

    /**
     * Buscar treinamentos do colaborador
     */
    static async getTreinamentos(req, res) {
        try {
            const { id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const treinamentos = await colaborador.getTreinamentos();
            
            res.json({
                success: true,
                data: treinamentos,
                count: treinamentos.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar treinamentos do colaborador'
            });
        }
    }

    /**
     * Estatísticas do colaborador
     */
    static async getStats(req, res) {
        try {
            const { id } = req.params;
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            const departamentos = await colaborador.getDepartamentos();
            const ocorrencias = await colaborador.getOcorrencias();
            const treinamentos = await colaborador.getTreinamentos();
            
            res.json({
                success: true,
                data: {
                    nome: colaborador.nome,
                    cpf: colaborador.cpf,
                    status: colaborador.status,
                    totalDepartamentos: departamentos.length,
                    totalOcorrencias: ocorrencias.length,
                    totalTreinamentos: treinamentos.length
                }
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas do colaborador'
            });
        }
    }
}

module.exports = ColaboradorController;
