import React, { useState, useEffect } from "react";
import { TMDBMediaItem, Genre } from "@/types/tmdb";
import styles from "./MovieCard.module.css";
import tmdbService from "@/services/tmdbService";
import { useRouter } from "next/navigation";
interface MovieCardProps {
  movie: TMDBMediaItem;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const router = useRouter();

  const hendleClick = () => {
    // Генерируем правильный путь в зависимости от типа контента
    if (movie.media_type === "movie") {
      router.push(`/explore/movie/${movie.id}`);
    } else if (movie.media_type === "tv") {
      router.push(`/explore/tv/${movie.id}`);
    } else if (movie.media_type === "person") {
      router.push(`/explore/person/${movie.id}`);
    }
  };
  // Загружаем жанры при монтировании компонента
  useEffect(() => {
    const fetchGenres = async () => {
      if (!movie.genre_ids?.length || movie.media_type === "person") return;

      try {
        setLoadingGenres(true);
        let genreList: Genre[] = [];

        if (movie.media_type === "movie") {
          const response = await tmdbService.genre.getMovieGenres();
          genreList = response.genres;
        } else if (movie.media_type === "tv") {
          const response = await tmdbService.genre.getTVGenres();
          genreList = response.genres;
        }

        // Фильтруем только те жанры, которые есть в фильме/сериале
        const movieGenres = genreList.filter((genre) =>
          movie.genre_ids?.includes(genre.id)
        );

        setGenres(movieGenres);
      } catch (error) {
        console.error("Error fetching genres:", error);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, [movie.genre_ids, movie.media_type]);

  // Функция для получения жанров
  const getGenres = () => {
    // Для людей не показываем жанры
    if (movie.media_type === "person") return [];

    // Возвращаем жанры из state
    return genres;
  };

  // Функция для отображения жанров (первые 2)
  const getGenresText = () => {
    const movieGenres = getGenres();
    if (!movieGenres.length) return null;

    const genreNames = movieGenres.slice(0, 2).map((g) => g.name);
    return genreNames.join(", ");
  };

  // Определяем тип и получаем данные в зависимости от типа
  const getTitle = () => {
    if (movie.media_type === "movie") return movie.title;
    if (movie.media_type === "tv") return movie.name;
    if (movie.media_type === "person") return movie.name;
    return "Unknown";
  };

  const getReleaseDate = () => {
    if (movie.media_type === "movie") return movie.release_date;
    if (movie.media_type === "tv") return movie.first_air_date;
    if (movie.media_type === "person") return movie.known_for_department;
    return "";
  };

  const getPosterPath = () => {
    if (movie.media_type === "person") return movie.profile_path;
    return movie.poster_path;
  };

  const getImageUrl = () => {
    const path = getPosterPath();

    // Проверяем все возможные случаи отсутствия изображения
    const imageUnavailable =
      !path || // null, undefined, empty string
      path === "N/A" ||
      path === "null" ||
      path === "" ||
      imageError; // если была ошибка при загрузке

    if (imageUnavailable) {
      // Определяем placeholder на основе типа и gender
      if (movie.media_type === "person") {
        // gender: 1 = female, 2 = male
        if (movie.gender === 2 || movie.gender === 0) {
          return "/male-placeholder.png";
        } else {
          return "/female-placeholder.png";
        }
        return "/person-placeholder.jpg";
      }
      return "/poster-placeholder.jpg";
    }

    // Если изображение доступно
    return `https://proxy-tmdb-weld.vercel.app/api/image/w500/${path}`;
  };

  const getMediaTypeBadge = () => {
    switch (movie.media_type) {
      case "movie":
        return "🎬 Фильм";
      case "tv":
        return "📺 Сериал";
      case "person":
        return "⭐ Актер";
      default:
        return "";
    }
  };

  const getRatingBadge = () => {
    // Для людей не показываем рейтинг
    if (movie.media_type === "person") return null;
    const rating = movie.vote_average?.toFixed(1) || "0.0";
    let badgeColor = "gold";

    if (+rating < 7) {
      badgeColor = "gray";
    } else if (+rating < 8.2) {
      badgeColor = "green";
    }
    return (
      <div className={`${styles.ratingBadge} ${styles[badgeColor]}`}>
        {rating}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return dateString;
    }
  };

  const getDateText = () => {
    if (movie.media_type === "person") {
      return movie.known_for_department || "Актер";
    }

    const date = formatDate(getReleaseDate());
    if (date) {
      return `${date}`;
    }
    return "Дата неизвестна";
  };

  const getKnownFor = () => {
    if (movie.media_type !== "person" || !movie.known_for) return null;

    if (Array.isArray(movie.known_for) && movie.known_for.length > 0) {
      const items = movie.known_for
        .slice(0, 2)
        .map((item) => item.title || item.name || "Неизвестно");
      return `Известен за: ${items.join(", ")}`;
    }
    return null;
  };

  return (
    <div
      className={styles.movieCard}
      data-type={movie.media_type}
      onClick={hendleClick}
    >
      <div className={styles.posterHolder}>
        <img
          src={getImageUrl()}
          alt={getTitle()}
          className={`${styles.movieCardPoster} ${
            movie.media_type === "person" ? styles.personPoster : ""
          }`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
      <div className={styles.movieCardInfo}>
        <h3 className={styles.title}>{getTitle()}</h3>

        <div className={styles.infoRow}>
          <span className={styles.date}>{getDateText()}</span>
          <span className={styles.mediaTypeBadge}>{getMediaTypeBadge()}</span>
        </div>

        {/* Добавляем блок с жанрами */}
        {movie.media_type !== "person" && getGenresText() && (
          <div className={styles.genres}>
            <span className={styles.genreLabel}>Жанры: </span>
            <span className={styles.genreText}>{getGenresText()}</span>
            {genres.length > 2 && (
              <span className={styles.moreGenres}> +{genres.length - 2}</span>
            )}
          </div>
        )}

        {movie.media_type === "person" && (
          <div className={styles.personInfo}>
            {getKnownFor() && (
              <p className={styles.knownFor}>{getKnownFor()}</p>
            )}
          </div>
        )}
      </div>

      {getRatingBadge()}
    </div>
  );
}
