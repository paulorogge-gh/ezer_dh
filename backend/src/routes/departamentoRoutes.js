const express = require('express');
const router = express.Router();
const DepartamentoController = require('../controllers/departamentoController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route   GET /api/departamentos
 * @desc    Listar todos os departamentos
 * @access  Private (Empresa/Consultoria)
 */
router.get('/', 
    requireEmpresaOrConsultoria,
    DepartamentoController.getAll
);

/**
 * @route   GET /api/departamentos/:id
 * @desc    Buscar departamento por ID
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id',
    requireEmpresaOrConsultoria,
    DepartamentoController.getById
);

/**
 * @route   POST /api/departamentos
 * @desc    Criar novo departamento
 * @access  Private (Empresa/Consultoria)
 */
router.post('/',
    checkPermission('departamentos', 'create'),
    DepartamentoController.create
);

/**
 * @route   PUT /api/departamentos/:id
 * @desc    Atualizar departamento
 * @access  Private (Empresa/Consultoria)
 */
router.put('/:id',
    checkPermission('departamentos', 'update'),
    DepartamentoController.update
);

/**
 * @route   DELETE /api/departamentos/:id
 * @desc    Deletar departamento
 * @access  Private (Empresa/Consultoria)
 */
router.delete('/:id',
    checkPermission('departamentos', 'delete'),
    DepartamentoController.delete
);

/**
 * @route   GET /api/departamentos/:id/colaboradores
 * @desc    Buscar colaboradores do departamento
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id/colaboradores',
    requireEmpresaOrConsultoria,
    DepartamentoController.getColaboradores
);

/**
 * @route   POST /api/departamentos/:id/colaboradores
 * @desc    Adicionar colaborador ao departamento
 * @access  Private (Empresa/Consultoria)
 */
router.post('/:id/colaboradores',
    checkPermission('colaboradores', 'update'),
    DepartamentoController.addColaborador
);

/**
 * @route   DELETE /api/departamentos/:id/colaboradores/:colaborador_id
 * @desc    Remover colaborador do departamento
 * @access  Private (Empresa/Consultoria)
 */
router.delete('/:id/colaboradores/:colaborador_id',
    checkPermission('colaboradores', 'update'),
    DepartamentoController.removeColaborador
);

/**
 * @route   GET /api/departamentos/:id/stats
 * @desc    Estatísticas do departamento
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id/stats',
    requireEmpresaOrConsultoria,
    DepartamentoController.getStats
);

module.exports = router;
