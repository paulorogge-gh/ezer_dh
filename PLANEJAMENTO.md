# 📋 Planejamento Funcional - Ezer Desenvolvimento Humano

## 🔧 Tecnologias Definidas

| Camada | Tecnologia |
|--------|------------|
| **Back-end** | Node.js |
| **Front-end** | HTML, CSS, Bootstrap |
| **Banco de dados** | MySQL |

## 1. 📋 Requisitos Funcionais (RF)

### 🧩 Módulo 1 – Autenticação e Acesso

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF001 | O sistema deve permitir login via e-mail e senha. | Alta |
| RF002 | O sistema deve identificar o tipo de usuário (Consultoria, Admin Empresa, Líder, Colaborador) no login. | Alta |
| RF003 | O sistema deve permitir redefinição de senha via e-mail. | Média |
| RF004 | O sistema deve aplicar controle de acesso baseado em função (RBAC). | Alta |
| RF005 | O sistema deve registrar logs de login e logout. | Média |

### 🏢 Módulo 2 – Gestão de Clientes (Empresas)

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF010 | Consultoria pode cadastrar novas empresas clientes. | Alta |
| RF011 | Consultoria pode editar e excluir empresas existentes. | Alta |
| RF012 | Consultoria pode associar administradores a cada empresa. | Alta |
| RF013 | Cada empresa possui identificação única (CNPJ e nome). | Alta |
| RF014 | Consultoria pode visualizar todas as empresas e seus colaboradores. | Alta |

### 🧍‍♂️ Módulo 3 – Colaboradores

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF020 | Admin da empresa pode cadastrar colaboradores manualmente. | Alta |
| RF021 | Admin pode importar colaboradores via planilha Excel (modelo padrão). | Alta |
| RF022 | O sistema deve validar CPF e e-mails duplicados durante a importação. | Alta |
| RF023 | Cada colaborador deve ter vínculo com empresa e pode pertencer a mais de um departamento. | Alta |
| RF024 | Campos obrigatórios: Empresa, CPF, Nome, Data Nascimento, E-mails, Telefone, Departamento(s), Cargo, Remuneração, Data Admissão, Tipo de Contrato. | Alta |
| RF025 | Admin e líder podem editar dados de colaboradores. | Média |
| RF026 | Consultoria pode visualizar colaboradores de todas as empresas. | Alta |

### 🧩 Módulo 4 – Departamentos

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF030 | Admin pode cadastrar, editar e excluir departamentos. | Alta |
| RF031 | Cada departamento pertence a uma empresa. | Alta |
| RF032 | Colaboradores podem ser associados a vários departamentos (relação N:N). | Alta |

### 📋 Módulo 5 – Ocorrências

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF040 | Admin e líderes podem registrar ocorrências por colaborador. | Alta |
| RF041 | Cada ocorrência deve conter: Data, Classificação (Positivo/Negativo/Neutro), Tipo, Observação. | Alta |
| RF042 | Tipos subdivididos em categorias: Saúde Ocupacional, Ausência, Carreira. | Alta |
| RF043 | O sistema deve permitir filtros por período, classificação e tipo. | Média |
| RF044 | O sistema deve gerar relatórios de ocorrências por colaborador ou departamento. | Média |

### 🎓 Módulo 6 – Treinamentos

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF050 | Admin e líderes podem registrar treinamentos realizados pelos colaboradores. | Alta |
| RF051 | Cada registro deve conter: Data Inicial, Data Final, Categoria (Online/Presencial), Nome, Carga Horária, Observações. | Alta |
| RF052 | O sistema deve permitir filtros por colaborador, período e categoria. | Média |
| RF053 | O sistema deve permitir exportação de relatórios de treinamentos. | Baixa |

### 💬 Módulo 7 – Feedbacks

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF060 | Líder pode registrar feedback para seus liderados. | Alta |
| RF061 | Colaborador pode registrar feedbacks de seus líderes e colegas de departamento (feedback 360º). | Alta |
| RF062 | Cada feedback deve conter: Classificação (Positivo, Para Melhorar, Neutro) e campo de texto livre. | Alta |
| RF063 | O sistema deve registrar data e autor do feedback. | Média |
| RF064 | Controle de acesso baseado em hierarquia e departamento. | Alta |

### 📊 Módulo 8 – Avaliação de Desempenho

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF070 | O sistema deve permitir criação de questionário personalizado por empresa. | Alta |
| RF071 | O sistema deve permitir avaliações nos formatos 90°, 180° e 360°. | Alta |
| RF072 | Escala Likert 1 a 5 para cada questão. | Alta |
| RF073 | O sistema deve permitir adicionar comentário final ao questionário. | Alta |
| RF074 | O sistema deve gerar automaticamente o PDI (Plano de Desenvolvimento Individual) quando a média < 3. | Alta |
| RF075 | O sistema deve armazenar histórico de avaliações. | Alta |

