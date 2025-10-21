'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ServiceStatusProps = {
  serviceName: string;
};

export function ServiceStatus({ serviceName }: ServiceStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  // Simulate health checks
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, you would fetch('/health') here
      // For demo, we'll randomly set it to offline 10% of the time
      setIsOnline(Math.random() > 0.1);
    }, 5000 + Math.random() * 2000); // Stagger checks

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        )}
      />
      <span className="hidden sm:inline">{serviceName}</span>
      <span className="hidden sm:inline font-medium text-foreground">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
