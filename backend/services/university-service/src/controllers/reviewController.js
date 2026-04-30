
import Review from '../models/Review.js';
import { University } from '../models/University.js';
import { predictSingle, predictBatch } from '../services/sentimentService.js'; // Fixed: import predictBatch

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = async (req, res) => {
    try {
        const { review_text, factor, university, city, authorName, authorClass } = req.body;

        if (!review_text || !factor || !university || !city) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['review_text', 'factor', 'university', 'city']
            });
        }

        let rating;
        try {
            rating = await predictSingle({ review_text, factor, university, city });
        } catch (err) {
            console.error('Rating prediction failed:', err);
            return res.status(500).json({
                error: 'Failed to predict rating',
                message: err.message
            });
        }

        const review = new Review({
            review_text,
            rating,
            factor,
            university,
            city,
            author: req.user?._id || null,
            authorName: authorName || req.user?.name || 'Anonymous',
            authorClass: authorClass || null
        });

        await review.save();

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review: {
                id: review._id,
                review_text: review.review_text,
                rating: review.rating,
                factor: review.factor,
                university: review.university,
                city: review.city,
                authorName: review.authorName,
                authorClass: review.authorClass,
                helpful_count: review.helpful_count || 0,
                createdAt: review.createdAt
            }
        });
    } catch (err) {
        console.error('Create review error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};

/**
 * Get reviews for a specific university
 * GET /api/reviews/:university
 */
export const getReviewsByUniversity = async (req, res) => {
    try {
        const { university } = req.params;
        const {
            page = 1,
            limit = 10,
            factor = null,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

        // Get reviews using static method
        const rawReviews = await Review.getByUniversity(university, {
            page: pageNum,
            limit: limitNum,
            factor,
            sortBy,
            sortOrder
        });

        let reviews = rawReviews;

        // Only run AI prediction if there are reviews
        if (rawReviews.length > 0) {
            // Check for cached predictions first
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const sanitizedName = escapeRegExp(university).replace(/[\s\-]+/g, '[\\s\\-]+');

            const universityDoc = await University.findOne({
                $or: [
                    { name: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } },
                    { apiName: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } }
                ]
            });

            // Check if cache is valid (less than 24 hours old)
            const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
            const now = new Date();
            const cacheIsValid = universityDoc?.cachedSentiment?.lastAnalyzed &&
                (now - new Date(universityDoc.cachedSentiment.lastAnalyzed)) < CACHE_DURATION_MS &&
                universityDoc.cachedSentiment.predictions?.length > 0;

            let ratings;
            if (cacheIsValid) {
                // Use cached predictions (assumes same sort order as when cached)
                console.log(`[REVIEWS] ✅ Using cached predictions for ${university}`);
                ratings = universityDoc.cachedSentiment.predictions;
            } else {
                // Compute fresh predictions
                console.log(`[REVIEWS] 🔄 Computing fresh predictions for ${university}`);
                ratings = await predictBatch(
                    rawReviews.map(r => ({
                        review_text: r.reviewText || r.review_text || '',
                        factor: r.factor || 'General',
                        university: r.university || university,
                        city: r.city || 'Pakistan'
                    }))
                );
            }

            reviews = rawReviews.map((review, i) => {
                let cleanText = (review.reviewText || review.review_text || '').trim();

                // Clean prefix like "University: NUST, City: Islamabad. "
                cleanText = cleanText.replace(/^University:\s*[^,]+,\s*City:\s*[^.]+\.\s*/i, '');
                // Clean factor prefix like "Faculty: "
                cleanText = cleanText.replace(/^[A-Za-z\s]+:\s*/i, '');
                cleanText = cleanText.trim();

                return {
                    ...(review.toObject ? review.toObject() : review),
                    reviewText: cleanText || 'No content',
                    aiRating: Number((ratings[i] || 3.0).toFixed(1)),
                    authorName: review.authorName || 'Anonymous'
                };
            });
        }

        // Pagination count
        const query = { university, isApproved: true };
        if (factor && factor !== 'all') query.factor = factor;
        const totalCount = await Review.countDocuments(query);

        res.json({
            success: true,
            reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount
            }
        });
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};

/**
 * Get review statistics for a university using AI predictions
 * GET /api/reviews/:university/stats
 */
export const getReviewStats = async (req, res) => {
    try {
        const { university } = req.params;

        console.log(`[STATS] Request for university: "${university}"`);

        // Escape special regex characters (like brackets) and allow flexible matching for hyphens/spaces
        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        // Replace spaces and hyphens with a regex pattern that matches either
        const sanitizedName = escapeRegExp(university).replace(/[\s\-]+/g, '[\\s\\-]+');

        console.log(`[STATS] Using regex: ^${sanitizedName}$`);

        const query = {
            university: { $regex: new RegExp(`^${sanitizedName}$`, 'i') },
            isApproved: true
        };

        const totalCount = await Review.countDocuments(query);

        // Check if we have cached sentiment analysis
        const universityDoc = await University.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } },
                { apiName: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } }
            ]
        });

        // Check if cache is valid (less than 24 hours old and review count matches)
        const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = new Date();
        const cacheIsValid = universityDoc?.cachedSentiment?.lastAnalyzed &&
            (now - new Date(universityDoc.cachedSentiment.lastAnalyzed)) < CACHE_DURATION_MS &&
            universityDoc.cachedSentiment.totalReviews === totalCount;

        if (cacheIsValid) {
            console.log(`[STATS] ✅ Using cached sentiment analysis (age: ${Math.round((now - new Date(universityDoc.cachedSentiment.lastAnalyzed)) / 1000 / 60)} minutes)`);
            return res.json({
                success: true,
                university,
                cached: true,
                stats: {
                    overall_rating: universityDoc.cachedSentiment.overallRating || 0,
                    total_reviews: universityDoc.cachedSentiment.totalReviews || totalCount,
                    rating_breakdown: universityDoc.cachedSentiment.ratingBreakdown || {},
                    review_distribution: universityDoc.cachedSentiment.reviewDistribution || {}
                }
            });
        }

        // Limit to latest 30 reviews for AI analysis to prevent timeouts
        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        console.log(`[STATS] 🔄 Cache miss or expired. Analyzing ${reviews.length} reviews...`);

        if (reviews.length === 0) {
            return res.json({
                success: true,
                university,
                stats: {
                    overall_rating: 0,
                    total_reviews: 0,
                    rating_breakdown: {},
                    review_distribution: {}
                }
            });
        }

        const reviewsForPrediction = reviews.map(r => ({
            review_text: r.reviewText || r.review_text || '',
            factor: r.factor || 'General',
            university: r.university || university,
            city: r.city || 'Pakistan'
        }));

        console.log(`[STATS] Sending ${reviewsForPrediction.length} reviews to AI service...`);

        // Set a longer timeout for the fetch request (if supported by environment, otherwise rely on limiting data)
        const response = await fetch('http://localhost:5000/predict/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: reviewsForPrediction })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[STATS] AI service error ${response.status}:`, errText);
            throw new Error(`AI service failed: ${response.status}`);
        }

        const aiStats = await response.json();

        console.log('[STATS] AI Response:', JSON.stringify(aiStats, null, 2));

        // Fix keys for Mongoose schema (e.g., "Job Support" -> "JobSupport")
        const mappedRatingBreakdown = {};
        if (aiStats.rating_breakdown) {
            for (const [k, v] of Object.entries(aiStats.rating_breakdown)) {
                const schemaKey = k.replace(/\s+/g, '');
                mappedRatingBreakdown[schemaKey] = v;
            }
        }

        // Cache the results in the University document
        if (universityDoc) {
            universityDoc.cachedSentiment = {
                overallRating: aiStats.overall_rating || 0,
                predictions: aiStats.predictions || [],
                ratingBreakdown: mappedRatingBreakdown,
                reviewDistribution: aiStats.review_distribution || {},
                totalReviews: totalCount,
                lastAnalyzed: now,
                reviewsAnalyzedCount: reviews.length
            };
            await universityDoc.save();
            console.log(`[STATS] ✅ Cached sentiment analysis for ${university}`);
        } else {
            console.warn(`[STATS] ⚠️  University document not found, cannot cache results`);
        }

        res.json({
            success: true,
            university,
            cached: false,
            stats: {
                overall_rating: aiStats.overall_rating || 0,
                total_reviews: totalCount, // Return the real total count
                rating_breakdown: aiStats.rating_breakdown || {},
                review_distribution: aiStats.review_distribution || {}
            }
        });
    } catch (err) {
        console.error('[STATS] Error:', err);
        res.status(500).json({ error: 'Failed to get stats', message: err.message });
    }
};

/**
 * Like/upvote a review
 */
export const likeReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);

        if (!review) return res.status(404).json({ error: 'Review not found' });

        await review.incrementHelpful();

        res.json({
            success: true,
            message: 'Liked!',
            helpful_count: review.helpful_count
        });
    } catch (err) {
        console.error('Like error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Delete a review
 */
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);

        if (!review) return res.status(404).json({ error: 'Not found' });

        if (req.user && review.author && review.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Report a review
 */
export const reportReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        review.isReported = true;
        await review.save();

        res.json({ success: true, message: 'Review reported' });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};