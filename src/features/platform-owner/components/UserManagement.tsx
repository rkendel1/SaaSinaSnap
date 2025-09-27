'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Ban, CheckCircle, Edit, Mail, MoreHorizontal, Search, Trash2, UserCheck, UserX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import { PlatformUser } from '../types/index';

interface UserManagementProps {
  initialUsers: PlatformUser[];
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<PlatformUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && user.role !== 'suspended') ||
                      (activeTab === 'suspended' && user.role === 'suspended');
    
    return matchesSearch && matchesRole && matchesTab;
  });

  const handleUserAction = async (userId: string, action: string) => {
    setIsLoading(userId);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId) {
            switch (action) {
              case 'suspend':
                return { ...user, role: 'suspended' };
              case 'activate':
                return { ...user, role: 'creator' };
              case 'delete':
                return user; // Handle deletion separately
              default:
                return user;
            }
          }
          return user;
        })
      );

      if (action === 'delete') {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      }

      toast({
        description: `User ${action}d successfully!`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: `Failed to ${action} user. Please try again.`,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const sendEmail = (email: string) => {
    // Mock email functionality
    toast({
      description: `Email compose dialog would open for ${email}`,
    });
  };

  const userStats = {
    total: users.length,
    active: users.filter(u => u.role !== 'suspended').length,
    suspended: users.filter(u => u.role === 'suspended').length,
    creators: users.filter(u => u.role === 'creator').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
              <UserCheck className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{userStats.active}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Creators</p>
                <p className="text-2xl font-bold">{userStats.creators}</p>
              </div>
              <UserCheck className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">{userStats.suspended}</p>
              </div>
              <UserX className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
                <SelectItem value="platform_owner">Platform Owners</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User List */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Users ({userStats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({userStats.active})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({userStats.suspended})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-4">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.full_name || ''} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.full_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'creator' ? 'bg-green-100 text-green-800' :
                            user.role === 'platform_owner' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          {user.last_sign_in_at && (
                            <span className="text-xs text-gray-500">
                              Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendEmail(user.email!)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isLoading === user.id}>
                            {isLoading === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          {user.role === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No users found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}