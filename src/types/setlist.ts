
import { Song } from '@/pages/Index';

export interface Setlist {
  id: string;
  name: string;
  gig_name?: string;
  gig_date?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  set_number: number;
  notes?: string;
  song?: Song;
}

export interface SetlistWithSongs extends Setlist {
  songs: SetlistSong[];
}
