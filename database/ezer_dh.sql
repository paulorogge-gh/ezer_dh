-- ==================================================
-- Banco de Dados: ezer_dh
-- ==================================================

CREATE DATABASE IF NOT EXISTS ezer_dh;
USE ezer_dh;

-- ==================================================
-- 1. Consultoria
-- ==================================================
CREATE TABLE consultoria (
    id_consultoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    status ENUM('Ativo','Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================================================
-- 2. Empresa (Cliente)
-- ==================================================
CREATE TABLE empresa (
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
);

-- ==================================================
-- 3. Departamento
-- ==================================================
CREATE TABLE departamento (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- ==================================================
-- 4. Colaborador
-- ==================================================
CREATE TABLE colaborador (
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
);

-- ==================================================
-- 5. Colaborador_Departamento (N:N)
-- ==================================================
CREATE TABLE colaborador_departamento (
    id_colaborador INT NOT NULL,
    id_departamento INT NOT NULL,
    PRIMARY KEY (id_colaborador, id_departamento),
    FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador) ON DELETE CASCADE,
    FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento) ON DELETE CASCADE
);

-- ==================================================
-- 6. Ocorrência
-- ==================================================
CREATE TABLE ocorrencia (
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
);

-- ==================================================
-- 7. Treinamento
-- ==================================================
CREATE TABLE treinamento (
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
);

-- ==================================================
-- 8. Feedback
-- ==================================================
CREATE TABLE feedback (
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
);

-- ==================================================
-- 9. Avaliação de Desempenho
-- ==================================================
CREATE TABLE avaliacao (
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
);

-- ==================================================
-- 10. PDI (Plano de Desenvolvimento Individual)
-- ==================================================
CREATE TABLE pdi (
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
);

-- ==================================================
-- Índices adicionais para otimização
-- ==================================================
CREATE INDEX idx_colaborador_cpf ON colaborador(cpf);
CREATE INDEX idx_colaborador_email_corp ON colaborador(email_corporativo);
CREATE INDEX idx_feedback_data ON feedback(data);
CREATE INDEX idx_avaliacao_data ON avaliacao(data);
