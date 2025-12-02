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
      if (movie.gender === 2 || movie.gender === 0) return "/male-placeholder.png";
      if (movie.gender === 1) return "/female-placeholder.png";
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
    return <div className={`${styles.ratingBadge} ${styles[badgeColor]}`}>{rating}</div>;
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
      const items = movie.known_for.slice(0, 2).map(item => 
        item.title || item.name || "Неизвестно"
      );
      return `Известен за: ${items.join(", ")}`;
    }
    return null;
  };

  return (
    <div className={styles.movieCard} data-type={movie.media_type}>
      <div className={styles.posterHolder}>
        <img
          src={getImageUrl()}
          alt={getTitle()}
          className={`${styles.movieCardPoster} ${movie.media_type === "person" ? styles.personPoster : ""}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
      <div className={styles.movieCardInfo}>
        <h3 className={styles.title}>{getTitle()} </h3>
        
        <div className={styles.infoRow}>
          <span className={styles.date}>{getDateText()}</span>
          <span className={styles.mediaTypeBadge}>{getMediaTypeBadge()}</span>
        </div>

        {movie.media_type === "person" && (
          <div className={styles.personInfo}>
            {getKnownFor() && (
              <p className={styles.knownFor}>{getKnownFor()}</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}