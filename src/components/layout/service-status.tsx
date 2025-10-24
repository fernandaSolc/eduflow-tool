'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ServiceStatusProps = {
  serviceName: string;
  serviceType: 'backend' | 'ai';
};

type Status = 'online' | 'offline' | 'checking';

export function ServiceStatus({ serviceName, serviceType }: ServiceStatusProps) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const checkService = async () => {
      try {
        const response = await fetch(`/api/health/${serviceType}`);
        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    checkService();
    const interval = setInterval(checkService, 30000 + Math.random() * 5000); // Stagger checks

    return () => clearInterval(interval);
  }, [serviceType]);

  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-red-500 animate-pulse',
    checking: 'bg-yellow-500 animate-pulse',
  };

  const statusText = {
    online: 'Online',
    offline: 'Offline',
    checking: 'Verificando...',
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className={cn('h-2 w-2 rounded-full', statusColor[status])}
      />
      <span className="hidden sm:inline">{serviceName}</span>
      <span className="hidden sm:inline font-medium text-foreground">{statusText[status]}</span>
    </div>
  );
}
