"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { trpc } from "../_trpc/client"
import { Loader2 } from "lucide-react"

const Page = () => {
const router = useRouter()
const searchParams = useSearchParams()
const origin = searchParams.get('origin')

console.log("Rendering the component and calling useQuery");

const { data, error, isLoading } = trpc.authCallback.useQuery()
// Handle loading state
if (isLoading) {

    return  (
<div className="w-full mt-24 flex justify-center">
    <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-800"/>
        <h3 className="font-semibold text-xl">Setting up your account...</h3>
        <p>You will be redirected automatically.</p>
    </div>
</div>
)
}

// Handle error
if (error) {
    console.error("Error occurred:", error);
    if (error.code === "UNAUTHORIZED") {
        router.push('/sign-in');
    }
   // return <div>Error occurred: {error.message}</div>;
}

// Handle success
if (data && data.success) {
    console.log("User exists, redirecting...");
    router.push(origin ? `/${origin}` : '/dashboard');
}

}   

export default Page