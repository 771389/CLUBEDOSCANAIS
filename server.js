const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Chave secreta para JWT
const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';

// Middleware para interpretar JSON
app.use(express.json());

// Autenticação JWT para todas as rotas, exceto login
const authMiddleware = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256']
}).unless({
  path: ['/login', '/api/canais/download/:arquivo'] // Rota de download não exige token
});

app.use(authMiddleware);

// Rota de login para gerar o token principal
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Rota para fornecer URL com token temporário (opcional, pode manter ou remover)
app.get('/api/canais/:arquivo', (req, res) => {
  const { arquivo } = req.params;

  if (!arquivo.endsWith('.m3u8')) {
    return res.status(400).json({ erro: 'Formato de arquivo inválido.' });
  }

  const urlBase = 'https://clubedosmods.vercel.app/api/canais/download';
  const url = `${urlBase}/${arquivo}`; // Sem token

  res.json({
    url,
    expires_in: null // sem token, sem expiração
  });
});

// Rota de download do arquivo .m3u8 - **SEM validação de token**
app.get('/api/canais/download/:arquivo', (req, res) => {
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
