# 🧠 Ezer Desenvolvimento Humano

**Ezer Desenvolvimento Humano (Ezer DH)** é uma plataforma web voltada para **gestão de pessoas, performance e desenvolvimento humano**. A solução é oferecida para empresas clientes por meio de uma **consultoria especializada**.

O sistema permite gerenciar empresas, colaboradores, departamentos, ocorrências, feedbacks, treinamentos e avaliações de desempenho (90°, 180°, 360°), oferecendo uma visão completa da evolução e comportamento dos profissionais.

---

## 🏗️ Visão geral do projeto

O **Ezer DH** é uma aplicação web modular composta por um **backend em Node.js (API e regras de negócio)** e um **frontend em HTML/CSS/Bootstrap**, integrados a um banco de dados **MySQL**.

### 🎯 Objetivo

Automatizar e centralizar processos de **gestão de pessoas** e **avaliação de desempenho** para consultorias e empresas clientes, com controle de acesso hierárquico e indicadores de performance.

---

## 🌐 Configuração de Portas

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| **Frontend** | 3000 | http://localhost:3000 | Interface web do usuário |
| **Backend API** | 3001 | http://localhost:3001 | API REST e autenticação |
| **Health Check** | 3001 | http://localhost:3001/api/health | Verificação de status |

### 🚀 Como iniciar o projeto:
```bash
# Iniciar ambos os servidores
./start.sh

# Ou iniciar separadamente:
# Backend (porta 3001)
cd backend && npm start

# Frontend (porta 3000)  
cd frontend && npm start
```

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

### 2.1. Gestão de Líderes e Liderados (novo módulo)
### 2.2. Gerenciamento de Usuários (RBAC)

Módulo para administração das contas de acesso com controle estrito por RBAC, seguindo o planejamento (RF001–RF005, RBAC/RB). Permite consultar/criar/atualizar/excluir usuários com tipos: `consultoria`, `empresa`, `colaborador`.

Banco:
- Tabela `usuario` (já existente): `id_usuario`, `email` (único), `senha` (bcrypt), `tipo_usuario` (`consultoria|empresa|colaborador`), `id_referencia`, `status`, `ultimo_login`, `tentativas_login`, `bloqueado_ate`.

API:
- GET `/api/usuarios?empresa_id&tipo_usuario&status` — Lista (consultoria: todos; empresa: escopo da própria; colaborador: apenas próprio)
- GET `/api/usuarios/:id` — Detalhe (restrito ao escopo)
- POST `/api/usuarios` — Criar (consultoria/empresa)
- PUT `/api/usuarios/:id` — Atualizar (consultoria/empresa; colaborador apenas próprio e sem alterar status)
- PATCH `/api/usuarios/:id/status` — Alterar status (consultoria/empresa)
- POST `/api/usuarios/:id/reset-password` — Reset de senha (consultoria/empresa)
- DELETE `/api/usuarios/:id` — Excluir (consultoria/empresa)

RBAC:
- `consultoria`: CRUD completo em `usuarios`.
- `empresa`: CRUD em `usuarios` do seu escopo (usuários tipo `empresa` da própria e `colaborador` da própria empresa).
- `colaborador`: leitura do próprio e atualização limitada (e-mail/senha).

Frontend:
- Página `frontend/public/usuarios.html` + script `frontend/public/js/usuarios.js`.
- Filtros: Empresa, Tipo, Status; busca por e-mail; ações: criar, editar, reset de senha, alterar status, excluir.
- Navegação adicionada na sidebar.


Este módulo permite definir líderes por empresa, gerenciar seus liderados e os departamentos que supervisionam, com interações via modais e atualização dinâmica no frontend (fetch/AJAX), seguindo o layout minimalista existente.

- Seleção de Empresa: filtro por empresa e controle de permissões de acesso.
- Definição de Líder: um colaborador ativo da empresa pode ser definido como líder.
- Gerenciamento de Liderados: adicionar/remover liderados do líder.
- Gerenciamento de Departamentos: vincular/desvincular departamentos ao líder.

