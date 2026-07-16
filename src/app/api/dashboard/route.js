import { NextResponse } from 'next/server';
import { getOrCreateUser, getDashboard } from '@/lib/db';

export async function GET(req) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const user = await getOrCreateUser(email, '');
  const dash = await getDashboard(user.id);
  return NextResponse.json(dash);
}
