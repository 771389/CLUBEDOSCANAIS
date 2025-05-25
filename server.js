const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';
const BASE_URL = 'https://clubedosmods.vercel.app'; // sua URL real

app.use(express.json());

// Middleware JWT para proteger todas rotas exceto /login e /api/canais/download/*
app.use(expressJwt({ secret: SECRET_KEY, algorithms: ['HS256'] }).unless({
  path: [
    '/login',
    /^\/api\/canais\/download\/.*/ // RegEx para permitir acesso público à rota download
  ]
}));

// Login para gerar token principal
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Rota que retorna URL com token para reprodução - protegida por token principal
app.get('/api/canais/:arquivo', (req, res) => {
  const { arquivo } = req.params;

  if (!arquivo.toLowerCase().endsWith('.m3u8')) {
    return res.status(400).json({ erro: 'Formato de arquivo inválido.' });
  }

  const filePath = path.join(__dirname, 'canais', arquivo);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  }

  // Gera token temporário para o arquivo, válido 15 minutos
  const accessToken = jwt.sign({ arquivo }, SECRET_KEY, { expiresIn: '15m' });

  const urlParaReproducao = `${BASE_URL}/api/canais/download/${encodeURIComponent(arquivo)}?token=${accessToken}`;

  res.json({
    url: urlParaReproducao,
    expires_in: 15 * 60 // segundos
  });
});

// Rota pública que entrega o arquivo .m3u8 validando token via query param
app.get('/api/canais/download/:arquivo', (req, res) => {
  const { arquivo } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso obrigatório.' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.arquivo !== arquivo) {
      return res.status(401).json({ erro: 'Token inválido ou não corresponde ao arquivo.' });
    }

    const filePath = path.join(__dirname, 'canais', arquivo);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.sendFile(filePath);
  });
});

// Middleware para erros de autenticação do express-jwt (token principal)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou ausente.' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
