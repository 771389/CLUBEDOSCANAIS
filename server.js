const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';
const BASE_URL = 'https://clubedosmods.vercel.app'; // Mude para sua URL real

app.use(express.json());

// Middleware JWT para proteger rotas, exceto /login
app.use(expressJwt({ secret: SECRET_KEY, algorithms: ['HS256'] }).unless({ path: ['/login'] }));

// Login para gerar token principal
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Rota que responde a URL protegida para reprodução
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

  // URL para reprodução, que o player deve usar
  const urlParaReproducao = `${BASE_URL}/api/canais/download/${encodeURIComponent(arquivo)}?token=${accessToken}`;

  res.json({
    url: urlParaReproducao,
    expires_in: 15 * 60 // segundos
  });
});

// Rota que serve o arquivo .m3u8 após validar token temporário na query
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

// Tratamento de erros de autenticação JWT principal
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou ausente.' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
