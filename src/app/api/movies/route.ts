// app/api/movies/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const query = searchParams.get('query') || '';
  const page = searchParams.get('page') || '1';
  const movies = searchParams.get('movies') !== 'false'; // По умолчанию true
  const tv = searchParams.get('tv') !== 'false'; // По умолчанию true
  const people = searchParams.get('people') === 'true';
  const sort = searchParams.get('sort') || 'popularity.desc';
  const genresParam = searchParams.get('genres') || '';
  
  const proxyBase = "https://tmdb-proxy-orpin.vercel.app";

  try {
    let url: string;
    let params = new URLSearchParams();
    let currentMediaType = 'movie'; // Определяем тип контента для добавления media_type
    
    // Базовые параметры
    params.set('page', page);
    params.set('language', 'ru-RU');
    
    // Если есть поисковый запрос
    if (query) {
      // Multi-search endpoint
      const includeTypes = [];
      if (movies) includeTypes.push('movie');
      if (tv) includeTypes.push('tv');
      if (people) includeTypes.push('person');
      
      // Multi search не поддерживает сортировку
      url = `${proxyBase}/search/multi?query=${encodeURIComponent(query)}&${params.toString()}`;
    } else {
      // Определяем тип контента
      let mediaType = 'movie';
      if (tv && !movies) {
        mediaType = 'tv';
        currentMediaType = 'tv';
      } else if (movies && !tv) {
        mediaType = 'movie';
        currentMediaType = 'movie';
      } else {
        // Если оба типа или ни один - используем movie по умолчанию
        mediaType = 'movie';
        currentMediaType = 'movie';
      }
      
      // Используем discover endpoint для лучшей сортировки и фильтрации
      url = `${proxyBase}/discover/${mediaType}`;
      
      // Добавляем сортировку только для discover
      params.set('sort_by', sort);
      
      // Добавляем жанры если есть
      if (genresParam) {
        const genres = genresParam.split(',').map(Number);
        const primaryGenre = genres[0];
        params.set('with_genres', primaryGenre.toString());
      }
      
      // Для сортировки по рейтингу добавляем минимальное количество голосов
      if (sort.includes('vote_average')) {
        params.set('vote_count.gte', '50'); // Минимум 50 голосов для рейтинга
      }
      
      // Для фильмов - добавляем базовые фильтры
      if (mediaType === 'movie') {
        // Только фильмы с постером
        params.set('include_adult', 'false');
        params.set('include_video', 'false');
      }
      
      url = `${url}?${params.toString()}`;
    }

    console.log("Fetching movies from:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("TMDB API error:", errorText);
      throw new Error(`Failed to fetch movies: ${res.status}`);
    }

    const data = await res.json();
    
    // Добавляем media_type к результатам если их нет
    if (data.results && Array.isArray(data.results)) {
      data.results = data.results.map((item: any) => {
        // Если у элемента уже есть media_type, оставляем его
        if (item.media_type) {
          return item;
        }
        
        // Определяем media_type по полям
        let mediaType = currentMediaType;
        
        // Если это search/multi, проверяем поля
        if (!query) {
          // Для discover результатов используем текущий media_type
          return {
            ...item,
            media_type: mediaType
          };
        }
        
        // Для search/multi определяем по наличию полей
        if (item.title) {
          mediaType = 'movie';
        } else if (item.name && !item.known_for) {
          mediaType = 'tv';
        } else if (item.known_for || item.known_for_department) {
          mediaType = 'person';
        }
        
        return {
          ...item,
          media_type: mediaType
        };
      });
    }
    
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch movies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}