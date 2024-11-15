import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { getPineconeClient } from '@/lib/pinecone'
import { SourceTextModule } from "vm";


const f = createUploadthing();


// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const { getUser } = getKindeServerSession()
      const user = await getUser();
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data:{
          key:file.key,
          name:file.name,
          userId:metadata.userId,
          url: `https://utfs.io/f/${file.key}`,
          
          uploadStatus: "PROCESSING"
        }
      })

      try {
        console.log("i'm running this ?")
          const response = await fetch(`https://utfs.io/f/${file.key}`)
          const blob = await response.blob();
          // example of a blob
          /*
          Blob {
            size: 123456, // The size of the file in bytes
            type: "application/pdf" // MIME type indicating it's a PDF
          }*/
          const loader = new PDFLoader(blob);

          const pageLevelDocs = await loader.load()
          /* if we consoel.log the pageLevelDocs
          we get soemthing like this 
          [
          {
            pageNumber: 1,
            text: "This is the text of the first page of the PDF.",
            metadata: { title: "Document Title", author: "Author Name" }
          },
          {
            pageNumber: 2,
            text: "This is the text of the second page of the PDF.",
            metadata: { title: "Document Title", author: "Author Name" }
          },
          // Additional pages...
        ]
          */
         // this gets the length of the pageLevelDocs
          const pagesAmt = pageLevelDocs.length
          

          // vectorize and index entire document
          console.log("creating pinecone")
          const youu = await getPineconeClient();
const nooo = youu.Index('chatpdf'); // Create or get the 'quill' index

console.log("Pinecone index created:", nooo);

// Continue with your other operations (e.g., PineconeStore, embeddings, etc.)











        // vectorize and index entire document
        const pinecone = await getPineconeClient()
        console.log("thepincone oject "+pinecone)
        const pineconeIndex = pinecone.Index('chatpdf')

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        await PineconeStore.fromDocuments(
          pageLevelDocs,
          embeddings,
          {
            pineconeIndex,
            namespace: createdFile.id,
          }
        )

        await db.file.update({
          data: {
            uploadStatus: 'SUCCESS',
          },
          where: {
            id: createdFile.id,
          },
  })
} catch (err) {
  console.log("something went wrong here "+err)
  await db.file.update({
    data: {
      uploadStatus: 'FAILED',
    },
    where: {
      id: createdFile.id,
    },

        })
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
