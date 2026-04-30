import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple CSV parser since we're avoiding dependencies
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      if (lines.length === 0) {
        resolve([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const results = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] ? values[index].trim() : '';
        });
        results.push(obj);
      }

      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Scholarship Mapper Utility
 * Maps scholarships from data files to universities based on eligibility criteria
 */
class ScholarshipMapper {
  constructor() {
    this.scholarships = [];
    this.universities = [];
  }

  /**
   * Load scholarship data from CSV and JSON files
   */
  async loadScholarshipData() {
    try {
      // Load JSON scholarships
      const jsonPath = path.join(__dirname, '../data/scholarships data/eduvision_scholarships.json');
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      this.scholarships = jsonData;

      // Load CSV scholarships (if needed)
      const csvPath = path.join(__dirname, '../data/scholarships data/bachelors_scholarships.csv');
      if (fs.existsSync(csvPath)) {
        const csvScholarships = await this.readCSV(csvPath);
        // Merge CSV scholarships if they have different format
        this.scholarships = [...this.scholarships, ...csvScholarships];
      }

      console.log(`Loaded ${this.scholarships.length} scholarships`);
      return this.scholarships;
    } catch (error) {
      console.error('Error loading scholarship data:', error);
      return [];
    }
  }

  /**
   * Load university data
   */
  loadUniversityData() {
    try {
      const universityPath = path.join(__dirname, '../data/universities data/universities intro details/universities_with_ratio.json');
      this.universities = JSON.parse(fs.readFileSync(universityPath, 'utf8'));
      console.log(`Loaded ${this.universities.length} universities`);
      return this.universities;
    } catch (error) {
      console.error('Error loading university data:', error);
      return [];
    }
  }

  /**
   * Read CSV file and convert to JSON
   */
  async readCSV(filePath) {
    return await parseCSV(filePath);
  }

  /**
   * Extract province/city from university location
   */
  extractLocation(university) {
    const location = university.Location || university.University || '';
    const locationLower = location.toLowerCase();

    // Define major cities and provinces
    const locationMap = {
      'punjab': ['punjab', 'lahore', 'faisalabad', 'rawalpindi', 'multan', 'gujranwala', 'sialkot'],
      'sindh': ['sindh', 'karachi', 'hyderabad', 'sukkur', 'larkana'],
      'balochistan': ['balochistan', 'quetta', 'gwadar', 'khuzdar'],
      'kp': ['khyber', 'peshawar', 'mardan', 'abbottabad', 'swat'],
      'islamabad': ['islamabad', 'ict'],
      'ajk': ['azad kashmir', 'ajk', 'muzaffarabad', 'mirpur'],
      'gilgit': ['gilgit', 'baltistan', 'gb']
    };

    for (const [province, keywords] of Object.entries(locationMap)) {
      if (keywords.some(keyword => locationLower.includes(keyword))) {
        return province;
      }
    }

    return 'unknown';
  }

  normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getScholarshipText(scholarship) {
    return this.normalizeText(
      [
        scholarship.title,
        scholarship.area,
        scholarship.eligibility,
        scholarship.offered_by,
        scholarship.full_content,
        scholarship.summary
      ].join(' ')
    );
  }

  isInternationalScholarship(scholarship) {
    const text = this.getScholarshipText(scholarship);
    const internationalKeywords = [
      'usa',
      'united states',
      'uk',
      'united kingdom',
      'germany',
      'netherlands',
      'finland',
      'japan',
      'canada',
      'australia',
      'china',
      'chinese',
      'hungary',
      'hungaricum',
      'europe',
      'foreign university',
      'study abroad',
      'international students',
      'fulbright',
      'daad',
      'commonwealth',
      'erasmus',
      'rotterdam',
      'kyoto'
    ];
    return internationalKeywords.some((keyword) => text.includes(keyword));
  }

  isNoiseScholarship(scholarship) {
    const title = this.normalizeText(scholarship.title);
    const link = this.normalizeText(scholarship.url);
    const noisyKeywords = ['latest scholarships', 'bachelor php', 'scholarships list', 'all scholarships'];
    if (noisyKeywords.some((keyword) => title.includes(keyword))) return true;
    if (link.includes('bachelor.php')) return true;
    return false;
  }

