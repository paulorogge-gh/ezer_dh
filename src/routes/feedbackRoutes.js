const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');

// todas autenticadas
router.use(authenticateToken);

// listar com filtros
router.get('/', requireEmpresaOrConsultoria, FeedbackController.getAll);
router.get('/:id', requireEmpresaOrConsultoria, FeedbackController.getById);

// criar/atualizar/deletar
router.post('/', checkPermission('feedbacks', 'create'), FeedbackController.create);
router.put('/:id', checkPermission('feedbacks', 'update'), FeedbackController.update);
router.delete('/:id', checkPermission('feedbacks', 'delete'), FeedbackController.delete);

module.exports = router;


