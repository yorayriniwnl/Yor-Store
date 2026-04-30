import { Suspense } from "react";
import SearchLoading from "./loading";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SearchLoading />}>{children}</Suspense>;
}
