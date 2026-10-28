const mongoose = require('mongoose');
const Perfume = require('../models/Perfume');

/**
 * Escapa caracteres especiais para uso seguro em expressões regulares,
 * prevenindo injeções de regex maliciosas.
 * @param {string} text
 * @returns {string}
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Cadastra um novo perfume no banco de dados.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function createPerfume(data) {
  // Extrai estritamente os campos permitidos, impedindo injeção de _id ou campos internos
  const { marca, modelo, preco, foto } = data;

  const novoPerfume = new Perfume({
    marca,
    modelo,
    preco: typeof preco === 'string' ? parseFloat(preco) : preco,
    foto,
  });

  return await novoPerfume.save();
}

/**
 * Lista perfumes com suporte a paginação, busca textual, filtro por marca e ordenação.
 * @param {Object} options
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
async function getPerfumes(options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const filter = {};

  // Busca textual segura por marca ou modelo
  if (options.search && typeof options.search === 'string' && options.search.trim().length > 0) {
    const safeSearch = escapeRegex(options.search.trim());
    filter.$or = [
      { marca: { $regex: safeSearch, $options: 'i' } },
      { modelo: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  // Filtro exato por marca (case-insensitive)
  if (options.marca && typeof options.marca === 'string' && options.marca.trim().length > 0) {
    filter.marca = { $regex: `^${escapeRegex(options.marca.trim())}$`, $options: 'i' };
  }

  // Ordenação
  let sortOption = { createdAt: -1 };
  if (options.sort === 'preco_asc') {
    sortOption = { preco: 1, _id: 1 };
  } else if (options.sort === 'preco_desc') {
    sortOption = { preco: -1, _id: 1 };
  } else if (options.sort === 'antigo') {
    sortOption = { createdAt: 1, _id: 1 };
  }

  const [total, perfumes] = await Promise.all([
    Perfume.countDocuments(filter),
    Perfume.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: perfumes,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Consulta um perfume por seu identificador único.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getPerfumeById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Identificador inválido fornecido.');
    error.status = 400;
    throw error;
  }

  return await Perfume.findById(id).lean();
}

/**
 * Atualiza os dados de um perfume existente.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
async function updatePerfume(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Identificador inválido fornecido.');
    error.status = 400;
    throw error;
  }

  // Permite atualizar apenas campos autorizados
  const updateData = {};
  if (data.marca !== undefined) updateData.marca = data.marca;
  if (data.modelo !== undefined) updateData.modelo = data.modelo;
  if (data.preco !== undefined) {
    updateData.preco = typeof data.preco === 'string' ? parseFloat(data.preco) : data.preco;
  }
  if (data.foto !== undefined) updateData.foto = data.foto;

  // Garante que não haja tentativa de mutação de _id
  delete updateData._id;

  const perfumeAtualizado = await Perfume.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
      context: 'query',
    }
  ).lean();

  return perfumeAtualizado;
}

/**
 * Exclui um perfume pelo identificador.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function deletePerfume(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Identificador inválido fornecido.');
    error.status = 400;
    throw error;
  }

  return await Perfume.findByIdAndDelete(id).lean();
}

/**
 * Retorna lista de marcas únicas cadastradas para filtros dinâmicos no frontend.
 * @returns {Promise<string[]>}
 */
async function getDistinctMarcas() {
  const marcas = await Perfume.distinct('marca');
  return marcas.filter(Boolean).sort();
}

module.exports = {
  createPerfume,
  getPerfumes,
  getPerfumeById,
  updatePerfume,
  deletePerfume,
  getDistinctMarcas,
};
