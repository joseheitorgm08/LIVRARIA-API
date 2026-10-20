const { Router } = require('express');
const controller = require('../controllers/AuthController');

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastra um novo usuário (perfil USER)
 *     description: |
 *       Rota **pública**. Cria um usuário com a senha armazenada como hash BCrypt.
 *       - Todos os campos (`nome`, `email`, `senha`) são obrigatórios.
 *       - O perfil é **sempre** `USER`; um campo `role` enviado no body é ignorado (evita escalonamento de privilégio).
 *       - O e-mail deve ser único no sistema.
 *       - A resposta nunca contém a senha nem o hash.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *             example:
 *               id: 1760900000000
 *               nome: Maria Oliveira
 *               email: maria.oliveira@email.com
 *               role: USER
 *       400:
 *         description: Falha de validação — campo obrigatório ausente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: "Campos obrigatórios ausentes: nome, email ou senha."
 *       409:
 *         description: Conflito — e-mail já cadastrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: E-mail já cadastrado no sistema.
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/register', (req, res, next) => controller.register(req, res, next));

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autentica o usuário e emite um token JWT
 *     description: |
 *       Rota **pública**. Valida e-mail e senha (comparação BCrypt) e retorna um **JWT HS256**
 *       com validade padrão de 1 hora.
 *
 *       Use o `token` retornado no botão **Authorize** para testar as rotas protegidas.
 *
 *       Por segurança, a mesma mensagem (`Credenciais inválidas.`) é retornada para e-mail inexistente e senha errada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           examples:
 *             admin:
 *               summary: Usuário ADMIN (seed)
 *               value: { email: admin@livraria.com, senha: admin123 }
 *             leitor:
 *               summary: Usuário USER / leitor (seed)
 *               value: { email: leitor@gmail.com, senha: leitor123 }
 *     responses:
 *       200:
 *         description: Login realizado; token JWT emitido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Falha de validação — e-mail ou senha ausentes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: E-mail e senha são obrigatórios.
 *       401:
 *         description: Credenciais inválidas (e-mail inexistente ou senha incorreta).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: Credenciais inválidas.
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', (req, res, next) => controller.login(req, res, next));

module.exports = router;
