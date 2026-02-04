import mongoose from "mongoose";

export const healthCheck = (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                status: 'unhealthy',
                reason: 'database',
                mongodb: dbStatus
            });
        }

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            mongodb: dbStatus
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
};
