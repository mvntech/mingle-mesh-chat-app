export default {
    transform: {},
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/config/',
        '/tests/'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ]
};
