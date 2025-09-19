// Debug component to check authentication state
'use client';

import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null);

  useEffect(() => {
    const checkAuthState = () => {
      const token = localStorage.getItem('authToken');
      setAuthState({
        hasToken: !!token,
        token: token ? token.substring(0, 20) + '...' : null,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    checkAuthState();
    const interval = setInterval(checkAuthState, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <h4 className="font-bold mb-2">Debug Auth State</h4>
      <div>
        <div>Has Token: {authState?.hasToken ? '✅' : '❌'}</div>
        <div>Token: {authState?.token || 'None'}</div>
        <div>Updated: {authState?.timestamp}</div>
      </div>
    </div>
  );
}
