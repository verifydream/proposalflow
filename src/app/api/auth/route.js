import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';

export async function POST(req) {
  const { email, name, phone, company } = await req.json();
  if (!email || !name) return NextResponse.json({ error: 'email & name required' }, { status: 400 });
  const user = await getOrCreateUser(email, name, phone, company);
  return NextResponse.json(user);
}
