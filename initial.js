// ================================================
// Script Node.js para criar estrutura do Ezer DH
// Evita sobrescrever arquivos existentes
// ================================================

const fs = require('fs');
const path = require('path');

const baseDir = process.cwd(); // Executa dentro do diretório ezer_dh

const structure = {
    'backend': {
        'config': ['db.js', 'jwt.js', 'constants.js'],
        'controllers': [
            'authController.js',
            'empresaController.js',
            'departamentoController.js',
            'colaboradorController.js',
            'ocorrenciaController.js',
            'treinamentoController.js',
            'feedbackController.js',
            'avaliacaoController.js',
            'pdiController.js'
        ],
        'models': [
            'consultoria.js',
            'empresa.js',
            'departamento.js',
            'colaborador.js',
            'colaboradorDepartamento.js',
            'ocorrencia.js',
            'treinamento.js',
            'feedback.js',
            'avaliacao.js',
            'pdi.js'
        ],
        'routes': [
            'authRoutes.js',
            'empresaRoutes.js',
            'departamentoRoutes.js',
            'colaboradorRoutes.js',
            'ocorrenciaRoutes.js',
            'treinamentoRoutes.js',
            'feedbackRoutes.js',
            'avaliacaoRoutes.js',
            'pdiRoutes.js'
        ],
        'middlewares': [
            'authMiddleware.js',
            'rbacMiddleware.js',
            'validationMiddleware.js'
        ],
        'services': [
            'feedbackService.js',
            'avaliacaoService.js',
            'pdiService.js'
        ],
        'utils': [
            'logger.js',
            'excelImporter.js'
        ],
        'app.js': null
    },
    'frontend': {
        'assets': {
            'css': [],
            'js': [],
            'img': []
        },
        'pages': [
            'login.html',
            'dashboard.html',
            'colaboradores.html',
            'departamentos.html',
            'ocorrencias.html',
            'treinamentos.html',
            'feedbacks.html',
            'avaliacoes.html',
            'pdi.html'
        ],
        'components': [
            'navbar.html',
            'footer.html',
            'cards.html'
        ]
    },
    'database': ['ezer_dh.sql'],
    'docs': ['arquitetura.md'],
    'tests': {
        'unit': [],
        'integration': []
    },
    'package.json': null,
    'README.md': null
};

// Função recursiva para criar diretórios e arquivos
function createStructure(basePath, obj) {
    for (const key in obj) {
        const itemPath = path.join(basePath, key);
        if (obj[key] === null) {
            // Cria arquivo vazio se não existir
            if (!fs.existsSync(itemPath)) {
                fs.writeFileSync(itemPath, '', 'utf8');
                console.log(`Arquivo criado: ${itemPath}`);
            }
        } else if (Array.isArray(obj[key])) {
            // Cria diretório se não existir
            if (!fs.existsSync(itemPath)) fs.mkdirSync(itemPath, { recursive: true });
            obj[key].forEach(file => {
                const filePath = path.join(itemPath, file);
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, '', 'utf8');
                    console.log(`Arquivo criado: ${filePath}`);
                }
            });
        } else if (typeof obj[key] === 'object') {
            // Cria diretório e recursivamente seus conteúdos
            if (!fs.existsSync(itemPath)) fs.mkdirSync(itemPath, { recursive: true });
            createStructure(itemPath, obj[key]);
        }
    }
}

createStructure(baseDir, structure);
console.log('\nEstrutura de diretórios e arquivos verificada/criada com sucesso!');
