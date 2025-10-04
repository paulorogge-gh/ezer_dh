# 🧠 Ezer Desenvolvimento Humano (ezer_dh)

## 📘 Descrição Geral

**Ezer Desenvolvimento Humano (ezer_dh)** é um sistema web voltado para **consultorias de RH e empresas clientes** com o objetivo de **gerenciar pessoas, desempenho e desenvolvimento humano**.  
A plataforma permite que uma **consultoria** administre diversas empresas (clientes), e que cada empresa possua controle completo sobre seus **colaboradores, departamentos, feedbacks e avaliações de desempenho**.

---

## 🚀 Objetivo do Sistema

- Centralizar a **gestão de colaboradores e departamentos** de múltiplos clientes;
- Facilitar o **lançamento de feedbacks** entre líderes e liderados;
- Realizar **avaliações de desempenho 90º, 180º e 360º** com base em escalas Likert;
- Registrar **ocorrências e treinamentos** de colaboradores;
- Apoiar a consultoria na **análise e desenvolvimento humano** das empresas atendidas.

---

## 🧩 Estrutura Funcional do Sistema

### 1. **Cadastro de Cliente (Empresa)**
- Dados cadastrais da empresa (razão social, CNPJ, email, telefone, endereço, etc.);
- Múltiplos usuários (administrador, líderes e colaboradores);
- Cadastro de **departamentos** e vínculo com colaboradores;
- Cada colaborador pode pertencer a **mais de um departamento**.

---

### 2. **Cadastro de Colaboradores**
#### 📋 Dados pessoais:
- Empresa, CPF, Nome, Data de Nascimento, Email pessoal e corporativo, Telefone;
- Departamento(s), Cargo, Remuneração, Data de admissão;
- Tipo de contrato: **CLT, Prestador de Serviço, Estagiário, Jovem Aprendiz**;
- Importação em massa via **modelo Excel**.

#### ⚙️ Registro de Ocorrências:
- Data da ocorrência;
- Classificação: **Positivo, Negativo ou Neutro**;
- Tipo: **Saúde Ocupacional, Ausência, Carreira**;
  - Exemplos: Exame Admissional, Periódico, Falta, Promoção, Atestado, Advertência, Ideia/Contribuição, etc.
- Campo de observações detalhadas.

#### 🎓 Registro de Treinamentos:
- Datas (início e fim);
- Categoria: **Online ou Presencial**;
- Nome do treinamento;
- Carga horária;
- Observações e anotações do avaliador.

---

### 3. **Departamentos**
- Cadastro e gerenciamento de departamentos por empresa;
- Vínculo de líderes e colaboradores;
- Permite um colaborador estar em múltiplos departamentos;
- Relacionamento direto com feedbacks e avaliações de desempenho.

---

### 4. **Feedbacks**
- Inserção feita pelo **cliente (empresa)** e **líderes**;
- Classificação: **Positivo**, **Para Melhorar** ou **Neutro**;
- Campo aberto para descrição do feedback;
- Controle de acesso:
  - Líder → pode lançar feedbacks apenas para liderados;
  - Colaborador → pode lançar feedbacks para **líderes e colegas de departamento** (modelo 360º).

---

### 5. **Avaliação de Desempenho**
- Sistema de avaliação baseado na **escala Likert (1 a 5)**;
- Três níveis:
  - **90º** – Líder avalia liderado;
  - **180º** – Líder e liderado se avaliam mutuamente;
  - **360º** – Líder, liderado e pares (colegas de departamento) se avaliam;
- Cada empresa possui **questionário próprio** (personalizável);
- Comentário final obrigatório;
- **PDI (Plano de Desenvolvimento Individual)** gerado automaticamente a partir das notas obtidas.

---

### 6. **Futuras Expansões**
- **Análise de Performance:** dashboards com métricas de desempenho e engajamento;
- **Pesquisas Organizacionais:** coleta de percepções sobre clima, cultura e liderança.

---

## 👥 Classificação de Usuários

| Tipo de Usuário | Permissões |
|-----------------|-------------|
| **Consultoria (Global)** | Acesso total a todas as empresas, colaboradores e registros. |
| **Administrador da Empresa** | Acesso total aos dados da sua empresa (cadastros, relatórios, avaliações). |
| **Líder** | Acesso aos seus liderados (feedbacks, avaliações, ocorrências, treinamentos). |
| **Colaborador** | Pode avaliar líderes e colegas de departamento (modelo 360º) e visualizar seu próprio histórico. |

---

## 🏗️ Arquitetura do Projeto

### 🧱 Estrutura
- **Backend:** Node.js (Express)
- **Frontend:** HTML5, CSS3, Bootstrap
- **Banco de Dados:** MySQL
- **ORM:** (opcional) Sequelize ou consultas SQL nativas
- **Deploy:** Servidor Linux (Ubuntu / Apache ou Nginx)

### 📂 Estrutura de Diretórios

/ezer_dh
│
├── /src
│ ├── /config # Configurações gerais e conexão ao banco
│ ├── /controllers # Lógica de negócios e validações
│ ├── /models # Definições de tabelas e relacionamentos
│ ├── /routes # Rotas HTTP (API REST)
│ ├── /middlewares # Autenticação e controle de acesso
│ ├── /services # Regras auxiliares e integrações
│ └── /utils # Funções utilitárias e helpers
│
├── /public
│ ├── /css # Estilos Bootstrap e customizados
│ ├── /js # Scripts do frontend
│ ├── /img # Imagens e ícones
│ └── /uploads # Importações via Excel e arquivos anexos
│
├── /views # Páginas HTML renderizadas
│
├── /tests # Scripts e relatórios de testes
│
├── package.json
├── app.js # Ponto de entrada do servidor Node.js
├── .env # Configurações de ambiente
└── README.md


---

## 🗄️ Banco de Dados – ezer_dh

### Principais Tabelas
- `consultorias`
- `empresas`
- `departamentos`
- `colaboradores`
- `usuarios`
- `ocorrencias`
- `treinamentos`
- `feedbacks`
- `avaliacoes`
- `avaliacoes_perguntas`
- `avaliacoes_respostas`
- `pdi_planos`

### Principais Relacionamentos
- Uma **consultoria** → várias **empresas**
- Uma **empresa** → vários **departamentos** e **colaboradores**
- Um **colaborador** → pode pertencer a **múltiplos departamentos**
- Um **líder** → avalia **liderados e pares**
- Um **colaborador** → envia feedbacks a **líderes e colegas**

---

## 🔐 Controle de Acesso

O sistema utiliza **autenticação por sessão (JWT ou cookie)** e middleware de controle de acesso:

- Verifica tipo de usuário antes de acessar qualquer rota;
- Restringe ações (ex: colaborador não pode cadastrar outro colaborador);
- Registra logs de login, ações críticas e falhas de autenticação.

---

## ⚙️ Ambiente de Desenvolvimento

### Requisitos
- Node.js 20+
- MySQL 8+
- NPM ou Yarn
- Servidor Linux com Apache ou Nginx

### Instalação

```bash
git clone https://github.com/paulorogge-gh/ezer_dh.git
cd ezer_dh
npm install
cp .env.example .env
# Configure variáveis de ambiente no .env
npm start
