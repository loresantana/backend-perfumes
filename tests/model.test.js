const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Perfume = require('../src/models/Perfume');

describe('Modelo Perfume - Testes Unitários de Validação', () => {
  it('deve validar com sucesso um perfume com todos os dados válidos', async () => {
    const perfumeValido = new Perfume({
      marca: 'Chanel',
      modelo: 'Bleu de Chanel',
      preco: 750.5,
      foto: 'https://images.unsplash.com/photo-1594035910387-fea47794261f',
    });

    const error = perfumeValido.validateSync();
    assert.equal(error, undefined);
  });

  it('deve falhar se a marca estiver ausente ou vazia', () => {
    const perfumeSemMarca = new Perfume({
      modelo: 'Bleu de Chanel',
      preco: 750.5,
      foto: 'https://images.unsplash.com/photo-1594035910387-fea47794261f',
    });
    const errorAusente = perfumeSemMarca.validateSync();
    assert.ok(errorAusente.errors.marca);

    const perfumeMarcaVazia = new Perfume({
      marca: '   ',
      modelo: 'Bleu de Chanel',
      preco: 750.5,
      foto: 'https://images.unsplash.com/photo-1594035910387-fea47794261f',
    });
    const errorVazia = perfumeMarcaVazia.validateSync();
    assert.ok(errorVazia.errors.marca);
  });

  it('deve falhar se o modelo estiver ausente ou vazio', () => {
    const perfumeSemModelo = new Perfume({
      marca: 'Dior',
      preco: 599.9,
      foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
    });
    const errorAusente = perfumeSemModelo.validateSync();
    assert.ok(errorAusente.errors.modelo);

    const perfumeModeloVazio = new Perfume({
      marca: 'Dior',
      modelo: '',
      preco: 599.9,
      foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
    });
    const errorVazio = perfumeModeloVazio.validateSync();
    assert.ok(errorVazio.errors.modelo);
  });

  it('deve falhar se o preço for zero, negativo ou não numérico', () => {
    const perfumePrecoZero = new Perfume({
      marca: 'Dior',
      modelo: 'Sauvage',
      preco: 0,
      foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
    });
    const errorZero = perfumePrecoZero.validateSync();
    assert.ok(errorZero.errors.preco);

    const perfumePrecoNegativo = new Perfume({
      marca: 'Dior',
      modelo: 'Sauvage',
      preco: -49.9,
      foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
    });
    const errorNegativo = perfumePrecoNegativo.validateSync();
    assert.ok(errorNegativo.errors.preco);

    const perfumePrecoNaoNumerico = new Perfume({
      marca: 'Dior',
      modelo: 'Sauvage',
      preco: NaN,
      foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
    });
    const errorNaoNumerico = perfumePrecoNaoNumerico.validateSync();
    assert.ok(errorNaoNumerico.errors.preco);
  });

  it('deve falhar se a URL da foto for inválida ou não usar HTTP/HTTPS', () => {
    const perfumeFotoInvalida = new Perfume({
      marca: 'Versace',
      modelo: 'Eros',
      preco: 450.0,
      foto: 'arquivo-local.png',
    });
    const errorInvalida = perfumeFotoInvalida.validateSync();
    assert.ok(errorInvalida.errors.foto);

    const perfumeFtp = new Perfume({
      marca: 'Versace',
      modelo: 'Eros',
      preco: 450.0,
      foto: 'ftp://servidor.com/imagem.png',
    });
    const errorFtp = perfumeFtp.validateSync();
    assert.ok(errorFtp.errors.foto);
  });
});
