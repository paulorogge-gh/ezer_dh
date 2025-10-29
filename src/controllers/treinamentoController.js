const { Treinamento, Colaborador } = require('../models');
const { logDatabase, logError } = require('../utils/logger');
const { uploadBuffer, deleteBlob, listByPrefix, downloadToBuffer, getBlobUrl } = require('../services/azureBlob');
const CONTAINER = process.env.AZURE_BLOB_CONTAINER || 'ezer-dh';
const TreinamentoAnexo = require('../models/treinamentoAnexo');

class TreinamentoController {
  static sanitize(v) { return typeof v === 'string' ? v.trim() : v; }

  static normalizeDate(value) {
    if (!value) return null;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [d, m, y] = value.split('/');
        return `${y}-${m}-${d}`;
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return null;
    } catch { return null; }
  }

  static async getAll(req, res) {
    try {
      const list = await Treinamento.findAll();
      logDatabase('SELECT', 'treinamento', { count: list.length });
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao listar treinamentos' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const t = await Treinamento.findById(id);
      if (!t) return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
      res.json({ success: true, data: t });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao obter treinamento' });
    }
  }

  static async create(req, res) {
    try {
      const body = req.body || {};
      const id_colaborador = Number(body.id_colaborador);
      const nome = TreinamentoController.sanitize(body.nome);
      const data_inicio = TreinamentoController.normalizeDate(body.data_inicio);
      const data_fim = TreinamentoController.normalizeDate(body.data_fim);
      const categoria = TreinamentoController.sanitize(body.categoria);
      const carga_horaria = body.carga_horaria ? Number(body.carga_horaria) : null;
      const observacoes = TreinamentoController.sanitize(body.observacoes);

      const required = [];
      if (!id_colaborador) required.push('Colaborador');
      if (!nome) required.push('Nome');
      if (!data_inicio) required.push('Data Inicial');
      if (!data_fim) required.push('Data Final');
      if (!categoria || !['Online','Presencial'].includes(categoria)) required.push('Categoria');
      if (required.length) return res.status(400).json({ success: false, error: `Campos obrigatórios: ${required.join(', ')}` });

      const col = await Colaborador.findById(id_colaborador);
      if (!col) return res.status(400).json({ success: false, error: 'Colaborador inválido' });

      const id = await Treinamento.create({ id_colaborador, nome, data_inicio, data_fim, categoria, carga_horaria, observacoes });
      // Upload inline de anexos
      if (req.files && req.files.length) {
        const prefix = `treinamentos/${id}/`;
        for (const f of req.files) {
          const name = prefix + Date.now() + '-' + (f.originalname || 'file');
          try {
            const up = await uploadBuffer(CONTAINER, name, f.buffer, f.mimetype);
            await TreinamentoAnexo.create({ id_treinamento: Number(id), url: up.url, nome_arquivo: f.originalname || up.name, content_type: f.mimetype });
          } catch (err) { logError(err, req); }
        }
      }
      logDatabase('INSERT', 'treinamento', { id });
      const created = await Treinamento.findById(id);
      res.status(201).json({ success: true, data: created, message: 'Treinamento criado com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao criar treinamento' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const t = await Treinamento.findById(id);
      if (!t) return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
      const body = req.body || {};
      const data = {
        nome: TreinamentoController.sanitize(body.nome),
        data_inicio: TreinamentoController.normalizeDate(body.data_inicio),
        data_fim: TreinamentoController.normalizeDate(body.data_fim),
        categoria: TreinamentoController.sanitize(body.categoria),
        carga_horaria: body.carga_horaria ? Number(body.carga_horaria) : null,
        observacoes: TreinamentoController.sanitize(body.observacoes)
      };
      await t.update(data);
      // Upload inline de anexos (se enviados)
      if (req.files && req.files.length) {
        const prefix = `treinamentos/${id}/`;
        for (const f of req.files) {
          const name = prefix + Date.now() + '-' + (f.originalname || 'file');
          try {
            const up = await uploadBuffer(CONTAINER, name, f.buffer, f.mimetype);
            await TreinamentoAnexo.create({ id_treinamento: Number(id), url: up.url, nome_arquivo: f.originalname || up.name, content_type: f.mimetype });
          } catch (err) { logError(err, req); }
        }
      }
      logDatabase('UPDATE', 'treinamento', { id });
      const updated = await Treinamento.findById(id);
      res.json({ success: true, data: updated, message: 'Treinamento atualizado com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao atualizar treinamento' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const t = await Treinamento.findById(id);
      if (!t) return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
      await TreinamentoAnexo.deleteAllByTreinamento(Number(id));
      await t.delete();
      logDatabase('DELETE', 'treinamento', { id });
      res.json({ success: true, message: 'Treinamento excluído com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao excluir treinamento' });
    }
  }

  // Anexos
  static async uploadAttachments(req, res) {
    try {
      const { id } = req.params;
      const t = await Treinamento.findById(id);
      if (!t) return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
      const prefix = `treinamentos/${id}/`;
      const uploaded = [];
      for (const f of files) {
        const name = prefix + Date.now() + '-' + (f.originalname || 'file');
        const up = await uploadBuffer(CONTAINER, name, f.buffer, f.mimetype);
        uploaded.push(up);
        try {
          await TreinamentoAnexo.create({ id_treinamento: Number(id), url: up.url, nome_arquivo: f.originalname || up.name, content_type: f.mimetype });
        } catch (err) {
          logError(err, req);
        }
      }
      logDatabase('INSERT', 'treinamento_attachments', { id, count: uploaded.length });
      res.json({ success: true, data: uploaded });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao enviar anexos' });
    }
  }

  static async listAttachments(req, res) {
    try {
      const { id } = req.params;
      const t = await Treinamento.findById(id);
      if (!t) return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
      const list = await TreinamentoAnexo.findByTreinamento(Number(id));
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao listar anexos' });
    }
  }

  static async deleteAttachment(req, res) {
    try {
      const { id, blobName } = req.params;
      // blobName deve vir completo no formato treinamentos/{id}/arquivo
      await deleteBlob(CONTAINER, blobName);
      try {
        const url = getBlobUrl(CONTAINER, blobName);
        await TreinamentoAnexo.deleteByUrl(Number(id), url);
      } catch (err) { logError(err, req); }
      logDatabase('DELETE', 'treinamento_attachments', { id, blobName });
      res.json({ success: true });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao excluir anexo' });
    }
  }

  static async getAttachmentContent(req, res) {
    try {
      const { id, blobName } = req.params;
      // Segurança: o blob deve estar dentro do prefixo do treinamento
      const expectedPrefix = `treinamentos/${id}/`;
      if (!blobName || !blobName.startsWith(expectedPrefix)) {
        return res.status(400).json({ success: false, error: 'Nome de blob inválido' });
      }
      const { buffer, contentType } = await downloadToBuffer(CONTAINER, blobName);
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.send(buffer);
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao obter conteúdo do anexo' });
    }
  }
}

module.exports = TreinamentoController;


