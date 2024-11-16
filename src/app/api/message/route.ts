import { db } from "@/db";
import { openai } from "@/lib/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

import { sendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";

import { OpenAIStream,StreamingTextResponse } from 'ai'
import { NextRequest } from "next/server";

export const POST = async (req:NextRequest)=>{
    // endpoint for asking a question to a pdf file
    const body = await req.json();

    const { getUser } = getKindeServerSession()
    const user = await getUser();

    const { id:userId } = user

    if(!userId) return new Response("Unauthorized",{ status: 401})

    const {fileId,message } = sendMessageValidator.parse(body)

    const file = await db.file.findFirst({
        where:{
            id:fileId,
            userId
        }
    })

    if(!file) return new Response("Not found",{ status: 404})

        await db.message.create({
            data:{
                text:message,
                isUserMessage: true,
                userId,
                fileId,
            }
        })

        // vectorize message
       /* const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
          })*/
            const embeddings = new OpenAIEmbeddings({
              model: "text-embedding-3-small"
            });

            const pinecone = new PineconeClient();

            const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

            const vectoreStore = await PineconeStore.fromExistingIndex(embeddings, {
              pineconeIndex,
              // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
              maxConcurrency: 5,
              // You can pass a namespace here too
              namespace: file.id,
            });

          /*const results = await vectoreStore.similaritySearch(message, 4, {
            includeValues: true, // Optional: include vector values in the result
            includeMetadata: true, // Optional: include metadata
            filter: {}, // Optional: filter the results based on some criteria
            topK: 4 // Optional: specify how many results you want to retrieve
          })*/
          const results = await vectoreStore.similaritySearch(
            message,
            2
          );
          const prevMessages = await db.message.findMany({
            where:{
                fileId
            },
            orderBy:{
                createdAt:"asc"
            },
            take:6
          })
          console.log("prevMessages"+Array.isArray(prevMessages), prevMessages);

          const formattedPrevMessages = prevMessages.map((msg)=>({
            role:msg.isUserMessage ? "user" as const : "assistant" as const,
            content:msg.text
          }))

          const response = await openai.chat.completions.create({
            model:"gpt-3.5-turbo",
            temperature:0,
            stream:true,
            messages: [
                {
                  role: 'system',
                  content:
                    'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
                },
                {
                  role: 'user',
                  content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
                  
            \n----------------\n
            
            PREVIOUS CONVERSATION:
            ${formattedPrevMessages.map((message) => {
              if (message.role === 'user') return `User: ${message.content}\n`
              return `Assistant: ${message.content}\n`
            })}
            
            \n----------------\n
            
            CONTEXT:
            ${results.map((r) => r.pageContent).join('\n\n')}
            
            USER INPUT: ${message}`,
                },
              ],
          })

          const stream = OpenAIStream(response,{
            async onCompletion(completion){
                await db.message.create({
                    data:{
                        text:completion,
                        isUserMessage:false,
                        fileId,
                        userId
                    }
                })
            }
          })
          
          return new StreamingTextResponse(stream)
     
}