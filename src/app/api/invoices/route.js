import { NextResponse } from 'next/server';
import { getOrCreateUser, getInvoices, updateInvoiceStatus, recordPayment } from '@/lib/db';

export async function GET(req) {
  const email = req.nextUrl.searchParams.get('email');
  const user = await getOrCreateUser(email, '');
  return NextResponse.json(await getInvoices(user.id));
}

export async function PATCH(req) {
  const { id, status } = await req.json();
  return NextResponse.json(await updateInvoiceStatus(id, status));
}
