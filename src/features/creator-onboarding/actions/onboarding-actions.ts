'use server';

import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { getOrCreateCreatorProfile, updateCreatorProfile } from '../controllers/creator-profile';
import { createStripeConnectAccount } from '../controllers/stripe-connect';
import type { CreatorProfileUpdate } from '../types';

export async function updateCreatorProfileAction(profileData: CreatorProfileUpdate) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProfile(session.user.id, profileData);
}

export async function createStripeConnectAccountAction() {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email) {
    throw new Error('Not authenticated');
  }

  try {
    const { accountId, onboardingUrl } = await createStripeConnectAccount(session.user.email);

    // Update creator profile with Stripe account ID
    await updateCreatorProfile(session.user.id, {
      stripe_account_id: accountId,
    });

    redirect(onboardingUrl);
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw new Error('Failed to create Stripe Connect account');
  }
}

export async function completeOnboardingStepAction(step: number) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  const isCompleted = nextStep > 7; // Assuming 7 total steps

  return updateCreatorProfile(session.user.id, {
    onboarding_step: isCompleted ? step : nextStep,
    onboarding_completed: isCompleted,
  });
}

export async function initializeCreatorOnboardingAction() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get or create creator profile
  const profile = await getOrCreateCreatorProfile(session.user.id);

  if (profile.onboarding_completed) {
    redirect('/creator/dashboard');
  }

  return profile;
}