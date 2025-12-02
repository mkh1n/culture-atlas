import React, { useState } from "react";
import { TMDBMediaItem } from "@/types/movie";
import styles from "./MovieCard.module.css";

interface MovieCardProps {
  movie: TMDBMediaItem;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

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
    const hasPoster = path && path !== "N/A" && path !== null && !imageError;

    return hasPoster
      ? `https://proxy-tmdb-weld.vercel.app/api/image/w500/${path}`
      : "/poster-placeholder.jpg";
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
    if (movie.media_type !== "person") {
      const rating = movie.vote_average.toFixed(1);
      let badgeColor = "gold";
      
      if (+rating < 7) {
        badgeColor = "gray";
      } else if (+rating < 8.2) {
        badgeColor = "green";
      }
      return <div className={`${styles.ratingBadge} ${styles[badgeColor]}`}>{rating}</div>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Дата неизвестна";
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.movieCard} data-type={movie.media_type}>
      <div className={styles.posterHolder}>
        {getRatingBadge()}
        <img
          src={getImageUrl()}
          alt={getTitle()}
          className={styles.movieCardPoster}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
      <div className={styles.movieCardInfo}>
        <h3 className={styles.title}>{getTitle()}</h3>

        {movie.media_type === "person" ? (
          <div className={styles.personInfo}>
            <p className={styles.department}>{movie.known_for_department}</p>
            {movie.known_for && movie.known_for.length > 0 && (
              <p className={styles.knownFor}>
                Известен за:{" "}
                {movie.known_for[0].title || movie.known_for[0].name}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.mediaInfo}>
            <p className={styles.date}>
              {formatDate(getReleaseDate())}, {movie.genre_ids}
            </p>
                  <div className={styles.mediaTypeBadge}>{getMediaTypeBadge()}</div>

            {/* {movie.overview && (
              <p className={styles.overview}>
                {movie.overview.substring(0, 100)}...
              </p>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
}
