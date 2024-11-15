import { PineconeClient } from '@pinecone-database/pinecone'

export const getPineconeClient = async () => {
  const client = new PineconeClient();

  try {
    console.log("Initializing Pinecone client...");
    console.log("PINECONE_API_KEY:", process.env.PINECONE_API_KEY);

    await client.init({
      apiKey: process.env.PINECONE_API_KEY, // Ensure this is set correctly
      environment: 'us-east-1', // Ensure this is the correct environment for your Pinecone setup
    });
    console.log("Pinecone client initialized successfully.");
    return client;
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw error; // Re-throw the error after logging it
  }
}