  referencesSpecificInstitution(scholarship) {
    const text = this.getScholarshipText(scholarship);
    const genericInstitutionPhrases = [
      'public universities',
      'private universities',
      'government recognized institutions',
      'all universities in pakistan'
    ];
    if (genericInstitutionPhrases.some((phrase) => text.includes(phrase))) return false;

    return (
      text.includes(' university') ||
      text.includes(' college') ||
      text.includes(' institute') ||
      text.includes(' campus')
    );
  }

  getUniversityMatchStrength(scholarship, university) {
    const scholarshipText = this.getScholarshipText(scholarship);
    const universityName = this.normalizeText(university.University);
    if (!universityName) return 0;

    if (scholarshipText.includes(universityName)) return 3;

    const genericTokens = new Set([
      'university',
      'college',
      'institute',
      'campus',
      'pakistan',
      'islamabad',
      'lahore',
      'karachi',
      'peshawar',
      'quetta',
      'multan',
      'faisalabad',
      'rawalpindi',
      'the',
      'of',
      'for',
      'and',
      'in'
    ]);
    const tokens = universityName
      .split(' ')
      .filter((token) => token.length > 3 && !genericTokens.has(token));
    const matchedTokens = tokens.filter((token) => scholarshipText.includes(token));

    if (matchedTokens.length >= 2) return 2;
    if (matchedTokens.length === 1) return 1;
    return 0;
  }

  /**
   * Check if scholarship is "All Pakistan" type
   */
  isAllPakistanScholarship(scholarship) {
    const area = (scholarship.area || '').toLowerCase();
    return area.includes('all pakistan') || area.includes('pakistan');
  }

  /**
   * Check if scholarship is quota-based (Balochistan/FATA)
   */
  isQuotaScholarship(scholarship) {
    const area = (scholarship.area || '').toLowerCase();
    const title = (scholarship.title || '').toLowerCase();
    const eligibility = (scholarship.eligibility || '').toLowerCase();

    const quotaKeywords = ['balochistan', 'baloch', 'fata', 'ex-fata', 'gilgit', 'gb', 'quota'];
    return quotaKeywords.some(keyword => 
      area.includes(keyword) || title.includes(keyword) || eligibility.includes(keyword)
    );
  }

  /**
   * Check if scholarship is for Bachelor level students
   */
  isBachelorLevelScholarship(scholarship) {
    const level = (scholarship.level || '').toLowerCase();
    
    // Include if level contains "bachelor" or "bs" or "undergraduate"
    return level.includes('bachelor') || 
           level.includes('bs ') || 
           level.includes('undergraduate') ||
           level.includes('bachelors');
  }

  /**
   * Check if scholarship is public/private specific
   */
  getScholarshipUniversityType(scholarship) {
    const title = (scholarship.title || '').toLowerCase();
    const eligibility = (scholarship.eligibility || '').toLowerCase();
    const fullContent = (scholarship.full_content || '').toLowerCase();

    if (fullContent.includes('public universities') || fullContent.includes('public sector universities')) {
      return 'public';
    }
    if (fullContent.includes('private universities') || fullContent.includes('private sector')) {
      return 'private';
    }
    
    return 'both'; // Default: available for both
  }