Estrutura de banco de dados:

```
lider (id_lider PK, id_empresa FK->empresa, id_colaborador FK->colaborador, status, created_at, updated_at)
lider_membro (id_lider FK->lider, id_liderado FK->colaborador, PK composto)
lider_departamento (id_lider FK->lider, id_departamento FK->departamento, PK composto)
```

Rotas da API (todas autenticadas, respostas JSON padronizadas):

- GET `/api/lideres?empresa_id=ID&status=Ativo|Inativo` — listar líderes (opcionalmente por empresa/status)
- GET `/api/lideres/:id` — detalhes de um líder
- POST `/api/lideres` — criar líder
  - Body: `{ "id_empresa": number, "id_colaborador": number, "status": "Ativo"|"Inativo" }`
- PUT `/api/lideres/:id` — atualizar líder (status e/ou colaborador)
  - Body: `{ "id_empresa"?: number, "id_colaborador"?: number, "status"?: "Ativo"|"Inativo" }`
- DELETE `/api/lideres/:id` — excluir líder
- GET `/api/lideres/:id/membros` — listar liderados
- POST `/api/lideres/:id/membros` — adicionar liderado
  - Body: `{ "liderado_id": number }`
- DELETE `/api/lideres/:id/membros/:liderado_id` — remover liderado
- GET `/api/lideres/:id/departamentos` — listar departamentos do líder
- POST `/api/lideres/:id/departamentos` — adicionar departamento ao líder
  - Body: `{ "departamento_id": number }`
- DELETE `/api/lideres/:id/departamentos/:departamento_id` — remover departamento do líder

Permissões (RBAC):

- `consultoria`: create/read/update/delete em `lideres`.
- `empresa`: create/read/update/delete em `lideres` da própria empresa.
- `colaborador`: read (leitura) onde aplicável.

Frontend:

- Página `frontend/public/lideres.html` e script `frontend/public/js/lideres.js`.
- Filtro por empresa, busca por nome do líder, ações na lista: Ver, Editar, Gerenciar Liderados, Gerenciar Departamentos, Excluir.
- Modais:
  - Novo Líder: seleção de empresa e colaborador ativo da empresa.
  - Gerenciar Liderados: lista atual, seleção e adição de novos, remoção individual.
  - Gerenciar Departamentos: lista atual, seleção e adição de novos, remoção individual.

Validações importantes:

- Só é possível definir como líder um colaborador da mesma empresa.
- Liderados precisam pertencer à mesma empresa do líder e não podem ser o próprio líder.
- Departamentos vinculados devem pertencer à mesma empresa do líder.

Logs:

- Operações críticas registradas via `logDatabase` e `logError` (inserções/remoções em `lider`, `lider_membro`, `lider_departamento`).


---

## 🛠️ Plano de Correções e Padronização (Guia de Execução)

Objetivo: organizar, padronizar e eliminar duplicidades para garantir funcionamento estável e consistente em produção.

### 1) API e Integração
- [x] Alinhar Base URL em docs com o projeto (Frontend 3000, Backend 3001, base `/api`).
- [x] Padronizar chamadas protegidas: usar `auth.authenticatedRequest` + `API_CONFIG.BASE_URL` (JWT); manter `EzerAPI` apenas para públicos.
- [x] Uniformizar respostas `{ success, data, error, message }` nos endpoints principais (Empresas, Colaboradores, Departamentos); ampliar para módulos restantes conforme ativação.
- [x] `Colaborador.findAll` aceitar `?status=Ativo|Inativo`; padrão “todos” (alinhar com Empresas).
- [x] Garantir `empresa_nome` em todas as listagens (JOIN consistente), já aplicado em `findAll/findById/findByEmpresa`.

