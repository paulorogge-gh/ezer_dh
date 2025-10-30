const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireConsultoria } = require('../middlewares/rbacMiddleware');
const { AuditLog, Usuario, Colaborador } = require('../models');
const { logError } = require('../utils/logger');

// Listagem de auditoria com filtros
router.get('/', authenticateToken, requireConsultoria, async (req, res) => {
  try {
    const { action, user_id, from, to, q, limit, offset } = req.query || {};
    const logs = await AuditLog.findFiltered({ action, user_id, from, to, q, limit: Number(limit) || 100, offset: Number(offset) || 0 });

    // Restrição para role empresa: só ver auditorias de usuários da mesma empresa
    if (req.user.role === 'empresa') {
      const empresaId = Number(req.user.empresa_id);
      const filtered = [];
      for (const log of logs) {
        const uid = log.user_id;
        if (!uid) continue; // sem usuário associado, ocultar para empresa
        try {
          const user = await Usuario.findById(uid);
          if (!user) continue;
          if (user.tipo_usuario === 'empresa') {
            if (Number(user.id_empresa) === empresaId) filtered.push(log);
          } else if (user.tipo_usuario === 'colaborador') {
            const colId = user.id_colaborador || user.id_referencia;
            const col = await Colaborador.findById(colId);
            if (col && Number(col.id_empresa) === empresaId) filtered.push(log);
          } else {
            // consultoria não pertence à empresa → ocultar
          }
        } catch {}
      }
      return res.json({ success: true, data: filtered, count: filtered.length });
    }

    // Consultoria: acesso total
    return res.json({ success: true, data: logs, count: logs.length });
  } catch (error) {
    logError(error, req);
    res.status(500).json({ success: false, error: 'Erro ao listar auditoria' });
  }
});

module.exports = router;

