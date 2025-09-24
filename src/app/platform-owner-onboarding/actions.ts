"use server";

import { redirect } from 'next/navigation';

export async function redirectToPlatformDashboard() {
  redirect('/creator/dashboard');
}