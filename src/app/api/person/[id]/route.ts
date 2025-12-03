import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const appendToResponse = searchParams.get("append") || "combined_credits";
  
  const proxyBase = "https://tmdb-proxy-orpin.vercel.app";

  try {
    const url = `${proxyBase}/person/${id}?append_to_response=${appendToResponse}&language=ru-RU`;
    
    console.log("Fetching person details:", url);
    
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TMDB_BEARER_TOKEN}`
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("TMDB API error:", errorText);
      throw new Error(`Failed to fetch person details: ${res.status}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch person details",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}