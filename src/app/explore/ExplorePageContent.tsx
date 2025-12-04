"use client";

import { Suspense } from 'react';

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import movieService, { SearchFilters } from "@/services/movieService";
import MoviesGrid from "@/components/MoviesGrid/MoviesGrid";
import SearchInput from "@/components/SearchInput/SearchInput";
import ReactPaginate from "react-paginate";
import Image from "next/image";

import styles from "./ExplorePage.module.css";

type SortOption =
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

// Ключ для localStorage
const SEARCH_STORAGE_KEY = "explore_search_state";

// Функции для работы с localStorage
const saveSearchState = (state: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state));
  }
};

const loadSearchState = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(SEARCH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

export default function ExplorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlPage = Number(searchParams.get("page") || "1");
  const urlMovies = searchParams.get("movies") !== "false";
  const urlTV = searchParams.get("tv") !== "false";
  const urlPeople = searchParams.get("people") === "true";
  const urlSort = (searchParams.get("sort") as SortOption) || "popularity.desc";

  // Загружаем сохраненное состояние при инициализации
  const [rawQuery, setRawQuery] = useState(() => {
    const saved = loadSearchState();
    // Приоритет: URL параметры > сохраненное состояние
    return urlQuery || saved?.query || "";
  });

  const [debouncedQuery] = useDebounce(rawQuery, 400);

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = loadSearchState();
    // Приоритет: URL параметры > сохраненное состояние
    return urlPage > 1 ? urlPage : saved?.page || 1;
  });

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const saved = loadSearchState();
    // Приоритет: URL параметры > сохраненное состояние > значения по умолчанию
    return {
      movies:
        urlMovies ||
        (saved?.filters?.movies !== undefined ? saved.filters.movies : true),
      tv: urlTV || (saved?.filters?.tv !== undefined ? saved.filters.tv : true),
      people: urlPeople || saved?.filters?.people || false,
    };
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = loadSearchState();
    // Приоритет: URL параметры > сохраненное состояние > значение по умолчанию
    return urlSort !== "popularity.desc"
      ? urlSort
      : saved?.sortBy || "popularity.desc";
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const query = debouncedQuery.trim();

  // Сохраняем полное состояние при каждом изменении
  useEffect(() => {
    saveSearchState({
      query: rawQuery,
      filters,
      sortBy,
      page: currentPage,
    });
  }, [rawQuery, filters, sortBy, currentPage]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService(query, currentPage, filters, sortBy);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, filters, sortBy]);

  useEffect(() => {
    fetchData();

    // Обновляем URL с параметрами
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentPage > 1) params.set("page", currentPage.toString());

    if (!filters.movies) params.set("movies", "false");
    if (!filters.tv) params.set("tv", "false");
    if (filters.people) params.set("people", "true");

    if (sortBy !== "popularity.desc") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/explore?${params.toString()}`
      : "/explore";
    router.replace(newUrl, { scroll: false });
  }, [query, currentPage, filters, sortBy, fetchData, router]);

  const handleSearch = (value: string) => {
    setRawQuery(value);
    // При новом поиске сбрасываем на первую страницу
    if (value.trim() !== query) {
      setCurrentPage(1);
    }
  };

  const handleFilterChange = (filter: keyof SearchFilters) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filter]: !prev[filter],
      };

      // Сбрасываем страницу только если выбранный фильтр изменился с активного на неактивный или наоборот
      const wasActive = prev[filter];
      const nowActive = !prev[filter];

      // Если фильтр изменил свое состояние
      if (wasActive !== nowActive) {
        setCurrentPage(1);
      }

      return newFilters;
    });
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    // Ограничиваем максимальную страницу 500
    const newPage = Math.min(selected + 1, 500);
    setCurrentPage(newPage);
  };

  const handleClearFilters = () => {
    setRawQuery("");
    setCurrentPage(1);
    setFilters({
      movies: true,
      tv: true,
      people: false,
    });
    setSortBy("popularity.desc");
  };

  const hasMediaSelected = filters.movies || filters.tv || filters.people;

  const sortOptions = [
    { value: "popularity.desc", label: "По популярности ⬇" },
    { value: "popularity.asc", label: "По популярности ⬆" },
    { value: "vote_average.desc", label: "По рейтингу ⬇" },
    { value: "vote_average.asc", label: "По рейтингу ⬆" },
    { value: "primary_release_date.desc", label: "По дате релиза ⬇" },
    { value: "primary_release_date.asc", label: "По дате релиза ⬆" },
    { value: "first_air_date.desc", label: "По дате выхода сериала ⬇" },
    { value: "first_air_date.asc", label: "По дате выхода сериала ⬆" },
    { value: "revenue.desc", label: "По кассовым сборам ⬇" },
    { value: "revenue.asc", label: "По кассовым сборам ⬆" },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label ||
    "По популярности (убыв.)";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SearchInput onInput={handleSearch} initialValue={rawQuery} />
        <div className={styles.controlsRow}>
          <div className={styles.searchSettings}>
            <div className={styles.filters}>
              <div className={styles.filterHolder}>
                <input
                  type="checkbox"
                  id="movies"
                  name="movies"
                  checked={filters.movies}
                  onChange={() => handleFilterChange("movies")}
                />
                <label htmlFor="movies">Фильмы</label>
              </div>
              <div className={styles.filterHolder}>
                <input
                  type="checkbox"
                  id="tv"
                  name="tv"
                  checked={filters.tv}
                  onChange={() => handleFilterChange("tv")}
                />
                <label htmlFor="tv">Сериалы</label>
              </div>
              <div className={styles.filterHolder}>
                <input
                  type="checkbox"
                  id="people"
                  name="people"
                  checked={filters.people}
                  onChange={() => handleFilterChange("people")}
                />
                <label htmlFor="people">Люди</label>
              </div>
            </div>

            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className={styles.sortSelect}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleClearFilters}
              className={styles.clearButton}
            >
              <Image
                src="/clear.svg"
                alt="Описание изображения"
                height={30}
                width={30}
                className={styles.clearButtonImage}
              />
            </button>
          </div>
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
            <div className={styles.infoRow}>
              <p className={styles.infoItem}>
                <strong>Найдено:</strong>{" "}
                {data.total_results?.toLocaleString() || 0}
              </p>
              <p className={styles.infoItem}>
                <strong>Страница:</strong> {currentPage} из{" "}
                {Math.min(data.total_pages || 1, 500)}
              </p>
            </div>
          </div>

          <MoviesGrid movies={data.results || []} />

          {data.total_pages > 1 && (
            <ReactPaginate
              previousLabel="‹"
              nextLabel="›"
              pageCount={Math.min(data.total_pages || 1, 500)}
              forcePage={Math.min(currentPage - 1, 499)}
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
