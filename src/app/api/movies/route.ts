import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sort") || "popularity.desc";

  const includeMovies = searchParams.get("movies") !== "false";
  const includeTV = searchParams.get("tv") !== "false";
  const includePeople = searchParams.get("people") === "true";

  const proxyBase = "https://tmdb-proxy-orpin.vercel.app";

  try {
    let data: any;

    if (!query) {
      // Без поискового запроса - используем discover с сортировкой
      
      // Определяем, какие типы контента выбраны
      const onlyMovies = includeMovies && !includeTV;
      const onlyTV = !includeMovies && includeTV;
      const both = includeMovies && includeTV;
      
      if (onlyMovies) {
        // Только фильмы
        const url = `${proxyBase}/discover/movie?page=${page}&language=ru-RU&sort_by=${sortBy}&include_adult=false`;
        console.log("Fetching discover movies:", url);
        
        const res = await fetch(url, { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
          },
          next: { revalidate: 3600 } 
        });
        
        if (!res.ok) throw new Error(`Failed to fetch movies: ${res.status}`);
        data = await res.json();
        
        // Добавляем media_type
        data.results = (data.results || []).map((m: any) => ({
          ...m,
          media_type: "movie",
        }));
        
      } else if (onlyTV) {
        // Только сериалы
        const tvSortBy = sortBy === "primary_release_date.desc" ? "first_air_date.desc" 
                       : sortBy === "primary_release_date.asc" ? "first_air_date.asc" 
                       : sortBy;
        
        const url = `${proxyBase}/discover/tv?page=${page}&language=ru-RU&sort_by=${tvSortBy}&include_adult=false`;
        console.log("Fetching discover TV:", url);
        
        const res = await fetch(url, { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
          },
          next: { revalidate: 3600 } 
        });
        
        if (!res.ok) throw new Error(`Failed to fetch TV: ${res.status}`);
        data = await res.json();
        
        // Добавляем media_type
        data.results = (data.results || []).map((m: any) => ({
          ...m,
          media_type: "tv",
        }));
        
      } else if (both) {
        // И фильмы, и сериалы - нужно получить оба и объединить
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`${proxyBase}/discover/movie?page=${page}&language=ru-RU&sort_by=${sortBy}&include_adult=false`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
            }
          }),
          fetch(`${proxyBase}/discover/tv?page=${page}&language=ru-RU&sort_by=${sortBy === "primary_release_date.desc" ? "first_air_date.desc" : sortBy === "primary_release_date.asc" ? "first_air_date.asc" : sortBy}&include_adult=false`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
            }
          })
        ]);
        
        if (!moviesRes.ok || !tvRes.ok) {
          throw new Error(`Failed to fetch discover data`);
        }
        
        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        
        // Объединяем результаты
        const combinedResults = [
          ...(moviesData.results || []).map((m: any) => ({ ...m, media_type: "movie" })),
          ...(tvData.results || []).map((t: any) => ({ ...t, media_type: "tv" }))
        ];
        
        // Сортируем объединенный список локально
        combinedResults.sort((a, b) => {
          switch(sortBy) {
            case "popularity.desc":
              return b.popularity - a.popularity;
            case "popularity.asc":
              return a.popularity - b.popularity;
            case "vote_average.desc":
              return (b.vote_average || 0) - (a.vote_average || 0);
            case "vote_average.asc":
              return (a.vote_average || 0) - (b.vote_average || 0);
            case "primary_release_date.desc":
              const dateA = a.media_type === "movie" ? a.release_date : a.first_air_date;
              const dateB = b.media_type === "movie" ? b.release_date : b.first_air_date;
              return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            case "primary_release_date.asc":
              const dateA2 = a.media_type === "movie" ? a.release_date : a.first_air_date;
              const dateB2 = b.media_type === "movie" ? b.release_date : b.first_air_date;
              return new Date(dateA2 || 0).getTime() - new Date(dateB2 || 0).getTime();
            default:
              return 0;
          }
        });
        
        data = {
          page,
          results: combinedResults,
          total_results: (moviesData.total_results || 0) + (tvData.total_results || 0),
          total_pages: Math.max(moviesData.total_pages || 1, tvData.total_pages || 1)
        };
        
      } else {
        // Только люди или ничего не выбрано
        data = { results: [], total_results: 0, total_pages: 0 };
      }
      
    } else {
      // С поисковым запросом - multi search (сортировка не поддерживается API)
      const url = `${proxyBase}/search/multi?query=${encodeURIComponent(
        query
      )}&page=${page}&include_adult=false&language=ru-RU`;
      
      const res = await fetch(url, { 
        next: { revalidate: 1800 } 
      });
      
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      data = await res.json();
      
      // Фильтруем результаты
      let results = data.results || [];
      results = results.filter((item: any) => {
        const mediaType = item.media_type;

        if (includePeople && mediaType === "person") {
          return true;
        }

        if (mediaType === "movie") {
          return includeMovies;
        }
        if (mediaType === "tv") {
          return includeTV;
        }

        return false;
      });
      
      // При поиске сортируем локально, так как TMDB search не поддерживает sort_by
      if (sortBy !== "popularity.desc") {
        results.sort((a: any, b: any) => {
          switch(sortBy) {
            case "popularity.asc":
              return a.popularity - b.popularity;
            case "vote_average.desc":
              return (b.vote_average || 0) - (a.vote_average || 0);
            case "vote_average.asc":
              return (a.vote_average || 0) - (b.vote_average || 0);
            case "primary_release_date.desc":
              const dateA = a.media_type === "movie" ? a.release_date : a.first_air_date;
              const dateB = b.media_type === "movie" ? b.release_date : b.first_air_date;
              return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            case "primary_release_date.asc":
              const dateA2 = a.media_type === "movie" ? a.release_date : a.first_air_date;
              const dateB2 = b.media_type === "movie" ? b.release_date : b.first_air_date;
              return new Date(dateA2 || 0).getTime() - new Date(dateB2 || 0).getTime();
            default:
              return 0;
          }
        });
      }
      
      data.results = results;
    }

    return Response.json({
      page: data.page || page,
      results: data.results || [],
      total_results: data.total_results || 0,
      total_pages: Math.min(data.total_pages || 1, 500),
      filtered_count: (data.results || []).length,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        page,
        results: [],
        total_results: 0,
        total_pages: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}