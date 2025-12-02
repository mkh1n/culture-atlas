"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import movieService from "@/services/movieService";
import MoviesGrid from "@/components/MoviesGrid/MoviesGrid";
import SearchInput from "@/components/SearchInput/SearchInput";
import ReactPaginate from "react-paginate";

import styles from "./ExplorePage.module.css";

type SortOption = "popularity.desc" | "release_date.desc" | "release_date.asc";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSort =
    (searchParams.get("sort_by") as SortOption) || "popularity.desc";

  const [rawQuery, setRawQuery] = useState(urlQuery);
  const [debouncedQuery] = useDebounce(rawQuery, 400);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const query = debouncedQuery.trim();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService(query, currentPage, sortBy);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, sortBy]);

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortBy !== "popularity.desc") params.set("sort_by", sortBy);

    const newUrl = params.toString() ? `?${params.toString()}` : "/explore";
    router.replace(newUrl, { scroll: false });
  }, [query, currentPage, sortBy, fetchData, router]);

  useEffect(() => {
    const queryChanged = query !== urlQuery;
    const sortChanged = sortBy !== urlSort;

    if (queryChanged || sortChanged) {
      setCurrentPage(1);
    }
  }, [query, sortBy, urlQuery, urlSort]);

  const handleSearch = (value: string) => {
    setRawQuery(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SearchInput onInput={handleSearch} initialValue={rawQuery} />
        <div className={styles.searchSettings}>
          <div className={styles.filters}>
            <div className={styles.filterHolder}>
              <input type="checkbox" id="movies" name="movies" />
              <label htmlFor="movies" >Фильмы</label>
            </div>
            <div className={styles.filterHolder}>
              <input type="checkbox" id="tv" name="tv" />
              <label htmlFor="tv">Сериалы</label>
            </div>
            <div className={styles.filterHolder}>
              <input type="checkbox" id="people" name="people" />
              <label htmlFor="people">Люди</label>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className={styles.sortSelect}
          >
            <option value="popularity.desc">По популярности</option>
            <option value="release_date.desc">Сначала новые</option>
            <option value="release_date.asc">Сначала старые</option>
          </select>
        </div>
      </div>

      {loading && <div className={styles.loading}>Загрузка...</div>}

      {!loading && data && (
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

      {!loading && !data && (
        <div className={styles.noResults}>
          {query ? "Ничего не найдено" : "Не удалось загрузить данные"}
        </div>
      )}
    </div>
  );
}
