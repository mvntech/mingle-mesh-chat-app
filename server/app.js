import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { typeDefs, resolvers } from './graphql/schema.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
const httpServer = createServer(app);

app.use(express.json());

// connect to mongoDB
connectDB();

// graphql context function
const context = async ({ req }) => {

  // HTTP request
  let user = null;
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id).select('-password');
    } catch (error) {
        console.error("Error: ", error);
    }
  }

  return { user };
}

// create graphql schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// create apollo server
const apolloServer = new ApolloServer({
  schema,
  context,
});

// start apollo server
const startServer = async () => {
  await apolloServer.start();
  
  // apply apollo middleware
  apolloServer.applyMiddleware({ 
    app, 
    path: '/graphql',
  });

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });

  httpServer.on('error', (error) => {
      console.error('Error: ', error);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});

