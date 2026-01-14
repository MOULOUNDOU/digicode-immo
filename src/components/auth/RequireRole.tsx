"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type UserRole } from "@/lib/auth/local";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRoleForUser } from "@/lib/auth/supabase";

export default function RequireRole({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const userRole = await getRoleForUser(user.id);
      if (role && userRole !== role) {
        router.replace("/dashboard");
        return;
      }

      setReady(true);
    });
  }, [pathname, role, router]);

  if (!ready) return null;
  return <>{children}</>;
}
