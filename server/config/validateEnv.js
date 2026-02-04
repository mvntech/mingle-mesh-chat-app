export const REQUIRED_ENV_VARS = [
    'SERVER_URL',
    'CLIENT_URL',
    'MONGODB_URI',
    'MONGODB_NAME',
    'JWT_SECRET',
    'JWT_TOKEN_EXPIRE',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NODE_ENV'
];

export const RECOMMENDED_ENV_VARS = [
    'SENTRY_DSN',
    'GOOGLE_CLIENT_ID',
    'GITHUB_CLIENT_ID'
];

export function validateEnvironment() {
    console.log('Starting validation...');
    console.log('Env vars loaded:', Object.keys(process.env).length);

    if (!process.env.NODE_ENV) console.warn('NODE_ENV is missing!');

    const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
    const missingRecommended = RECOMMENDED_ENV_VARS.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:');
        missing.forEach(varName => console.error(`   - ${varName}`));
        console.error('\nCheck your .env file or deployment platform settings');
        process.exit(1);
    }

    if (missingRecommended.length > 0) {
        console.warn('Missing recommended environment variables:');
        missingRecommended.forEach(varName => console.warn(`   - ${varName}`));
    }

    if (process.env.NODE_ENV === 'production') {
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            console.error('JWT_SECRET must be at least 32 characters in production');
            process.exit(1);
        }
    }

    console.log('Environment validation passed');
}

export function validateUrl(url, varName) {
    try {
        new URL(url);
        return true;
    } catch {
        console.error(`Invalid URL format for ${varName}: ${url}`);
        return false;
    }
}
