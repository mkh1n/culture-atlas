// services/movieService.ts

export type SearchFilters = {
  movies: boolean;
  tv: boolean;
  people: boolean;
  genres?: number[]; // Добавляем поддержку жанров
};

export type SortOption = 
  | "popularity.desc" 
  | "popularity.asc" 
  | "vote_average.desc" 
  | "vote_average.asc" 
  | "primary_release_date.desc" 
  | "primary_release_date.asc"
  | "first_air_date.desc"
  | "first_air_date.asc"
  | "revenue.desc"
  | "revenue.asc";

const movieService = async (
  query: string,
  page: number = 1,
  filters: SearchFilters = { 
    movies: true, 
    tv: true, 
    people: false,
    genres: [] 
  },
  sortBy: SortOption = "popularity.desc"
): Promise<any> => {
  const params = new URLSearchParams({
    page: page.toString(),
    movies: filters.movies.toString(),
    tv: filters.tv.toString(),
    people: filters.people.toString(),
    sort: sortBy
  });

  if (query) {
    params.set('query', query);
  }

  // Добавляем жанры в параметры, если они есть
  if (filters.genres && filters.genres.length > 0) {
    // Добавляем параметр for_genres=true чтобы бэкенд знал, что нужна фильтрация по жанрам
    params.set('for_genres', 'true');
    params.set('genres', filters.genres.join(','));
  }

  const url = `/api/movies?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

export default movieService;