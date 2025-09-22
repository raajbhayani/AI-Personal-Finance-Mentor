import { ApolloServer } from '@apollo/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { typeDefs } from '../../lib/graphql/schema';
import { resolvers } from '../../lib/graphql/resolvers';
import { createContext } from '../../lib/graphql/context';
import connectToDatabase from '../../lib/database/mongodb';

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    // Log error for debugging
    console.error('GraphQL Error:', error);

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't reveal sensitive information
      if (error.message.includes('JWT') || error.message.includes('token')) {
        return {
          message: 'Authentication failed',
          code: 'AUTHENTICATION_ERROR',
          path: error.path,
        };
      }

      if (error.message.includes('database') || error.message.includes('MongoDB')) {
        return {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          path: error.path,
        };
      }
    }

    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_ERROR',
      path: error.path,
    };
  },
});

let serverStarted = false;

// Main API handler function
export default async function graphqlHandler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for GraphQL endpoint
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Ensure database connection before handling GraphQL requests
    await connectToDatabase();

    // Start server if not already started
    if (!serverStarted) {
      await server.start();
      serverStarted = true;
    }

    // Create context for this request
    const context = await createContext({ req });

    // Handle GraphQL request
    if (req.method === 'POST') {
      const { query, variables, operationName } = req.body;

      const response = await server.executeOperation(
        {
          query,
          variables,
          operationName,
        },
        {
          contextValue: context,
        }
      );

      // Handle single result
      if (response.body.kind === 'single') {
        res.status(200).json(response.body.singleResult);
      } else {
        // Handle incremental results (subscriptions)
        res.status(400).json({ error: 'Subscriptions not supported over HTTP' });
      }
    } else if (req.method === 'GET') {
      // Handle GraphQL Playground or introspection queries
      const { query, variables, operationName } = req.query;

      if (query) {
        const response = await server.executeOperation(
          {
            query: Array.isArray(query) ? query[0] : query,
            variables: variables ? JSON.parse(Array.isArray(variables) ? variables[0] : variables) : undefined,
            operationName: Array.isArray(operationName) ? operationName[0] : operationName,
          },
          {
            contextValue: context,
          }
        );

        if (response.body.kind === 'single') {
          res.status(200).json(response.body.singleResult);
        } else {
          res.status(400).json({ error: 'Subscriptions not supported over HTTP' });
        }
      } else {
        // Return GraphQL Playground HTML in development
        if (process.env.NODE_ENV !== 'production') {
          res.setHeader('Content-Type', 'text/html');
          res.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>GraphQL Playground</title>
              </head>
              <body>
                <div id="root">
                  <h1>GraphQL API</h1>
                  <p>This GraphQL endpoint is ready to receive queries.</p>
                  <p>Send POST requests to this endpoint with GraphQL queries.</p>
                  <p>Example query:</p>
                  <pre>
{
  me {
    id
    firstName
    lastName
    email
  }
}
                  </pre>
                </div>
              </body>
            </html>
          `);
        } else {
          res.status(404).json({ error: 'Not found' });
        }
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('GraphQL Handler Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : (error as Error).message,
    });
  }
}

// Configure the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
};