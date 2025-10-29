const express = require('express');
const router = express.Router();
const TreinamentoController = require('../controllers/treinamentoController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: (10 * 1024 * 1024) } });

// Autenticar todas
router.use(authenticateToken);

// Listar treinamentos
router.get('/', requireEmpresaOrConsultoria, TreinamentoController.getAll);

// Obter por id
router.get('/:id', requireEmpresaOrConsultoria, TreinamentoController.getById);

// Criar (aceita multipart para enviar anexos inline)
router.post('/', checkPermission('treinamentos', 'create'), upload.array('files', 10), TreinamentoController.create);

// Atualizar (aceita multipart para anexos inline)
router.put('/:id', checkPermission('treinamentos', 'update'), upload.array('files', 10), TreinamentoController.update);

// Deletar
router.delete('/:id', checkPermission('treinamentos', 'delete'), TreinamentoController.delete);

// Anexos
router.get('/:id/attachments', requireEmpresaOrConsultoria, TreinamentoController.listAttachments);
router.post('/:id/attachments', checkPermission('treinamentos', 'update'), upload.array('files', 10), TreinamentoController.uploadAttachments);
router.delete('/:id/attachments/:blobName', checkPermission('treinamentos', 'update'), TreinamentoController.deleteAttachment);
router.get('/:id/attachments/:blobName/content', requireEmpresaOrConsultoria, TreinamentoController.getAttachmentContent);

module.exports = router;


