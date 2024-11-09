import React from 'react'

interface PageProps {
    params: {
        fileid: string
    }
}

const Page = ({ params }:PageProps) => {
    // retreive the file id 
    const { fileid } = params;
    // make database call
  return (
    <div>{fileid}</div>
  )
}

export default Page