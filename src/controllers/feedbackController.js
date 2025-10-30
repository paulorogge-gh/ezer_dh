const { Feedback } = require('../models');
const { logDatabase, logError, logAudit } = require('../utils/logger');
const { getPool } = require('../config/db');

class FeedbackController {
  static async getAll(req, res) {
    try {
      const { empresa_id, classificacao, periodo, data_inicio: qi, data_fim: qf, q } = req.query;
      let data_inicio = null; let data_fim = null;
      if (qi && qf) { data_inicio = String(qi).slice(0,10); data_fim = String(qf).slice(0,10); }
      if (periodo && (!qi || !qf)) {
        const now = new Date();
        if (periodo === 'hoje') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const end = new Date(start); end.setDate(start.getDate() + 1);
          data_inicio = start.toISOString().slice(0,10);
          data_fim = end.toISOString().slice(0,10);
        } else if (periodo === 'semana') {
          const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
          const end = new Date(start); end.setDate(start.getDate() + 7);
          data_inicio = start.toISOString().slice(0,10);
          data_fim = end.toISOString().slice(0,10);
        } else if (periodo === 'mes') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          data_inicio = start.toISOString().slice(0,10);
          data_fim = end.toISOString().slice(0,10);
        } else if (periodo === 'ano') {
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear() + 1, 0, 1);
          data_inicio = start.toISOString().slice(0,10);
          data_fim = end.toISOString().slice(0,10);
        }
      }
      // Escopo: se usuário for empresa ou colaborador, forçar filtro pela sua empresa
      let forcedEmpresaId = null;
      try {
        const role = req.user?.role;
        if (role === 'empresa') {
          forcedEmpresaId = (req.user?.empresa_id || req.user?.id_empresa || req.user?.id_referencia) || null;
        } else if (role === 'colaborador') {
          const idRef = req.user?.id_referencia || null;
          if (idRef) {
            const pool = getPool();
            const [rows] = await pool.execute('SELECT id_empresa FROM colaborador WHERE id_colaborador = ?', [idRef]);
            if (rows && rows[0] && rows[0].id_empresa) forcedEmpresaId = rows[0].id_empresa;
          }
        }
      } catch {}
      const finalEmpresaId = forcedEmpresaId || empresa_id;
      const list = (finalEmpresaId || classificacao || data_inicio || data_fim || q)
        ? await Feedback.findFiltered({ empresa_id: finalEmpresaId, classificacao, data_inicio, data_fim, q })
        : await Feedback.findAll();
      logDatabase('SELECT', 'feedback', { count: list.length });
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao buscar feedbacks' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await Feedback.findById(id);
      if (!item) return res.status(404).json({ success: false, error: 'Feedback não encontrado' });
      logDatabase('SELECT', 'feedback', { id });
      res.json({ success: true, data: item });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao buscar feedback' });
    }
  }

  static async create(req, res) {
    try {
      const body = req.body || {};
      const required = ['id_avaliado', 'data', 'classificacao'];
      for (const k of required) { if (!body[k] && body[k] !== 0) return res.status(400).json({ success: false, error: `Campo obrigatório ausente: ${k}` }); }
      // Avaliador é o usuário autenticado (se possível)
      const user = req.user || {};
      body.id_avaliador = body.id_avaliador || user.id_colaborador || user.id_referencia || null;
      // Regra de acesso: líder só para liderados; colaborador 360º para colegas/ líder do(s) departamento(s)
      // Colaborador não pode criar tipo 'Liderado'
      // Regra sem distinção de tipo
      try {
        const pool = getPool();
        // empresa do avaliado
        const [rows] = await pool.execute('SELECT id_empresa FROM colaborador WHERE id_colaborador = ?', [body.id_avaliado]);
        if (!rows.length) return res.status(400).json({ success: false, error: 'Avaliado inválido' });
        const idEmpresaAvaliado = rows[0].id_empresa;
        // Se usuário for empresa, garantir mesma empresa
        if (req.user?.role === 'empresa') {
          const myEmp = req.user.id_empresa || req.user.id_referencia;
          if (idEmpresaAvaliado !== myEmp) return res.status(403).json({ success: false, error: 'Sem permissão para avaliar colaborador de outra empresa' });
        }
        // Escopo departamental simples (baseado em N:N): obter deps compartilhados
        if (req.user?.role === 'lider' || req.user?.role === 'colaborador') {
          const idAvaliador = body.id_avaliador;
          const [depsAvaliador] = await pool.execute('SELECT id_departamento FROM colaborador_departamento WHERE id_colaborador = ?', [idAvaliador]);
          const [depsAvaliado] = await pool.execute('SELECT id_departamento FROM colaborador_departamento WHERE id_colaborador = ?', [body.id_avaliado]);
          const setA = new Set((depsAvaliador||[]).map(d=>d.id_departamento));
          const shared = (depsAvaliado||[]).some(d=> setA.has(d.id_departamento));
          if (!shared) return res.status(403).json({ success: false, error: 'Sem permissão: colaboradores sem departamento compartilhado' });
        }
      } catch(e) { /* fallback permissivo se regra não aplicável */ }
      const id = await Feedback.create(body);
      const novo = await Feedback.findById(id);
      logDatabase('INSERT', 'feedback', { id });
      try { logAudit('create_feedback', req.user?.id, { id, id_avaliado: body.id_avaliado, classificacao: body.classificacao }, req.ip); } catch {}
      res.status(201).json({ success: true, data: novo, message: 'Feedback criado com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao criar feedback' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const item = await Feedback.findById(id);
      if (!item) return res.status(404).json({ success: false, error: 'Feedback não encontrado' });
      await item.update(req.body || {});
      const updated = await Feedback.findById(id);
      logDatabase('UPDATE', 'feedback', { id });
      try { logAudit('update_feedback', req.user?.id, { id, changes: req.body || {} }, req.ip); } catch {}
      res.json({ success: true, data: updated, message: 'Feedback atualizado com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao atualizar feedback' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const item = await Feedback.findById(id);
      if (!item) return res.status(404).json({ success: false, error: 'Feedback não encontrado' });
      await item.delete();
      logDatabase('DELETE', 'feedback', { id });
      try { logAudit('delete_feedback', req.user?.id, { id }, req.ip); } catch {}
      res.json({ success: true, message: 'Feedback deletado com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao deletar feedback' });
    }
  }
}

module.exports = FeedbackController;


