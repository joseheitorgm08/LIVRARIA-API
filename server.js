const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Documentação OpenAPI 3.0 (Swagger UI) — contrato formal da API
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Especificação bruta em JSON
app.get(['/api/docs.json', '/api-docs.json'], (req, res) => res.json(swaggerSpec));

// Interface interativa com botão "Authorize" (JWT Bearer)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Livraria API — Documentação',
  swaggerOptions: {
    persistAuthorization: true,   // mantém o token após recarregar a página
    displayRequestDuration: true,
    tryItOutEnabled: true
  }
}));

// Atalhos para a documentação
app.get(['/', '/docs'], (req, res) => res.redirect('/api/docs'));

// Agrupamento Semântico de Rotas (RESTful /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Livraria API rodando em http://localhost:${PORT}`);
  console.log(`Documentação (Swagger UI): http://localhost:${PORT}/api/docs`);
  console.log(`Especificação OpenAPI (JSON): http://localhost:${PORT}/api/docs.json`);
});