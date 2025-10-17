const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresaController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route   GET /api/empresas
 * @desc    Listar todas as empresas
 * @access  Private (Consultoria)
 */
router.get('/', 
    checkPermission('empresas', 'read'),
    EmpresaController.getAll
);

/**
 * @route   GET /api/empresas/:id
 * @desc    Buscar empresa por ID
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id',
    requireEmpresaOrConsultoria,
    EmpresaController.getById
);

/**
 * @route   POST /api/empresas
 * @desc    Criar nova empresa
 * @access  Private (Consultoria)
 */
router.post('/',
    checkPermission('empresas', 'create'),
    EmpresaController.create
);

/**
 * @route   PUT /api/empresas/:id
 * @desc    Atualizar empresa
 * @access  Private (Empresa/Consultoria)
 */
router.put('/:id',
    requireEmpresaOrConsultoria,
    EmpresaController.update
);

/**
 * @route   DELETE /api/empresas/:id
 * @desc    Deletar empresa
 * @access  Private (Consultoria)
 */
router.delete('/:id',
    checkPermission('empresas', 'delete'),
    EmpresaController.delete
);

/**
 * @route   GET /api/empresas/:id/colaboradores
 * @desc    Buscar colaboradores da empresa
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id/colaboradores',
    requireEmpresaOrConsultoria,
    EmpresaController.getColaboradores
);

/**
 * @route   GET /api/empresas/:id/departamentos
 * @desc    Buscar departamentos da empresa
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id/departamentos',
    requireEmpresaOrConsultoria,
    EmpresaController.getDepartamentos
);

/**
 * @route   GET /api/empresas/:id/stats
 * @desc    Estatísticas da empresa
 * @access  Private (Empresa/Consultoria)
 */
router.get('/:id/stats',
    requireEmpresaOrConsultoria,
    EmpresaController.getStats
);

/**
 * @route   GET /api/empresas/stats
 * @desc    Contagens globais (total/ativas/inativas)
 * @access  Private (Consultoria/Empresa leitura)
 */
router.get('/stats/global',
    checkPermission('empresas', 'read'),
    EmpresaController.getGlobalStats
);

module.exports = router;
