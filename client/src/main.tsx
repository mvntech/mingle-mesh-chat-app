import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from "@apollo/client/react";
import { SocketProvider } from './context/SocketContext'
import App from './App.tsx'
import client from './apollo/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <SocketProvider>
        <App />
      </SocketProvider>
    </ApolloProvider>
  </StrictMode>
)
