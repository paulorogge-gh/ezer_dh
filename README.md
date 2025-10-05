# 🧠 Ezer Desenvolvimento Humano

**Ezer Desenvolvimento Humano (Ezer DH)** é uma plataforma web voltada para **gestão de pessoas, performance e desenvolvimento humano**. A solução é oferecida para empresas clientes por meio de uma **consultoria especializada**.

O sistema permite gerenciar empresas, colaboradores, departamentos, ocorrências, feedbacks, treinamentos e avaliações de desempenho (90°, 180°, 360°), oferecendo uma visão completa da evolução e comportamento dos profissionais.

---

## 🏗️ Visão geral do projeto

O **Ezer DH** é uma aplicação web modular composta por um **backend em Node.js (API e regras de negócio)** e um **frontend em HTML/CSS/Bootstrap**, integrados a um banco de dados **MySQL**.

### 🎯 Objetivo

Automatizar e centralizar processos de **gestão de pessoas** e **avaliação de desempenho** para consultorias e empresas clientes, com controle de acesso hierárquico e indicadores de performance.

---

## 🧩 Funcionalidades principais

### 1. Gestão de empresas (clientes)
- Cadastro de empresas (clientes da consultoria).
- Vinculação de departamentos e colaboradores.
- Controle de acesso por empresa.

### 2. Gestão de colaboradores
- Dados pessoais e profissionais:
  - Empresa, CPF, nome, data de nascimento, e-mails (pessoal e corporativo), telefone, departamento(s), cargo, remuneração, data de admissão.
  - Tipo de contrato: **CLT**, **Prestador de Serviço**, **Estagiário** ou **Jovem Aprendiz**.
- Importação em lote via modelo Excel.
- Um colaborador pode pertencer a **mais de um departamento**.

### 3. Registro de ocorrências
- Data da ocorrência.
- Classificação: **Positivo**, **Negativo** ou **Neutro**.
- Tipo: Saúde Ocupacional, Ausência, Carreira (ex.: exame admissional, falta, promoção, advertência).
- Observações detalhadas.

### 4. Registro de treinamentos
- Data inicial e final.
- Categoria: **Online** ou **Presencial**.
- Nome e carga horária.
- Campo de observações.

### 5. Feedbacks
- Inseridos por **líderes** ou **colaboradores (360°)**.
- Classificação: **Positivo**, **Para Melhorar** ou **Neutro**.
- Campo livre para comentários.
- Acesso limitado conforme relação hierárquica:
  - Líder → liderados
  - Colaborador → líder e pares do mesmo departamento

### 6. Avaliação de desempenho
- Escalas Likert de 1 a 5 (diferentes perspectivas):
  - **90°:** Líder → Liderado
  - **180°:** Líder ↔ Liderado
  - **360°:** Líder ↔ Liderado + Pares
- Questionário personalizável por empresa.
- Comentário final por avaliação.
- **PDI – Plano de Desenvolvimento Individual:** geração automática de plano de ação com base nas notas e feedbacks.

### 7. Classificação de usuários e permissões
- **Consultoria:** acesso global a todas as empresas e dados.
- **Cliente (Empresa):**
  - **Administrador:** gerencia colaboradores, departamentos, registros e feedbacks da empresa.
  - **Líder:** pode lançar feedbacks e ocorrências apenas de seus liderados.
  - **Colaborador:** participa das avaliações e feedbacks de seus líderes e colegas.

---

## 🧱 Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Node.js (Express) |
| **Frontend** | HTML5, CSS3, Bootstrap 5 |
| **Banco de Dados** | MySQL |
| **Ambiente** | Azure (Linux VM) |
| **Gerenciador de pacotes** | npm |
| **Execução** | Node / nodemon |
| **Configurações** | dotenv |

---

## 📂 Estrutura de diretórios

