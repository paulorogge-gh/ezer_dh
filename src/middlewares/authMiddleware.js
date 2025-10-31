const { verifyToken, extractTokenFromHeader } = require('../config/jwt');
const { logAuth, logError } = require('../utils/logger');

/**
 * Middleware de autenticação JWT
 */
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            logAuth('token_missing', null, req.ip);
            return res.status(401).json({
                success: false,
                error: 'Token de acesso necessário'
            });
        }

        // Verificar token
        const decoded = verifyToken(token);
        // Mapear IDs de referência conforme o role, garantindo compatibilidade
        const role = decoded.role;
        const empresaId = decoded.empresa_id || decoded.id_empresa || undefined;
        const consultoriaId = decoded.consultoria_id || decoded.id_consultoria || undefined;
        const idReferencia = decoded.id_referencia || decoded.id_colaborador || undefined;
        
        // Adicionar dados do usuário ao request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: role,
            empresa_id: empresaId,
            consultoria_id: consultoriaId,
            id_referencia: idReferencia,
            id_colaborador: decoded.id_colaborador || undefined
        };

        logAuth('token_validated', decoded.id, req.ip);
        next();

    } catch (error) {
        logAuth('token_invalid', null, req.ip);
        logError(error, req);
        
        return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const decoded = verifyToken(token);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                empresa_id: decoded.empresa_id,
                consultoria_id: decoded.consultoria_id
            };
        }

        next();
    } catch (error) {
        // Em caso de erro, continua sem usuário autenticado
        next();
    }
};

/**
 * Middleware para verificar se o usuário está ativo
 */
const checkUserActive = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        // Aqui você pode adicionar lógica para verificar se o usuário está ativo
        // Por enquanto, apenas continua
        next();

    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status do usuário'
        });
    }
};

/**
 * Middleware para verificar se o token está próximo do vencimento
 */
const checkTokenExpiry = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const { isTokenNearExpiry } = require('../config/jwt');
            
            if (isTokenNearExpiry(token, 30)) { // 30 minutos antes do vencimento
                res.set('X-Token-Expires-Soon', 'true');
            }
        }

        next();
    } catch (error) {
        // Em caso de erro, continua normalmente
        next();
    }
};

/**
 * Middleware para rate limiting por usuário
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Limpar requisições antigas
        if (requests.has(userId)) {
            const userRequests = requests.get(userId).filter(time => time > windowStart);
            requests.set(userId, userRequests);
        } else {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);

        if (userRequests.length >= maxRequests) {
            logAuth('rate_limit_exceeded', userId, req.ip);
            return res.status(429).json({
                success: false,
                error: 'Muitas requisições. Tente novamente em alguns minutos.'
            });
        }

        // Adicionar requisição atual
        userRequests.push(now);
        requests.set(userId, userRequests);

        next();
    };
};

/**
 * Middleware para log de requisições autenticadas
 */
const logAuthenticatedRequest = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        if (req.user) {
            logAuth('api_request', req.user.id, req.ip, {
                method: req.method,
                url: req.url,
                status: res.statusCode
            });
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    checkUserActive,
    checkTokenExpiry,
    userRateLimit,
    logAuthenticatedRequest
};
