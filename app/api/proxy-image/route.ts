const ALLOWED_HOSTS = new Set([
  "i.imgflip.com",
  "imgflip.com",
  "api.imgflip.com",
  "i.imgur.com",
  "imgur.com",
  "i.redd.it",
  "preview.redd.it",
  "pbs.twimg.com",
  "media.tenor.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:") {
    return new Response("HTTPS only", { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Host not allowed", { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "Accept-Encoding": "identity",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) {
      return new Response("Fetch failed", { status: 502 });
    }

    const finalUrl = new URL(upstream.url);
    if (!ALLOWED_HOSTS.has(finalUrl.hostname)) {
      return new Response("Redirect host not allowed", { status: 400 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/") && contentType !== "application/octet-stream") {
      return new Response("Not an image", { status: 400 });
    }

    const buffer = await upstream.arrayBuffer();
    const expected = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(expected) && expected > 0 && buffer.byteLength < expected) {
      return new Response("Incomplete image", { status: 502 });
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType.startsWith("image/") ? contentType : "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}
