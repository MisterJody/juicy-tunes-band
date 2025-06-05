
import React from 'react';
import { SetlistManager } from '@/components/SetlistManager';
import { Song } from '@/pages/Index';

interface SetlistsPageProps {
  songs: Song[];
}

export const SetlistsPage = ({ songs }: SetlistsPageProps) => {
  return <SetlistManager songs={songs} />;
};
