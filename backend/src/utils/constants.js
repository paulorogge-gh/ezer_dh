// ==================================================
// Constantes do Sistema Ezer DH
// ==================================================

// Status gerais
const STATUS = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo'
};

// Classificações de ocorrências
const CLASSIFICACAO_OCORRENCIA = {
    POSITIVO: 'Positivo',
    NEGATIVO: 'Negativo',
    NEUTRO: 'Neutro'
};

// Tipos de ocorrências
const TIPO_OCORRENCIA = {
    SAUDE_OCUPACIONAL: 'Saúde Ocupacional',
    AUSENCIA: 'Ausência',
    CARREIRA: 'Carreira'
};

// Categorias de treinamento
const CATEGORIA_TREINAMENTO = {
    ONLINE: 'Online',
    PRESENCIAL: 'Presencial'
};

// Classificações de feedback
const CLASSIFICACAO_FEEDBACK = {
    POSITIVO: 'Positivo',
    PARA_MELHORAR: 'Para Melhorar',
    NEUTRO: 'Neutro'
};

// Tipos de feedback
const TIPO_FEEDBACK = {
    LIDERADO: 'Liderado',
    TREZENTOS_SESSENTA: '360º'
};

// Tipos de avaliação
const TIPO_AVALIACAO = {
    NOVENTA: '90',
    CENTO_OITENTA: '180',
    TREZENTOS_SESSENTA: '360'
};

// Status de PDI
const STATUS_PDI = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado'
};

// Tipos de contrato
const TIPO_CONTRATO = {
    CLT: 'CLT',
    PRESTADOR_SERVICO: 'Prestador de Serviço',
    ESTAGIARIO: 'Estagiário',
    JOVEM_APRENDIZ: 'Jovem Aprendiz'
};

// Códigos de erro
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR'
};

// Mensagens de erro
const ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Dados de entrada inválidos',
    NOT_FOUND: 'Recurso não encontrado',
    DUPLICATE_ENTRY: 'Registro já existe',
    UNAUTHORIZED: 'Não autorizado',
    FORBIDDEN: 'Acesso negado',
    INTERNAL_ERROR: 'Erro interno do servidor',
    DATABASE_ERROR: 'Erro de conexão com o banco de dados'
};

// Configurações de paginação
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Configurações de upload
const UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    UPLOAD_PATH: './public/uploads'
};

// Configurações de JWT
const JWT = {
    EXPIRES_IN: '24h',
    ALGORITHM: 'HS256'
};

// Configurações de rate limiting
const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 100
};

// Configurações de CORS
const CORS = {
    DEFAULT_ORIGIN: 'http://localhost:8080',
    CREDENTIALS: true
};

// Configurações de logs
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

// Configurações de banco de dados
const DB_CONFIG = {
    CONNECTION_LIMIT: 10,
    QUEUE_LIMIT: 0,
    WAIT_FOR_CONNECTIONS: true
};

// Validações de CPF
const CPF_VALIDATION = {
    REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    CLEAN_REGEX: /\D/g
};

// Validações de CNPJ
const CNPJ_VALIDATION = {
    REGEX: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    CLEAN_REGEX: /\D/g
};

// Validações de email
const EMAIL_VALIDATION = {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Validações de telefone
const PHONE_VALIDATION = {
    REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    CLEAN_REGEX: /\D/g
};

// Formatos de data
const DATE_FORMATS = {
    BR: 'DD/MM/YYYY',
    US: 'YYYY-MM-DD',
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ'
};

// Configurações de relatórios
const REPORTS = {
    DEFAULT_FORMAT: 'pdf',
    SUPPORTED_FORMATS: ['pdf', 'excel', 'csv'],
    MAX_RECORDS: 10000
};

module.exports = {
    STATUS,
    CLASSIFICACAO_OCORRENCIA,
    TIPO_OCORRENCIA,
    CATEGORIA_TREINAMENTO,
    CLASSIFICACAO_FEEDBACK,
    TIPO_FEEDBACK,
    TIPO_AVALIACAO,
    STATUS_PDI,
    TIPO_CONTRATO,
    ERROR_CODES,
    ERROR_MESSAGES,
    PAGINATION,
    UPLOAD,
    JWT,
    RATE_LIMIT,
    CORS,
    LOG_LEVELS,
    DB_CONFIG,
    CPF_VALIDATION,
    CNPJ_VALIDATION,
    EMAIL_VALIDATION,
    PHONE_VALIDATION,
    DATE_FORMATS,
    REPORTS
};
