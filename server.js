const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Chave secreta para gerar e verificar os tokens
const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';

// Middleware para interpretar o corpo das requisições como JSON
app.use(express.json());

// Middleware para verificar o token
const authMiddleware = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256']
}).unless({
  path: ['/login'] // Apenas login não exige autenticação
});

app.use(authMiddleware);

// Rota para fazer login e gerar o token
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Diretório onde os arquivos JSON estão armazenados
const routesPath = path.join(__dirname, 'routes');

// Variável para armazenar os arquivos JSON carregados
const jsonRoutes = {};

// Carregamento dinâmico dos arquivos JSON e criação das rotas
fs.readdirSync(routesPath).forEach(file => {
  if (file.endsWith('.json')) {
    const routeName = `/routes/${file.replace('.json', '')}`;
    const filePath = path.join(routesPath, file);
    const fileContent = require(filePath);

    jsonRoutes[routeName] = fileContent;

    // Criar rota para cada arquivo JSON
    app.get(routeName, (req, res) => res.json(fileContent));
    console.log(`Rota criada: GET ${routeName}`);
  }
});

// Middleware para tratar erros
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou não fornecido.' });
  }
  next(err);
});

// Inicia o servidor
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
