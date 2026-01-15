# mingle mesh chat app

> a real-time chat application built with react, apollo-graphql, socket.io, and node.js for seamless communication and collaboration.

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()

## table of contents

* [introduction](#introduction)
* [prerequisites](#prerequisites)
* [installation](#installation)
* [usage](#usage)
* [configuration](#configuration)
* [api documentation](#api-documentation)
* [testing](#testing)
* [contributing](#contributing)
* [license](#license)

## introduction

mingle mesh chat app is a real-time chat platform designed for fast, reliable, and secure messaging. it supports direct messages, typing indicators, read receipts, and offline resilience.

**key features:**

* real-time chat with socket.io and apollo subscriptions
* secure authentication with oauth/google and jwt
* message status tracking (sent, delivered, read)
* offline support and message caching
* scalable architecture with node.js and mongodb

## prerequisites

before running the project, ensure the following are installed:

* [node.js](https://nodejs.org/) (v16+)
* [npm](https://www.npmjs.com/)
* [mongodb atlas](https://www.mongodb.com/cloud/atlas) or local mongodb instance
* optional: yarn for dependency management

## installation

step-by-step instructions to set up the project locally:

```bash
# clone the repository
git clone https://github.com/mvntech/mingle-mesh-chat-app.git
cd mingle-mesh-chat-app

# install dependencies
npm install

# run the development server
npm run dev
```

## usage

run frontend:

```bash
cd client
npm run dev
```

run backend:

```bash
cd server
npm run start:dev
```

access the app at `http://localhost:5173` (frontend) and `http://localhost:5000/graphql` (backend api).

## configuration

### backend environment variables (`server/.env`)

create a `.env` file in the `server` directory and add the following:

```env
# server configuration
SERVER_URL=http://localhost:5000
NODE_ENV=development
PORT=5000

# database
MONGODB_URI=your_mongodb_uri
MONGODB_NAME=mingle-mesh-chat-app

# authentication
JWT_SECRET=your_jwt_secret
JWT_TOKEN_EXPIRE=7d

# client url (for cors)
CLIENT_URL=http://localhost:5173

# cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# google oauth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# github oauth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
```
### frontend environment variables (`client/.env`)

create a `.env` file in the `client` directory and add the following:

```env
# api endpoints
VITE_API_URL=http://localhost:5000/graphql
VITE_WS_URL=http://localhost:5000
VITE_AUTH_URL=http://localhost:5000/auth
```

## api documentation

### graphql endpoints

* **query** `getChats` - returns all chats for authenticated user
* **query** `getMessages(chatId)` - returns messages for a chat
* **mutation** `sendMessage(chatId, content, fileUrl)` - sends a message
* **mutation** `markChatAsRead(chatId)` - marks all messages as read
* **mutation** `createChat(userIds)` - creates new chat
* **mutation** `deleteChat(chatId)` - deletes a chat
* **mutation** `register` / `login` - user authentication

### socket events

* `connect`, `disconnect` - socket connection management
* `new-message` - emitted when a message is sent
* `typing` - emitted when user is typing
* `join-chats` - join chat rooms

## testing

manual testing procedure:

1. run frontend and backend in dev mode
2. create new users and authenticate
3. send messages between users
4. verify read receipts, typing indicators, and offline persistence
5. test chat deletion and message history integrity

## contributing

contributions are welcome:

1. fork the repository
2. create a feature branch:

```bash
git checkout -b feature/amazing-feature
```

3. commit your changes:

```bash
git commit -m "add amazing feature"
```

4. push to your branch:

```bash
git push origin feature/amazing-feature
```

5. open a pull request

## license

distributed under the mit license. see `LICENSE` for more information.
created by [muntaha / mvntech] with love!♡
