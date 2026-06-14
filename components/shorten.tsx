'use client';
import { Input } from "@base-ui/react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { ArrowRight, Link } from "lucide-react";


export default function Shorten()
{
    
    // const[url,setUrl]=useState<string>();
    async function handleSubmit(formData: FormData) {
      const link = formData.get("link");
    console.log(link); 
      try{
        const response =await fetch('/api/shortenLink',
          {
            method:'POST',
            headers :{'content-type' : 'application/json'},
            body :JSON.stringify({
              link,
            }),
          }
        )
        if (!response.ok) {
      const errorText = await response.text(); // Reads the HTML page error text safely
      console.error("Server API returned an error:", response.status, errorText);
      return;
    }
        const data = await response.json();
      console.log("Successfully Shortened:", data);

        
      }
      catch(error){
        console.error('Error in shortening : ',error)
      }
    
   
  }
    return(
        <form action={handleSubmit} className="w-full">
      <div className="space-y-5 mt-10">
        
        
        <div className="relative flex items-center">
          
          <Link className="absolute left-4 h-5 w-5 text-neutral-400 pointer-events-none" />
          
          <Input 
            name="link"
            type="url" 
            placeholder="Paste your long link here..." 
            required
            className="h-14 w-full pl-12 pr-4 text-base bg-neutral-50/50 border-neutral-200/80 rounded-2xl transition-all duration-200 placeholder:text-neutral-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black"
          />
        </div>

        {/* Call To Action Submit Button */}
        <Button 
          type="submit"
          className="group h-14 w-full bg-neutral-900 text-white font-semibold text-base rounded-2xl transition-all duration-300 hover:bg-black hover:shadow-lg hover:shadow-neutral-900/10 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>Shorten URL</span>
          
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

      </div>
    </form>
  );
}