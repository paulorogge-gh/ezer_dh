const express = require('express');
const router = express.Router();
const { Consultoria } = require('../models');
const { logRequest, logError } = require('../utils/logger');

// Aplicar middleware de log
router.use(logRequest);

// GET /api/consultoria - Listar todas as consultorias
router.get('/', async (req, res) => {
    try {
        const consultorias = await Consultoria.findAll();
        res.json({
            success: true,
            data: consultorias,
            count: consultorias.length
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar consultorias',
            message: error.message
        });
    }
});

// GET /api/consultoria/:id - Buscar consultoria por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const consultoria = await Consultoria.findById(id);
        
        if (!consultoria) {
            return res.status(404).json({
                success: false,
                error: 'Consultoria não encontrada'
            });
        }
        
        res.json({
            success: true,
            data: consultoria
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar consultoria',
            message: error.message
        });
    }
});

// POST /api/consultoria - Criar nova consultoria
router.post('/', async (req, res) => {
    try {
        const { nome, email, telefone, status } = req.body;
        
        // Validação básica
        if (!nome) {
            return res.status(400).json({
                success: false,
                error: 'Nome é obrigatório'
            });
        }
        
        const consultoriaId = await Consultoria.create({
            nome,
            email,
            telefone,
            status
        });
        
        const consultoria = await Consultoria.findById(consultoriaId);
        
        res.status(201).json({
            success: true,
            data: consultoria,
            message: 'Consultoria criada com sucesso'
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar consultoria',
            message: error.message
        });
    }
});

// PUT /api/consultoria/:id - Atualizar consultoria
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const consultoria = await Consultoria.findById(id);
        
        if (!consultoria) {
            return res.status(404).json({
                success: false,
                error: 'Consultoria não encontrada'
            });
        }
        
        const { nome, email, telefone, status } = req.body;
        
        await consultoria.update({
            nome,
            email,
            telefone,
            status
        });
        
        const consultoriaAtualizada = await Consultoria.findById(id);
        
        res.json({
            success: true,
            data: consultoriaAtualizada,
            message: 'Consultoria atualizada com sucesso'
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar consultoria',
            message: error.message
        });
    }
});

// DELETE /api/consultoria/:id - Deletar consultoria (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const consultoria = await Consultoria.findById(id);
        
        if (!consultoria) {
            return res.status(404).json({
                success: false,
                error: 'Consultoria não encontrada'
            });
        }
        
        await consultoria.delete();
        
        res.json({
            success: true,
            message: 'Consultoria deletada com sucesso'
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao deletar consultoria',
            message: error.message
        });
    }
});

// GET /api/consultoria/:id/empresas - Buscar empresas da consultoria
router.get('/:id/empresas', async (req, res) => {
    try {
        const { id } = req.params;
        const consultoria = await Consultoria.findById(id);
        
        if (!consultoria) {
            return res.status(404).json({
                success: false,
                error: 'Consultoria não encontrada'
            });
        }
        
        const empresas = await consultoria.getEmpresas();
        
        res.json({
            success: true,
            data: empresas,
            count: empresas.length
        });
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar empresas da consultoria',
            message: error.message
        });
    }
});

module.exports = router;
