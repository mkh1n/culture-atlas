"use client";

import { TMDbSearchResponse } from "@/types/movie";
import MoviesGrid from "@/components/MoviesGrid/MoviesGrid";
import movieService from "@/services/movieService";
import SearchInput from "@/components/SearchInput/SearchInput";
import { useEffect, useState, useCallback } from "react";

function SearchPage() {
  const [query, setQuery] = useState("harry");
  const [data, setData] = useState<TMDbSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Используем useCallback для мемоизации функции
  const fetchMovies = useCallback(async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await movieService(searchQuery, 1);
      setData(response);
    } catch (err) {
      setError("Ошибка при загрузке фильмов");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Дебаунс для оптимизации запросов
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchMovies(query);
      }
    }, 500); // Задержка 500ms

    return () => clearTimeout(timer);
  }, [query, fetchMovies]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const renderContent = () => {
    if (loading) {
      return <p>Загрузка...</p>;
    }

    if (error) {
      return <p>Ошибка: {error}</p>;
    }

    if (!data) {
      return (
        <p>Фильмы не найдены: Попробуйте другой запрос</p>
      );
    }

    return (
      <>
        <p>Найдено фильмов: {data.total_results || 0}</p>
        <MoviesGrid movies={data.results} />
      </>
    );
  };

  return (
    <div>
      <SearchInput onInput={handleSearch} initialValue={query} />
      <h1>Результаты для "{query}"</h1>
      {renderContent()}
    </div>
  );
}

export default SearchPage;