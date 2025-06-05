const express = require('express');
const router = express.Router();
const mealController = require('../controllers/blogController');

router.post('/create', mealController.createPost);
router.put('/edit/:id', mealController.editpost);
router.get('/all', mealController.getAllPosts);
router.delete('/:id', mealController.deletePost);

module.exports = router;