const bcrypt = require('bcryptjs');
const { Colaborador, Departamento } = require('../models');
const { logDatabase, logError } = require('../utils/logger');

class ColaboradorController {
    static normalizeDate(value) {
        if (!value) return null;
        try {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                const [d, m, y] = value.split('/');
                return `${y}-${m}-${d}`;
            }
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
            return null;
        } catch { return null; }
    }

    static sanitizeString(v) { return typeof v === 'string' ? v.trim() : v; }

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
            const body = req.body || {};
            const departamentos = Array.isArray(body.departamentos) ? body.departamentos : [];
            const payload = {
                id_empresa: body.id_empresa,
                cpf: ColaboradorController.sanitizeString(body.cpf),
                nome: ColaboradorController.sanitizeString(body.nome),
                data_nascimento: ColaboradorController.normalizeDate(body.data_nascimento),
                email_pessoal: ColaboradorController.sanitizeString(body.email_pessoal) || null,
                email_corporativo: ColaboradorController.sanitizeString(body.email_corporativo) || null,
                telefone: ColaboradorController.sanitizeString(body.telefone) || null,
                cargo: ColaboradorController.sanitizeString(body.cargo) || null,
                remuneracao: body.remuneracao ?? null,
                data_admissao: ColaboradorController.normalizeDate(body.data_admissao),
                tipo_contrato: ColaboradorController.sanitizeString(body.tipo_contrato) || null,
                status: body.status || 'Ativo'
            };

            // RF024 - Validações obrigatórias de cadastro
            const missing = [];
            if (!payload.id_empresa) missing.push('Empresa');
            if (!payload.cpf) missing.push('CPF');
            if (!payload.nome) missing.push('Nome');
            if (!payload.data_nascimento) missing.push('Data de Nascimento');
            if (!payload.email_corporativo && !payload.email_pessoal) missing.push('E-mail');
            if (!payload.telefone) missing.push('Telefone');
            if (!Array.isArray(departamentos) || departamentos.length === 0) missing.push('Departamento(s)');
            if (!payload.cargo) missing.push('Cargo');
            if (payload.remuneracao === null || payload.remuneracao === '') missing.push('Remuneração');
            if (!payload.data_admissao) missing.push('Data de Admissão');
            if (!payload.tipo_contrato) missing.push('Tipo de Contrato');
            if (missing.length) {
                return res.status(400).json({ success: false, error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
            }

            // Criptografar senha se fornecida
            if (body.senha) {
                payload.senha = await bcrypt.hash(body.senha, 12);
            }

            const colaboradorId = await Colaborador.create(payload);
            const colaborador = await Colaborador.findById(colaboradorId);
            // Associar departamentos
            try {
                for (const depId of departamentos) {
                    await colaborador.addDepartamento(depId);
                }
            } catch (e) {
                logError(e, req);
            }
            
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
            const body = req.body || {};
            
            const colaborador = await Colaborador.findById(id);
            
            if (!colaborador) {
                return res.status(404).json({
                    success: false,
                    error: 'Colaborador não encontrado'
                });
            }

            // Criptografar nova senha se fornecida
            if (body.senha) {
                body.senha = await bcrypt.hash(body.senha, 12);
            }

            // Aceitar atualização parcial (ex: apenas status) e normalizar datas/strings
            const merged = {
                id_empresa: body.id_empresa ?? colaborador.id_empresa,
                nome: ColaboradorController.sanitizeString(body.nome) ?? colaborador.nome,
                cpf: ColaboradorController.sanitizeString(body.cpf) ?? colaborador.cpf,
                data_nascimento: body.hasOwnProperty('data_nascimento') ? ColaboradorController.normalizeDate(body.data_nascimento) : colaborador.data_nascimento,
                email_pessoal: body.hasOwnProperty('email_pessoal') ? (ColaboradorController.sanitizeString(body.email_pessoal) || null) : colaborador.email_pessoal,
                email_corporativo: body.hasOwnProperty('email_corporativo') ? (ColaboradorController.sanitizeString(body.email_corporativo) || null) : colaborador.email_corporativo,
                telefone: body.hasOwnProperty('telefone') ? (ColaboradorController.sanitizeString(body.telefone) || null) : colaborador.telefone,
                cargo: body.hasOwnProperty('cargo') ? (ColaboradorController.sanitizeString(body.cargo) || null) : colaborador.cargo,
                remuneracao: body.hasOwnProperty('remuneracao') ? (body.remuneracao ?? null) : colaborador.remuneracao,
                data_admissao: body.hasOwnProperty('data_admissao') ? ColaboradorController.normalizeDate(body.data_admissao) : colaborador.data_admissao,
                tipo_contrato: body.hasOwnProperty('tipo_contrato') ? (ColaboradorController.sanitizeString(body.tipo_contrato) || null) : colaborador.tipo_contrato,
                status: body.status ?? colaborador.status
            };

            await colaborador.update(merged);
            const colaboradorAtualizado = await Colaborador.findById(id);
            
            // Sincronizar departamentos se enviados
            if (Array.isArray(body.departamentos)) {
                try {
                    const atuais = await colaborador.getDepartamentos();
                    const atuaisIds = (atuais || []).map(d => d.id_departamento);
                    const novos = body.departamentos.map(Number).filter(Boolean);
                    const toAdd = novos.filter(x => !atuaisIds.includes(x));
                    const toRemove = atuaisIds.filter(x => !novos.includes(x));
                    for (const depId of toRemove) { await colaborador.removeDepartamento(depId); }
                    for (const depId of toAdd) { await colaborador.addDepartamento(depId); }
                } catch (e) { logError(e, req); }
            }

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

            await colaborador.addDepartamento(departamento_id);
            
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

            await colaborador.removeDepartamento(departamento_id);
            
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

    /**
     * Estatísticas globais (total/ativos/inativos)
     */
    static async getGlobalStats(req, res) {
        try {
            const colaboradores = await Colaborador.findAll();
            const total = colaboradores.length;
            const ativos = colaboradores.filter(c => c.status === 'Ativo').length;
            const inativos = colaboradores.filter(c => c.status === 'Inativo').length;
            res.json({ success: true, data: { total, ativos, inativos } });
        } catch (error) {
            logError(error, req);
            res.status(500).json({ success: false, error: 'Erro ao obter estatísticas de colaboradores' });
        }
    }
}

module.exports = ColaboradorController;
