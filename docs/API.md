# API Documentation - Ezer DH

## Visão Geral

Esta documentação descreve a API REST do Ezer Desenvolvimento Humano.

## Base URL

```
http://localhost:3001/api
```

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação.

### Headers necessários:
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/logout` - Logout de usuário
- `POST /auth/refresh` - Renovar token

### Empresas
- `GET /empresas` - Listar empresas
- `POST /empresas` - Criar empresa
- `GET /empresas/:id` - Obter empresa
- `PUT /empresas/:id` - Atualizar empresa
- `DELETE /empresas/:id` - Deletar empresa

### Colaboradores
- `GET /colaboradores` - Listar colaboradores
- `POST /colaboradores` - Criar colaborador
- `GET /colaboradores/:id` - Obter colaborador
- `PUT /colaboradores/:id` - Atualizar colaborador
- `DELETE /colaboradores/:id` - Deletar colaborador

### Departamentos
- `GET /departamentos` - Listar departamentos
- `POST /departamentos` - Criar departamento
- `GET /departamentos/:id` - Obter departamento
- `PUT /departamentos/:id` - Atualizar departamento
- `DELETE /departamentos/:id` - Deletar departamento

### Ocorrências
- `GET /ocorrencias` - Listar ocorrências
- `POST /ocorrencias` - Criar ocorrência
- `GET /ocorrencias/:id` - Obter ocorrência
- `PUT /ocorrencias/:id` - Atualizar ocorrência
- `DELETE /ocorrencias/:id` - Deletar ocorrência

### Treinamentos
- `GET /treinamentos` - Listar treinamentos
- `POST /treinamentos` - Criar treinamento
- `GET /treinamentos/:id` - Obter treinamento
- `PUT /treinamentos/:id` - Atualizar treinamento
- `DELETE /treinamentos/:id` - Deletar treinamento

### Feedbacks
- `GET /feedbacks` - Listar feedbacks
- `POST /feedbacks` - Criar feedback
- `GET /feedbacks/:id` - Obter feedback
- `PUT /feedbacks/:id` - Atualizar feedback
- `DELETE /feedbacks/:id` - Deletar feedback

### Avaliações
- `GET /avaliacoes` - Listar avaliações
- `POST /avaliacoes` - Criar avaliação
- `GET /avaliacoes/:id` - Obter avaliação
- `PUT /avaliacoes/:id` - Atualizar avaliação
- `DELETE /avaliacoes/:id` - Deletar avaliação

### PDI (Plano de Desenvolvimento Individual)
- `GET /pdi` - Listar PDIs
- `POST /pdi` - Criar PDI
- `GET /pdi/:id` - Obter PDI
- `PUT /pdi/:id` - Atualizar PDI
- `DELETE /pdi/:id` - Deletar PDI

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplos de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "code": "ERROR_CODE"
}
```