### 🧾 Módulo 9 – PDI (Plano de Desenvolvimento Individual)

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF080 | O sistema deve gerar automaticamente o PDI com base nos resultados da avaliação. | Alta |
| RF081 | O PDI deve conter campos: Objetivo, Ação, Prazo, Responsável, Status. | Média |
| RF082 | O líder pode atualizar e concluir PDIs dos seus liderados. | Média |

### 📈 Módulo 10 – Relatórios e Dashboard

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF090 | O sistema deve gerar relatórios de colaboradores, ocorrências, feedbacks e avaliações. | Alta |
| RF091 | Consultoria deve poder exportar relatórios consolidados por cliente. | Média |
| RF092 | Relatórios devem permitir filtros (empresa, departamento, período, tipo). | Média |

### 🔮 Módulos Futuro

| Código | Descrição | Prioridade |
|--------|-----------|------------|
| RF100 | Módulo de Análise de Performance (dashboard de indicadores). | Baixa |
| RF101 | Módulo de Pesquisas internas (clima organizacional, engajamento). | Baixa |

## 2. 🔧 Requisitos Não Funcionais (RNF)

| Código | Descrição |
|--------|-----------|
| RNF001 | Autenticação via JWT e criptografia de senhas (bcrypt). |
| RNF002 | Interface responsiva usando Bootstrap, compatível com mobile e desktop. |
| RNF003 | Tempo de resposta < 2s por requisição crítica. |
| RNF004 | Logs de operações críticas gravados no banco. |
| RNF005 | Suporte multi-empresa (multi-tenant) no banco. |
| RNF006 | Disponibilidade mínima de 99% em produção (Azure). |
| RNF007 | Banco MySQL hospedado no Azure Database. |
| RNF008 | Front-end em HTML, CSS e Bootstrap, sem frameworks JS avançados. |
| RNF009 | Suporte inicial para 5.000 colaboradores e 100 empresas. |

## 3. 📋 Regras de Negócio (RB)

| Código | Regra | Tipo |
|--------|-------|------|
| RB001 | Um líder só pode lançar feedbacks, ocorrências e treinamentos para seus liderados. | Restrição de Acesso |
| RB002 | Cada colaborador deve pertencer a pelo menos uma empresa e pode estar em múltiplos departamentos. | Integridade |
| RB003 | A importação Excel rejeita CPFs e e-mails duplicados. | Validação |
| RB004 | PDI obrigatório para notas médias < 3. | Automação |
| RB005 | Apenas a consultoria pode excluir empresas. | Segurança |
| RB006 | Avaliações 180° e 360° permitem que colaboradores avaliem líderes e colegas de departamento (feedback 360º). | Fluxo de Autorização e Visibilidade |

## 4. 👥 Perfis de Usuário e Permissões

| Ação / Módulo | Consultoria | Admin Empresa | Líder | Colaborador |
|---------------|-------------|---------------|-------|-------------|
| Cadastrar Empresa | ✅ | ❌ | ❌ | ❌ |
| Cadastrar Colaborador | ✅ | ✅ | ❌ | ❌ |
| Importar Colaboradores | ✅ | ✅ | ❌ | ❌ |
| Cadastrar Departamentos | ✅ | ✅ | ❌ | ❌ |
| Registrar Ocorrências | ✅ | ✅ | ✅ (liderados) | ❌ |
| Registrar Treinamentos | ✅ | ✅ | ✅ (liderados) | ❌ |
| Inserir Feedbacks | ✅ | ✅ | ✅ (liderados) | ✅ (líderes e colegas) |
| Avaliar Desempenho | ✅ | ✅ | ✅ | ✅ |
| Visualizar PDIs | ✅ | ✅ | ✅ | ✅ (próprio) |
| Gerar Relatórios | ✅ | ✅ | ❌ | ❌ |

## 5. 🚀 Roadmap de Desenvolvimento (Sprints)

| Sprint | Entregas Principais |
|--------|-------------------|
| Sprint 1 | Autenticação, Perfis e Permissões |
| Sprint 2 | Cadastros de Empresa, Departamentos e Colaboradores |
| Sprint 3 | Ocorrências e Treinamentos |
| Sprint 4 | Feedbacks (incluindo feedback 360º) |
| Sprint 5 | Avaliações de Desempenho + PDI |
| Sprint 6 | Relatórios e Dashboard |
| Sprint 7 | Módulos Futuro: Análise de Performance e Pesquisas |


---

## 6. ⏰ Linha do Tempo de Desenvolvimento

