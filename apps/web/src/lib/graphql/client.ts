import { GraphQLClient } from 'graphql-request';

// Envio GraphQL endpoint configuration
const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';

// Log the endpoint being used (helpful for debugging)
if (typeof window !== 'undefined') {
  console.log('🔗 Envio GraphQL Endpoint:', ENVIO_ENDPOINT);
}

// Create GraphQL client with better configuration
export const graphqlClient = new GraphQLClient(ENVIO_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Helper function for making GraphQL requests
export async function request<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    return await graphqlClient.request<T>(query, variables);
  } catch (error) {
    console.error('GraphQL request failed:', {
      endpoint: ENVIO_ENDPOINT,
      error: error instanceof Error ? error.message : error,
      query: query.slice(0, 200) + '...',
      variables
    });
    throw error;
  }
}

// Helper function for making GraphQL requests with error handling
export async function requestWithFallback<T = any>(
  query: string,
  variables?: Record<string, any>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await graphqlClient.request<T>(query, variables);
  } catch (error) {
    console.warn('GraphQL request failed, using fallback:', error);
    return fallbackValue;
  }
}