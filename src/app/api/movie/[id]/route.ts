import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const appendToResponse =
    searchParams.get("append") || "credits,videos,similar";

  const proxyBase = "https://tmdb-proxy-orpin.vercel.app";

  try {
    const url = `${proxyBase}/movie/${id}?append_to_response=${appendToResponse}&language=ru-RU`;

    console.log("Fetching movie details:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("TMDB API error:", errorText);
      throw new Error(`Failed to fetch movie details: ${res.status}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch movie details",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
