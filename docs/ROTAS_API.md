# 📋 Documentação das Rotas da API - Ezer Desenvolvimento Humano

## 🔐 Autenticação (`/api/auth`)

| Método | Rota | Descrição | Autenticação | Permissões |
|--------|------|-----------|--------------|------------|
| POST | `/login` | Login do usuário | ❌ | Público |
| POST | `/logout` | Logout do usuário | ✅ | Usuário logado |
| POST | `/refresh` | Renovar token de acesso | ❌ | Token refresh válido |
| GET | `/profile` | Obter perfil do usuário | ✅ | Usuário logado |
| PUT | `/change-password` | Alterar senha | ✅ | Usuário logado |
| GET | `/verify` | Verificar se token é válido | ✅ | Usuário logado |

## 🏢 Consultoria (`/api/consultoria`)

| Método | Rota | Descrição | Autenticação | Permissões |
|--------|------|-----------|--------------|------------|
| GET | `/` | Listar todas as consultorias | ✅ | Consultoria |
| GET | `/:id` | Buscar consultoria por ID | ✅ | Consultoria |
| POST | `/` | Criar nova consultoria | ✅ | Consultoria |
| PUT | `/:id` | Atualizar consultoria | ✅ | Consultoria |
| DELETE | `/:id` | Deletar consultoria | ✅ | Consultoria |
| GET | `/:id/empresas` | Buscar empresas da consultoria | ✅ | Consultoria |

## 🏭 Empresas (`/api/empresas`)

| Método | Rota | Descrição | Autenticação | Permissões |
|--------|------|-----------|--------------|------------|
| GET | `/` | Listar todas as empresas | ✅ | Consultoria |
| GET | `/:id` | Buscar empresa por ID | ✅ | Empresa/Consultoria |
| POST | `/` | Criar nova empresa | ✅ | Consultoria |
| PUT | `/:id` | Atualizar empresa | ✅ | Empresa/Consultoria |
| DELETE | `/:id` | Deletar empresa | ✅ | Consultoria |
| GET | `/:id/colaboradores` | Buscar colaboradores da empresa | ✅ | Empresa/Consultoria |
| GET | `/:id/departamentos` | Buscar departamentos da empresa | ✅ | Empresa/Consultoria |
| GET | `/:id/stats` | Estatísticas da empresa | ✅ | Empresa/Consultoria |

## 🏢 Departamentos (`/api/departamentos`)

| Método | Rota | Descrição | Autenticação | Permissões |
|--------|------|-----------|--------------|------------|
| GET | `/` | Listar todos os departamentos | ✅ | Empresa/Consultoria |
| GET | `/:id` | Buscar departamento por ID | ✅ | Empresa/Consultoria |
| POST | `/` | Criar novo departamento | ✅ | Empresa/Consultoria |
| PUT | `/:id` | Atualizar departamento | ✅ | Empresa/Consultoria |
| DELETE | `/:id` | Deletar departamento | ✅ | Empresa/Consultoria |
| GET | `/:id/colaboradores` | Buscar colaboradores do departamento | ✅ | Empresa/Consultoria |
| POST | `/:id/colaboradores` | Adicionar colaborador ao departamento | ✅ | Empresa/Consultoria |
| DELETE | `/:id/colaboradores/:colaborador_id` | Remover colaborador do departamento | ✅ | Empresa/Consultoria |
| GET | `/:id/stats` | Estatísticas do departamento | ✅ | Empresa/Consultoria |

## 👥 Colaboradores (`/api/colaboradores`)

| Método | Rota | Descrição | Autenticação | Permissões |
|--------|------|-----------|--------------|------------|
| GET | `/` | Listar todos os colaboradores | ✅ | Colaborador/Empresa/Consultoria |
| GET | `/:id` | Buscar colaborador por ID | ✅ | Colaborador/Empresa/Consultoria |
| POST | `/` | Criar novo colaborador | ✅ | Empresa/Consultoria |
| PUT | `/:id` | Atualizar colaborador | ✅ | Colaborador/Empresa/Consultoria |
| DELETE | `/:id` | Deletar colaborador | ✅ | Empresa/Consultoria |
| GET | `/:id/departamentos` | Buscar departamentos do colaborador | ✅ | Colaborador/Empresa/Consultoria |
| POST | `/:id/departamentos` | Adicionar colaborador ao departamento | ✅ | Empresa/Consultoria |
| DELETE | `/:id/departamentos/:departamento_id` | Remover colaborador do departamento | ✅ | Empresa/Consultoria |
| GET | `/:id/ocorrencias` | Buscar ocorrências do colaborador | ✅ | Colaborador/Empresa/Consultoria |
| GET | `/:id/treinamentos` | Buscar treinamentos do colaborador | ✅ | Colaborador/Empresa/Consultoria |
| GET | `/:id/stats` | Estatísticas do colaborador | ✅ | Colaborador/Empresa/Consultoria |

## 🔍 Health Check

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/health` | Status da API | ❌ |

## 📊 Resumo por Módulo

### 🔐 Autenticação (6 rotas)
- **Públicas:** 2 (login, refresh)
- **Protegidas:** 4 (logout, profile, change-password, verify)

### 🏢 Consultoria (6 rotas)
- **Todas protegidas** - Apenas consultoria

### 🏭 Empresas (8 rotas)
- **Consultoria:** 6 rotas (CRUD + listagem)
- **Empresa/Consultoria:** 2 rotas (dados específicos)

### 🏢 Departamentos (9 rotas)
- **Todas protegidas** - Empresa/Consultoria

### 👥 Colaboradores (11 rotas)
- **Empresa/Consultoria:** 6 rotas (CRUD + gestão)
- **Colaborador/Empresa/Consultoria:** 5 rotas (dados específicos)

## 🛡️ Sistema de Permissões

### 👑 Consultoria
- **Acesso total** a todas as rotas
- **Pode gerenciar** todas as empresas e dados

### 🏭 Empresa
- **Acesso limitado** aos próprios dados
- **Pode gerenciar** colaboradores e departamentos da própria empresa

### 👤 Colaborador
- **Acesso limitado** aos próprios dados
- **Pode visualizar** dados de colegas da mesma empresa

## 🔧 Status das Rotas

✅ **Implementadas e Funcionando:**
- Autenticação completa
- Consultoria (básico)
- Empresas (CRUD completo)
- Departamentos (CRUD completo)
- Colaboradores (CRUD completo)

⏳ **Pendentes de Implementação:**
- Ocorrências
- Treinamentos
- Feedbacks
- Avaliações
- PDI

## 📝 Notas Importantes

1. **Todas as rotas protegidas** requerem token JWT no header `Authorization: Bearer <token>`
2. **RBAC** é aplicado automaticamente baseado no tipo de usuário
3. **Filtros de dados** são aplicados baseados na empresa do usuário
4. **Logs de auditoria** são gerados para todas as operações
5. **Validação de entrada** é feita em todos os endpoints
