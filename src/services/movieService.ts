// lib/tmdb.ts
export default async function searchMovies(query: string, page: number = 1) {
  console.log('searchMovies called with:', { query, page });
  
  try {
    const response = await fetch(
      `/api/movies?query=${encodeURIComponent(query)}&page=${page}`,
      {
        next: { 
          revalidate: 60 * 60,
          tags: ['movies', query]
        }
      }
    );
    
    console.log('API route response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText.slice(0, 100)}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('searchMovies error:', error);
    throw error;
  }
}