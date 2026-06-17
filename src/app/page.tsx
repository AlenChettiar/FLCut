import { auth } from "@/auth";
import UrlContainer from "@/components/url-container";
import UserNav from "@/components/user-nav";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      
      {user && (
        <UserNav
          name={user.name ?? "User"}
          email={user.email ?? ""}
        />
      )}

      <main className="flex-1 py-12 px-4 md:py-20 animate-fade-in">
        <div className="mx-auto max-w-xl space-y-10">

          {/* Hero */}
          <div className="space-y-2 text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
              Short Lync<span className="text-blue-600">.</span>
            </h1>
            <p className="text-sm md:text-base text-neutral-500 font-medium tracking-wide">
              Shorten your URL instantly
            </p>
          </div>

          {/* Main card */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
            <UrlContainer />
          </div>
        </div>
      </main>
    </div>
  );
}
