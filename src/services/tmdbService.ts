import {
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  Credits,
  Videos,
  GenreList,
  Person
} from '@/types/tmdb';

const TMDB_PROXY_BASE = process.env.NEXT_PUBLIC_TMDB_PROXY || 'https://tmdb-proxy-orpin.vercel.app';

// Общая функция для запросов к TMDB
async function fetchTMDB<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const queryParams = new URLSearchParams({
    language: 'ru-RU',
    ...params
  });

  const url = `${TMDB_PROXY_BASE}/${endpoint}?${queryParams.toString()}`;
  
  console.log(`Fetching TMDB: ${url}`);
  
  const response = await fetch(url, {
    next: { revalidate: 3600 } // Кэширование на 1 час
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

// Фильмы
export const movieService = {
  // Детали фильма по ID
  getDetails: async (id: number): Promise<MovieDetails> => {
    return fetchTMDB<MovieDetails>(`movie/${id}`);
  },

  // Детали с дополнительной информацией
  getDetailsWithAppend: async (id: number, appendToResponse: string = 'credits,videos,similar'): Promise<any> => {
    return fetchTMDB(`movie/${id}`, { append_to_response: appendToResponse });
  },

  // Кредиты (актеры и команда)
  getCredits: async (id: number): Promise<Credits> => {
    return fetchTMDB<Credits>(`movie/${id}/credits`);
  },

  // Видео (трейлеры)
  getVideos: async (id: number): Promise<Videos> => {
    return fetchTMDB<Videos>(`movie/${id}/videos`);
  },

  // Похожие фильмы
  getSimilar: async (id: number, page: number = 1): Promise<{ results: Movie[] }> => {
    return fetchTMDB(`movie/${id}/similar`, { page: page.toString() });
  },

  // Рекомендации
  getRecommendations: async (id: number, page: number = 1): Promise<{ results: Movie[] }> => {
    return fetchTMDB(`movie/${id}/recommendations`, { page: page.toString() });
  },

  // Фильмы по жанру
  getByGenre: async (genreId: number, page: number = 1, sortBy: string = 'popularity.desc'): Promise<{ results: Movie[] }> => {
    return fetchTMDB('discover/movie', {
      with_genres: genreId.toString(),
      page: page.toString(),
      sort_by: sortBy
    });
  }
};

// Сериалы
export const tvService = {
  // Детали сериала по ID
  getDetails: async (id: number): Promise<TVShowDetails> => {
    return fetchTMDB<TVShowDetails>(`tv/${id}`);
  },

  // Детали с дополнительной информацией
  getDetailsWithAppend: async (id: number, appendToResponse: string = 'credits,videos,similar'): Promise<any> => {
    return fetchTMDB(`tv/${id}`, { append_to_response: appendToResponse });
  },

  // Кредиты
  getCredits: async (id: number): Promise<Credits> => {
    return fetchTMDB<Credits>(`tv/${id}/credits`);
  },

  // Видео
  getVideos: async (id: number): Promise<Videos> => {
    return fetchTMDB<Videos>(`tv/${id}/videos`);
  },

  // Похожие сериалы
  getSimilar: async (id: number, page: number = 1): Promise<{ results: TVShow[] }> => {
    return fetchTMDB(`tv/${id}/similar`, { page: page.toString() });
  },

  // Рекомендации
  getRecommendations: async (id: number, page: number = 1): Promise<{ results: TVShow[] }> => {
    return fetchTMDB(`tv/${id}/recommendations`, { page: page.toString() });
  },

  // Сериалы по жанру
  getByGenre: async (genreId: number, page: number = 1, sortBy: string = 'popularity.desc'): Promise<{ results: TVShow[] }> => {
    return fetchTMDB('discover/tv', {
      with_genres: genreId.toString(),
      page: page.toString(),
      sort_by: sortBy
    });
  },

  // Сезоны
  getSeason: async (tvId: number, seasonNumber: number): Promise<any> => {
    return fetchTMDB(`tv/${tvId}/season/${seasonNumber}`);
  }
};

// Жанры
export const genreService = {
  // Список всех жанров фильмов
  getMovieGenres: async (): Promise<GenreList> => {
    return fetchTMDB<GenreList>('genre/movie/list');
  },

  // Список всех жанров сериалов
  getTVGenres: async (): Promise<GenreList> => {
    return fetchTMDB<GenreList>('genre/tv/list');
  }
};

// Люди (актеры, режиссеры)
export const personService = {
  // Детали персоны
  getDetails: async (id: number): Promise<Person> => {
    return fetchTMDB<Person>(`person/${id}`);
  },

  // Фильмография
  getMovieCredits: async (id: number): Promise<{ cast: Movie[], crew: any[] }> => {
    return fetchTMDB(`person/${id}/movie_credits`);
  },

  // Сериалография
  getTVCredits: async (id: number): Promise<{ cast: TVShow[], crew: any[] }> => {
    return fetchTMDB(`person/${id}/tv_credits`);
  },

  // Комбинированные кредиты
  getCombinedCredits: async (id: number): Promise<{ cast: Array<Movie | TVShow> }> => {
    return fetchTMDB(`person/${id}/combined_credits`);
  }
};

// Поиск
export const searchService = {
  // Универсальный поиск
  multiSearch: async (query: string, page: number = 1): Promise<{ results: Array<Movie | TVShow | Person> }> => {
    return fetchTMDB('search/multi', {
      query: encodeURIComponent(query),
      page: page.toString(),
      include_adult: 'false'
    });
  },

  // Поиск фильмов
  searchMovies: async (query: string, page: number = 1): Promise<{ results: Movie[] }> => {
    return fetchTMDB('search/movie', {
      query: encodeURIComponent(query),
      page: page.toString()
    });
  },

  // Поиск сериалов
  searchTV: async (query: string, page: number = 1): Promise<{ results: TVShow[] }> => {
    return fetchTMDB('search/tv', {
      query: encodeURIComponent(query),
      page: page.toString()
    });
  },

  // Поиск людей
  searchPeople: async (query: string, page: number = 1): Promise<{ results: Person[] }> => {
    return fetchTMDB('search/person', {
      query: encodeURIComponent(query),
      page: page.toString()
    });
  }
};

export default {
  movie: movieService,
  tv: tvService,
  genre: genreService,
  person: personService,
  search: searchService
};