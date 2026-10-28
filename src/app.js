require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const perfumeRoutes = require('./routes/perfumeRoutes');
const perfumeController = require('./controllers/perfumeController');

const app = express();

// Configuração robusta de CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem origin (como curl, postman ou chamadas locais de mesmo servidor)
      if (!origin) return callback(null, true);

      // Se wildcard estiver configurado, aceita qualquer origem
      if (allowedOrigins.includes('*')) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Acesso bloqueado por política de CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false,
  })
);

// Parser de JSON com limite seguro contra ataques de payload gigante
app.use(express.json({ limit: '500kb' }));

// Middleware para garantir conexão ativa com MongoDB no ambiente Serverless da Vercel
app.use(async (req, res, next) => {
  // Ignora conexão no endpoint de health se for verificar apenas a subida do servidor
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      // Se falhar e a rota não for health, podemos retornar 503 Service Unavailable
      if (!req.path.includes('/health')) {
        return res.status(503).json({
          error: 'Serviço temporariamente indisponível. Não foi possível conectar ao banco de dados.',
        });
      }
    }
  }
  next();
});

// Endpoint de verificação de integridade da API e banco
app.get('/api/health', perfumeController.healthCheck);
app.get('/health', perfumeController.healthCheck);

// Rotas da API de Perfumes (suportando prefixo /api e raiz)
app.use('/api/perfumes', perfumeRoutes);
app.use('/perfumes', perfumeRoutes);

// Tratamento para rotas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware global de tratamento de erros
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Payload JSON malformado.' });
  }

  // Erro inesperado
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Erro interno no servidor.' : err.message,
  });
});

module.exports = app;
