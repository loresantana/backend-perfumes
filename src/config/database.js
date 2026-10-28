const mongoose = require('mongoose');

/**
 * Cache global da conexão Mongoose para evitar que múltiplas invocações serverless
 * esgotem o pool de conexões com o MongoDB.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Conecta ao MongoDB reutilizando a conexão existente se disponível.
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('A variável de ambiente MONGODB_URI não foi configurada.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Retorna o estado atual da conexão Mongoose para o healthcheck.
 * @returns {{ code: number, status: string, databaseName: string | null }}
 */
function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const stateCode = mongoose.connection ? mongoose.connection.readyState : 0;

  return {
    code: stateCode,
    status: states[stateCode] || 'unknown',
    databaseName: mongoose.connection ? mongoose.connection.name : null,
  };
}

module.exports = {
  connectDB,
  getDBStatus,
};
