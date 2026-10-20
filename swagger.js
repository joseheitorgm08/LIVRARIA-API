const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// Contrato OpenAPI 3.0 da Livraria API.
// A base (info, servers, securitySchemes, schemas e respostas reutilizáveis) fica aqui;
// cada endpoint é descrito por anotações JSDoc @openapi nos arquivos de rotas (routes/*.js).
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Livraria API',
    version: '1.0.0',
    description: [
      'API RESTful de **Livros e Autores** com autenticação stateless (JWT HS256), senhas com hash BCrypt e controle de acesso por perfil (RBAC).',
      '',
      '### Como testar rotas protegidas',
      '1. Abra **Auth → POST /api/v1/auth/login**, clique em *Try it out* e use um dos usuários seed:',
      '   - ADMIN: `admin@livraria.com` / `admin123`',
      '   - USER: `leitor@gmail.com` / `leitor123`',
      '2. Copie o valor de `token` da resposta.',
      '3. Clique no botão **Authorize** (cadeado), cole **apenas o token** (sem o prefixo `Bearer`) e confirme.',
      '4. A partir daí a interface envia `Authorization: Bearer <token>` automaticamente nas rotas com cadeado.',
      '',
      '### Matriz de permissões',
      '| Método | Rota | Perfil |',
      '|---|---|---|',
      '| GET | /api/v1/livros | Público |',
      '| GET | /api/v1/livros/{id} | Público |',
      '| GET | /api/v1/autores | Público |',
      '| POST | /api/v1/auth/register | Público |',
      '| POST | /api/v1/auth/login | Público |',
      '| POST | /api/v1/livros/{id}/comentarios | Autenticado (USER ou ADMIN) |',
      '| POST | /api/v1/autores | Exclusivo ADMIN |',
      '| POST | /api/v1/livros | Exclusivo ADMIN |',
      '',
      'Especificação bruta (JSON): [`/api/docs.json`](/api/docs.json)'
    ].join('\n')
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Auth', description: 'Cadastro e login (emissão do JWT)' },
    { name: 'Livros', description: 'Consulta, cadastro e comentários de livros' },
    { name: 'Autores', description: 'Consulta e cadastro de autores' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido em POST /api/v1/auth/login. Informe somente o token; o prefixo "Bearer" é adicionado automaticamente.'
      }
    },
    schemas: {
      // ---------- Entradas ----------
      RegisterInput: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', minLength: 1, example: 'Maria Oliveira' },
          email: { type: 'string', format: 'email', example: 'maria.oliveira@email.com' },
          senha: { type: 'string', format: 'password', minLength: 1, example: 'S3nhaF0rte!' }
        },
        description: 'O perfil (role) NÃO é aceito no cadastro: todo usuário registrado nasce como USER. Um campo "role" enviado no body é ignorado.'
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@livraria.com' },
          senha: { type: 'string', format: 'password', example: 'admin123' }
        }
      },
      AutorInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', minLength: 1, description: 'Nome do autor (não pode ser vazio ou só espaços).', example: 'Clarice Lispector' },
          nacionalidade: { type: 'string', description: 'Opcional. Padrão: "Não informada".', example: 'Brasileira' }
        }
      },
      LivroInput: {
        type: 'object',
        required: ['titulo', 'autor_id'],
        properties: {
          titulo: { type: 'string', minLength: 1, example: 'A Hora da Estrela' },
          ano: { type: 'integer', description: 'Opcional. Padrão: ano corrente.', example: 1977 },
          autor_id: { type: 'integer', description: 'ID de um autor existente.', example: 1 }
        }
      },
      ComentarioInput: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: { type: 'string', minLength: 1, description: 'Texto do comentário (não pode ser vazio).', example: 'Narrativa intensa e muito bem construída.' }
        }
      },

      // ---------- Saídas ----------
      Usuario: {
        type: 'object',
        required: ['id', 'nome', 'email', 'role'],
        properties: {
          id: { type: 'integer', example: 1760900000000 },
          nome: { type: 'string', example: 'Maria Oliveira' },
          email: { type: 'string', format: 'email', example: 'maria.oliveira@email.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' }
        },
        description: 'Usuário sem o campo senha_hash (o hash nunca é exposto).'
      },
      LoginResponse: {
        type: 'object',
        required: ['usuario', 'token'],
        properties: {
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              nome: { type: 'string', example: 'Admin' },
              role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' }
            }
          },
          token: {
            type: 'string',
            description: 'JWT HS256 com claims sub, nome, role, iat e exp (validade padrão: 1h).',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21lIjoiQWRtaW4iLCJyb2xlIjoiQURNSU4iLCJzdWIiOiIxIn0.assinatura'
          }
        }
      },
      Autor: {
        type: 'object',
        required: ['id', 'nome', 'nacionalidade'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Machado de Assis' },
          nacionalidade: { type: 'string', example: 'Brasileiro' }
        }
      },
      Comentario: {
        type: 'object',
        required: ['id', 'autor_nome', 'texto'],
        properties: {
          id: { type: 'integer', example: 1760900000000 },
          autor_nome: { type: 'string', description: 'Nome do usuário autenticado que comentou (vem do token).', example: 'Leitor' },
          texto: { type: 'string', example: 'Clássico indispensável.' }
        }
      },
      Livro: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'comentarios'],
        properties: {
          id: { type: 'integer', example: 1 },
          titulo: { type: 'string', example: 'Dom Casmurro' },
          ano: { type: 'integer', example: 1899 },
          autor_id: { type: 'integer', example: 1 },
          comentarios: { type: 'array', items: { $ref: '#/components/schemas/Comentario' } }
        }
      },
      LivroDetalhado: {
        allOf: [
          { $ref: '#/components/schemas/Livro' },
          {
            type: 'object',
            required: ['autor_nome'],
            properties: {
              autor_nome: { type: 'string', description: 'Nome do autor ou "Autor Desconhecido".', example: 'Machado de Assis' }
            }
          }
        ]
      },
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: {
          erro: { type: 'string', example: 'Mensagem descritiva do erro.' }
        }
      }
    },
    parameters: {
      LivroId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'ID numérico do livro.',
        schema: { type: 'integer', example: 1 }
      }
    },
    responses: {
      Unauthorized: {
        description: 'Não autenticado: token ausente, com formato inválido, expirado ou adulterado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            examples: {
              ausente: { summary: 'Token ausente', value: { erro: 'Token de autenticação não fornecido.' } },
              formato: { summary: 'Header mal formatado', value: { erro: 'Formato do header inválido. Use: Authorization: Bearer <token>.' } },
              expirado: { summary: 'Token expirado', value: { erro: 'Token expirado. Faça login novamente.' } },
              invalido: { summary: 'Token corrompido/assinatura inválida', value: { erro: 'Token inválido.' } }
            }
          }
        }
      },
      ForbiddenAdmin: {
        description: 'Autenticado, mas sem o perfil ADMIN exigido (ex.: usuário USER/leitor).',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Acesso proibido: privilégio de ADMIN exigido.' }
          }
        }
      },
      InternalError: {
        description: 'Erro interno inesperado do servidor.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Ocorreu um erro interno no servidor.' }
          }
        }
      }
    }
  }
};

const swaggerSpec = swaggerJSDoc({
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')]
});

module.exports = swaggerSpec;
