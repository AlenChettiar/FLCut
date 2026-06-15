"use client";

import { useState } from "react";
import Shorten from "./shorten";
import RecentURLs from "./url-list";

export default function UrlContainer() {
  const [refreshKey, setRefreshKey] = useState<number>(0);


  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
     
      <Shorten onLinkCreated={triggerRefresh} />
      

      <RecentURLs refreshKey={refreshKey} />
    </div>
  );
}
