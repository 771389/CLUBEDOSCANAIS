const express = require('express');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3001;

<<<<<<< HEAD
// Chave secreta para gerar e verificar tokens
const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';

// Middleware para interpretar JSON
app.use(express.json());

// Autenticação JWT para todas as rotas, exceto login
const authMiddleware = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256']
}).unless({
  path: ['/login']
});

app.use(authMiddleware);

// Rota de login para gerar o token
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Rota protegida para acessar arquivos .m3u8
app.get('/api/canais/:arquivo', (req, res) => {
  const { arquivo } = req.params;

  if (!arquivo.endsWith('.m3u8')) {
    return res.status(400).json({ erro: 'Formato de arquivo inválido.' });
  }

  const filePath = path.join(__dirname, 'canais', arquivo);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  }

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.sendFile(filePath);
});

// Middleware para lidar com erros de autenticação
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou ausente.' });
  }
  next(err);
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
