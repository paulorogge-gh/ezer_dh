const express = require('express');
const router = express.Router();
const LiderController = require('../controllers/liderController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');

// Aplicar autenticação
router.use(authenticateToken);

// GET /api/lideres
router.get('/',
    checkPermission('lideres', 'read'),
    LiderController.getAll
);

// GET /api/lideres/:id
router.get('/:id',
    checkPermission('lideres', 'read'),
    LiderController.getById
);

// POST /api/lideres
router.post('/',
    checkPermission('lideres', 'create'),
    LiderController.create
);

// PUT /api/lideres/:id
router.put('/:id',
    checkPermission('lideres', 'update'),
    LiderController.update
);

// DELETE /api/lideres/:id
router.delete('/:id',
    checkPermission('lideres', 'delete'),
    LiderController.delete
);

// GET /api/lideres/:id/membros
router.get('/:id/membros',
    checkPermission('lideres', 'read'),
    LiderController.getMembros
);

// POST /api/lideres/:id/membros
router.post('/:id/membros',
    checkPermission('lideres', 'update'),
    LiderController.addMembro
);

// DELETE /api/lideres/:id/membros/:liderado_id
router.delete('/:id/membros/:liderado_id',
    checkPermission('lideres', 'update'),
    LiderController.removeMembro
);

// GET /api/lideres/:id/departamentos
router.get('/:id/departamentos',
    checkPermission('lideres', 'read'),
    LiderController.getDepartamentos
);

// POST /api/lideres/:id/departamentos
router.post('/:id/departamentos',
    checkPermission('lideres', 'update'),
    LiderController.addDepartamento
);

// DELETE /api/lideres/:id/departamentos/:departamento_id
router.delete('/:id/departamentos/:departamento_id',
    checkPermission('lideres', 'update'),
    LiderController.removeDepartamento
);

module.exports = router;


