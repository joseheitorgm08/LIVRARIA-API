const jwt = require('jsonwebtoken');
const { jwtSecret, jwtAlgorithm } = require('../config/auth');

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  // Formato exigido: "Authorization: Bearer <token>"
  const [esquema, token] = authHeader.split(' ');
  if (!/^Bearer$/i.test(esquema) || !token) {
    return res.status(401).json({ erro: "Formato do header inválido. Use: Authorization: Bearer <token>." });
  }

  try {
    // Valida assinatura e expiração; o algoritmo é fixado para evitar ataques de troca de "alg"
    const payload = jwt.verify(token, jwtSecret, { algorithms: [jwtAlgorithm] });

    req.usuario = {
      id: Number(payload.sub),
      nome: payload.nome,
      role: payload.role
    };
    next();
  } catch (err) {
    const mensagem = err.name === 'TokenExpiredError'
      ? "Token expirado. Faça login novamente."
      : "Token inválido.";
    return res.status(401).json({ erro: mensagem });
  }
}

function exigirRole(roleEsperada) {
  return (req, res, next) => {
    if (!req.usuario || req.usuario.role !== roleEsperada) {
      return res.status(403).json({ erro: `Acesso proibido: privilégio de ${roleEsperada} exigido.` });
    }
    next();
  };
}

module.exports = { autenticarToken, exigirRole };
