// services/movieService.ts

export type SearchFilters = {
  movies?: boolean;
  tv?: boolean;
  people?: boolean;
};

export default async function searchMovies(
  query: string = '', 
  page: number = 1,
  filters: SearchFilters = { movies: true, tv: true, people: false }
) {  
  const params = new URLSearchParams({
    page: page.toString(),
  });

  // Добавляем query только если он есть
  if (query) {
    params.set('query', query);
  }

  // Добавляем фильтры
  params.set('movies', filters.movies !== false ? 'true' : 'false');
  params.set('tv', filters.tv !== false ? 'true' : 'false');
  params.set('people', filters.people !== false ? 'true' : 'false');
  
  try {
    const response = await fetch(`/api/movies?${params.toString()}`);
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    return response.json();
  } catch (error) {
    console.error('searchMovies error:', error);
    throw error;
  }
}