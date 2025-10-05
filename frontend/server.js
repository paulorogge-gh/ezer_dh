const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'login.html'));
});

// Rota para colaboradores
app.get('/colaboradores', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'colaboradores.html'));
});

// Rota para ocorrências
app.get('/ocorrencias', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'ocorrencias.html'));
});

// Rota para departamentos
app.get('/departamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'departamentos.html'));
});

// Rota para treinamentos
app.get('/treinamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'treinamentos.html'));
});

// Rota para feedbacks
app.get('/feedbacks', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'feedbacks.html'));
});

// Rota para avaliações
app.get('/avaliacoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'avaliacoes.html'));
});

// Rota para PDI
app.get('/pdi', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'pdi.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🌐 ================================================');
    console.log('   EZER DESENVOLVIMENTO HUMANO - FRONTEND');
    console.log('🌐 ================================================');
    console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`👥 Colaboradores: http://localhost:${PORT}/colaboradores`);
    console.log(`📋 Ocorrências: http://localhost:${PORT}/ocorrencias`);
    console.log(`🏢 Departamentos: http://localhost:${PORT}/departamentos`);
    console.log(`🎓 Treinamentos: http://localhost:${PORT}/treinamentos`);
    console.log(`💬 Feedbacks: http://localhost:${PORT}/feedbacks`);
    console.log(`📊 Avaliações: http://localhost:${PORT}/avaliacoes`);
    console.log(`🧾 PDI: http://localhost:${PORT}/pdi`);
    console.log(`🔧 Ambiente: development`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('🌐 ================================================');
});
