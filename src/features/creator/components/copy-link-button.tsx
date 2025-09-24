"use client";

import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface CopyLinkButtonProps {
  link: string;
  label?: string;
  className?: string;
}

export function CopyLinkButton({ link, label = 'Copy Link', className }: CopyLinkButtonProps) {
  const handleCopyClick = () => {
    navigator.clipboard.writeText(link);
    toast({
      description: 'Link copied to clipboard!',
    });
  };

  return (
    <Button
      variant="link"
      className={className}
      onClick={handleCopyClick}
    >
      <Copy className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
}