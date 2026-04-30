import mongoose from 'mongoose';

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    duration: String,
    feePerSemester: String,
    meritDeadline: String,
    detailUrl: String,
    phone: String
});

const UniversitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    apiName: String, // Short name for API/Reviews (e.g. "NUST")
    location: { type: String, default: 'Islamabad' },
    type: String, // Public/Private
    established: String,
    affiliation: String,
    website: String,
    wikipediaUrl: String,

    // Leadership
    chancellor: String,
    viceChancellor: String,
    president: String,
    chairman: String,
    rector: String,
    dean: String,
    director: String,
    principal: String,

    // Stats
    totalStudents: Number,
    undergradStudents: Number,
    postgradStudents: Number,
    totalStaff: Number,
    academicStaff: Number,
    adminStaff: Number,
    studentStaffRatio: String,
    malePercentage: String,
    femalePercentage: String,

    // Campus Info
    campus: String, // Urban/Rural etc
    area: String,

    // Embedded Programs
    programs: [ProgramSchema],

    // Cached Sentiment Analysis
    cachedSentiment: {
        overallRating: Number,
        predictions: [Number],
        ratingBreakdown: {
            Cafeteria: Number,
            Campus: Number,
            Faculty: Number,
            Hostels: Number,
            Labs: Number,
            Management: Number,
            Overall: Number,
            Resources: Number,
            Sports: Number,
            JobSupport: Number,
            Events: Number
        },
        reviewDistribution: {
            '1': Number,
            '2': Number,
            '3': Number,
            '4': Number,
            '5': Number
        },
        totalReviews: Number,
        lastAnalyzed: Date,
        reviewsAnalyzedCount: Number // Number of reviews used for this analysis
    },

    // Metadata
    lastUpdated: { type: Date, default: Date.now }
});

// Create text index for search
UniversitySchema.index({ name: 'text', location: 'text', 'programs.name': 'text' });

export const University = mongoose.model('University', UniversitySchema);