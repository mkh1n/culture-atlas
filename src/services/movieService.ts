export type SearchFilters = {
  movies: boolean;
  tv: boolean;
  people: boolean;
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
  filters: SearchFilters = { movies: true, tv: true, people: false },
  sortBy: SortOption = "popularity.desc"
): Promise<any> => {
  const params = new URLSearchParams({
    page: page.toString(),
    movies: filters.movies.toString(),
    tv: filters.tv.toString(),
    people: filters.people.toString(),
  });

  // Добавляем сортировку только если есть запрос
  if (query) {
    params.set('query', query);
  }
  
  // Всегда добавляем sort параметр
  params.set('sort', sortBy);

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