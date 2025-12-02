// Базовый интерфейс для всех типов
interface TMDBBaseItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  adult: boolean;
  popularity: number;
  original_language: string;
}

// Фильм
export interface TMDbMovie extends TMDBBaseItem {
  media_type: 'movie';
  backdrop_path: string | null;
  genre_ids: number[];
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

// Сериал
export interface TMDbTV extends TMDBBaseItem {
  media_type: 'tv';
  backdrop_path: string | null;
  genre_ids: number[];
  original_name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  name: string;
  vote_average: number;
  vote_count: number;
  origin_country: string[];
}

// Актер/Человек
export interface TMDbPerson extends TMDBBaseItem {
  media_type: 'person';
  name: string;
  original_name: string;
  gender: number;
  known_for_department: string;
  profile_path: string | null;
  known_for: Array<TMDbMovie | TMDbTV>;
}

// Объединенный тип для результатов поиска
export type TMDBMediaItem = TMDbMovie | TMDbTV | TMDbPerson;

// Ответ на поиск
export interface TMDbSearchResponse {
  page: number;
  results: TMDBMediaItem[];
  total_pages: number;
  total_results: number;
}