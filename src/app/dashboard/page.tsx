"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace("/login?redirect=/dashboard");
        return;
      }

      const role = await getRoleForUser(user.id);
      if (role === "admin") {
        router.replace("/dashboard/admin");
        return;
      }

      if (role === "broker") {
        router.replace("/dashboard/broker");
        return;
      }

      router.replace("/dashboard/client");
    });
  }, [router]);

  return null;
}
