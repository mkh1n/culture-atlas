import styles from "./MoviesGrid.module.css";
import MovieCard from "../MovieCard/MovieCard";
import { TMDbMovie } from "@/types/movie";

export default function MoviesGrid({ movies }) {
  return (
    <div className={styles.moviesGrid}>
      {movies?.map((movie: TMDbMovie) => (
        <MovieCard movie={movie} key={movie.id} />
      ))}
    </div>
  );
}
