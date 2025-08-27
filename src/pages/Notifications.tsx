import React from 'react';
import { NotificationsList } from '@/components/NotificationsList';

const Notifications = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with likes and activity on your properties
          </p>
        </div>
        
        <NotificationsList />
      </div>
    </div>
  );
};

export default Notifications;