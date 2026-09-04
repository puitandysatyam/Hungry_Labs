import { Router } from 'express';
import { handleContactSubmit, getContactConfig } from '../controllers/contactController';

const router = Router();

router.post('/', handleContactSubmit);
router.get('/config', getContactConfig);

export default router;

