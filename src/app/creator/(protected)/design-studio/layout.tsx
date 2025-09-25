import { PropsWithChildren } from 'react';

import { SidebarNavigation } from '@/components/creator/sidebar-navigation';

export default function DesignStudioLayout({ children }: PropsWithChildren) {
  return (
    <SidebarNavigation>
      {children}
    </SidebarNavigation>
  );
}