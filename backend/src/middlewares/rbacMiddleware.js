const { logAuth, logError } = require('../utils/logger');

/**
 * Definição de permissões por role
 */
const PERMISSIONS = {
    consultoria: {
        // Acesso total
        empresas: ['create', 'read', 'update', 'delete'],
        colaboradores: ['create', 'read', 'update', 'delete'],
        departamentos: ['create', 'read', 'update', 'delete'],
        ocorrencias: ['create', 'read', 'update', 'delete'],
        treinamentos: ['create', 'read', 'update', 'delete'],
        feedbacks: ['create', 'read', 'update', 'delete'],
        avaliacoes: ['create', 'read', 'update', 'delete'],
        pdi: ['create', 'read', 'update', 'delete'],
        consultoria: ['read', 'update']
    },
    empresa: {
        // Acesso limitado à própria empresa
        empresas: ['read'], // Apenas a própria empresa
        colaboradores: ['create', 'read', 'update', 'delete'],
        departamentos: ['create', 'read', 'update', 'delete'],
        ocorrencias: ['create', 'read', 'update', 'delete'],
        treinamentos: ['create', 'read', 'update', 'delete'],
        feedbacks: ['create', 'read', 'update', 'delete'],
        avaliacoes: ['create', 'read', 'update', 'delete'],
        pdi: ['create', 'read', 'update', 'delete']
    },
    colaborador: {
        // Acesso limitado aos próprios dados e de colegas
        colaboradores: ['read'], // Apenas próprios dados
        departamentos: ['read'],
        ocorrencias: ['read'], // Apenas próprias ocorrências
        treinamentos: ['read'], // Apenas próprios treinamentos
        feedbacks: ['create', 'read'], // Pode dar e receber feedbacks
        avaliacoes: ['read'], // Apenas próprias avaliações
        pdi: ['read', 'update'] // Pode atualizar próprio PDI
    }
};

/**
 * Middleware para verificar permissões baseadas em role
 */
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não autenticado'
                });
            }

            const userRole = req.user.role;
            const userPermissions = PERMISSIONS[userRole];

            if (!userPermissions) {
                logAuth('invalid_role', req.user.id, req.ip);
                return res.status(403).json({
                    success: false,
                    error: 'Role de usuário inválida'
                });
            }

            const resourcePermissions = userPermissions[resource];
            
            if (!resourcePermissions) {
                logAuth('resource_not_allowed', req.user.id, req.ip, { resource });
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado a este recurso'
                });
            }

            if (!resourcePermissions.includes(action)) {
                logAuth('action_not_allowed', req.user.id, req.ip, { resource, action });
                return res.status(403).json({
                    success: false,
                    error: 'Ação não permitida para este usuário'
                });
            }

            // Verificar acesso a dados específicos da empresa
            if (userRole === 'empresa' || userRole === 'colaborador') {
                const hasAccess = await checkDataAccess(req, resource);
                if (!hasAccess) {
                    logAuth('data_access_denied', req.user.id, req.ip, { resource });
                    return res.status(403).json({
                        success: false,
                        error: 'Acesso negado aos dados solicitados'
                    });
                }
            }

            next();

        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao verificar permissões'
            });
        }
    };
};

/**
 * Verificar acesso a dados específicos
 */
const checkDataAccess = async (req, resource) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        const empresaId = req.user.empresa_id;

        // Consultoria tem acesso total
        if (userRole === 'consultoria') {
            return true;
        }

        // Empresa só acessa dados da própria empresa
        if (userRole === 'empresa') {
            return await checkEmpresaAccess(req, empresaId);
        }

        // Colaborador só acessa próprios dados e de colegas da mesma empresa
        if (userRole === 'colaborador') {
            return await checkColaboradorAccess(req, userId, empresaId);
        }

        return false;

    } catch (error) {
        console.error('Error checking data access:', error);
        return false;
    }
};

/**
 * Verificar acesso de empresa
 */
const checkEmpresaAccess = async (req, empresaId) => {
    try {
        // Verifica se o recurso acessado pertence à mesma empresa do usuário (role empresa)
        const resourceId = req.params.id;
        if (!empresaId) return false;
        if (!resourceId) return true; // em listagens gerais sem id, permitir

        // Descobrir recurso pela rota base
        const basePath = (req.baseUrl || '').toLowerCase();
        // Se estiver operando sobre colaboradores
        if (basePath.includes('/colaboradores')) {
            const { Colaborador } = require('../models');
            const col = await Colaborador.findById(resourceId);
            return !!(col && col.id_empresa == empresaId);
        }
        // Se estiver operando sobre departamentos
        if (basePath.includes('/departamentos')) {
            const { Departamento } = require('../models');
            const dep = await Departamento.findById(resourceId);
            return !!(dep && dep.id_empresa == empresaId);
        }
        // Se estiver operando sobre empresas
        if (basePath.includes('/empresas')) {
            return resourceId == empresaId; // empresa só acessa sua própria
        }
        return true;
    } catch (error) {
        console.error('Error in checkEmpresaAccess:', error);
        return false;
    }
};

