const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');
const { jwtSecret, jwtExpiresIn, jwtAlgorithm, bcryptSaltRounds } = require('../config/auth');

class AuthService {
  async registrar({ nome, email, senha }) {
    if (!nome || !email || !senha) {
      throw { status: 400, message: "Campos obrigatórios ausentes: nome, email ou senha." };
    }

    const usuarioExistente = repository.buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
      throw { status: 409, message: "E-mail já cadastrado no sistema." };
    }

    // Hash da senha com BCrypt: o salt é gerado aleatoriamente e embutido no próprio hash,
    // e o work factor (bcryptSaltRounds) define o custo computacional.
    const senha_hash = await bcrypt.hash(senha, bcryptSaltRounds);

    // O cadastro público SEMPRE cria USER — o cliente não pode escolher a própria role
    // (evita escalonamento de privilégio enviando { "role": "ADMIN" } no body).
    const novoUsuario = repository.salvarUsuario({
      nome,
      email,
      senha_hash,
      role: "USER"
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw { status: 400, message: "E-mail e senha são obrigatórios." };
    }

    const usuario = repository.buscarUsuarioPorEmail(email);

    // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem)
    const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;
    if (!usuario || !senhaValida) {
      throw { status: 401, message: "Credenciais inválidas." };
    }

    const token = jwt.sign(
      { nome: usuario.nome, role: usuario.role },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: jwtExpiresIn, algorithm: jwtAlgorithm }
    );

    return {
      usuario: { id: usuario.id, nome: usuario.nome, role: usuario.role },
      token
    };
  }
}

module.exports = new AuthService();
