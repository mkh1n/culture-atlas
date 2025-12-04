import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get("id");

  const proxyBase = "https://tmdb-proxy-orpin.vercel.app";

  try {
    let url: string;

    if (genreId) {
      // Фильмы/сериалы по жанру
      const page = searchParams.get("page") || "1";
      const sortBy = searchParams.get("sort_by") || "popularity.desc";

      url = `${proxyBase}/discover/${type}?with_genres=${genreId}&page=${page}&sort_by=${sortBy}&language=ru-RU`;
    } else {
      // Список всех жанров
      url = `${proxyBase}/genre/${type}/list?language=ru-RU`;
    }

    console.log("Fetching genre data:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
      },
      next: { revalidate: 86400 }, // Кэш на 24 часа для жанров
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("TMDB API error:", errorText);
      throw new Error(`Failed to fetch genre data: ${res.status}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch genre data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