### 2) Backend – Regras e Validações
- [x] Centralizar normalização de datas (yyyy-mm-dd) e strings (trim) nos controllers.
- [x] Validar RF024 (Colaboradores) no create/update (já no create): Empresa, CPF, Nome, Data Nascimento, E-mail(s), Telefone, Departamentos, Cargo, Remuneração, Data Admissão, Tipo Contrato.
- [x] Reconciliação de `departamentos` no update (já aplicada): dif atual vs novo, add/remove com logs.
- [x] Revisar RBAC nas rotas de associação (add/remove) para apenas Empresa/Consultoria (checagem de mesma empresa + permissão).
- [x] Aceitar atualização parcial sem falhas por campos ausentes (merge e defaults).

### 3) Frontend – Páginas/Componentes
- [x] Padronizar includes: `config.js`, `auth.js`, `ui.js`, `alerts.js`, `confirm.js`, `app.js` e script do módulo.
- [x] Migrar páginas para `minimal.css`; descontinuar `style.css` (migrar o que for necessário, remover o restante).
- [x] Spinner (`EzerLoading`) em todas as cargas: listagens, modais, ações CRUD (aplicado onde há operações; expandir conforme módulos ganharem listagem padronizada).
- [x] Ações nas tabelas: Ver/Editar (botões), Inativar/Excluir (ícones-only `.btn-icon`) nas páginas padronizadas (Empresas/Colaboradores); expandindo para demais módulos.
- [x] Reintroduzir Importação de Colaboradores (RF021) com `auth.authenticatedRequest` + toasts `alerts.js`.
- [x] KPI cards com `EzerKPI` onde houver estatísticas (padrão Empresas/Colaboradores; aguarda endpoints dos demais módulos).
- [x] Busca minimalista (ícone + debounce) e evitar DataTables nas novas páginas (manteremos um único padrão).

### 4) Frontend – Formulários e Máscaras
- [x] Inputs de data com `type="date"`; máscara de data não aplicada a nativos.
- [x] Converter datas para `yyyy-mm-dd` antes de enviar.
- [x] Remuneração com máscara BRL e conversão para decimal no submit (já aplicado); formatar visualização com `R$`.
- [x] Departamentos como checkboxes; enviar `departamentos` no body (backend reconcilia).
- [x] Validação RF024 no front: aplicar `.is-invalid`/`.checkbox-list.invalid` e focar no primeiro erro.

### 5) UI/UX e Estilos
- [x] Consolidar componentes globais: `alerts.js` (toasts), `confirm.js`, `showFormModal`, `showInfoModal`.
- [x] Aplicar `form-grid`, `details-grid`, `kpi-grid`, `.btn-icon`, `.form-select` (seta minimalista) em todas as páginas novas/padronizadas.
- [x] Modais com `max-height: calc(100vh - 80px)` e `overflow: auto` no corpo.
- [x] Favicon padrão em todas as páginas.

### 6) Logs e Erros
- [x] Padronizar mensagens de erro no backend; front sempre exibir `showAlert('error', ...)` (fallback `EzerNotifications`).
- [x] Logs claros de operações (`logDatabase`, `logError`) em pontos críticos.
- [x] Verificar `/api/health` e adicionar seção de troubleshooting (README).

### 7) Documentação
- [x] Atualizar README com fluxos e endpoints reais.
- [x] Atualizar docs de rotas e RBAC com exemplos de payloads.
- [x] Documentar `config.js` e variáveis de ambiente esperadas.

### 8) Limpeza
- [x] Remover referências a IDs antigos em JS (ex.: `searchInput`, `empresaFilter`, `departamentoFilter`) — checadas e removidas; variáveis atuais usam checagens seguras e IDs existentes.
- [x] Remover duplicidades em `style.css` e manter apenas `minimal.css` — páginas não referenciam `style.css` (mantido apenas para histórico; não é carregado).
- [x] Padronizar mecanismo de toasts, manter `EzerNotifications` apenas como fallback — ajustado também no `dashboard.js`.

---

## Health Check e Troubleshooting

- Health Check da API: `GET /api/health`
  - Resposta exemplo:
  ```json
  { "status": "OK", "timestamp": "2025-10-18T12:00:00.000Z", "uptime": 123.45, "environment": "development" }
  ```
