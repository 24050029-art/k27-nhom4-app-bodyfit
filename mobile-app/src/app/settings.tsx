import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useLocalDb } from '@/hooks/use-local-db';

export default function SettingsRedirect() {
  const router = useRouter();
  const { setActiveTabRoute } = useLocalDb();

  useEffect(() => {
    setActiveTabRoute('/settings');
    router.replace('/');
  }, []);

  return null;
}
