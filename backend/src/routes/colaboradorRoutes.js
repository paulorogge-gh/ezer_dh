const express = require('express');
const router = express.Router();
const ColaboradorController = require('../controllers/colaboradorController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireColaboradorOrAbove, checkResourceOwnership } = require('../middlewares/rbacMiddleware');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route   GET /api/colaboradores
 * @desc    Listar todos os colaboradores
 * @access  Private (Empresa/Consultoria)
 */
router.get('/', 
    requireColaboradorOrAbove,
    ColaboradorController.getAll
);

/**
 * @route   GET /api/colaboradores/:id
 * @desc    Buscar colaborador por ID
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.get('/:id',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.getById
);

/**
 * @route   POST /api/colaboradores
 * @desc    Criar novo colaborador
 * @access  Private (Empresa/Consultoria)
 */
router.post('/',
    checkPermission('colaboradores', 'create'),
    ColaboradorController.create
);

/**
 * @route   PUT /api/colaboradores/:id
 * @desc    Atualizar colaborador
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.put('/:id',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.update
);

/**
 * @route   DELETE /api/colaboradores/:id
 * @desc    Deletar colaborador
 * @access  Private (Empresa/Consultoria)
 */
router.delete('/:id',
    checkPermission('colaboradores', 'delete'),
    ColaboradorController.delete
);

/**
 * @route   GET /api/colaboradores/:id/departamentos
 * @desc    Buscar departamentos do colaborador
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.get('/:id/departamentos',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.getDepartamentos
);

/**
 * @route   POST /api/colaboradores/:id/departamentos
 * @desc    Adicionar colaborador ao departamento
 * @access  Private (Empresa/Consultoria)
 */
router.post('/:id/departamentos',
    checkPermission('colaboradores', 'update'),
    ColaboradorController.addToDepartamento
);

/**
 * @route   DELETE /api/colaboradores/:id/departamentos/:departamento_id
 * @desc    Remover colaborador do departamento
 * @access  Private (Empresa/Consultoria)
 */
router.delete('/:id/departamentos/:departamento_id',
    checkPermission('colaboradores', 'update'),
    ColaboradorController.removeFromDepartamento
);

/**
 * @route   GET /api/colaboradores/:id/ocorrencias
 * @desc    Buscar ocorrências do colaborador
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.get('/:id/ocorrencias',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.getOcorrencias
);

/**
 * @route   GET /api/colaboradores/:id/treinamentos
 * @desc    Buscar treinamentos do colaborador
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.get('/:id/treinamentos',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.getTreinamentos
);

/**
 * @route   GET /api/colaboradores/:id/stats
 * @desc    Estatísticas do colaborador
 * @access  Private (Colaborador/Empresa/Consultoria)
 */
router.get('/:id/stats',
    requireColaboradorOrAbove,
    checkResourceOwnership('colaborador'),
    ColaboradorController.getStats
);

module.exports = router;
