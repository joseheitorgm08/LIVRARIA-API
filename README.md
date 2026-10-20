# Livraria API — Segurança (BCrypt + JWT + RBAC)

API RESTful de Livros e Autores (Node.js + Express, Clean Architecture) com camada de segurança:

- **Armazenamento seguro de credenciais** — senhas guardadas como hash **BCrypt** (salt aleatório embutido + work factor configurável). A senha em texto puro nunca é persistida nem retornada.
- **Autenticação stateless** — `POST /auth/login` emite um **JWT (HS256)** com `sub`, `nome`, `role` e expiração. Rotas protegidas exigem `Authorization: Bearer <token>`.
- **RBAC** — middlewares `autenticarToken` (401) e `exigirRole('ADMIN')` (403) protegem os endpoints.

## Como rodar

```bash
npm install
cp .env.example .env   # defina um JWT_SECRET forte
npm start              # http://localhost:3000
```

> Se existir um `database.txt` antigo (com hashes falsos), apague-o antes de iniciar — ele é recriado com os usuários seed.

## Usuários seed

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@livraria.com | admin123 |
| USER | leitor@gmail.com | leitor123 |

## Matriz de permissões

| Método | Rota | Acesso | Sucesso | Falha |
|---|---|---|---|---|
| GET | /api/v1/livros | Público | 200 | — |
| GET | /api/v1/livros/:id | Público | 200 | — |
| POST | /api/v1/auth/register | Público | 201 | — |
| POST | /api/v1/auth/login | Público | 200 | 401 |
| POST | /api/v1/livros/:id/comentarios | USER ou ADMIN | 201 | 401 |
| POST | /api/v1/autores | Somente ADMIN | 201 | 401 / 403 |
| POST | /api/v1/livros | Somente ADMIN | 201 | 401 / 403 |

## Decisões de segurança

- **Cadastro sempre cria `USER`**: o campo `role` enviado no body é ignorado, impedindo escalonamento de privilégio via `/register`.
- **Mensagem genérica no login** (`Credenciais inválidas.`) tanto para e-mail inexistente quanto senha errada.
- **Algoritmo do JWT fixado** em `HS256` no `jwt.verify`, evitando ataques de troca de algoritmo.
- **Token expirado ou adulterado → 401**; autenticado sem a role necessária → 403.
- O segredo do JWT fica em `.env` (já ignorado pelo git).

## Testes rápidos (curl)

```bash
# Login (ADMIN)
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@livraria.com","senha":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# Cadastrar autor (ADMIN → 201)
curl -i -X POST localhost:3000/api/v1/autores -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"nome":"Clarice Lispector","nacionalidade":"Brasileira"}'
```

Há também um script que valida a matriz inteira: `npm run test:security` (com o servidor rodando).

## Documentação OpenAPI 3.0 (Swagger UI)

O contrato formal da API segue a **OpenAPI Specification 3.0.3**, gerado com `swagger-jsdoc` (anotações `@openapi` em `routes/*.js`, base em `config/swagger.js`) e servido por `swagger-ui-express`.

| Recurso | URL |
|---|---|
| Interface interativa (Swagger UI) | http://localhost:3000/api/docs |
| Atalho | http://localhost:3000/docs (redireciona) |
| Especificação bruta (JSON) | http://localhost:3000/api/docs.json (também `/api-docs.json`) |

### Testando rotas protegidas pelo navegador

1. Em **Auth → POST /api/v1/auth/login**, clique em *Execute* com o exemplo `admin` (ou `leitor`).
2. Copie o `token` da resposta.
3. Clique em **Authorize**, cole **somente o token** (sem `Bearer`) e confirme.
4. As rotas com cadeado passam a enviar `Authorization: Bearer <token>` automaticamente. O token fica salvo ao recarregar a página (`persistAuthorization`).

### Contratos documentados

| Método | Rota | Perfil | Sucesso | Falhas documentadas |
|---|---|---|---|---|
| GET | /api/v1/livros | Público | 200 | 500 |
| GET | /api/v1/livros/{id} | Público | 200 | 404, 500 |
| GET | /api/v1/autores | Público | 200 | 500 |
| POST | /api/v1/auth/register | Público | 201 | 400, 409, 500 |
| POST | /api/v1/auth/login | Público | 200 | 400, 401, 500 |
| POST | /api/v1/livros/{id}/comentarios | USER ou ADMIN | 201 | 400, 401, 404, 500 |
| POST | /api/v1/autores | Somente ADMIN | 201 | 400, 401, 403, 500 |
| POST | /api/v1/livros | Somente ADMIN | 201 | 400, 401, 403, 404, 500 |

Cada rota traz sumário, descrição das regras, schema do body com campos `required`, tipos e exemplos realistas, e exemplos de payload para sucesso e erro. As falhas de validação de dados retornam **400 Bad Request** com corpo `{ "erro": "..." }`. O esquema de segurança é `bearerAuth` (HTTP Bearer, formato JWT).
