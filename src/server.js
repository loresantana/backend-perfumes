require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (process.env.MONGODB_URI) {
      console.log('Conectando ao MongoDB...');
      await connectDB();
      console.log('✓ Conexão com MongoDB estabelecida com sucesso.');
    } else {
      console.warn('⚠️ AVISO: MONGODB_URI não definida. Operações de banco poderão falhar.');
    }

    const server = app.listen(PORT, () => {
      console.log(`✓ Servidor de Perfumes ativo na porta ${PORT}`);
      console.log(`  - Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`  - Perfumes API: http://localhost:${PORT}/api/perfumes`);
    });

    // Encerramento gracioso (Graceful Shutdown)
    const gracefulShutdown = async (signal) => {
      console.log(`\nRecebido sinal ${signal}. Encerrando servidor com segurança...`);
      server.close(async () => {
        console.log('Servidor HTTP encerrado.');
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close(false);
          console.log('Conexão com MongoDB encerrada.');
        } catch (err) {
          console.error('Erro ao encerrar conexão com MongoDB:', err.message);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Falha crítica ao iniciar o servidor:', error.message);
    process.exit(1);
  }
}

startServer();
