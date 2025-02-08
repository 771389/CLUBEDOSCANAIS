const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Chave secreta para JWT
const SECRET_KEY = process.env.SECRET_KEY || 'androidx&clubedosfilmes';

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Middleware para verificar token (exceto algumas rotas)
const authMiddleware = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256']
}).unless({
  path: ['/login', '/search'] // Rotas que não exigem autenticação
});

app.use(authMiddleware);

// Rota de login para gerar token
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'vitor' && senha === 'spazio3132') {
    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

// Função para carregar JSONs dinamicamente de uma pasta e criar rotas
const loadJsonRoutes = (folderPath, baseRoute, jsonStorage) => {
  if (!fs.existsSync(folderPath)) return;

  fs.readdirSync(folderPath).forEach(file => {
    if (file.endsWith('.json')) {
      const routeName = `/${baseRoute}/${file.replace('.json', '')}`;
      const filePath = path.join(folderPath, file);
      delete require.cache[require.resolve(filePath)]; // Limpar cache do require
      const fileContent = require(filePath);

      jsonStorage[routeName] = fileContent;

      app.get(routeName, (req, res) => res.json(fileContent));
      console.log(`Rota criada: GET ${routeName}`);
    }
  });
};

// Diretórios de JSONs
const routesPath = path.join(__dirname, 'routes');
const servidoresPath = path.join(__dirname, 'servidores');

// Armazena os JSONs carregados
const jsonRoutes = {};
const jsonServidores = {};

// Carregar JSONs das pastas 'routes' e 'servidores'
loadJsonRoutes(routesPath, 'routes', jsonRoutes);
loadJsonRoutes(servidoresPath, 'servidores', jsonServidores);

// Rota de pesquisa nos arquivos JSON
app.get('/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ erro: 'Você deve fornecer um termo de busca.' });
  }

  let resultados = [];

  // Função para buscar em qualquer JSON carregado
  const searchInJson = (jsonData, routeName) => {
    const searchData = Array.isArray(jsonData) ? jsonData : [jsonData];
    const matches = searchData.some(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));

    if (matches) {
      resultados.push({ route: routeName, data: jsonData });
    }
  };

  // Procurar nos JSONs carregados
  Object.entries(jsonRoutes).forEach(([routeName, jsonData]) => searchInJson(jsonData, routeName));
  Object.entries(jsonServidores).forEach(([routeName, jsonData]) => searchInJson(jsonData, routeName));

  if (resultados.length > 0) {
    res.json(resultados);
  } else {
    res.status(404).json({ mensagem: 'Nenhum resultado encontrado.' });
  }
});

// Middleware para tratar erros de autenticação
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou não fornecido.' });
  }
  next(err);
});

// Iniciar o servidor
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
