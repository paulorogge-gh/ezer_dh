const { getPool } = require('../config/db');

async function createTables() {
    try {
        console.log('🔍 Criando tabelas do banco de dados...');
        
        const pool = getPool();
        
        // Tabela usuario (Sistema de Autenticação)
        console.log('📊 Criando tabela usuario...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL,
                tipo_usuario ENUM('consultoria','empresa','colaborador') NOT NULL,
                id_referencia INT NOT NULL,
                status ENUM('Ativo','Inativo') DEFAULT 'Ativo',
                ultimo_login TIMESTAMP NULL,
                tentativas_login INT DEFAULT 0,
                bloqueado_ate TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_tipo_referencia (tipo_usuario, id_referencia),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Tabela usuario criada!');
        
        // Tabela consultoria
        console.log('📊 Criando tabela consultoria...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS consultoria (
                id_consultoria INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                telefone VARCHAR(50),
                status ENUM('Ativo','Inativo') DEFAULT 'Ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela consultoria criada!');
        
        // Tabela empresa
        console.log('📊 Criando tabela empresa...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS empresa (
                id_empresa INT AUTO_INCREMENT PRIMARY KEY,
                id_consultoria INT NOT NULL,
                nome VARCHAR(255) NOT NULL,
                cnpj VARCHAR(20) NOT NULL UNIQUE,
                email VARCHAR(255),
                telefone VARCHAR(50),
                endereco VARCHAR(255),
                responsavel VARCHAR(255),
                status ENUM('Ativo','Inativo') DEFAULT 'Ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_consultoria) REFERENCES consultoria(id_consultoria) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela empresa criada!');
        
        // Tabela departamento
        console.log('📊 Criando tabela departamento...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS departamento (
                id_departamento INT AUTO_INCREMENT PRIMARY KEY,
                id_empresa INT NOT NULL,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela departamento criada!');
        
        // Tabela colaborador
        console.log('📊 Criando tabela colaborador...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS colaborador (
                id_colaborador INT AUTO_INCREMENT PRIMARY KEY,
                id_empresa INT NOT NULL,
                cpf VARCHAR(20) NOT NULL UNIQUE,
                nome VARCHAR(255) NOT NULL,
                data_nascimento DATE,
                email_pessoal VARCHAR(255),
                email_corporativo VARCHAR(255),
                telefone VARCHAR(50),
                cargo VARCHAR(100),
                remuneracao DECIMAL(10,2),
                data_admissao DATE,
                tipo_contrato ENUM('CLT','Prestador de Serviço','Estagiário','Jovem Aprendiz'),
                status ENUM('Ativo','Inativo') DEFAULT 'Ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela colaborador criada!');
        
        // Tabela colaborador_departamento
        console.log('📊 Criando tabela colaborador_departamento...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS colaborador_departamento (
                id_colaborador INT NOT NULL,
                id_departamento INT NOT NULL,
                PRIMARY KEY (id_colaborador, id_departamento),
                FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
                FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela colaborador_departamento criada!');
        
        // Tabela ocorrencia
        console.log('📊 Criando tabela ocorrencia...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS ocorrencia (
                id_ocorrencia INT AUTO_INCREMENT PRIMARY KEY,
                id_colaborador INT NOT NULL,
                data DATE NOT NULL,
                classificacao ENUM('Positivo','Negativo','Neutro') NOT NULL,
                tipo ENUM('Saúde Ocupacional','Ausência','Carreira') NOT NULL,
                subtipo VARCHAR(255),
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela ocorrencia criada!');

        // Tabela ocorrencia_anexo (índice de anexos)
        console.log('📊 Criando tabela ocorrencia_anexo...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS ocorrencia_anexo (
                id_anexo INT AUTO_INCREMENT PRIMARY KEY,
                id_ocorrencia INT NOT NULL,
                url VARCHAR(1024) NOT NULL,
                nome_arquivo VARCHAR(512) NOT NULL,
                content_type VARCHAR(128),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia(id_ocorrencia) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela ocorrencia_anexo criada!');
        // Índices de ocorrencia_anexo
        try {
            await pool.execute('CREATE INDEX idx_ocorrencia_anexo_ocorrencia ON ocorrencia_anexo(id_ocorrencia)');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_ocorrencia_anexo_ocorrencia já existe ou houve erro');
        }
        try {
            await pool.execute('CREATE INDEX idx_ocorrencia_anexo_url ON ocorrencia_anexo(url(255))');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_ocorrencia_anexo_url já existe ou houve erro');
        }

        // Tabela treinamento
        console.log('📊 Criando tabela treinamento...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS treinamento (
                id_treinamento INT AUTO_INCREMENT PRIMARY KEY,
                id_colaborador INT NOT NULL,
                nome VARCHAR(255) NOT NULL,
                data_inicio DATE NOT NULL,
                data_fim DATE NOT NULL,
                categoria ENUM('Online','Presencial') NOT NULL,
                carga_horaria INT,
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela treinamento criada!');
        
        // Tabela feedback
        console.log('📊 Criando tabela feedback...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS feedback (
                id_feedback INT AUTO_INCREMENT PRIMARY KEY,
                id_avaliador INT NOT NULL,
                id_avaliado INT NOT NULL,
                data DATE NOT NULL,
                classificacao ENUM('Positivo','Para Melhorar','Neutro') NOT NULL,
                observacoes TEXT,
                tipo_feedback ENUM('Liderado','360º') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_avaliador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
                FOREIGN KEY (id_avaliado) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela feedback criada!');
        
        // Tabela avaliacao
        console.log('📊 Criando tabela avaliacao...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS avaliacao (
                id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
                id_colaborador INT NOT NULL,
                id_avaliador INT NOT NULL,
                data DATE NOT NULL,
                tipo ENUM('90','180','360') NOT NULL,
                nota DECIMAL(3,2) NOT NULL,
                comentario TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
                FOREIGN KEY (id_avaliador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela avaliacao criada!');
        
        // Tabela pdi
        console.log('📊 Criando tabela pdi...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS pdi (
                id_pdi INT AUTO_INCREMENT PRIMARY KEY,
                id_colaborador INT NOT NULL,
                objetivo VARCHAR(255) NOT NULL,
                acao TEXT NOT NULL,
                prazo DATE NOT NULL,
                responsavel VARCHAR(255),
                status ENUM('Em Andamento','Concluído','Cancelado') DEFAULT 'Em Andamento',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela pdi criada!');
        
        // Criar índices
        console.log('📊 Criando índices...');
        try {
            await pool.execute('CREATE INDEX idx_colaborador_cpf ON colaborador(cpf)');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_colaborador_cpf já existe');
        }
        
        try {
            await pool.execute('CREATE INDEX idx_colaborador_email_corp ON colaborador(email_corporativo)');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_colaborador_email_corp já existe');
        }
        
        try {
            await pool.execute('CREATE INDEX idx_feedback_data ON feedback(data)');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_feedback_data já existe');
        }
        
        try {
            await pool.execute('CREATE INDEX idx_avaliacao_data ON avaliacao(data)');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') console.log('⚠️  Índice idx_avaliacao_data já existe');
        }
        console.log('✅ Índices criados!');
        
        // Inserir dados de exemplo
        console.log('📊 Inserindo dados de exemplo...');
        
        // Inserir consultoria de exemplo
        await pool.execute(`
            INSERT IGNORE INTO consultoria (nome, email, telefone) VALUES 
            ('Ezer Consultoria', 'contato@ezer.com', '(11) 99999-9999')
        `);
        
        // Inserir empresa de exemplo
        await pool.execute(`
            INSERT IGNORE INTO empresa (id_consultoria, nome, cnpj, email, telefone, endereco, responsavel) VALUES 
            (1, 'Empresa Exemplo Ltda', '12.345.678/0001-90', 'contato@empresaexemplo.com', '(11) 88888-8888', 'Rua Exemplo, 123', 'João Silva')
        `);
        
        // Inserir departamentos de exemplo
        await pool.execute(`
            INSERT IGNORE INTO departamento (id_empresa, nome, descricao) VALUES 
            (1, 'Recursos Humanos', 'Departamento responsável pela gestão de pessoas'),
            (1, 'Tecnologia', 'Departamento de desenvolvimento e suporte técnico')
        `);
        
        // Inserir colaboradores de exemplo
        await pool.execute(`
            INSERT IGNORE INTO colaborador (id_empresa, cpf, nome, data_nascimento, email_corporativo, telefone, cargo, data_admissao, tipo_contrato) VALUES 
            (1, '123.456.789-00', 'Maria Santos', '1990-05-15', 'maria.santos@empresaexemplo.com', '(11) 77777-7777', 'Analista de RH', '2023-01-15', 'CLT'),
            (1, '987.654.321-00', 'Pedro Oliveira', '1985-08-20', 'pedro.oliveira@empresaexemplo.com', '(11) 66666-6666', 'Desenvolvedor', '2023-02-01', 'CLT')
        `);
        
        // Associar colaboradores aos departamentos
        await pool.execute(`
            INSERT IGNORE INTO colaborador_departamento (id_colaborador, id_departamento) VALUES 
            (1, 1), (2, 2)
        `);
        
        // Inserir usuários de exemplo (senhas: "123456" criptografadas com bcrypt)
        await pool.execute(`
            INSERT IGNORE INTO usuario (email, senha, tipo_usuario, id_referencia) VALUES 
            ('admin@ezer.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4j4j4j4j', 'consultoria', 1),
            ('admin@empresaexemplo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4j4j4j4j', 'empresa', 1),
            ('maria.santos@empresaexemplo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4j4j4j4j', 'colaborador', 1),
            ('pedro.oliveira@empresaexemplo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4j4j4j4j', 'colaborador', 2)
        `);
        
        console.log('✅ Dados de exemplo inseridos!');
        
        console.log('🎉 Todas as tabelas foram criadas com sucesso!');
        
        // Verificar tabelas criadas
        const [tables] = await pool.execute('SHOW TABLES');
        console.log(`📋 Tabelas encontradas (${tables.length}):`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error.message);
        process.exit(1);
    }
}

createTables();
