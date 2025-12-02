// app/explore/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import movieService, { SearchFilters } from "@/services/movieService";
import MoviesGrid from "@/components/MoviesGrid/MoviesGrid";
import SearchInput from "@/components/SearchInput/SearchInput";
import ReactPaginate from "react-paginate";

import styles from "./ExplorePage.module.css";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlPage = Number(searchParams.get("page") || "1");
  const urlMovies = searchParams.get("movies") !== "false";
  const urlTV = searchParams.get("tv") !== "false";
  const urlPeople = searchParams.get("people") === "true";

  const [rawQuery, setRawQuery] = useState(urlQuery);
  const [debouncedQuery] = useDebounce(rawQuery, 400);
  const [currentPage, setCurrentPage] = useState(urlPage);
  
  // Состояние для фильтров
  const [filters, setFilters] = useState<SearchFilters>({
    movies: urlMovies,
    tv: urlTV,
    people: urlPeople
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const query = debouncedQuery.trim();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService(query, currentPage, filters);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, filters]);

  useEffect(() => {
    fetchData();
    
    // Обновляем URL с параметрами
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    // Добавляем фильтры в URL
    if (!filters.movies) params.set("movies", "false");
    if (!filters.tv) params.set("tv", "false");
    if (filters.people) params.set("people", "true");

    const newUrl = params.toString() ? `?${params.toString()}` : "/explore";
    router.replace(newUrl, { scroll: false });
  }, [query, currentPage, filters, fetchData, router]);

  // Сбрасываем страницу при изменении запроса или фильтров
  useEffect(() => {
    const queryChanged = query !== urlQuery;
    const moviesChanged = filters.movies !== urlMovies;
    const tvChanged = filters.tv !== urlTV;
    const peopleChanged = filters.people !== urlPeople;

    if (queryChanged || moviesChanged || tvChanged || peopleChanged) {
      setCurrentPage(1);
    }
  }, [query, filters, urlQuery, urlMovies, urlTV, urlPeople]);

  const handleSearch = (value: string) => {
    setRawQuery(value);
  };

  const handleFilterChange = (filter: keyof SearchFilters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };

  // Проверяем, выбраны ли хоть какие-то медиа-типы
  const hasMediaSelected = filters.movies || filters.tv || filters.people;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SearchInput onInput={handleSearch} initialValue={rawQuery} />
        <div className={styles.searchSettings}>
          <div className={styles.filters}>
            <div className={styles.filterHolder}>
              <input 
                type="checkbox" 
                id="movies" 
                name="movies" 
                checked={filters.movies}
                onChange={() => handleFilterChange('movies')}
              />
              <label htmlFor="movies">Фильмы</label>
            </div>
            <div className={styles.filterHolder}>
              <input 
                type="checkbox" 
                id="tv" 
                name="tv"
                checked={filters.tv}
                onChange={() => handleFilterChange('tv')}
              />
              <label htmlFor="tv">Сериалы</label>
            </div>
            <div className={styles.filterHolder}>
              <input 
                type="checkbox" 
                id="people" 
                name="people"
                checked={filters.people}
                onChange={() => handleFilterChange('people')}
              />
              <label htmlFor="people">Люди</label>
            </div>
          </div>
          {/* Убираем селект сортировки */}
        </div>
      </div>

      {loading && <div className={styles.loading}>Загрузка...</div>}

      {!loading && !hasMediaSelected && (
        <div className={styles.warning}>
          Выберите хотя бы один тип контента (фильмы, сериалы или люди)
        </div>
      )}

      {!loading && data && hasMediaSelected && (
        <>
          <div className={styles.infoSection}>
            <p>Найдено: {data.total_results?.toLocaleString() || 0}</p>
          </div>

          <MoviesGrid movies={data.results || []} />

          {data.total_pages > 1 && (
            <ReactPaginate
              previousLabel="‹"
              nextLabel="›"
              pageCount={Math.min(data.total_pages || 1, 500)}
              forcePage={currentPage - 1}
              onPageChange={handlePageChange}
              containerClassName={styles.pagination}
              activeClassName={styles.active}
              pageRangeDisplayed={5}
              marginPagesDisplayed={2}
            />
          )}
        </>
      )}

      {!loading && !data && hasMediaSelected && (
        <div className={styles.noResults}>
          {query ? "Ничего не найдено" : "Не удалось загрузить данные"}
        </div>
      )}
    </div>
  );
}