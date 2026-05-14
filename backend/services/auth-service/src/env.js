import dotenv from 'dotenv';

// AUTH_ENV_FILE=.env.nomongo → in-memory demo auth, no MongoDB (see .env.nomongo).
dotenv.config({ path: process.env.AUTH_ENV_FILE || '.env' });
