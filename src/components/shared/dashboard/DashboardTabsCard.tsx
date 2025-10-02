'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface DashboardTabsCardProps {
  title: string;
  description?: string;
  tabs: DashboardTab[];
  defaultTab?: string;
  className?: string;
}

export function DashboardTabsCard({
  title,
  description,
  tabs,
  defaultTab,
  className,
}: DashboardTabsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
          <TabsList className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
