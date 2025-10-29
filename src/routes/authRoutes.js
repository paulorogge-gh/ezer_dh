const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login do usuário
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout do usuário
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acesso
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Obter perfil do usuário
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.put('/change-password', authenticateToken, AuthController.changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar se token é válido
 * @access  Private
 */
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
});

module.exports = router;