```
/ezer_dh
├── backend/                          # Backend API (Node.js + Express)
│   ├── src/                          # Código fonte da aplicação
│   │   ├── app.js                    # Ponto de entrada da aplicação
│   │   ├── config/                   # Configurações (db, jwt, constantes)
│   │   │   ├── db.js                 # Configuração do banco de dados
│   │   │   ├── jwt.js                # Configuração JWT
│   │   │   └── constants.js          # Constantes da aplicação
│   │   ├── controllers/              # Controllers das rotas
│   │   │   ├── authController.js     # Autenticação
│   │   │   ├── empresaController.js  # Gestão de empresas
│   │   │   ├── colaboradorController.js # Gestão de colaboradores
│   │   │   ├── departamentoController.js # Gestão de departamentos
│   │   │   ├── ocorrenciaController.js # Gestão de ocorrências
│   │   │   ├── treinamentoController.js # Gestão de treinamentos
│   │   │   ├── feedbackController.js # Gestão de feedbacks
│   │   │   ├── avaliacaoController.js # Gestão de avaliações
│   │   │   └── pdiController.js      # Gestão de PDI
│   │   ├── models/                   # Modelos do banco de dados
│   │   │   ├── consultoria.js        # Modelo da consultoria
│   │   │   ├── empresa.js            # Modelo de empresa
│   │   │   ├── departamento.js       # Modelo de departamento
│   │   │   ├── colaborador.js        # Modelo de colaborador
│   │   │   ├── colaboradorDepartamento.js # Relação N:N
│   │   │   ├── ocorrencia.js         # Modelo de ocorrência
│   │   │   ├── treinamento.js        # Modelo de treinamento
│   │   │   ├── feedback.js           # Modelo de feedback
│   │   │   ├── avaliacao.js          # Modelo de avaliação
│   │   │   └── pdi.js                # Modelo de PDI
│   │   ├── routes/                   # Definição das rotas
│   │   │   ├── authRoutes.js         # Rotas de autenticação
│   │   │   ├── empresaRoutes.js      # Rotas de empresas
│   │   │   ├── colaboradorRoutes.js  # Rotas de colaboradores
│   │   │   ├── departamentoRoutes.js # Rotas de departamentos
│   │   │   ├── ocorrenciaRoutes.js   # Rotas de ocorrências
│   │   │   ├── treinamentoRoutes.js  # Rotas de treinamentos
│   │   │   ├── feedbackRoutes.js     # Rotas de feedbacks
│   │   │   ├── avaliacaoRoutes.js    # Rotas de avaliações
│   │   │   └── pdiRoutes.js          # Rotas de PDI
│   │   ├── services/                 # Lógica de negócio
│   │   │   ├── feedbackService.js    # Serviços de feedback
│   │   │   ├── avaliacaoService.js   # Serviços de avaliação
│   │   │   └── pdiService.js         # Serviços de PDI
│   │   ├── middlewares/              # Middlewares
│   │   │   ├── authMiddleware.js     # Middleware de autenticação
│   │   │   ├── rbacMiddleware.js     # Controle de acesso
│   │   │   └── validationMiddleware.js # Validação de dados
│   │   └── utils/                    # Utilitários
│   │       ├── logger.js             # Sistema de logs
│   │       └── excelImporter.js      # Importação de Excel
│   ├── public/                       # Arquivos públicos
│   │   └── uploads/                  # Uploads de arquivos
│   ├── logs/                         # Logs da aplicação
│   ├── .env.example                  # Exemplo de variáveis de ambiente
│   └── package.json                  # Dependências do backend
│
├── frontend/                         # Frontend (HTML/CSS/JS + Bootstrap)
│   ├── src/                          # Código fonte do frontend
│   │   ├── components/               # Componentes reutilizáveis
│   │   │   ├── navbar.html           # Barra de navegação
│   │   │   ├── footer.html           # Rodapé
│   │   │   └── cards.html            # Componentes de cards
│   │   ├── pages/                    # Páginas da aplicação
│   │   │   ├── login.html            # Página de login
│   │   │   ├── dashboard.html        # Dashboard principal
│   │   │   ├── colaboradores.html    # Gestão de colaboradores
│   │   │   ├── departamentos.html    # Gestão de departamentos
│   │   │   ├── ocorrencias.html      # Gestão de ocorrências
│   │   │   ├── treinamentos.html     # Gestão de treinamentos
│   │   │   ├── feedbacks.html        # Gestão de feedbacks
│   │   │   ├── avaliacoes.html       # Gestão de avaliações
│   │   │   └── pdi.html              # Gestão de PDI
│   │   └── utils/                    # Utilitários do frontend
│   ├── public/                       # Arquivos públicos
│   │   ├── index.html                # Página principal
│   │   ├── css/                      # Estilos CSS
│   │   ├── js/                       # Scripts JavaScript
│   │   ├── img/                      # Imagens
│   │   └── fonts/                    # Fontes
│   └── package.json                  # Dependências do frontend
│
├── scripts/                          # Scripts auxiliares
│   └── initial.js                    # Script de inicialização
│
├── database/                         # Arquivos do banco de dados
│   └── ezer_dh.sql                   # Script de criação do banco
│
├── docs/                             # Documentação
│   ├── arquitetura.md                # Documentação de arquitetura
│   ├── API.md                        # Documentação da API
│   └── DEPLOYMENT.md                 # Guia de deploy
│
├── tests/                            # Testes
│   ├── unit/                         # Testes unitários
│   │   ├── backend/                  # Testes do backend
│   │   └── frontend/                 # Testes do frontend
│   ├── integration/                  # Testes de integração
│   ├── e2e/                          # Testes end-to-end
│   ├── fixtures/                     # Dados de teste
│   ├── jest.config.js                # Configuração do Jest
│   └── setup.js                      # Configuração dos testes
│
├── .env.example                      # Exemplo de variáveis de ambiente
├── .gitignore                        # Arquivos ignorados pelo Git
├── package.json                      # Configuração do projeto raiz
└── README.md                         # Este arquivo
```

