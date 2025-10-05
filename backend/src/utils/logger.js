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
};
