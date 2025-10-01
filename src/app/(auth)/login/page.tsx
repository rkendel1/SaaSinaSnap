import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';

import { signInWithEmail, signInWithOAuth, signInWithEmailAndPassword } from '../auth-actions'; // Import signInWithEmailAndPassword
import { AuthUI } from '../auth-ui';

export default async function LoginPage() {
  // Use enhanced auth service for role-driven redirects
  await EnhancedAuthService.redirectAuthenticatedUser();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4'>
      <AuthUI mode='login' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} signInWithEmailAndPassword={signInWithEmailAndPassword} />
    </div>
  );
}