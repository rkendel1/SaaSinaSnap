'use client';

import { useState } from 'react';
import { CheckCircle, Globe, Loader2, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  addCustomDomain, 
  verifyCustomDomain, 
  deleteCustomDomain,
  getDNSInstructions,
  type CustomDomain 
} from '@/features/creator/services/custom-domain-service';

interface CustomDomainManagerProps {
  creatorId: string;
  initialDomains: CustomDomain[];
  platformDomain: string;
}

export function CustomDomainManager({ 
  creatorId, 
  initialDomains, 
  platformDomain 
}: CustomDomainManagerProps) {
  const [domains, setDomains] = useState(initialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please enter a domain',
      });
      return;
    }

    setIsAdding(true);
    try {
      const result = await addCustomDomain(creatorId, newDomain.trim().toLowerCase());
      
      if (result.success && result.domainId && result.verificationToken) {
        toast({
          description: 'Domain added successfully! Please configure DNS records.',
        });
        
        // Refresh domains list
        window.location.reload();
      } else {
        toast({
          variant: 'destructive',
          description: result.error || 'Failed to add domain',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while adding the domain',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingId(domainId);
    try {
      const result = await verifyCustomDomain(domainId);
      
      if (result.success) {
        if (result.verified) {
          toast({
            description: 'Domain verified successfully!',
          });
          window.location.reload();
        } else {
          toast({
            variant: 'destructive',
            description: 'Domain not yet verified. Please ensure DNS records are configured correctly and try again in a few minutes.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          description: result.error || 'Failed to verify domain',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while verifying the domain',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) {
      return;
    }

    setDeletingId(domainId);
    try {
      const result = await deleteCustomDomain(domainId);
      
      if (result.success) {
        toast({
          description: 'Domain deleted successfully',
        });
        setDomains(domains.filter(d => d.id !== domainId));
      } else {
        toast({
          variant: 'destructive',
          description: result.error || 'Failed to delete domain',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while deleting the domain',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Add Custom Domain
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="domain">Domain or Subdomain</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="domain"
                placeholder="shop.yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddDomain} 
                disabled={isAdding || !newDomain.trim()}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Domain
              </Button>
            </div>
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Custom Domains</h3>
          
          <div className="space-y-4">
            {domains.map((domain) => {
              const dnsInstructions = getDNSInstructions(
                domain.domain, 
                domain.verification_token || '', 
                platformDomain
              );
              
              return (
                <div key={domain.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{domain.domain}</span>
                        {getStatusBadge(domain.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        Added {new Date(domain.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {domain.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifyingId === domain.id}
                        >
                          {verifyingId === domain.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                        disabled={deletingId === domain.id}
                      >
                        {deletingId === domain.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {domain.status === 'pending' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                      <h4 className="font-medium text-blue-900 mb-2">DNS Configuration Required</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Add these records to your DNS settings:
                      </p>
                      
                      <div className="space-y-2">
                        <div className="bg-white rounded border border-blue-200 p-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">Verification Record</p>
                          <code className="text-xs font-mono text-blue-800">
                            Type: {dnsInstructions.verificationRecord.type} | 
                            Name: {dnsInstructions.verificationRecord.name} | 
                            Value: {dnsInstructions.verificationRecord.value}
                          </code>
                        </div>
                        
                        <div className="bg-white rounded border border-blue-200 p-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">CNAME Record</p>
                          <code className="text-xs font-mono text-blue-800">
                            Type: {dnsInstructions.cnameRecord.type} | 
                            Name: {dnsInstructions.cnameRecord.name} | 
                            Value: {dnsInstructions.cnameRecord.value}
                          </code>
                        </div>
                      </div>

                      <p className="text-xs text-blue-700 mt-3">
                        DNS changes can take up to 48 hours to propagate. Click "Verify" once configured.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
