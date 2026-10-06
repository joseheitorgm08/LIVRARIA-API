// Valida a matriz de permissões contra a API em execução (npm start em outro terminal).
// Uso: npm run test:security
const BASE = process.env.API_URL || 'http://localhost:3000/api/v1';

let falhas = 0;

async function req(method, rota, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + rota, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let dados = null;
  try { dados = await res.json(); } catch { /* sem corpo */ }
  return { status: res.status, dados };
}

function checar(descricao, obtido, esperado) {
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? '✔' : '✘'} ${descricao} → ${obtido}${ok ? '' : ` (esperado ${esperado})`}`);
}

(async () => {
  const email = `teste${Date.now()}@mail.com`;

  checar('GET /livros (público)', (await req('GET', '/livros')).status, 200);
  checar('GET /livros/1 (público)', (await req('GET', '/livros/1')).status, 200);

  const reg = await req('POST', '/auth/register', { body: { nome: 'Teste', email, senha: 's3nha', role: 'ADMIN' } });
  checar('POST /auth/register', reg.status, 201);
  checar('register ignora role=ADMIN do body', reg.dados && reg.dados.role, 'USER');
  checar('register não expõe senha_hash', reg.dados && 'senha_hash' in reg.dados, false);

  checar('login com senha errada', (await req('POST', '/auth/login', { body: { email: 'admin@livraria.com', senha: 'errada' } })).status, 401);
  checar('login com e-mail inexistente', (await req('POST', '/auth/login', { body: { email: 'x@x.com', senha: 'x' } })).status, 401);

  const admin = await req('POST', '/auth/login', { body: { email: 'admin@livraria.com', senha: 'admin123' } });
  const leitor = await req('POST', '/auth/login', { body: { email: 'leitor@gmail.com', senha: 'leitor123' } });
  checar('login ADMIN', admin.status, 200);
  checar('login USER', leitor.status, 200);
  const tAdmin = admin.dados.token;
  const tLeitor = leitor.dados.token;

  checar('comentário anônimo', (await req('POST', '/livros/1/comentarios', { body: { texto: 'oi' } })).status, 401);
  checar('comentário com token adulterado', (await req('POST', '/livros/1/comentarios', { token: tLeitor + 'x', body: { texto: 'oi' } })).status, 401);
  checar('comentário USER', (await req('POST', '/livros/1/comentarios', { token: tLeitor, body: { texto: 'Ótimo livro!' } })).status, 201);
  checar('comentário ADMIN', (await req('POST', '/livros/1/comentarios', { token: tAdmin, body: { texto: 'Recomendado.' } })).status, 201);

  checar('POST /autores anônimo', (await req('POST', '/autores', { body: { nome: 'X' } })).status, 401);
  checar('POST /autores USER', (await req('POST', '/autores', { token: tLeitor, body: { nome: 'X' } })).status, 403);
  const autor = await req('POST', '/autores', { token: tAdmin, body: { nome: 'Clarice Lispector', nacionalidade: 'Brasileira' } });
  checar('POST /autores ADMIN', autor.status, 201);

  const livro = { titulo: 'A Hora da Estrela', ano: 1977, autor_id: autor.dados.id };
  checar('POST /livros anônimo', (await req('POST', '/livros', { body: livro })).status, 401);
  checar('POST /livros USER', (await req('POST', '/livros', { token: tLeitor, body: livro })).status, 403);
  checar('POST /livros ADMIN', (await req('POST', '/livros', { token: tAdmin, body: livro })).status, 201);

  console.log(falhas === 0 ? '\nTodos os cenários passaram.' : `\n${falhas} cenário(s) falharam.`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch(err => {
  console.error('Erro ao conectar com a API. Ela está rodando?', err.message);
  process.exit(1);
});
