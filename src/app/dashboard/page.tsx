import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/dist/server/api-utils";

const Page = async() => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();


  //if(!user || !user.id) redirect('/auth-callback?origin=dashboard')
  return (
    <div>
      <h1>Hello, {user?.email || "Guest"}</h1>
      {/* Displays the user's email if available, otherwise shows "Guest" */}
    </div>
  );
};

export default Page;
