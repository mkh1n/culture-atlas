export const getImageUrl = (
  path: string | null | undefined,
  size: string = "w500",
  isPerson: boolean = false
): string => {
  // Проверяем все возможные случаи отсутствия изображения
  const imageUnavailable =
    !path || // null, undefined, empty string
    path === "N/A" ||
    path === "null" ||
    path === "";

  if (imageUnavailable) {
    // Определяем placeholder на основе типа
    if (isPerson) {
      // Для персон можно использовать общий placeholder
      return "/person-placeholder.jpg";
    }
    return "/poster-placeholder.jpg";
  }

  // Если изображение доступно
  return `https://proxy-tmdb-weld.vercel.app/api/image/${size}/${path}`;
};

// Вспомогательная функция для получения года из даты
export const getYearFromDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).getFullYear().toString();
  } catch {
    return "";
  }
};
