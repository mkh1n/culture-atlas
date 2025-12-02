// app/api/movies/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').trim();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sort_by') as 'popularity.desc' | 'release_date.desc' | 'release_date.asc' || 'popularity.desc';

  const proxyBase = 'https://proxy-tmdb-weld.vercel.app/api';

  try {
    let data: any;

    if (!query) {
      // Без поискового запроса — используем популярные (поддерживают sort_by через прокси, если он передаёт)
      const url = `${proxyBase}/movie/popular?page=${page}&language=ru-RU`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error('Failed to fetch popular movies');
      data = await res.json();

      // Добавляем media_type
      data.results = (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
    } else {
      // С поисковым запросом — используем /search (sort_by НЕ поддерживается)
      const url = `${proxyBase}/search?query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=ru-RU`;
      const res = await fetch(url, { next: { revalidate: 1800 } });
      if (!res.ok) throw new Error('Search failed');
      data = await res.json();
    }

    let results = data.results || [];

    // Убираем людей (если не включены)
    results = results.filter((item: any) => item.media_type !== 'person');

    // КРИТИЧЕСКИ ВАЖНО: сортируем на сервере, даже если только одну страницу
    results.sort((a: any, b: any) => {
      if (sortBy === 'popularity.desc') {
        return (b.popularity || 0) - (a.popularity || 0);
      }

      const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01').getTime();
      const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01').getTime();

      if (sortBy === 'release_date.desc') {
        return dateB - dateA;
      }
      if (sortBy === 'release_date.asc') {
        return dateA - dateB;
      }

      return 0;
    });

    return Response.json({
      page: data.page || page,
      results,
      total_results: data.total_results || results.length,
      total_pages: Math.min(data.total_pages || 1, 500),
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({
      results: [],
      total_results: 0,
      total_pages: 0,
    }, { status: 500 });
  }
}