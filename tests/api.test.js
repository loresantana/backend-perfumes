const { describe, it, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const perfumeService = require('../src/services/perfumeService');

describe('API REST - Endpoints e Tratamento de Erros', () => {
  const originalService = { ...perfumeService };

  afterEach(() => {
    // Restaura os métodos do service após cada teste
    Object.assign(perfumeService, originalService);
  });

  describe('GET /api/health', () => {
    it('deve responder status HTTP 200 ou 503 com payload estruturado', async () => {
      const res = await request(app).get('/api/health');
      assert.ok([200, 503].includes(res.status));
      assert.ok(res.body.status);
      assert.ok(res.body.timestamp);
      assert.ok(res.body.database);
    });
  });

  describe('POST /api/perfumes', () => {
    it('deve retornar 400 se faltarem campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/perfumes')
        .send({ marca: 'Dior' });

      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });

    it('deve cadastrar com sucesso e retornar 201 quando os dados forem válidos', async () => {
      const fakePerfume = {
        _id: '653b6f2e8f1b2c001f3e4d5a',
        marca: 'Tom Ford',
        modelo: 'Tobacco Vanille',
        preco: 1450.0,
        foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
      };

      perfumeService.createPerfume = async () => fakePerfume;

      const res = await request(app)
        .post('/api/perfumes')
        .send({
          marca: 'Tom Ford',
          modelo: 'Tobacco Vanille',
          preco: 1450.0,
          foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.message, 'Perfume cadastrado com sucesso.');
      assert.equal(res.body.data.marca, 'Tom Ford');
    });
  });

  describe('GET /api/perfumes', () => {
    it('deve retornar 200 com lista de perfumes e paginação estruturada', async () => {
      perfumeService.getPerfumes = async () => ({
        data: [
          {
            _id: '653b6f2e8f1b2c001f3e4d5a',
            marca: 'Dior',
            modelo: 'Sauvage',
            preco: 599.9,
            foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get('/api/perfumes?page=1&limit=12');

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.pagination.page, 1);
      assert.equal(res.body.pagination.total, 1);
    });

    it('deve repassar parâmetros de busca, filtro e ordenação para o service', async () => {
      let capturedOptions = null;
      perfumeService.getPerfumes = async (options) => {
        capturedOptions = options;
        return {
          data: [],
          pagination: { page: 2, limit: 6, total: 0, totalPages: 0 },
        };
      };

      const res = await request(app)
        .get('/api/perfumes?page=2&limit=6&search=sauvage&marca=Dior&sort=preco_asc');

      assert.equal(res.status, 200);
      assert.equal(capturedOptions.page, '2');
      assert.equal(capturedOptions.limit, '6');
      assert.equal(capturedOptions.search, 'sauvage');
      assert.equal(capturedOptions.marca, 'Dior');
      assert.equal(capturedOptions.sort, 'preco_asc');
    });
  });

  describe('GET /api/perfumes/:id', () => {
    it('deve retornar 400 se o id fornecido for inválido', async () => {
      const res = await request(app).get('/api/perfumes/id-invalido-123');
      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });

    it('deve retornar 404 se o perfume não existir no banco', async () => {
      perfumeService.getPerfumeById = async () => null;

      const res = await request(app).get('/api/perfumes/653b6f2e8f1b2c001f3e4d5a');
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Perfume não encontrado.');
    });

    it('deve retornar 200 com os dados do perfume quando ele existir', async () => {
      const perfumeMock = {
        _id: '653b6f2e8f1b2c001f3e4d5a',
        marca: 'Dior',
        modelo: 'Sauvage',
        preco: 599.9,
        foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
      };

      perfumeService.getPerfumeById = async () => perfumeMock;

      const res = await request(app).get('/api/perfumes/653b6f2e8f1b2c001f3e4d5a');
      assert.equal(res.status, 200);
      assert.equal(res.body.marca, 'Dior');
      assert.equal(res.body._id, '653b6f2e8f1b2c001f3e4d5a');
    });
  });

  describe('PUT /api/perfumes/:id', () => {
    it('deve retornar 400 se nenhum campo for enviado para atualização', async () => {
      const res = await request(app)
        .put('/api/perfumes/653b6f2e8f1b2c001f3e4d5a')
        .send({});

      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });

    it('deve retornar 404 se o perfume a atualizar não for encontrado', async () => {
      perfumeService.updatePerfume = async () => null;

      const res = await request(app)
        .put('/api/perfumes/653b6f2e8f1b2c001f3e4d5a')
        .send({ preco: 649.9 });

      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Perfume não encontrado.');
    });

    it('deve atualizar com sucesso e retornar 200', async () => {
      const perfumeAtualizadoMock = {
        _id: '653b6f2e8f1b2c001f3e4d5a',
        marca: 'Dior',
        modelo: 'Sauvage Elixir',
        preco: 799.9,
        foto: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
      };

      perfumeService.updatePerfume = async () => perfumeAtualizadoMock;

      const res = await request(app)
        .put('/api/perfumes/653b6f2e8f1b2c001f3e4d5a')
        .send({ modelo: 'Sauvage Elixir', preco: 799.9 });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Perfume atualizado com sucesso.');
      assert.equal(res.body.data.modelo, 'Sauvage Elixir');
    });
  });

  describe('DELETE /api/perfumes/:id', () => {
    it('deve retornar 404 se o perfume a excluir não existir', async () => {
      perfumeService.deletePerfume = async () => null;

      const res = await request(app).delete('/api/perfumes/653b6f2e8f1b2c001f3e4d5a');
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Perfume não encontrado.');
    });

    it('deve excluir e retornar 200 com confirmação', async () => {
      perfumeService.deletePerfume = async () => ({ _id: '653b6f2e8f1b2c001f3e4d5a' });

      const res = await request(app).delete('/api/perfumes/653b6f2e8f1b2c001f3e4d5a');
      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Perfume excluído com sucesso.');
      assert.equal(res.body.id, '653b6f2e8f1b2c001f3e4d5a');
    });
  });

  describe('GET /api/perfumes/marcas', () => {
    it('deve retornar lista de marcas únicas registradas', async () => {
      perfumeService.getDistinctMarcas = async () => ['Chanel', 'Dior', 'Tom Ford'];

      const res = await request(app).get('/api/perfumes/marcas');
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data, ['Chanel', 'Dior', 'Tom Ford']);
    });
  });

  describe('Tratamento de Rotas Inexistentes e Erros', () => {
    it('deve retornar 404 para rotas desconhecidas em formato JSON', async () => {
      const res = await request(app).get('/api/rota-inexistente-xyz');
      assert.equal(res.status, 404);
      assert.ok(res.body.error);
    });

    it('deve retornar 400 para payloads com JSON malformado', async () => {
      const res = await request(app)
        .post('/api/perfumes')
        .set('Content-Type', 'application/json')
        .send('{"marca": "Dior", quebrado');

      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Payload JSON malformado.');
    });

    it('deve configurar cabeçalhos de CORS adequados', async () => {
      const res = await request(app)
        .options('/api/perfumes')
        .set('Origin', 'http://localhost:5500')
        .set('Access-Control-Request-Method', 'POST');

      assert.ok([200, 204].includes(res.status));
      assert.ok(
        res.headers['access-control-allow-origin'] === '*' ||
          res.headers['access-control-allow-origin'] === 'http://localhost:5500'
      );
    });
  });
});