---

## ⚙️ Configuração do ambiente

Antes de começar, copie o arquivo de exemplo de ambiente e ajuste as variáveis sensíveis. Não comite o `.env`.

### 1) Instalar dependências (backend)
```bash
cd backend
npm install
```

### 2) Arquivo `.env` (exemplo)

As credenciais de conexão com o banco devem ser configuradas no arquivo `.env` — **não** deixe valores sensíveis no repositório.

Exemplo:
```
PORT=3000
# DB_HOST deve apontar para o host do banco no Azure (não use `localhost` em produção)
DB_HOST=<seu_host_azure_mysql>
DB_USER=<seu_usuario>
DB_PASSWORD=<sua_senha>
DB_NAME=ezer_dh
# Habilite SSL conforme a configuração do provedor
DB_SSL=true
```

Observação: o banco de dados do projeto é hospedado no Azure; nunca instale ou use uma instância local em produção. As credenciais ficam no arquivo `.env` e a conexão deve usar SSL quando exigido pelo provedor [[memory:8380388]].

---

## Modelo lógico e tabelas principais

Principais tabelas (resumo):
- clientes (empresas)
- departamentos
- colaboradores
- colaboradores_departamentos (relação N:N)
- ocorrencias
- treinamentos
- feedbacks
- avaliacoes
- pdi
- usuarios
- logs

Relacionamentos principais:
- empresa 1:N departamentos
- empresa 1:N colaboradores
- colaboradores N:N departamentos
- colaboradores 1:N ocorrencias
- colaboradores 1:N treinamentos
- colaboradores N:N feedbacks
- colaboradores N:N avaliacoes

---

## 🧩 Etapas do desenvolvimento (resumo)

1. Planejamento funcional
   - Levantamento de requisitos
   - Definição de perfis de usuário e regras de acesso

2. Modelagem do banco de dados
   - Criação do DER
   - Definição de relacionamentos e restrições (FKs)

3. Arquitetura do projeto
   - Separação por camadas (routes, controllers, models, config)
   - Configuração com `dotenv`

4. Desenvolvimento
   - Implementação da API base (Express)
   - Criação das rotas e controllers
   - Implementação da conexão e consultas MySQL
   - Integração com frontend

5. Testes e validação
   - Testes unitários e de integração (Jest, Supertest)
   - Testes de usabilidade

6. Deploy e manutenção
   - Publicação em servidor Azure (Linux)
   - Configuração de PM2 / Nginx
   - Monitoramento e logs

---

## 🧪 Testes planejados

| Tipo | Descrição | Ferramenta |
|------|-----------|-----------|
| Unitário | Teste de funções individuais | Jest |
| Integração | Teste entre módulos (API ↔ DB) | Supertest |
| Usabilidade | Testes com usuários reais | Sessões piloto |
| Validação | Cross-check de dados e regras | Scripts automatizados |

---

## 💼 Futuras expansões

- Análise de performance (BI) e dashboards
- Integração com Power BI
- Pesquisas internas (clima organizacional)
- Notificações e relatórios automatizados (e-mail / PDF)

---

## 👥 Equipes e papéis (resumo)

| Papel | Responsabilidade |
|-------|------------------|
| Consultoria | Administração global e monitoramento |
| Administrador da Empresa | Gestão interna de colaboradores e cadastros |
| Líder | Inserção de feedbacks e avaliações dos liderados |
| Colaborador | Participação em avaliações 360° |

---

## 🛡️ Segurança e controle de acesso

- Autenticação baseada em e-mail corporativo e senha
- Controle de permissões por nível de usuário
- Logs de atividade em banco
- Separação de dados entre empresas clientes

---

## ⚡ Execução rápida (resumo)

```bash
# Clonar o projeto
git clone https://github.com/seuusuario/ezer_dh.git
cd ezer_dh/backend

# Instalar dependências
npm install

# Configurar ambiente (copiar e editar .env)
cp .env.example .env

# Executar em modo de desenvolvimento
npm run dev
```

---

## 🧾 Licença

Este projeto é propriedade intelectual da Ezer Desenvolvimento Humana e não deve ser redistribuído sem autorização.

---

## 📞 Contato

Ezer Desenvolvimento Humano

Desenvolvimento: Paulo Roggê

📧 contato@ezerdh.com.br
🌐 `https://ezerdh.com.br`
