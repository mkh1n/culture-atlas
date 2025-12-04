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
        const url = `${proxyBase}/discover/movie?page=${Math.min(page, 500)}&language=ru-RU&sort_by=${sortBy}&include_adult=false`;
        
        const res = await fetch(url, { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
          },
          next: { revalidate: 3600 } 
        });
        
        if (!res.ok) {
          console.error(`Movies fetch failed: ${res.status}`);
          throw new Error(`Failed to fetch movies: ${res.status}`);
        }
        
        data = await res.json();
        
        data.results = (data.results || []).map((m: any) => ({
          ...m,
          media_type: "movie",
        }));
        
      } else if (onlyTV) {
        // Только сериалы
        const tvSortBy = sortBy === "primary_release_date.desc" ? "first_air_date.desc" 
                       : sortBy === "primary_release_date.asc" ? "first_air_date.asc" 
                       : sortBy === "revenue.desc" ? "popularity.desc"
                       : sortBy === "revenue.asc" ? "popularity.asc"
                       : sortBy;
        
        const url = `${proxyBase}/discover/tv?page=${Math.min(page, 500)}&language=ru-RU&sort_by=${tvSortBy}&include_adult=false`;
        
        const res = await fetch(url, { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
          },
          next: { revalidate: 3600 } 
        });
        
        if (!res.ok) {
          console.error(`TV fetch failed: ${res.status}`);
          throw new Error(`Failed to fetch TV: ${res.status}`);
        }
        
        data = await res.json();
        
        data.results = (data.results || []).map((m: any) => ({
          ...m,
          media_type: "tv",
        }));
        
      } else if (both) {
        // И фильмы, и сериалы
        // ВАЖНО: Для объединенных результатов используем упрощенную логику
        // Получаем данные по отдельности и объединяем
        
        const itemsPerPage = 20;
        const currentPage = Math.min(page, 500);
        
        // Запрашиваем больше данных для объединения и сортировки
        const fetchPerType = 40; // Получаем по 40 каждого типа
        const calculatedPage = Math.ceil((currentPage * itemsPerPage) / fetchPerType);
        
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`${proxyBase}/discover/movie?page=${Math.min(calculatedPage, 500)}&language=ru-RU&sort_by=${sortBy}&include_adult=false`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
            }
          }),
          fetch(`${proxyBase}/discover/tv?page=${Math.min(calculatedPage, 500)}&language=ru-RU&sort_by=${sortBy === "primary_release_date.desc" ? "first_air_date.desc" : sortBy === "primary_release_date.asc" ? "first_air_date.asc" : sortBy === "revenue.desc" ? "popularity.desc" : sortBy === "revenue.asc" ? "popularity.asc" : sortBy}&include_adult=false`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
            }
          })
        ]);
        
        if (!moviesRes.ok || !tvRes.ok) {
          console.error(`Fetch failed: Movies: ${moviesRes.status}, TV: ${tvRes.status}`);
          // Возвращаем хотя бы то, что получилось
        }
        
        const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [], total_results: 0, total_pages: 0 };
        const tvData = tvRes.ok ? await tvRes.json() : { results: [], total_results: 0, total_pages: 0 };
        
        // Подготавливаем данные
        const moviesResults = (moviesData.results || []).map((m: any) => ({ 
          ...m, 
          media_type: "movie",
          sort_date: m.release_date,
          sort_revenue: m.revenue || 0
        }));
        
        const tvResults = (tvData.results || []).map((t: any) => ({ 
          ...t, 
          media_type: "tv",
          sort_date: t.first_air_date,
          sort_revenue: 0
        }));
        
        // Объединяем результаты
        let combinedResults = [
          ...moviesResults,
          ...tvResults
        ];
        
        // Сортируем объединенный список
        if (combinedResults.length > 0) {
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
              case "first_air_date.desc":
                const dateB = new Date(b.sort_date || 0).getTime();
                const dateA = new Date(a.sort_date || 0).getTime();
                return dateB - dateA;
              case "primary_release_date.asc":
              case "first_air_date.asc":
                const dateA2 = new Date(a.sort_date || 0).getTime();
                const dateB2 = new Date(b.sort_date || 0).getTime();
                return dateA2 - dateB2;
              case "revenue.desc":
                return b.sort_revenue - a.sort_revenue;
              case "revenue.asc":
                return a.sort_revenue - b.sort_revenue;
              default:
                return b.popularity - a.popularity;
            }
          });
        }
        
        // Применяем пагинацию к отсортированным результатам
        const startIndex = ((currentPage - 1) * itemsPerPage) % (combinedResults.length);
        const paginatedResults = combinedResults.slice(startIndex, startIndex + itemsPerPage);
        
        // Если не хватает элементов, дополняем из следующей "порции"
        if (paginatedResults.length < itemsPerPage && calculatedPage < 500) {
          const nextPage = calculatedPage + 1;
          
          try {
            const [nextMoviesRes, nextTvRes] = await Promise.all([
              fetch(`${proxyBase}/discover/movie?page=${Math.min(nextPage, 500)}&language=ru-RU&sort_by=${sortBy}&include_adult=false`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
                }
              }),
              fetch(`${proxyBase}/discover/tv?page=${Math.min(nextPage, 500)}&language=ru-RU&sort_by=${sortBy === "primary_release_date.desc" ? "first_air_date.desc" : sortBy === "primary_release_date.asc" ? "first_air_date.asc" : sortBy === "revenue.desc" ? "popularity.desc" : sortBy === "revenue.asc" ? "popularity.asc" : sortBy}&include_adult=false`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
                }
              })
            ]);
            
            if (nextMoviesRes.ok && nextTvRes.ok) {
              const nextMoviesData = await nextMoviesRes.json();
              const nextTvData = await nextTvRes.json();
              
              const nextMoviesResults = (nextMoviesData.results || []).map((m: any) => ({ 
                ...m, 
                media_type: "movie",
                sort_date: m.release_date,
                sort_revenue: m.revenue || 0
              }));
              
              const nextTvResults = (nextTvData.results || []).map((t: any) => ({ 
                ...t, 
                media_type: "tv",
                sort_date: t.first_air_date,
                sort_revenue: 0
              }));
              
              // Объединяем и сортируем новые результаты
              const nextCombined = [...nextMoviesResults, ...nextTvResults];
              if (nextCombined.length > 0) {
                nextCombined.sort((a, b) => {
                  // Та же логика сортировки
                  switch(sortBy) {
                    case "popularity.desc":
                      return b.popularity - a.popularity;
                    case "popularity.asc":
                      return a.popularity - b.popularity;
                    case "vote_average.desc":
                      return (b.vote_average || 0) - (a.vote_average || 0);
                    case "vote_average.asc":
                      return (a.vote_average || 0) - (b.vote_average || 0);
                    default:
                      return b.popularity - a.popularity;
                  }
                });
                
                // Дополняем текущую страницу
                const needed = itemsPerPage - paginatedResults.length;
                paginatedResults.push(...nextCombined.slice(0, needed));
              }
            }
          } catch (error) {
            console.error("Error fetching next page:", error);
          }
        }
        
        // Для объединенных результатов используем максимальное значение total_pages
        const maxTotalPages = Math.max(
          moviesData.total_pages || 0,
          tvData.total_pages || 0,
          1
        );
        
        data = {
          page: currentPage,
          results: paginatedResults,
          total_results: Math.min(
            (moviesData.total_results || 0) + (tvData.total_results || 0),
            10000
          ),
          total_pages: Math.min(maxTotalPages, 500)
        };
        
      } else {
        // Только люди или ничего не выбрано
        data = { results: [], total_results: 0, total_pages: 0 };
      }
      
    } else {
      // С поисковым запросом - multi search
      const url = `${proxyBase}/search/multi?query=${encodeURIComponent(
        query
      )}&page=${Math.min(page, 500)}&include_adult=false&language=ru-RU`;
      
      const res = await fetch(url, { 
        next: { revalidate: 1800 } 
      });
      
      if (!res.ok) {
        console.error(`Search failed: ${res.status}`);
        throw new Error(`Search failed: ${res.status}`);
      }
      
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
      
      // Добавляем поля для сортировки
      results = results.map((item: any) => ({
        ...item,
        sort_date: item.media_type === "movie" ? item.release_date : item.first_air_date,
        sort_revenue: item.revenue || 0
      }));
      
      // Сортируем локально
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
            case "first_air_date.desc":
              return new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime();
            case "primary_release_date.asc":
            case "first_air_date.asc":
              return new Date(a.sort_date || 0).getTime() - new Date(b.sort_date || 0).getTime();
            case "revenue.desc":
              return b.sort_revenue - a.sort_revenue;
            case "revenue.asc":
              return a.sort_revenue - b.sort_revenue;
            default:
              return 0;
          }
        });
      }
      
      data.results = results;
    }

    // Ограничиваем total_pages 500 (максимум TMDB)
    const limitedTotalPages = Math.min(data.total_pages || 1, 500);
    
    return Response.json({
      page: data.page || page,
      results: data.results || [],
      total_results: data.total_results || 0,
      total_pages: limitedTotalPages,
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