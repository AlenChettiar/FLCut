import UrlContainer from "@/components/url-container";



export default function Home() {
  return (

    <main className="min-h-screen bg-neutral-50 text-neutral-900 py-12 px-4 md:py-24 animate-fade-in">
      
      
      <div className="mx-auto max-w-xl space-y-10">
        
       
        <div className="space-y-2 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
            FLCut<span className="text-blue-600">.</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-500 font-medium tracking-wide">
            Shorten your URL instantly
          </p>
        </div>

        
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <UrlContainer />
        </div>

      </div>
    </main>
  );
}