- Problemas comuns e soluções:
  - Autenticação 401/403: verifique `Authorization: Bearer <token>` e expiração do JWT; se necessário, efetue login novamente.
  - CORS: conferir cabeçalhos do fetch e origem; backend usa `cors({ origin: true, credentials: true })` em dev.
  - Banco de dados: se `/api/health` OK porém operações falham, revisar `.env` no backend (host Azure, SSL habilitado). [[memory:8380388]]
  - Base URL: no frontend, `window.API_CONFIG.BASE_URL` deve apontar para a API correta.

## Configuração do Frontend (config.js)

Exemplo de configuração esperada no `frontend/public/js/config.js`:
```js
window.API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api'
};
window.FRONTEND_CONFIG = {
  LOGIN_PAGE: '/login-minimal',
  DASHBOARD_URL: '/dashboard-minimal'
};
```

## Exemplos de RBAC e Payloads

- Associação de colaborador a departamento (empresa/consultoria):
  - `POST /api/colaboradores/:id/departamentos`
  - Body: `{ "departamento_id": 12 }`
- Remoção de associação:
  - `DELETE /api/colaboradores/:id/departamentos/:departamento_id`
- Atualização de colaborador com reconciliação de departamentos:
  - `PUT /api/colaboradores/:id`
  - Body (exemplo):
  ```json
  {
    "nome": "João Silva",
    "id_empresa": 3,
    "departamentos": [2, 5, 7],
    "data_nascimento": "1990-05-10",
    "data_admissao": "2020-01-15",
    "status": "Ativo"
  }
  ```

### 9) Testes
- [ ] Criar checklist/manual para fluxos principais: Login → Empresas (CRUD) → Colaboradores (CRUD + Departamentos + Importação) → Departamentos.
- [ ] Testar RBAC por perfil.
- [ ] Validar formatos de data e moeda fim-a-fim.

---

### ✅ Ordem sugerida de execução
1. API e integração (authenticatedRequest + API_CONFIG) e documentação.
2. Backend: normalizações, validações (RF024), reconciliação e RBAC.
3. Frontend: migração para `minimal.css`, componentes globais e spinner.
4. Importação de Colaboradores e KPI cards padronizados.
5. Padronização de tabelas (ações) e barra de busca.
6. Testes de RBAC e fluxos e correções finais.


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
| **Backend** | Node.js (Express) - Porta 3001 |
| **Frontend** | HTML5, CSS3, Bootstrap 5 - Porta 3000 |
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
│   │   │   ├── login-minimal.html    # Página de login (minimal)
│   │   │   ├── dashboard-minimal.html # Dashboard principal (minimal)
│   │   │   ├── colaboradores.html    # Gestão de colaboradores
│   │   │   ├── departamentos.html    # Gestão de departamentos
│   │   │   ├── ocorrencias.html      # Gestão de ocorrências
│   │   │   ├── treinamentos.html     # Gestão de treinamentos
│   │   │   ├── feedbacks.html        # Gestão de feedbacks
│   │   │   ├── avaliacoes.html       # Gestão de avaliações
│   │   │   └── pdi.html              # Gestão de PDI
│   │   └── utils/                    # Utilitários do frontend
│   ├── public/                       # Arquivos públicos
│   │   ├── index-minimal.html        # Página principal (redirecionamento inteligente)
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
PORT_API=3000
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

## 🚀 Deploy Automático (GitHub → Azure Web App)

Este projeto está pronto para deploy contínuo no Azure Web App a partir do GitHub.

### Pré-requisitos
- Um App Service (Azure Web App) criado (Linux) com stack Node.js.
- Publicação via perfil de publicação (Publish Profile) e Secrets configurados no GitHub.

### 1) Configurar Secrets no GitHub
No repositório GitHub, acesse Settings → Secrets and variables → Actions → New repository secret, e adicione:
- `AZURE_WEBAPP_NAME`: Nome do seu Web App (ex.: `ezer-dh-webapp-prod`).
- `AZURE_WEBAPP_PUBLISH_PROFILE`: Conteúdo do Publish Profile (XML) obtido no Azure Portal: Web App → Get publish profile.

