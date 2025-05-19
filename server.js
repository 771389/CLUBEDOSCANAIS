const express = require('express');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3001;

// Rota pública que retorna data, hora e timestamp em milissegundos (fuso de Brasília)
app.get('/api/tempo', (req, res) => {
  const agora = moment().tz('America/Sao_Paulo');

  res.json({
    data: agora.format('DD/MM/YYYY'),
    hora: agora.format('HH:mm:ss'),
    timestamp: agora.valueOf() // <-- milissegundos
  });
});

app.listen(port, () => {
  console.log(`API de tempo rodando em http://localhost:${port}/api/tempo`);
});
