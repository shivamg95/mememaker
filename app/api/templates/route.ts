import { overlayTemplate, isDenied } from "@/lib/templates/catalog";
import { BLANKS } from "@/lib/templates/blanks";

type ImgflipResponse = {
  success: boolean;
  data?: {
    memes: Array<{
      id: string;
      name: string;
      url: string;
      width: number;
      height: number;
      box_count: number;
    }>;
  };
};

export async function GET() {
  try {
    const res = await fetch("https://api.imgflip.com/get_memes", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return Response.json({ templates: [], blanks: BLANKS, error: "unavailable" });
    }
    const json = (await res.json()) as ImgflipResponse;
    const memes = (json.data?.memes ?? []).filter((meme) => !isDenied(meme));
    return Response.json({
      templates: memes.map(overlayTemplate),
      blanks: BLANKS,
    });
  } catch {
    return Response.json({ templates: [], blanks: BLANKS, error: "offline" });
  }
}
