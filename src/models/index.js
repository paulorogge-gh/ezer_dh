// ==================================================
// Exportação de todos os modelos
// ==================================================

const Usuario = require('./usuario');
const Consultoria = require('./consultoria');
const Empresa = require('./empresa');
const Departamento = require('./departamento');
const Colaborador = require('./colaborador');
const ColaboradorDepartamento = require('./colaboradorDepartamento');
const Lider = require('./lider');
const LiderMembro = require('./liderMembro');
const LiderDepartamento = require('./liderDepartamento');
const Ocorrencia = require('./ocorrencia');
const Treinamento = require('./treinamento');
const Feedback = require('./feedback');
const Avaliacao = require('./avaliacao');
const Pdi = require('./pdi');
const AuditLog = require('./auditLog');
const OcorrenciaAnexo = require('./ocorrenciaAnexo');

module.exports = {
    Usuario,
    Consultoria,
    Empresa,
    Departamento,
    Colaborador,
    ColaboradorDepartamento,
    Lider,
    LiderMembro,
    LiderDepartamento,
    Ocorrencia,
    Treinamento,
    Feedback,
    Avaliacao,
    Pdi,
    AuditLog
    , OcorrenciaAnexo
};
