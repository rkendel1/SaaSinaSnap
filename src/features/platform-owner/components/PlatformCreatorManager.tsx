'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { deleteUserAction } from '@/features/account/actions/user-actions';

import { PlatformUser } from '../types/index';

interface PlatformCreatorManagerProps {
  initialUsers: PlatformUser[];
}

export function PlatformCreatorManager({ initialUsers }: PlatformCreatorManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteUser = async (userToDelete: PlatformUser) => {
    if (!confirm(`Are you sure you want to permanently delete the user "${userToDelete.full_name || userToDelete.email || userToDelete.id}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(userToDelete.id);
    try {
      const result = await deleteUserAction(userToDelete.id);
      if (result.success) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        toast({
          description: 'User deleted successfully.',
        });
      } else {
        throw new Error(result.error || 'Failed to delete user.');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {users.map((user) => (
          <div key={user.id} className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || ''} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{user.full_name || 'N/A'}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Role: {user.role} • Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUser(user)}
              disabled={isDeleting === user.id}
              className="text-red-600 hover:text-red-700"
            >
              {isDeleting === user.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
      {users.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No other users found on the platform.</p>
        </div>
      )}
    </div>
  );
}