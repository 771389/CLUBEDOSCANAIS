const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';
const BASE_URL = 'https://clubedosmods.vercel.app'; // URL base do seu servidor

app.use(express.json());

// Middleware JWT geral, exceto login
const authMiddleware = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256'],
}).unless({
  path: ['/login']
});

app.use(authMiddleware);

// Login para gerar token principal
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Rota que retorna URL + token para acesso ao arquivo
app.get('/api/canais/:arquivo', (req, res) => {
  const { arquivo } = req.params;

  if (!arquivo.endsWith('.m3u8')) {
    return res.status(400).json({ erro: 'Formato de arquivo inválido.' });
  }

  const filePath = path.join(__dirname, 'canais', arquivo);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  }

  // Criar token temporário para acessar esse arquivo, válido por exemplo 15 minutos
  const accessToken = jwt.sign({ arquivo }, SECRET_KEY, { expiresIn: '15m' });

  // URL para acessar o arquivo protegido, passando token como query string
  const urlComToken = `${BASE_URL}/api/canais/download/${arquivo}?token=${accessToken}`;

  res.json({
    url: urlComToken,
    expires_in: 15 * 60 // segundos
  });
});

// Rota que realmente serve o arquivo .m3u8, protegida por token na query
app.get('/api/canais/download/:arquivo', (req, res) => {
  const { arquivo } = req.params;
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso é obrigatório.' });
  }

  // Verificar o token temporário
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    if (decoded.arquivo !== arquivo) {
      return res.status(403).json({ erro: 'Token não corresponde ao arquivo solicitado.' });
    }

    const filePath = path.join(__dirname, 'canais', arquivo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.sendFile(filePath);
  });
});

// Middleware de erro para token geral
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou ausente.' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
