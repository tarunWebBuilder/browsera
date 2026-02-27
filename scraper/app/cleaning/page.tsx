"use client";
import dynamic from "next/dynamic";

const Sheet = dynamic(() => import("@/components/sheet/sheet"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="h-screen w-full overflow-hidden ">
      <Sheet />
    </div>
  );
}
