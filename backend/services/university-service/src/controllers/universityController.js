import { University } from '../models/University.js';

export const listUniversities = async (req, res) => {
  try {
    const universities = await University.find({}, 'name apiName location type overallRating totalStudents image');
    res.json({ universities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
};

export const getUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    let university;

    // Check if valid ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      university = await University.findById(id);
    }

    // If not found by ID, try by name or apiName
    if (!university) {
      // Escape special characters for regex
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      university = await University.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${escapedId}$`, 'i') } },
          { apiName: { $regex: new RegExp(`^${escapedId}$`, 'i') } }
        ]
      });
    }

    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json(university);
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({ error: 'Failed to fetch university details' });
  }
};

export const getUniversityScholarships = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lazy load the scholarshipMapper (correct path to backend/shared)
    const mapperHref =
      process.env.SCHOLARSHIP_MAPPER_URL ||
      new URL('../../../../shared/utils/scholarshipMapper.js', import.meta.url).href;
    const { scholarshipMapper } = await import(mapperHref);
    
    // Initialize mapper if not already done
    if (!scholarshipMapper.scholarships || scholarshipMapper.scholarships.length === 0) {
      await scholarshipMapper.initialize();
    }

    let university;

    // Check if valid ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      university = await University.findById(id);
    }

    // If not found by ID, try by name or apiName
    if (!university) {
      // Escape special characters for regex
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      university = await University.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${escapedId}$`, 'i') } },
          { apiName: { $regex: new RegExp(`^${escapedId}$`, 'i') } }
        ]
      });
    }

    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Get scholarships for this university
    const scholarships = scholarshipMapper.getScholarshipsForUniversity(university.name);

    res.json({
      universityName: university.name,
      scholarships,
      totalCount: scholarships.length
    });
  } catch (error) {
    console.error('Error fetching university scholarships:', error);
    res.status(500).json({ error: 'Failed to fetch university scholarships', details: error.message });
  }
};