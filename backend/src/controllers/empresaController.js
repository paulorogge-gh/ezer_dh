const { Empresa } = require('../models');
const { logDatabase, logError } = require('../utils/logger');

class EmpresaController {
    /**
     * Listar todas as empresas
     */
    static async getAll(req, res) {
        try {
            const empresas = await Empresa.findAll();
            
            logDatabase('SELECT', 'empresa', { count: empresas.length });
            
            res.json({
                success: true,
                data: empresas,
                count: empresas.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar empresas'
            });
        }
    }

    /**
     * Buscar empresa por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }
            
            logDatabase('SELECT', 'empresa', { id });
            
            res.json({
                success: true,
                data: empresa
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar empresa'
            });
        }
    }

    /**
     * Criar nova empresa
     */
    static async create(req, res) {
        try {
            const empresaData = req.body;
            
            // Validação básica
            if (!empresaData.nome || !empresaData.cnpj) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome e CNPJ são obrigatórios'
                });
            }

            const empresaId = await Empresa.create(empresaData);
            const empresa = await Empresa.findById(empresaId);
            
            logDatabase('INSERT', 'empresa', { id: empresaId });
            
            res.status(201).json({
                success: true,
                data: empresa,
                message: 'Empresa criada com sucesso'
            });
        } catch (error) {
            logError(error, req);
            
            if (error.message.includes('CNPJ já cadastrado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Erro ao criar empresa'
            });
        }
    }

    /**
     * Atualizar empresa
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const empresaData = req.body;
            
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }

            await empresa.update(empresaData);
            const empresaAtualizada = await Empresa.findById(id);
            
            logDatabase('UPDATE', 'empresa', { id });
            
            res.json({
                success: true,
                data: empresaAtualizada,
                message: 'Empresa atualizada com sucesso'
            });
        } catch (error) {
            logError(error, req);
            
            if (error.message.includes('CNPJ já cadastrado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar empresa'
            });
        }
    }

    /**
     * Deletar empresa
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }

            await empresa.delete();
            
            logDatabase('DELETE', 'empresa', { id });
            
            res.json({
                success: true,
                message: 'Empresa deletada com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao deletar empresa'
            });
        }
    }

    /**
     * Buscar colaboradores da empresa
     */
    static async getColaboradores(req, res) {
        try {
            const { id } = req.params;
            
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }

            const colaboradores = await empresa.getColaboradores();
            
            res.json({
                success: true,
                data: colaboradores,
                count: colaboradores.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar colaboradores da empresa'
            });
        }
    }

    /**
     * Buscar departamentos da empresa
     */
    static async getDepartamentos(req, res) {
        try {
            const { id } = req.params;
            
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }

            const departamentos = await empresa.getDepartamentos();
            
            res.json({
                success: true,
                data: departamentos,
                count: departamentos.length
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar departamentos da empresa'
            });
        }
    }

    /**
     * Estatísticas da empresa
     */
    static async getStats(req, res) {
        try {
            const { id } = req.params;
            
            const empresa = await Empresa.findById(id);
            
            if (!empresa) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada'
                });
            }

            const totalColaboradores = await empresa.countColaboradores();
            const departamentos = await empresa.getDepartamentos();
            
            res.json({
                success: true,
                data: {
                    totalColaboradores,
                    totalDepartamentos: departamentos.length,
                    nome: empresa.nome,
                    cnpj: empresa.cnpj,
                    status: empresa.status
                }
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas da empresa'
            });
        }
    }
}

module.exports = EmpresaController;
