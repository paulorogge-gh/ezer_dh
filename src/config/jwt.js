const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configurações JWT
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'ezer_dh_secret_key_2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
};

/**
 * Gera um token JWT
 * @param {Object} payload - Dados do usuário
 * @param {Object} options - Opções adicionais
 * @returns {string} Token JWT
 */
function generateToken(payload, options = {}) {
    const defaultOptions = {
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithm
    };
    
    return jwt.sign(payload, JWT_CONFIG.secret, { ...defaultOptions, ...options });
}

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Dados decodificados
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, { algorithms: [JWT_CONFIG.algorithm] });
    } catch (error) {
        throw new Error('Token inválido ou expirado');
    }
}

/**
 * Decodifica um token sem verificar a assinatura (para debug)
 * @param {string} token - Token JWT
 * @returns {Object} Dados decodificados
 */
function decodeToken(token) {
    return jwt.decode(token);
}

/**
 * Extrai o token do header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token extraído
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
}

/**
 * Gera refresh token
 * @param {Object} payload - Dados do usuário
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: '7d', // Refresh token válido por 7 dias
        algorithm: JWT_CONFIG.algorithm
    });
}

/**
 * Verifica se o token está próximo do vencimento
 * @param {string} token - Token JWT
 * @param {number} minutes - Minutos antes do vencimento
 * @returns {boolean} True se próximo do vencimento
 */
function isTokenNearExpiry(token, minutes = 30) {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return false;
        
        const now = Math.floor(Date.now() / 1000);
        const expiry = decoded.exp;
        const timeUntilExpiry = expiry - now;
        
        return timeUntilExpiry <= (minutes * 60);
    } catch (error) {
        return false;
    }
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    extractTokenFromHeader,
    generateRefreshToken,
    isTokenNearExpiry,
    JWT_CONFIG
};
