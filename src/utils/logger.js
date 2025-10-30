const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configuração de formatos
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'ezer-dh-api' },
    transports: [
        // Arquivo de erro
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Arquivo de todos os logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Funções auxiliares
const logRequest = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        if (res.statusCode >= 400) {
            logger.error('HTTP Request Error', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });
    
    next();
};

const logError = (error, req = null) => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
    };
    
    if (req) {
        errorData.request = {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
    }
    
    logger.error('Application Error', errorData);
};

const logDatabase = (operation, table, data = {}) => {
    logger.info('Database Operation', {
        operation,
        table,
        data: JSON.stringify(data)
    });
};

const logAuth = (action, user = null, ip = null) => {
    logger.info('Authentication', {
        action,
        user: user ? user.id : null,
        ip
    });
};

const logBusiness = (action, entity, data = {}) => {
    logger.info('Business Logic', {
        action,
        entity,
        data: JSON.stringify(data)
    });
};

// Auditoria detalhada de ações do usuário
// Aceita dois formatos:
// 1) userId-first: (userId, action, entity, entityId, details, ip)
// 2) action-first: (action, userId, details, ip)
const logAudit = (...args) => {
  try {
    let userId = null;
    let action = null;
    let entity = null;
    let entityId = null;
    let details = {};
    let ip = null;

    if (typeof args[0] === 'string') {
      // action-first
      action = args[0] || null;
      userId = args[1] || null;
      details = args[2] || {};
      ip = args[3] || null;
    } else {
      // userId-first
      userId = args[0] || null;
      action = args[1] || null;
      entity = args[2] || null;
      entityId = args[3] || null;
      details = args[4] || {};
      ip = args[5] || null;
    }

    logger.info('Audit', {
      userId,
      action,
      entity,
      entityId,
      ip,
      details: JSON.stringify(details)
    });

    // Persistência opcional em banco
    try {
      const { AuditLog } = require('../models');
      AuditLog.create({ action, user_id: userId, ip, details }).catch(() => {});
    } catch (dbErr) {
      logger.warn('Audit DB persist failed', { message: dbErr.message });
    }
  } catch (e) {
    // nunca quebrar fluxo por falha de auditoria
  }
};

// Middleware para auditoria automática de requests autenticados
const auditRequest = (req, res, next) => {
  try {
    const start = Date.now();
    res.on('finish', () => {
      try {
        const durationMs = Date.now() - start;
        const userId = (req.user && req.user.id) || null;
        // Auditar apenas métodos que alteram estado
        const mutating = ['POST','PUT','PATCH','DELETE'];
        if (!mutating.includes(req.method)) return;
        logAudit(userId, req.method, 'http', null, {
          url: req.originalUrl || req.url,
          status: res.statusCode,
          durationMs,
          bodyKeys: req.body ? Object.keys(req.body) : [],
        }, req.ip);
      } catch {}
    });
  } catch {}
  next();
};

// Middleware para capturar erros não tratados
const errorHandler = (error, req, res, next) => {
    logError(error, req);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erro interno do servidor';
    
    res.status(statusCode).json({
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
        }
    });
};

// Middleware para capturar erros de Promise rejeitada
const unhandledRejectionHandler = (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
        reason: reason.toString(),
        stack: reason.stack,
        promise: promise.toString()
    });
};

// Middleware para capturar exceções não tratadas
const uncaughtExceptionHandler = (error) => {
    logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack
    });
    
    // Encerrar o processo em caso de exceção não tratada
    process.exit(1);
};

// Configurar handlers
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

module.exports = {
    logger,
    logRequest,
    logError,
    logDatabase,
    logAuth,
    logBusiness,
    errorHandler,
    unhandledRejectionHandler,
    uncaughtExceptionHandler
  ,logAudit
  ,auditRequest
};
