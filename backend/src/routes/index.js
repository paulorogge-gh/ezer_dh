const express = require('express');
const router = express.Router();

function mountIfRouter(basePath, routeModule) {
  const isRouter = typeof routeModule === 'function';
  if (isRouter) {
    router.use(basePath, routeModule);
  } else {
    console.warn(`⚠️ Rota '${basePath}' não montada: módulo não exporta Router (arquivo pode estar vazio).`);
  }
}

const authRoutes = require('./authRoutes');
const consultoriaRoutes = require('./consultoria');
const empresaRoutes = require('./empresaRoutes');
const departamentoRoutes = require('./departamentoRoutes');
const colaboradorRoutes = require('./colaboradorRoutes');
const ocorrenciaRoutes = require('./ocorrenciaRoutes');
const treinamentoRoutes = require('./treinamentoRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const avaliacaoRoutes = require('./avaliacaoRoutes');
const pdiRoutes = require('./pdiRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const liderRoutes = require('./liderRoutes');

mountIfRouter('/auth', authRoutes);
mountIfRouter('/consultoria', consultoriaRoutes);
mountIfRouter('/empresas', empresaRoutes);
mountIfRouter('/departamentos', departamentoRoutes);
mountIfRouter('/colaboradores', colaboradorRoutes);
mountIfRouter('/ocorrencias', ocorrenciaRoutes);
mountIfRouter('/treinamentos', treinamentoRoutes);
mountIfRouter('/feedbacks', feedbackRoutes);
mountIfRouter('/avaliacoes', avaliacaoRoutes);
mountIfRouter('/pdi', pdiRoutes);
mountIfRouter('/usuarios', usuarioRoutes);
mountIfRouter('/lideres', liderRoutes);

module.exports = router;
 