// ==================== PYTHON AI SERVICE INTEGRATION ====================
// This service calls the Python Flask API to use the trained AI model

// Empty string = explicitly disabled (e.g. Render free tier without ML container).
const _pyUrl = process.env.PYTHON_SENTIMENT_URL ?? process.env.PYTHON_SERVICE_URL;
const PYTHON_SERVICE_URL =
  _pyUrl === '' ? null : (_pyUrl || 'http://localhost:5000');

// Factor mapping for normalization
const FACTOR_MAP = {
    academics: 'Academics',
    faculty: 'Faculty',
    'campus life': 'Campus Life',
    facilities: 'Facilities',
    infrastructure: 'Facilities',
    hostel: 'Facilities',
    hostels: 'Facilities',
    placement: 'Placements',
    placements: 'Placements',
    career: 'Placements',
    jobs: 'Placements',
};

/**
 * Normalize factor name to standard format
 */
function normalizeFactor(raw) {
    const lower = raw.toLowerCase().trim();
    for (const key in FACTOR_MAP) {
        if (lower.includes(key)) {
            return FACTOR_MAP[key];
        }
    }
    return 'General';
}

/**
 * Predict rating for a single review using Python AI service
 */
async function predictSingle(review) {
    if (!PYTHON_SERVICE_URL) {
        return 3.0;
    }
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                review_text: review.review_text,
                factor: review.factor || 'General',
                university: review.university || '',
                city: review.city || ''
            })
        });

        if (!response.ok) {
            throw new Error(`Python service returned ${response.status}`);
        }

        const data = await response.json();
        return data.rating || 3.0;
    } catch (err) {
        console.error('Python service prediction error:', err);
        return 3.0; // Fallback
    }
}

/**
 * Predict ratings for multiple reviews using Python AI service
 */
async function predictBatch(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        throw new Error('Reviews must be a non-empty array');
    }

    if (!PYTHON_SERVICE_URL) {
        return reviews.map(() => 3.0);
    }

    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/predict/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reviews: reviews.map(r => ({
                    review_text: r.review_text,
                    factor: r.factor || 'General',
                    university: r.university || '',
                    city: r.city || ''
                }))
            })
        });

        if (!response.ok) {
            throw new Error(`Python service returned ${response.status}`);
        }

        const data = await response.json();

        if (data.predictions && Array.isArray(data.predictions)) {
            return data.predictions;
        }

        if (Array.isArray(data)) {
            return data.map(item => item.rating || 3.0);
        }

        return reviews.map(() => 3.0);
    } catch (err) {
        console.error('Python service batch prediction error:', err);
        return reviews.map(() => 3.0);
    }
}

/**
 * Analyze reviews (calls Python service batch endpoint)
 */
async function analyzeReviews(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        throw new Error('Reviews array is required');
    }

    if (!PYTHON_SERVICE_URL) {
        return {
            overall_rating: 0,
            predictions: [],
            rating_breakdown: {},
            review_distribution: {},
            total_reviews: reviews.length,
            note: 'Python sentiment service not configured'
        };
    }

    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/predict/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews })
        });

        if (!response.ok) {
            throw new Error(`Python service returned ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error('Analyze reviews error:', err);
        throw err;
    }
}

/**
 * Check if Python AI service is ready
 */
async function isModelReady() {
    if (!PYTHON_SERVICE_URL) {
        return false;
    }
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/health`);
        const data = await response.json();
        return data.status === 'ok' && data.model_loaded === true;
    } catch (err) {
        return false;
    }
}

/**
 * Get model status from Python service
 */
async function getModelStatus() {
    if (!PYTHON_SERVICE_URL) {
        return {
            ready: false,
            loading: false,
            error: 'Python sentiment not configured',
            service: 'disabled'
        };
    }
    try {
        const response = await fetch(`${PYTHON_SERVICE_URL}/health`);
        const data = await response.json();
        return {
            ready: data.model_loaded || false,
            loading: false,
            error: data.model_loaded ? null : 'Model not loaded',
            service: 'Python Flask (port 5000)'
        };
    } catch (err) {
        return {
            ready: false,
            loading: false,
            error: 'Python service not reachable',
            service: 'Python Flask (port 5000)'
        };
    }
}

/**
 * Dummy loadModel function for compatibility
 */
async function loadModel() {
    // Python service loads the model on startup
    console.log('Using Python AI service - model loaded by Flask app');
}

export {
    loadModel,
    predictSingle,
    predictBatch,
    analyzeReviews,
    isModelReady,
    getModelStatus,
    normalizeFactor,
    PYTHON_SERVICE_URL,
};