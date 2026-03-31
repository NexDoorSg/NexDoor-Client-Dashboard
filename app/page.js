"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef] text-[#36454f]">
      Redirecting...
    </div>
  );
}
