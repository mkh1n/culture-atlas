export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${query}&page=${page}&include_adult=false&language=ru-RU`,
    {
      headers: {
        authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
      next: { revalidate: 3600 },
    }
  );

  const data = await res.json();
  return Response.json(data);
}