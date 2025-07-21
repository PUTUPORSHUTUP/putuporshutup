import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Bell, Trophy, Gamepad2, AlertTriangle, CreditCard, Users } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'wager' | 'tournament' | 'dispute' | 'payment' | 'match';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon: React.ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time notifications for user:', user.id);

    // Subscribe to wager changes
    const wagerChannel = supabase
      .channel('wager-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wagers',
        },
        (payload) => {
          console.log('Wager change received:', payload);
          const wager = payload.new as any;
          
          if (payload.eventType === 'INSERT' && wager.creator_id !== user.id) {
            addNotification({
              title: 'New Wager Available',
              message: `${wager.title} - $${wager.stake_amount} stake`,
              type: 'wager',
              actionUrl: '/games',
              icon: <Gamepad2 className="h-4 w-4" />,
            });
          } else if (payload.eventType === 'UPDATE' && wager.status === 'completed') {
            addNotification({
              title: 'Wager Completed',
              message: `${wager.title} has been completed`,
              type: 'wager',
              actionUrl: '/games',
              icon: <Trophy className="h-4 w-4" />,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to wager participant changes
    const participantChannel = supabase
      .channel('participant-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wager_participants',
        },
        async (payload) => {
          console.log('Wager participant change:', payload);
          const participant = payload.new as any;
          
          // Get wager details
          const { data: wager } = await supabase
            .from('wagers')
            .select('title, creator_id')
            .eq('id', participant.wager_id)
            .single();

          if (wager && wager.creator_id === user.id && participant.user_id !== user.id) {
            addNotification({
              title: 'Someone Joined Your Wager',
              message: `A player joined "${wager.title}"`,
              type: 'wager',
              actionUrl: '/games',
              icon: <Users className="h-4 w-4" />,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to tournament changes
    const tournamentChannel = supabase
      .channel('tournament-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
        },
        (payload) => {
          console.log('Tournament change received:', payload);
          const tournament = payload.new as any;
          
          if (payload.eventType === 'INSERT' && tournament.creator_id !== user.id) {
            addNotification({
              title: 'New Tournament',
              message: `${tournament.title} - $${tournament.entry_fee} entry fee`,
              type: 'tournament',
              actionUrl: '/tournaments',
              icon: <Trophy className="h-4 w-4" />,
            });
          } else if (payload.eventType === 'UPDATE' && tournament.status === 'active') {
            addNotification({
              title: 'Tournament Started',
              message: `${tournament.title} has started`,
              type: 'tournament',
              actionUrl: '/tournaments',
              icon: <Trophy className="h-4 w-4" />,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to dispute changes
    const disputeChannel = supabase
      .channel('dispute-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'disputes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Dispute change received:', payload);
          const dispute = payload.new as any;
          
          if (dispute.status === 'resolved') {
            addNotification({
              title: 'Dispute Resolved',
              message: `Your dispute "${dispute.title}" has been resolved`,
              type: 'dispute',
              actionUrl: '/profile',
              icon: <AlertTriangle className="h-4 w-4" />,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to transaction changes
    const transactionChannel = supabase
      .channel('transaction-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Transaction change received:', payload);
          const transaction = payload.new as any;
          
          if (payload.eventType === 'UPDATE' && transaction.status === 'completed') {
            const isDeposit = transaction.type === 'deposit';
            addNotification({
              title: isDeposit ? 'Deposit Confirmed' : 'Withdrawal Processed',
              message: `$${transaction.amount} ${isDeposit ? 'added to' : 'withdrawn from'} your wallet`,
              type: 'payment',
              actionUrl: '/profile',
              icon: <CreditCard className="h-4 w-4" />,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notification subscriptions');
      supabase.removeChannel(wagerChannel);
      supabase.removeChannel(participantChannel);
      supabase.removeChannel(tournamentChannel);
      supabase.removeChannel(disputeChannel);
      supabase.removeChannel(transactionChannel);
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};