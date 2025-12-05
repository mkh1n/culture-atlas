export interface MediaDetails {
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv';
  first_air_date?: string;
  release_date?: string;
}

export interface SearchLink {
  title: string;
  url: string;
  engine: 'google' | 'yandex' | 'rutube';
  type: 'search' | 'direct';
}

export function generateSearchLinks(details: MediaDetails): SearchLink[] {
  // Определяем название
  const title = details.title || details.name || '';
  if (!title) return [];
  
  // Определяем тип контента
  let mediaType: 'movie' | 'tv';
  
  if (details.media_type) {
    mediaType = details.media_type;
  } else if (details.first_air_date) {
    mediaType = 'tv'; // Есть дата первой серии - сериал
  } else {
    mediaType = 'movie'; // По умолчанию фильм
  }
  
  const isSeries = mediaType === 'tv';
  const mediaTypeText = isSeries ? 'сериал' : 'фильм';
  const searchQuery = `${title} ${mediaTypeText} смотреть бесплатно`;
  
  // Формируем ссылки
  return [
        {
      title: `Смотреть "${title}" на Rutube`,
      url: `https://rutube.ru/search/?query=${encodeURIComponent(mediaTypeText + ' ' + title)}`,
      engine: 'rutube',
      type: 'direct'
    },
    {
      title: `Найти "${title}" в Яндексе`,
      url: `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}&lr=213`,
      engine: 'yandex',
      type: 'search'
    },
    {
      title: `Найти "${title}" в Google`,
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      engine: 'google',
      type: 'search'
    },
    

  ];
}