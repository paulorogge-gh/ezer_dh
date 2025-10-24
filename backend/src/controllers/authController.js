const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken, verifyToken } = require('../config/jwt');
const { logAuth, logError } = require('../utils/logger');
const { Usuario, Consultoria, Empresa, Colaborador } = require('../models');

class AuthController {
    /**
     * Login do usuário
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validação básica
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'E-mail e senha são obrigatórios'
                });
            }

            // Buscar usuário na tabela de usuários
            const user = await Usuario.findByEmail(email);
            
            if (!user) {
                logAuth('login_failed', null, req.ip);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciais inválidas'
                });
            }

            // Verificar senha
            const isValidPassword = await user.verificarSenha(password);
            
            if (!isValidPassword) {
                logAuth('login_failed', user.id, req.ip);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciais inválidas'
                });
            }

            // Verificar se usuário está ativo
            if (user.status !== 'Ativo') {
                logAuth('login_blocked', user.id_usuario, req.ip);
                return res.status(403).json({
                    success: false,
                    error: 'Usuário inativo'
                });
            }

            // Verificar se usuário está bloqueado
            if (user.isBloqueado()) {
                logAuth('login_blocked', user.id_usuario, req.ip);
                return res.status(403).json({
                    success: false,
                    error: 'Usuário temporariamente bloqueado'
                });
            }

            // Buscar dados completos do usuário (para contexto adicional)
            const dadosCompletos = await user.getDadosCompletos();
            
            // Gerar tokens
            const tokenPayload = {
                id: user.id_usuario,
                email: user.email,
                role: user.tipo_usuario,
                empresa_id: (user.tipo_usuario === 'empresa' || user.tipo_usuario === 'colaborador') ? (user.id_empresa ?? null) : null,
                consultoria_id: (user.tipo_usuario === 'consultoria') ? (user.id_referencia ?? null) : null
            };

            const accessToken = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken({ id: user.id_usuario });

            // Atualizar último login
            await user.atualizarUltimoLogin();

            // Log de sucesso
            logAuth('login_success', user.id_usuario, req.ip);

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id_usuario,
                        nome: user.nome || dadosCompletos?.nome || null,
                        email: user.email,
                        role: user.tipo_usuario,
                        id_empresa: (user.id_empresa ?? null),
                        id_consultoria: (user.tipo_usuario === 'consultoria' ? user.id_referencia ?? null : null),
                        empresa: dadosCompletos?.empresa_nome || null,
                        consultoria: dadosCompletos?.consultoria_nome || null
                    },
                    accessToken,
                    refreshToken,
                    expiresIn: '24h'
                },
                message: 'Login realizado com sucesso'
            });

        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Logout do usuário
     */
    static async logout(req, res) {
        try {
            const userId = req.user.id;
            
            logAuth('logout', userId, req.ip);
            
            res.json({
                success: true,
                message: 'Logout realizado com sucesso'
            });
        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Renovar token de acesso
     */
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token é obrigatório'
                });
            }

            // Verificar refresh token
            const decoded = verifyToken(refreshToken);
            
            // Buscar usuário
            const user = await Usuario.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Gerar novo access token (alinhado ao login)
            const tokenPayload = {
                id: user.id_usuario,
                email: user.email,
                role: user.tipo_usuario,
                empresa_id: (user.tipo_usuario === 'empresa' || user.tipo_usuario === 'colaborador') ? (user.id_empresa ?? null) : null,
                consultoria_id: (user.tipo_usuario === 'consultoria') ? (user.id_referencia ?? null) : null
            };

            const newAccessToken = generateToken(tokenPayload);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: '24h'
                }
            });

        } catch (error) {
            logError(error, req);
            res.status(401).json({
                success: false,
                error: 'Refresh token inválido'
            });
        }
    }

    /**
     * Obter perfil do usuário
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            
            const user = await Usuario.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Buscar dados completos
            const dadosCompletos = await user.getDadosCompletos();

            res.json({
                success: true,
                data: {
                    id: user.id_usuario,
                    nome: user.nome || dadosCompletos?.nome || null,
                    email: user.email,
                    role: user.tipo_usuario,
                    empresa: dadosCompletos?.empresa_nome || null,
                    consultoria: dadosCompletos?.consultoria_nome || null,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Alterar senha
     */
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Senha atual e nova senha são obrigatórias'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Nova senha deve ter pelo menos 6 caracteres'
                });
            }

            // Buscar usuário
            const user = await Usuario.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            // Verificar senha atual
            const isValidPassword = await user.verificarSenha(currentPassword);
            
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Senha atual incorreta'
                });
            }

            // Atualizar senha
            await user.update({ senha: newPassword });

            logAuth('password_changed', userId, req.ip);

            res.json({
                success: true,
                message: 'Senha alterada com sucesso'
            });

        } catch (error) {
            logError(error, req);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }

}

module.exports = AuthController;
