require('dotenv').config({ quiet: true });

// Segredo usado para assinar/validar os JWTs (HMAC-SHA256).
// Em produção, SEMPRE defina JWT_SECRET no .env com um valor longo e aleatório.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '[auth] JWT_SECRET não definido no .env — usando segredo de desenvolvimento. NÃO use isso em produção.'
  );
}

module.exports = {
  jwtSecret: JWT_SECRET || 'dev-secret-livraria-troque-no-env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtAlgorithm: 'HS256',
  // Work factor (custo) do BCrypt: 2^N iterações. 10–12 é o recomendado atualmente.
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
};
