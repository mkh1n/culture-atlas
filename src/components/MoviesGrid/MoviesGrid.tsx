import styles from "./MoviesGrid.module.css";
import MovieCard from "../MovieCard/MovieCard";
import { TMDBMediaItem } from "@/types/movie";

interface MoviesGridProps {
  movies: TMDBMediaItem[];
}

export default function MoviesGrid({ movies }: MoviesGridProps) {
  if (!movies || movies.length === 0) {
    return (
      <div className={styles.noResults}>
        Ничего не найдено
      </div>
    );
  }

  return (
    <div className={styles.moviesGrid}>
      {movies.map((movie: TMDBMediaItem) => (
        <MovieCard 
          movie={movie} 
          key={`${movie.media_type}-${movie.id}`} 
        />
      ))}
    </div>
  );
}