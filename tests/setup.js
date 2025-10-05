// Configuração global para testes
const { config } = require('dotenv');

// Carrega variáveis de ambiente para testes
config({ path: './backend/.env.test' });

// Configurações globais de teste
global.testTimeout = 10000;
