export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICE_BY_VARIANT = {
  female: "marin",
  male: "cedar",
};

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") === "male" ? "male" : "female";
  const voice = VOICE_BY_VARIANT[variant];
  const sdp = await request.text();

  if (!sdp) {
    return Response.json({ error: "Missing WebRTC SDP offer." }, { status: 400 });
  }

  const voiceStyle =
    variant === "male"
      ? "Mów naturalnym, spokojnym polskim męskim głosem. Brzmienie ma być ciepłe, premium, wyraźne i konwersacyjne."
      : "Mów naturalnym, spokojnym polskim kobiecym głosem. Brzmienie ma być ciepłe, premium, wyraźne i konwersacyjne.";

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    output_modalities: ["audio"],
    audio: {
      input: {
        turn_detection: {
          type: "semantic_vad",
        },
      },
      output: {
        voice,
      },
    },
    instructions: `${voiceStyle}\nRozmawiaj po polsku, chyba że użytkownik poprosi o inny język. Odpowiadaj naturalnie i bez sztucznego akcentu angielskiego. Mów z umiarkowanym tempem, krótkimi naturalnymi pauzami i subtelną ekspresją emocjonalną. Nie opisuj swoich gestów ani animacji.`,
  };

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("OpenAI Realtime session error", response.status, body);
      return Response.json(
        { error: "OpenAI Realtime session failed", status: response.status, detail: body },
        { status: response.status }
      );
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("OpenAI Realtime connection error", error);
    return Response.json(
      { error: "Could not connect to OpenAI Realtime." },
      { status: 500 }
    );
  }
}
