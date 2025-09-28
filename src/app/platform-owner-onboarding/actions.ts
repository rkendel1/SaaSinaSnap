"use server";

import { redirect } from 'next/navigation';

export async function redirectToPlatformDashboard() {
  redirect('/dashboard'); // Redirect to the platform owner's dashboard
}