const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/rbacMiddleware');

router.use(authenticateToken);

// Listar usuários (consultoria/empresa)
router.get('/',
    checkPermission('usuarios', 'read'),
    UsuarioController.getAll
);

// Detalhe
router.get('/:id',
    checkPermission('usuarios', 'read'),
    UsuarioController.getById
);

// Criar usuário
router.post('/',
    checkPermission('usuarios', 'create'),
    UsuarioController.create
);

// Atualizar usuário
router.put('/:id',
    checkPermission('usuarios', 'update'),
    UsuarioController.update
);

// Atualizar status
router.patch('/:id/status',
    checkPermission('usuarios', 'update'),
    UsuarioController.updateStatus
);

// Reset de senha
router.post('/:id/reset-password',
    checkPermission('usuarios', 'update'),
    UsuarioController.resetPassword
);

// Excluir usuário
router.delete('/:id',
    checkPermission('usuarios', 'delete'),
    UsuarioController.delete
);

module.exports = router;



