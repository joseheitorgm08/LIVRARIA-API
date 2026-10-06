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
