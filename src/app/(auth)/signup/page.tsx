import { checkEmailExists, signInWithEmail, signInWithEmailAndPassword, signInWithOAuth, signUpWithEmailAndPassword } from '../auth-actions';
import { UnifiedAuthUI } from '../unified-auth-ui';

export default async function SignupPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4'>
      <UnifiedAuthUI 
        signInWithOAuth={signInWithOAuth}
        signInWithEmail={signInWithEmail}
        signInWithEmailAndPassword={signInWithEmailAndPassword}
        signUpWithEmailAndPassword={signUpWithEmailAndPassword}
        checkEmailExists={checkEmailExists}
      />
    </div>
  );
}