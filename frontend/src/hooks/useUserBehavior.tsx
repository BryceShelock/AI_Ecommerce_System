import { useEffect } from 'react';

export const useUserBehavior = () => {
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  const trackBehavior = async (
    actionType: 'view' | 'click' | 'search' | 'add_to_cart' | 'purchase' | 'like' | 'review',
    productId?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const userId = localStorage.getItem('userId');
      const sessionId = getSessionId();
      
      // 映射行为类型
      const behaviorTypeMap: Record<string, string> = {
        'view': 'view',
        'click': 'click',
        'search': 'view',
        'add_to_cart': 'add_to_cart',
        'purchase': 'purchase',
        'like': 'like',
        'review': 'review',
      };

      await fetch(`${API_BASE}/products/api/behavior/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId || null,
          session_id: sessionId,
          product_id: productId,
          behavior_type: behaviorTypeMap[actionType] || 'view',
          metadata: metadata || {},
        }),
      });
    } catch (error) {
      console.error('Failed to track behavior:', error);
    }
  };

  return { trackBehavior };
};
