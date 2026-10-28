const express = require('express');
const perfumeController = require('../controllers/perfumeController');

const router = express.Router();

// Rota auxiliar para listagem de marcas (deve preceder /:id para não ser capturada como id)
router.get('/marcas', perfumeController.listMarcas);

// Endpoints CRUD principais de perfumes
router.get('/', perfumeController.listPerfumes);
router.get('/:id', perfumeController.getPerfume);
router.post('/', perfumeController.createPerfume);
router.put('/:id', perfumeController.updatePerfume);
router.delete('/:id', perfumeController.deletePerfume);

module.exports = router;