### 🔹 Fase 1 – Preparação do Ambiente (Semana 1)

**🎯 Objetivo:** Garantir o ambiente de desenvolvimento e a base técnica do projeto.

**📋 Tarefas:**
- Instalar Node.js, MySQL e dependências globais
- Configurar ambiente local e repositório Git
- Criar arquivo .env (variáveis de ambiente)
- Inicializar package.json e instalar dependências (express, mysql2, jsonwebtoken, bcrypt, cors, xlsx, dotenv)
- Criar script inicial de execução (npm start / nodemon)
- Executar script de criação de estrutura de diretórios

### 🔹 Fase 2 – Backend: Base e Modelagem (Semanas 2 e 3)

**🎯 Objetivo:** Implementar a camada de dados e estrutura principal do backend.

**📋 Tarefas:**
- Criar e testar conexão MySQL (db.js)
- Implementar modelos de dados (Consultoria, Empresa, Departamento, Colaborador, Ocorrência, Treinamento, Feedback, Avaliação, PDI)
- Criar relacionamentos e FKs
- Popular base inicial (scripts SQL de exemplo)
- Implementar constantes e utilitários (constants.js, logger.js)
- Testar integridade da base e rotas iniciais

### 🔹 Fase 3 – Backend: Lógica de Negócio e APIs (Semanas 4 a 6)

**🎯 Objetivo:** Criar toda a API REST com controle de acesso e autenticação.

**📋 Tarefas:**
- Implementar autenticação JWT (authController, authMiddleware)
- Implementar RBAC completo (rbacMiddleware)
- Criar controladores e rotas CRUD:
  - Empresas
  - Departamentos
  - Colaboradores
  - Ocorrências
  - Treinamentos
- Implementar serviços:
  - Importação Excel
  - Feedback 360º (feedbackService.js)
  - Avaliações 90/180/360 (avaliacaoService.js)
  - PDI (pdiService.js)
- Testar todas as rotas com Postman/Insomnia
- Gerar documentação básica da API (endpoints, parâmetros, retornos)

### 🔹 Fase 4 – Frontend: Estrutura e Layout (Semanas 7 e 8)

**🎯 Objetivo:** Criar as interfaces do sistema e estrutura de navegação.

**📋 Tarefas:**
- Criar páginas HTML: login, dashboard, colaboradores, departamentos, ocorrências, treinamentos, feedbacks, avaliações, PDI
- Criar componentes reutilizáveis: navbar, footer, cards
- Aplicar Bootstrap (tema corporativo e responsivo)
- Implementar scripts JS de navegação e autenticação (armazenar token JWT)
- Criar layout unificado (header/footer fixos, menu lateral se necessário)

### 🔹 Fase 5 – Frontend: Funcionalidades e Integração (Semanas 9 a 10)

**🎯 Objetivo:** Integrar frontend com backend via API REST e AJAX.

**📋 Tarefas:**
- Criar funções fetch/AJAX para CRUDs e autenticação
- Exibir dados em tabelas dinâmicas (DataTables opcional)
- Implementar formulários com validações (CPF, e-mail, datas)
- Integrar módulos:
  - Ocorrências
  - Treinamentos
  - Feedback 360º
  - Avaliação de desempenho
  - PDI
- Tratar erros e mensagens de sucesso/erro via modal ou alert

### 🔹 Fase 6 – Testes e Qualidade (Semanas 11 e 12)

**🎯 Objetivo:** Garantir estabilidade e segurança antes da entrega.

**📋 Tarefas:**
- Testes unitários em serviços críticos (feedback, avaliação, PDI)
- Testes de integração (CRUD completo via API)
- Testes manuais de fluxo: login → cadastro → feedback → avaliação → PDI
- Revisão de segurança:
  - Validação de permissões RBAC
  - Sanitização de entradas
  - Tokens JWT válidos e seguros
- Correção de bugs e inconsistências

### 🔹 Fase 7 – Documentação e Entrega (Semana 13)

**🎯 Objetivo:** Finalizar documentação e preparar entrega/hospedagem.

**📋 Tarefas:**
- Documentar API (docs/arquitetura.md)
- Documentar estrutura do projeto e rotas principais
- Criar README final com instruções de instalação e uso
- Configurar ambiente de produção (Azure ou outro)
- Teste final em produção e validação de acessos

### 🔹 Fase 8 – Futuro (Evoluções Planejadas)

**🎯 Objetivo:** Extensões pós-lançamento.

**🚀 Funcionalidades futuras:**
- Dashboard de Performance e Indicadores
- Pesquisas internas (clima, satisfação, engajamento)
- Relatórios exportáveis (PDF, Excel)
- Notificações por e-mail e integração com Microsoft 365
