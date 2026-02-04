import "dotenv/config";

const config = {
    mongodb: {
        url: process.env.MONGODB_URI,
        databaseName: process.env.MONGODB_NAME,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 3600000,
            socketTimeoutMS: 3600000,
        }
    },

    migrationsDir: "migrations",
    changelogCollectionName: "changelog",
    migrationFileExtension: ".js",
    useFileHash: false,
    moduleSystem: 'esm',
};

export default config;
