import { NextResponse } from 'next/server';
import { getOrCreateUser, getProjects, addProject } from '@/lib/db';

export async function GET(req) {
  const email = req.nextUrl.searchParams.get('email');
  const user = await getOrCreateUser(email, '');
  return NextResponse.json(await getProjects(user.id));
}

export async function POST(req) {
  const { email, name, clientId, value } = await req.json();
  const user = await getOrCreateUser(email, '');
  return NextResponse.json(await addProject(user.id, { clientId, name, value }));
}
