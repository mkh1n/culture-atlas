export type SearchFilters = {
  movies?: boolean;
  tv?: boolean;
  people?: boolean;
};

export type SortOption = 'popularity.desc' | 'release_date.desc' | 'release_date.asc';

export default async function searchMovies(
  query: string, 
  page: number = 1, 
  sortBy: SortOption = 'popularity.desc',
  filters: SearchFilters = { movies: true, tv: true, people: false }
) {  
  const params = new URLSearchParams({
    query: encodeURIComponent(query),
    page: page.toString(),
    sort_by: sortBy,
    movies: filters.movies !== false ? 'true' : 'false',
    tv: filters.tv !== false ? 'true' : 'false',
    people: filters.people !== false  ? 'true' : 'false'
  });
  
  try {
    const response = await fetch(
      `/api/movies?${params.toString()}`,
    );  
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    return response.json();
  } catch (error) {
    console.error('searchMovies error:', error);
    throw error;
  }
}