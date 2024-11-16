// Import the Pinecone library
import { Pinecone } from '@pinecone-database/pinecone';


export const getPineconeClient = async () => {
  // Initialize a Pinecone client with your API key

  const client = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    controllerHostUrl:"https://chatpdf-7riepex.svc.aped-4627-b74a.pinecone.io"
  });

  return client
}


