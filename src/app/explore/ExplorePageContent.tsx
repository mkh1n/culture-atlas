"use client";

import { Suspense } from "react";
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

// Тип для жанра
interface Genre {
  id: number;
  name: string;
}

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
  const urlGenres = searchParams.get("genres") || "";

  // Загружаем сохраненное состояние при инициализации
  const [rawQuery, setRawQuery] = useState(() => {
    const saved = loadSearchState();
    return urlQuery || saved?.query || "";
  });

  const [debouncedQuery] = useDebounce(rawQuery, 400);

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = loadSearchState();
    return urlPage > 1 ? urlPage : saved?.page || 1;
  });

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const saved = loadSearchState();
    return {
      movies:
        urlMovies ||
        (saved?.filters?.movies !== undefined ? saved.filters.movies : true),
      tv: urlTV || (saved?.filters?.tv !== undefined ? saved.filters.tv : true),
      people: urlPeople || saved?.filters?.people || false,
      genres: urlGenres
        ? urlGenres
            .split(",")
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id))
        : saved?.genres || [],
    };
  });

  const [selectedGenres, setSelectedGenres] = useState<number[]>(() => {
    const saved = loadSearchState();
    if (urlGenres) {
      return urlGenres
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
    }
    return saved?.genres || [];
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = loadSearchState();
    return urlSort !== "popularity.desc"
      ? urlSort
      : saved?.sortBy || "popularity.desc";
  });

  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const query = debouncedQuery.trim();

  // Загружаем жанры при монтировании
  useEffect(() => {
    const loadGenres = async () => {
      setGenresLoading(true);
      try {
        // Загружаем жанры фильмов из JSON
        const movieResponse = await fetch("/data/movie-genres-ru.json");
        const movieData = await movieResponse.json();
        setMovieGenres(movieData.genres || []);

        // Загружаем жанры сериалов из JSON
        const tvResponse = await fetch("/data/tv-genres-ru.json");
        const tvData = await tvResponse.json();
        setTvGenres(tvData.genres || []);
      } catch (error) {
        console.error("Error loading genres:", error);
        // Fallback данные если JSON не загрузился
        setMovieGenres([
          { id: 28, name: "Боевик" },
          { id: 35, name: "Комедия" },
          { id: 18, name: "Драма" },
          { id: 878, name: "Фантастика" },
          { id: 14, name: "Фэнтези" },
          { id: 27, name: "Ужасы" },
          { id: 10749, name: "Мелодрама" },
          { id: 53, name: "Триллер" },
        ]);
        setTvGenres([
          { id: 10759, name: "Боевик и Приключения" },
          { id: 35, name: "Комедия" },
          { id: 18, name: "Драма" },
          { id: 10765, name: "Фантастика и Фэнтези" },
        ]);
      } finally {
        setGenresLoading(false);
      }
    };

    loadGenres();
  }, []);

  // Сохраняем полное состояние при каждом изменении
  useEffect(() => {
    saveSearchState({
      query: rawQuery,
      filters: {
        movies: filters.movies,
        tv: filters.tv,
        people: filters.people,
      },
      sortBy,
      page: currentPage,
      genres: selectedGenres,
    });
  }, [rawQuery, filters, sortBy, currentPage, selectedGenres]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService(
        query,
        currentPage,
        {
          ...filters,
          genres: selectedGenres,
        },
        sortBy
      );
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, filters, sortBy, selectedGenres]);

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

    if (selectedGenres.length > 0) {
      params.set("genres", selectedGenres.join(","));
    }

    const newUrl = params.toString()
      ? `/explore?${params.toString()}`
      : "/explore";
    router.replace(newUrl, { scroll: false });
  }, [query, currentPage, filters, sortBy, selectedGenres, fetchData, router]);

  const handleSearch = (value: string) => {
    setRawQuery(value);
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

      const wasActive = prev[filter];
      const nowActive = !prev[filter];

      if (wasActive !== nowActive) {
        setCurrentPage(1);
      }

      return newFilters;
    });
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      } else {
        const newGenres = [...prev, genreId];
        return newGenres.slice(-3);
      }
    });
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
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
      genres: [],
    });
    setSelectedGenres([]);
    setSortBy("popularity.desc");
  };

  const handleClearGenres = () => {
    setSelectedGenres([]);
    setCurrentPage(1);
  };

  const toggleShowAllGenres = () => {
    setShowAllGenres(!showAllGenres);
  };

  const hasMediaSelected = filters.movies || filters.tv || filters.people;
  const hasGenresSelected = selectedGenres.length > 0;

  // Определяем доступные жанры в зависимости от выбранных фильтров
  const availableGenres =
    filters.movies && !filters.tv
      ? movieGenres
      : filters.tv && !filters.movies
      ? tvGenres
      : [...movieGenres, ...tvGenres];

  // Убираем дубликаты жанров
  const uniqueGenres = Array.from(
    new Map(availableGenres.map((genre) => [genre.id, genre])).values()
  );

  // Жанры для отображения
  const displayedGenres = showAllGenres
    ? uniqueGenres
    : uniqueGenres.slice(0, 8); // Первая строка - 8 жанров

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

  return (
    <div className={styles.container}>
      <div className={styles.exploreContainer}>
        <div className={styles.header}>
          <SearchInput onInput={handleSearch} initialValue={rawQuery} />
          <div className={styles.controlsRow}>
            <div className={styles.searchSettings}>
              <div className={styles.filters}>
                {[
                  {
                    id: "movies",
                    label: "Фильмы",
                    key: "movies" as keyof SearchFilters,
                  },
                  {
                    id: "tv",
                    label: "Сериалы",
                    key: "tv" as keyof SearchFilters,
                  },
                  {
                    id: "people",
                    label: "Люди",
                    key: "people" as keyof SearchFilters,
                  },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    className={
                      filters[filter.key]
                        ? `${styles.filterButton} ${styles.filterButtonActive}`
                        : styles.filterButton
                    }
                    onClick={() => handleFilterChange(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
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
                title="Очистить все фильтры"
              >
                <Image
                  src="/icons/clear.svg"
                  alt="Очистить"
                  height={24}
                  width={24}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Секция выбора жанров */}
        <div className={styles.genresSection}>
          <div className={styles.genresHeader}>
            <h3 className={styles.genresTitle}>Жанры</h3>
            {hasGenresSelected && (
              <button
                onClick={handleClearGenres}
                className={styles.clearGenresButton}
              >
                Очистить жанры
              </button>
            )}
          </div>
          {genresLoading ? (
            <div className={styles.genresLoading}>Загрузка жанров...</div>
          ) : (
            <>
              <div
                className={`${styles.genresContainer} ${
                  showAllGenres ? styles.genresExpanded : ""
                }`}
              >
                {displayedGenres.map((genre) => (
                  <button
                    key={genre.id}
                    className={`${styles.genreTag} ${
                      selectedGenres.includes(genre.id)
                        ? styles.genreTagActive
                        : ""
                    }`}
                    onClick={() => handleGenreToggle(genre.id)}
                  >
                    {genre.name}
                    {selectedGenres.includes(genre.id) && (
                      <span className={styles.genreRemove}>×</span>
                    )}
                  </button>
                ))}
              </div>

              {uniqueGenres.length > 8 && (
                <button
                  className={styles.showMoreButton}
                  onClick={toggleShowAllGenres}
                >
                  {showAllGenres
                    ? "Скрыть"
                    : `Показать все (${uniqueGenres.length})`}
                </button>
              )}
            </>
          )}

          {hasGenresSelected && (
            <div className={styles.selectedGenres}>
              <span className={styles.selectedGenresLabel}>Выбрано:</span>
              {selectedGenres.map((genreId) => {
                const genre = uniqueGenres.find((g) => g.id === genreId);
                return genre ? (
                  <span key={genreId} className={styles.selectedGenreBadge}>
                    {genre.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
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
                {hasGenresSelected && (
                  <p className={styles.infoItem}>
                    <strong>Жанр:</strong>{" "}
                    {selectedGenres
                      .map((genreId) => {
                        const genre = uniqueGenres.find(
                          (g) => g.id === genreId
                        );
                        return genre ? genre.name : "";
                      })
                      .join(", ")}
                  </p>
                )}
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
    </div>
  );
}
