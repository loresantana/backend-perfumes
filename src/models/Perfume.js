const mongoose = require('mongoose');

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const perfumeSchema = new mongoose.Schema(
  {
    marca: {
      type: String,
      required: [true, 'O campo marca é obrigatório.'],
      trim: true,
      minlength: [1, 'A marca não pode ficar vazia.'],
      maxlength: [100, 'A marca não pode ter mais de 100 caracteres.'],
    },
    modelo: {
      type: String,
      required: [true, 'O campo modelo é obrigatório.'],
      trim: true,
      minlength: [1, 'O modelo não pode ficar vazio.'],
      maxlength: [100, 'O modelo não pode ter mais de 100 caracteres.'],
    },
    preco: {
      type: Number,
      required: [true, 'O campo preco é obrigatório.'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isFinite(v) && v > 0;
        },
        message: 'O preço deve ser um valor numérico finito maior que zero.',
      },
    },
    foto: {
      type: String,
      required: [true, 'O campo foto é obrigatório.'],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === 'string' && URL_REGEX.test(v);
        },
        message: 'A foto deve ser uma URL válida iniciada por http:// ou https://.',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para otimização de consultas frequentes (busca, filtro e ordenação)
perfumeSchema.index({ marca: 1 });
perfumeSchema.index({ preco: 1 });
perfumeSchema.index({ createdAt: -1 });
// Índice composto de texto ou prefixo para busca rápida por marca e modelo
perfumeSchema.index({ marca: 'text', modelo: 'text' });

const Perfume = mongoose.models.Perfume || mongoose.model('Perfume', perfumeSchema);

module.exports = Perfume;
