import express from 'express';
import { listUniversities, getUniversity, getUniversityPrograms, getUniversityScholarships } from '../controllers/universityController.js';

const router = express.Router();

router.get('/', listUniversities);
router.get('/:id', getUniversity);
router.get('/:id/programs', getUniversityPrograms);
router.get('/:id/scholarships', getUniversityScholarships);

export default router;