const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');

const router = Router();

// Rotas Públicas

/**
 * @openapi
 * /api/v1/livros:
 *   get:
 *     tags: [Livros]
 *     summary: Lista todos os livros
 *     description: Rota **pública**. Retorna todos os livros com seus comentários e o nome do autor (`autor_nome`).
 *     responses:
 *       200:
 *         description: Lista de livros.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LivroDetalhado'
 *             example:
 *               - id: 1
 *                 titulo: Dom Casmurro
 *                 ano: 1899
 *                 autor_id: 1
 *                 comentarios:
 *                   - id: 1
 *                     autor_nome: Leitor
 *                     texto: Clássico indispensável.
 *                 autor_nome: Machado de Assis
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/livros/{id}:
 *   get:
 *     tags: [Livros]
 *     summary: Busca um livro pelo ID
 *     description: Rota **pública**. Retorna o livro, seus comentários e o nome do autor.
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     responses:
 *       200:
 *         description: Livro encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LivroDetalhado'
 *       404:
 *         description: Livro não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: Livro não localizado.
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', (req, res, next) => controller.show(req, res, next));

// Rota Restrita: ADMIN

/**
 * @openapi
 * /api/v1/livros:
 *   post:
 *     tags: [Livros]
 *     summary: Cadastra um novo livro (exclusivo ADMIN)
 *     description: |
 *       Rota **restrita ao perfil ADMIN**. Exige `Authorization: Bearer <token>` de um usuário ADMIN.
 *       - `titulo` e `autor_id` são obrigatórios; `autor_id` deve referenciar um autor existente.
 *       - `ano` é opcional (padrão: ano corrente).
 *       - O livro é criado com a lista de `comentarios` vazia.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LivroInput'
 *     responses:
 *       201:
 *         description: Livro criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livro'
 *             example:
 *               id: 1760900000000
 *               titulo: A Hora da Estrela
 *               ano: 1977
 *               autor_id: 1
 *               comentarios: []
 *       400:
 *         description: Falha de validação — título ou autor_id ausentes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: O título e o autor_id são obrigatórios.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/ForbiddenAdmin'
 *       404:
 *         description: O autor informado em autor_id não existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: O autor informado não existe.
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', autenticarToken, exigirRole('ADMIN'), (req, res, next) => controller.store(req, res, next));

// Rota Restrita: Usuário Autenticado

/**
 * @openapi
 * /api/v1/livros/{id}/comentarios:
 *   post:
 *     tags: [Livros]
 *     summary: Adiciona um comentário a um livro (USER ou ADMIN)
 *     description: |
 *       Rota **autenticada** — qualquer usuário logado (USER ou ADMIN). Exige `Authorization: Bearer <token>`.
 *       - `texto` é obrigatório e não pode ser vazio.
 *       - O nome do autor do comentário é extraído do token JWT (não é enviado no body).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComentarioInput'
 *     responses:
 *       201:
 *         description: Comentário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comentario'
 *             example:
 *               id: 1760900000000
 *               autor_nome: Leitor
 *               texto: Narrativa intensa e muito bem construída.
 *       400:
 *         description: Falha de validação — texto ausente ou vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: O texto do comentário não pode estar vazio.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Livro não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: Livro não localizado.
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/comentarios', autenticarToken, (req, res, next) => controller.storeComment(req, res, next));

module.exports = router;