  /**
   * Map scholarships to a specific university
   */
  mapScholarshipsToUniversity(university) {
    const universityLocation = this.extractLocation(university);
    const universityType = (university.Type || '').toLowerCase();
    const applicableScholarships = [];

    for (const scholarship of this.scholarships) {
      // FILTER: Only include Bachelor level scholarships
      if (!this.isBachelorLevelScholarship(scholarship)) {
        continue; // Skip non-bachelor scholarships
      }
      // FILTER: Exclude international/non-local scholarships and noisy listing entries
      if (this.isInternationalScholarship(scholarship) || this.isNoiseScholarship(scholarship)) {
        continue;
      }

      let isApplicable = false;
      const matchStrength = this.getUniversityMatchStrength(scholarship, university);
      if (matchStrength === 0 && this.referencesSpecificInstitution(scholarship)) {
        continue;
      }

      // Rule 1: All Pakistan scholarships apply to all universities
      if (this.isAllPakistanScholarship(scholarship)) {
        isApplicable = true;
      }

      // Rule 2: Quota-based scholarships (Balochistan, FATA, etc.)
      if (this.isQuotaScholarship(scholarship)) {
        const scholarshipArea = (scholarship.area || '').toLowerCase();
        
        // Balochistan scholarships apply to all universities (for Balochistan students)
        if (scholarshipArea.includes('balochistan') || scholarshipArea.includes('baloch')) {
          isApplicable = true;
        }
        
        // FATA scholarships apply to all universities
        if (scholarshipArea.includes('fata')) {
          isApplicable = true;
        }

        // Province-specific: Only apply if university is in that province
        if (scholarshipArea.includes(universityLocation)) {
          isApplicable = true;
        }
      }

      // Rule 3: Public/Private university type matching
      const scholarshipType = this.getScholarshipUniversityType(scholarship);
      if (scholarshipType !== 'both') {
        if (scholarshipType === 'public' && !universityType.includes('public')) {
          isApplicable = false;
        }
        if (scholarshipType === 'private' && !universityType.includes('private')) {
          isApplicable = false;
        }
      }

      // Rule 4: Province/City specific scholarships
      const scholarshipArea = (scholarship.area || '').toLowerCase();
      if (!this.isAllPakistanScholarship(scholarship) && 
          !this.isQuotaScholarship(scholarship) &&
          scholarshipArea !== '') {
        // Check if scholarship area matches university location
        if (scholarshipArea.includes(universityLocation) || 
            universityLocation.includes(scholarshipArea.split(',')[0])) {
          isApplicable = true;
        }
      }

      if (isApplicable) {
        const mapped = {
          ...scholarship,
          matchReason: this.getMatchReason(scholarship, university, universityLocation),
          _matchStrength: matchStrength
        };
        // Keep weak matches only when they are Pakistan-wide scholarships.
        if (mapped._matchStrength >= 1 || this.isAllPakistanScholarship(scholarship) || this.isQuotaScholarship(scholarship)) {
          applicableScholarships.push(mapped);
        }
      }
    }
    const dedupedByTitle = new Map();
    for (const scholarship of applicableScholarships) {
      const key = this.normalizeText(scholarship.title);
      const existing = dedupedByTitle.get(key);
      if (!existing || (scholarship._matchStrength || 0) > (existing._matchStrength || 0)) {
        dedupedByTitle.set(key, scholarship);
      }
    }

    return Array.from(dedupedByTitle.values())
      .sort((a, b) => (b._matchStrength || 0) - (a._matchStrength || 0))
      .map(({ _matchStrength, ...rest }) => rest);
  }

  /**
   * Get the reason why scholarship matches university
   */
  getMatchReason(scholarship, university, universityLocation) {
    const reasons = [];

    if (this.isAllPakistanScholarship(scholarship)) {
      reasons.push('Available for all universities in Pakistan');
    }

    if (this.isQuotaScholarship(scholarship)) {
      const area = (scholarship.area || '').toLowerCase();
      if (area.includes('balochistan')) {
        reasons.push('Special quota for Balochistan students');
      }
      if (area.includes('fata')) {
        reasons.push('Special quota for FATA students');
      }
    }

    const scholarshipType = this.getScholarshipUniversityType(scholarship);
    if (scholarshipType === 'public' && university.Type?.toLowerCase().includes('public')) {
      reasons.push('Available for public universities');
    }
    if (scholarshipType === 'private' && university.Type?.toLowerCase().includes('private')) {
      reasons.push('Available for private universities');
    }

    const scholarshipArea = (scholarship.area || '').toLowerCase();
    if (scholarshipArea.includes(universityLocation)) {
      reasons.push(`Available in ${universityLocation}`);
    }

    return reasons.join('; ');
  }

  /**
   * Get all scholarships for a university by name
   */
  getScholarshipsForUniversity(universityName) {
    const normalizedInput = this.normalizeText(universityName);
    let university = this.universities.find(
      (u) => this.normalizeText(u.University) === normalizedInput
    );

    if (!university) {
      university = this.universities.find((u) => {
        const dbName = this.normalizeText(u.University);
        return dbName.includes(normalizedInput) || normalizedInput.includes(dbName);
      });
    }

    if (!university) {
      console.warn(`University not found: ${universityName}`);
      return [];
    }

    return this.mapScholarshipsToUniversity(university);
  }

  /**
   * Get all scholarships for all universities (returns a map)
   */
  getAllUniversityScholarshipMappings() {
    const mappings = {};

    for (const university of this.universities) {
      if (university.University) {
        mappings[university.University] = this.mapScholarshipsToUniversity(university);
      }
    }

    return mappings;
  }

  /**
   * Initialize mapper with data
   */
  async initialize() {
    await this.loadScholarshipData();
    this.loadUniversityData();
    console.log('Scholarship Mapper initialized successfully');
  }
}

// Create singleton instance
const scholarshipMapper = new ScholarshipMapper();

export { scholarshipMapper, ScholarshipMapper };
