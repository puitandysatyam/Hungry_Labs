import { Router } from 'express';
import { register, login, makeAdmin } from '../controllers/authController';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/make-admin', makeAdmin);

export default router;
