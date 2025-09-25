import { redirect } from 'next/navigation';
import { Package, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function NewProductPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        <p className="text-gray-600 mt-1">Add a new product to your platform</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Product Creation Coming Soon
          </h3>
          <p className="text-gray-600 mb-6">
            The enhanced product creation interface is being developed. For now, you can manage 
            existing products from the Products page.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <a href="/creator/dashboard/products">
                <Package className="h-4 w-4 mr-2" />
                View Products
              </a>
            </Button>
            <Button disabled className="cursor-not-allowed">
              <Plus className="h-4 w-4 mr-2" />
              Create Product (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}