import { Suspense } from "react";
import ListingsClient from "./ListingsClient";

export const dynamic = "force-dynamic";

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsClient />
    </Suspense>
  );
}
