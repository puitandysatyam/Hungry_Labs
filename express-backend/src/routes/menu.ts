import { Router } from 'express';
import { getMenu, getCarousel } from '../controllers/menuController';

const router = Router();
router.get('/', getMenu);
router.get('/carousel', getCarousel);

export default router;