const { Ocorrencia, OcorrenciaAnexo } = require('../models');
const { logDatabase, logError } = require('../utils/logger');
const { uploadBuffer, listByPrefix, deleteBlob, downloadToBuffer, getBlobUrl } = require('../services/azureBlob');

const CONTAINER = process.env.AZURE_BLOB_CONTAINER || 'ezer-dh';

class OcorrenciaController {
  static async getAll(req, res) {
    try {
      const { empresa_id, tipo, classificacao, periodo, data_inicio: qi, data_fim: qf } = req.query;
      let ocorrencias;
      if (empresa_id || tipo || classificacao || periodo || (qi && qf)) {
        let data_inicio = null; let data_fim = null;
        if (qi && qf) {
          data_inicio = String(qi).slice(0,10);
          data_fim = String(qf).slice(0,10);
        }
        if (periodo) {
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
        ocorrencias = await Ocorrencia.findFiltered({ empresa_id, tipo, classificacao, data_inicio, data_fim });
      } else {
        ocorrencias = await Ocorrencia.findAll();
      }
      logDatabase('SELECT', 'ocorrencia', { count: ocorrencias.length });
      res.json({ success: true, data: ocorrencias, count: ocorrencias.length });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao buscar ocorrências' });
    }
  }

  // Upload múltiplos anexos
  static async uploadAttachments(req, res) {
    try {
      const { id } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
      const prefix = `ocorrencias/${id}/`;
      const uploaded = [];
      for (const f of files) {
        const name = prefix + Date.now() + '-' + (f.originalname || 'file');
        const up = await uploadBuffer(CONTAINER, name, f.buffer, f.mimetype);
        uploaded.push(up);
        // Registrar na tabela de índice de anexos
        try {
          await OcorrenciaAnexo.create({ id_ocorrencia: Number(id), url: up.url, nome_arquivo: f.originalname || up.name, content_type: f.mimetype });
        } catch (err) {
          // log mas não falhar upload inteiro
          logError(err, req);
        }
      }
      logDatabase('INSERT', 'ocorrencia_attachments', { id, count: uploaded.length });
      res.json({ success: true, data: uploaded });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao enviar anexos' });
    }
  }

  static async listAttachments(req, res) {
    try {
      const { id } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      const prefix = `ocorrencias/${id}/`;
      const list = await listByPrefix(CONTAINER, prefix);
      res.json({ success: true, data: list });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao listar anexos' });
    }
  }

  static async deleteAttachment(req, res) {
    try {
      const { id, blobName } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      // blobName deve vir completo (ex: ocorrencias/{id}/arquivo.ext)
      await deleteBlob(CONTAINER, blobName);
      try {
        const url = getBlobUrl(CONTAINER, blobName);
        await OcorrenciaAnexo.deleteByUrl(Number(id), url);
      } catch (err) { logError(err, req); }
      logDatabase('DELETE', 'ocorrencia_attachment', { id, blobName });
      res.json({ success: true, message: 'Anexo excluído com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao excluir anexo' });
    }
  }

  static async getAttachmentContent(req, res) {
    try {
      const { id, blobName } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      // Segurança: o blob deve estar dentro do prefixo da ocorrência
      const expectedPrefix = `ocorrencias/${id}/`;
      if (!blobName || !blobName.startsWith(expectedPrefix)) {
        return res.status(400).json({ success: false, error: 'Nome de blob inválido' });
      }
      const { buffer, contentType, name } = await downloadToBuffer(CONTAINER, blobName);
      const disp = (req.query && req.query.disposition) || 'inline';
      const filename = (name || '').split('/').pop() || 'arquivo';
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${disp}; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao obter conteúdo do anexo' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      logDatabase('SELECT', 'ocorrencia', { id });
      res.json({ success: true, data: ocorrencia });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao buscar ocorrência' });
    }
  }

  static async create(req, res) {
    try {
      const body = req.body || {};
      const required = ['id_colaborador', 'data', 'classificacao', 'tipo'];
      for (const k of required) {
        if (!body[k] && body[k] !== 0) return res.status(400).json({ success: false, error: `Campo obrigatório ausente: ${k}` });
      }
      const id = await Ocorrencia.create(body);
      const ocorrencia = await Ocorrencia.findById(id);
      // Upload inline (primeiro registro): suportar multipart/form-data
      if (req.files && req.files.length) {
        const prefix = `ocorrencias/${id}/`;
        const uploaded = [];
        for (const f of req.files) {
          const name = prefix + Date.now() + '-' + (f.originalname || 'file');
          const up = await uploadBuffer(CONTAINER, name, f.buffer, f.mimetype);
          uploaded.push(up);
          await OcorrenciaAnexo.create({ id_ocorrencia: id, url: up.url, nome_arquivo: f.originalname || up.name, content_type: f.mimetype });
        }
      }
      logDatabase('INSERT', 'ocorrencia', { id });
      res.status(201).json({ success: true, data: ocorrencia, message: 'Ocorrência criada com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao criar ocorrência' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      await ocorrencia.update(body);
      const updated = await Ocorrencia.findById(id);
      logDatabase('UPDATE', 'ocorrencia', { id });
      res.json({ success: true, data: updated, message: 'Ocorrência atualizada com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao atualizar ocorrência' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const ocorrencia = await Ocorrencia.findById(id);
      if (!ocorrencia) return res.status(404).json({ success: false, error: 'Ocorrência não encontrada' });
      // Remover anexos do Azure e limpar tabela índice
      try {
        const prefix = `ocorrencias/${id}/`;
        const list = await listByPrefix(CONTAINER, prefix);
        for (const item of (list || [])) {
          try { await deleteBlob(CONTAINER, item.name); } catch (err) { logError(err, req); }
        }
        try { await OcorrenciaAnexo.deleteAllByOcorrencia(Number(id)); } catch (err) { logError(err, req); }
      } catch (err) { logError(err, req); }
      await ocorrencia.delete();
      logDatabase('DELETE', 'ocorrencia', { id });
      res.json({ success: true, message: 'Ocorrência deletada com sucesso' });
    } catch (error) {
      logError(error, req);
      res.status(500).json({ success: false, error: 'Erro ao deletar ocorrência' });
    }
  }
}

module.exports = OcorrenciaController;


