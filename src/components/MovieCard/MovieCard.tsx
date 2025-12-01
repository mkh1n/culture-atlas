import { TMDbMovie } from "@/types/movie";
import React from "react";

import styles from "./MovieCard.module.css";

export default function MovieCard({ movie }) {
  console.log(movie)
  return (
    <div key={movie.id} className={styles.movieCard}>
      <img
        src={movie.poster_path !== "N/A" ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : "/placeholder.jpg"}
        alt={movie.title}
        className={styles.movieCardPoster}
      />
      <div className={styles.movieCardInfo}>
        <h3>{movie.title}</h3>
      </div>
      <p>{movie.release_date}</p>
    </div>
  );
}
