const express = require('express');
const router = express.Router();
const OcorrenciaController = require('../controllers/ocorrenciaController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkPermission, requireEmpresaOrConsultoria } = require('../middlewares/rbacMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: (5 * 1024 * 1024) } });

// Autenticar todas
router.use(authenticateToken);

// Listar ocorrências (com filtro opcional por empresa)
router.get('/', requireEmpresaOrConsultoria, OcorrenciaController.getAll);

// Obter por id
router.get('/:id', requireEmpresaOrConsultoria, OcorrenciaController.getById);

// Criar
router.post('/', checkPermission('ocorrencias', 'create'), upload.array('files', 10), OcorrenciaController.create);

// Atualizar (aceita multipart para permitir envio via FormData; arquivos serão ignorados aqui)
router.put('/:id', checkPermission('ocorrencias', 'update'), upload.array('files', 10), OcorrenciaController.update);

// Deletar
router.delete('/:id', checkPermission('ocorrencias', 'delete'), OcorrenciaController.delete);

module.exports = router;

// Anexos
router.get('/:id/attachments', requireEmpresaOrConsultoria, OcorrenciaController.listAttachments);
router.post('/:id/attachments', checkPermission('ocorrencias', 'update'), upload.array('files', 10), OcorrenciaController.uploadAttachments);
router.delete('/:id/attachments/:blobName', checkPermission('ocorrencias', 'update'), OcorrenciaController.deleteAttachment);

// Conteúdo de anexo (proxy autenticado)
router.get('/:id/attachments/:blobName/content', requireEmpresaOrConsultoria, OcorrenciaController.getAttachmentContent);



