const { Router } = require('express');
const controller = require('../controllers/AutorController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @openapi
 * /api/v1/autores:
 *   get:
 *     tags: [Autores]
 *     summary: Lista todos os autores
 *     description: Rota **pública**. Retorna todos os autores cadastrados.
 *     responses:
 *       200:
 *         description: Lista de autores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Autor'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/autores:
 *   post:
 *     tags: [Autores]
 *     summary: Cadastra um novo autor (exclusivo ADMIN)
 *     description: |
 *       Rota **restrita ao perfil ADMIN**. Exige `Authorization: Bearer <token>` de um usuário ADMIN.
 *       - `nome` é obrigatório e não pode ser vazio (espaços nas pontas são removidos).
 *       - `nacionalidade` é opcional (padrão: `"Não informada"`).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutorInput'
 *     responses:
 *       201:
 *         description: Autor criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Autor'
 *             example:
 *               id: 1760900000000
 *               nome: Clarice Lispector
 *               nacionalidade: Brasileira
 *       400:
 *         description: Falha de validação — nome ausente ou vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example:
 *               erro: O nome do autor é obrigatório.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/ForbiddenAdmin'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', autenticarToken, exigirRole('ADMIN'), (req, res, next) => controller.store(req, res, next));

module.exports = router;