/**
 * Verificar acesso de colaborador
 */
const checkColaboradorAccess = async (req, userId, empresaId) => {
    const resourceId = req.params.id;
    const method = req.method;

    // Para operações de leitura, verificar se é próprio dado ou de colega
    if (method === 'GET') {
        if (resourceId && resourceId == userId) {
            return true; // Próprios dados
        }
        // Verificar se é colega da mesma empresa
        return await checkSameEmpresa(resourceId, empresaId);
    }

    // Para operações de escrita, apenas próprios dados
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        return resourceId ? resourceId == userId : true;
    }

    return false;
};

/**
 * Verificar se colaborador pertence à mesma empresa
 */
const checkSameEmpresa = async (colaboradorId, empresaId) => {
    try {
        const { Colaborador } = require('../models');
        const colaborador = await Colaborador.findById(colaboradorId);
        
        return colaborador && colaborador.id_empresa == empresaId;
    } catch (error) {
        console.error('Error checking same empresa:', error);
        return false;
    }
};

/**
 * Middleware para verificar se é consultoria
 */
const requireConsultoria = (req, res, next) => {
    if (!req.user || req.user.role !== 'consultoria') {
        logAuth('consultoria_required', req.user?.id, req.ip);
        return res.status(403).json({
            success: false,
            error: 'Acesso restrito à consultoria'
        });
    }
    next();
};

/**
 * Middleware para verificar se é empresa ou consultoria
 */
const requireEmpresaOrConsultoria = (req, res, next) => {
    if (!req.user || !['empresa', 'consultoria'].includes(req.user.role)) {
        logAuth('empresa_consultoria_required', req.user?.id, req.ip);
        return res.status(403).json({
            success: false,
            error: 'Acesso restrito à empresa ou consultoria'
        });
    }
    next();
};

/**
 * Middleware para verificar se é colaborador ou superior
 */
const requireColaboradorOrAbove = (req, res, next) => {
    if (!req.user || !['colaborador', 'empresa', 'consultoria'].includes(req.user.role)) {
        logAuth('colaborador_required', req.user?.id, req.ip);
        return res.status(403).json({
            success: false,
            error: 'Acesso restrito a colaboradores'
        });
    }
    next();
};

/**
 * Middleware para verificar propriedade do recurso
 */
const checkResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user.id;
            const userRole = req.user.role;

            if (!resourceId) {
                return next();
            }

            // Consultoria tem acesso a tudo
            if (userRole === 'consultoria') {
                return next();
            }

            // Verificar propriedade baseada no tipo de recurso
            const isOwner = await checkOwnership(resourceType, resourceId, userId, userRole);
            
            if (!isOwner) {
                logAuth('ownership_denied', userId, req.ip, { resourceType, resourceId });
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado: recurso não pertence ao usuário'
                });
            }

            next();

        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro ao verificar propriedade do recurso'
            });
        }
    };
};

/**
 * Verificar propriedade do recurso
 */
const checkOwnership = async (resourceType, resourceId, userId, userRole) => {
    try {
        switch (resourceType) {
            case 'colaborador':
                return resourceId == userId || userRole === 'empresa';
            case 'ocorrencia':
                // Verificar se a ocorrência pertence ao colaborador
                return await checkOcorrenciaOwnership(resourceId, userId);
            case 'feedback':
                // Verificar se o feedback foi dado pelo usuário
                return await checkFeedbackOwnership(resourceId, userId);
            default:
                return true;
        }
    } catch (error) {
        console.error('Error checking ownership:', error);
        return false;
    }
};

/**
 * Verificar propriedade de ocorrência
 */
const checkOcorrenciaOwnership = async (ocorrenciaId, userId) => {
    try {
        const { Ocorrencia } = require('../models');
        const ocorrencia = await Ocorrencia.findById(ocorrenciaId);
        return ocorrencia && ocorrencia.id_colaborador == userId;
    } catch (error) {
        return false;
    }
};

/**
 * Verificar propriedade de feedback
 */
const checkFeedbackOwnership = async (feedbackId, userId) => {
    try {
        const { Feedback } = require('../models');
        const feedback = await Feedback.findById(feedbackId);
        return feedback && feedback.id_avaliador == userId;
    } catch (error) {
        return false;
    }
};

module.exports = {
    checkPermission,
    requireConsultoria,
    requireEmpresaOrConsultoria,
    requireColaboradorOrAbove,
    checkResourceOwnership,
    PERMISSIONS
};
