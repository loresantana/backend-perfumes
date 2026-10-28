const perfumeService = require('../services/perfumeService');
const { getDBStatus } = require('../config/database');

/**
 * Normaliza erros conhecidos do Mongoose em mensagens claras e estruturadas.
 * @param {Error} error
 * @returns {{ status: number, body: Object }}
 */
function handleControllerError(error) {
  // Erros de validação do Mongoose
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err) => err.message);
    return {
      status: 400,
      body: {
        error: 'Erro de validação nos dados fornecidos.',
        details,
      },
    };
  }

  // Erros de conversão de tipos (ex: Cast to ObjectId falhou)
  if (error.name === 'CastError') {
    return {
      status: 400,
      body: {
        error: 'Identificador ou valor inválido fornecido.',
        details: [error.message],
      },
    };
  }

  // Erros manuais com status definido (ex: 400 Bad Request)
  if (error.status && error.status < 500) {
    return {
      status: error.status,
      body: {
        error: error.message,
      },
    };
  }

  // Erro interno do servidor (não expõe stack trace ou dados sensíveis)
  return {
    status: 500,
    body: {
      error: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    },
  };
}

/**
 * Endpoint de verificação de integridade da API e estado do banco.
 * GET /api/health
 */
async function healthCheck(req, res) {
  const dbStatus = getDBStatus();
  const isDbHealthy = dbStatus.code === 1;

  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
}

/**
 * Lista perfumes com paginação, busca e filtros.
 * GET /api/perfumes
 */
async function listPerfumes(req, res) {
  try {
    const { page, limit, search, marca, sort } = req.query;
    const result = await perfumeService.getPerfumes({ page, limit, search, marca, sort });
    res.status(200).json(result);
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

/**
 * Consulta um perfume por ID.
 * GET /api/perfumes/:id
 */
async function getPerfume(req, res) {
  try {
    const { id } = req.params;
    const perfume = await perfumeService.getPerfumeById(id);

    if (!perfume) {
      return res.status(404).json({
        error: 'Perfume não encontrado.',
      });
    }

    res.status(200).json(perfume);
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

/**
 * Cadastra um novo perfume.
 * POST /api/perfumes
 */
async function createPerfume(req, res) {
  try {
    const { marca, modelo, preco, foto } = req.body;

    // Pré-validação rápida de presença
    if (!marca || !modelo || preco === undefined || !foto) {
      return res.status(400).json({
        error: 'Erro de validação nos dados fornecidos.',
        details: [
          'Todos os campos (marca, modelo, preco, foto) são obrigatórios para cadastro.',
        ],
      });
    }

    const novoPerfume = await perfumeService.createPerfume({ marca, modelo, preco, foto });
    res.status(201).json({
      message: 'Perfume cadastrado com sucesso.',
      data: novoPerfume,
    });
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

/**
 * Atualiza um perfume existente.
 * PUT /api/perfumes/:id
 */
async function updatePerfume(req, res) {
  try {
    const { id } = req.params;
    const { marca, modelo, preco, foto } = req.body;

    // Verifica se pelo menos um campo foi enviado para atualização
    if (marca === undefined && modelo === undefined && preco === undefined && foto === undefined) {
      return res.status(400).json({
        error: 'Erro de validação nos dados fornecidos.',
        details: ['Forneça ao menos um campo para atualização (marca, modelo, preco ou foto).'],
      });
    }

    const perfumeAtualizado = await perfumeService.updatePerfume(id, {
      marca,
      modelo,
      preco,
      foto,
    });

    if (!perfumeAtualizado) {
      return res.status(404).json({
        error: 'Perfume não encontrado.',
      });
    }

    res.status(200).json({
      message: 'Perfume atualizado com sucesso.',
      data: perfumeAtualizado,
    });
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

/**
 * Exclui um perfume do catálogo.
 * DELETE /api/perfumes/:id
 */
async function deletePerfume(req, res) {
  try {
    const { id } = req.params;
    const perfumeExcluido = await perfumeService.deletePerfume(id);

    if (!perfumeExcluido) {
      return res.status(404).json({
        error: 'Perfume não encontrado.',
      });
    }

    res.status(200).json({
      message: 'Perfume excluído com sucesso.',
      id: perfumeExcluido._id,
    });
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

/**
 * Retorna lista de marcas únicas registradas no catálogo.
 * GET /api/perfumes/marcas
 */
async function listMarcas(req, res) {
  try {
    const marcas = await perfumeService.getDistinctMarcas();
    res.status(200).json({ data: marcas });
  } catch (error) {
    const { status, body } = handleControllerError(error);
    res.status(status).json(body);
  }
}

module.exports = {
  healthCheck,
  listPerfumes,
  getPerfume,
  createPerfume,
  updatePerfume,
  deletePerfume,
  listMarcas,
};
