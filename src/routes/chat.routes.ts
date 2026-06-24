import { Router } from 'express';
import handleChat from '../controllers/chat.controller';
import validateBody from '../middleware/validateBody';
import { chatRequestSchema } from '../schemas/chat.schema';

const router = Router();

router.post('/chat', validateBody(chatRequestSchema), handleChat);

export default router;