### 2) Workflow de Deploy
O arquivo `/.github/workflows/main_ezerdh.yml` já está adicionado. Ele:
- Faz checkout do código.
- Instala dependências no root, `backend` e `frontend`.
- Cria um artefato `.zip` e publica no Azure Web App.

Branch de deploy: `main`. A cada push na `main`, o Azure fará o deploy automaticamente.

### 3) App Settings no Azure (Configurações de Aplicativo)
No seu Web App (Azure Portal → Configuration → Application settings), adicione as seguintes chaves:
- `WEBSITE_NODE_DEFAULT_VERSION=18` (ou 20, conforme seu Web App)
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true` (habilita build do Node durante o deploy)
- `NODE_ENV=production`
- `PORT` (opcional; o Azure fornece automaticamente)
- Banco de Dados (com SSL):
  - `DB_HOST=<seu_host_azure_mysql>`
  - `DB_PORT=3306`
  - `DB_USER=<seu_usuario>`
  - `DB_PASSWORD=<sua_senha>`
  - `DB_NAME=ezer_dh`
  - `DB_SSL=true`

### 4) Logs e Health Check
- Health: `GET /api/health` (deve retornar `{ status: "OK" }` etc.).
- Logs: ver `backend/logs`. Ajuste retenção conforme necessidade.

### 5) Como funciona em produção
- O backend Express inicia na porta fornecida pelo Azure (`process.env.PORT`).
- Em `production`, o backend serve os arquivos estáticos do `frontend/public` e mapeia rotas conhecidas (`/login-minimal`, `/dashboard-minimal`, etc.).
- O frontend usa `window.location.origin` em produção para montar `BASE_URL` da API.

### 6) Troubleshooting
- 403/401: verifique JWT e expiração; faça login novamente.
- Falha ao conectar no MySQL: cheque App Settings do Azure e SSL (`DB_SSL=true`).
- Dependências ausentes: garanta `SCM_DO_BUILD_DURING_DEPLOYMENT=true` no App Settings; o Oryx fará o build.
- Node versão: defina `WEBSITE_NODE_DEFAULT_VERSION=18` ou `20`.


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

## 🔐 Sistema de Autenticação

### Estrutura de Usuários
O sistema utiliza uma **tabela unificada de usuários** (`usuario`) que centraliza a autenticação para todos os tipos de usuários:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_usuario` | INT | Chave primária |
| `email` | VARCHAR(255) | Email único para login |
| `senha` | VARCHAR(255) | Senha criptografada (bcrypt) |
| `tipo_usuario` | ENUM | 'consultoria', 'empresa', 'colaborador' |
| `id_referencia` | INT | ID da tabela específica (consultoria, empresa, colaborador) |
| `status` | ENUM | 'Ativo', 'Inativo' |
| `ultimo_login` | TIMESTAMP | Data do último acesso |
| `tentativas_login` | INT | Contador de tentativas falhadas |
| `bloqueado_ate` | TIMESTAMP | Data de desbloqueio (se bloqueado) |

### Fluxo de Autenticação
1. **Login**: Usuário informa email/senha
2. **Validação**: Sistema busca na tabela `usuario`
3. **Identificação**: `tipo_usuario` + `id_referencia` define o perfil
4. **Dados**: Sistema busca dados específicos na tabela correspondente
5. **Permissões**: RBAC aplicado baseado no `tipo_usuario`

### Segurança
- **Senhas**: Criptografadas com bcrypt (12 rounds)
- **Tokens**: JWT com expiração de 24h
- **Bloqueio**: Após 5 tentativas falhidas (30 min)
- **RBAC**: Controle granular por módulo/ação

---

## 🧩 Etapas do desenvolvimento (resumo)

1. Planejamento funcional
   - Levantamento de requisitos
   - Definição de perfis de usuário e regras de acesso

2. Modelagem do banco de dados
   - Criação do DER
   - Definição de relacionamentos e restrições (FKs)
   - Sistema de autenticação com tabela `usuario` unificada

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
