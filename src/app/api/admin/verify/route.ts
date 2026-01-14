import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { code?: string };
  const code = body?.code ?? "";

  const secret = process.env.ADMIN_LOGIN_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_LOGIN_SECRET n'est pas configuré" },
      { status: 500 }
    );
  }

  if (code && code === secret) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
