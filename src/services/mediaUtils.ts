// services/mediaUtils.ts
import { TMDBMediaItem } from '@/types/tmdb';

export const getMediaTitle = (media: TMDBMediaItem): string => {
  return media.title || media.name || `ID: ${media.id}`;
};

export const getMediaImage = (media: TMDBMediaItem): string | null => {
  if (media.poster_path) {
    return `https://proxy-tmdb-weld.vercel.app/api/image/w500/${media.poster_path}`;
  }
  if (media.backdrop_path) {
    return `https://proxy-tmdb-weld.vercel.app/api/image/w500/${media.backdrop_path}`;
  }
  if (media.profile_path) {
    return `https://proxy-tmdb-weld.vercel.app/api/image/w500/${media.profile_path}`;
  }
  return null;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};