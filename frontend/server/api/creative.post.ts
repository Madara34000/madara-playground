export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { botId, provider, inputs } = body;

  if (!botId || !provider || !inputs) {
    throw createError({ statusCode: 400, message: "Missing required fields" });
  }

  if (provider === "higgsfield") {
    return await handleHiggsfield(config.higgsFieldApiKey, inputs);
  }

  if (provider === "banana") {
    return await handleBanana(config.bananaApiKey, inputs);
  }

  throw createError({ statusCode: 400, message: "Unknown provider" });
});

async function handleHiggsfield(apiKey: string, inputs: Record<string, string>) {
  if (!apiKey) {
    return {
      message: "Higgsfield API key not configured. Set HIGGSFIELD_API_KEY in your environment.",
      url: null,
    };
  }

  try {
    const response = await fetch("https://api.higgsfield.ai/v1/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: inputs.prompt,
        style: inputs.style || "cinematic",
        duration: parseInt(inputs.duree) || 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { message: `Higgsfield error: ${errText}`, url: null };
    }

    const data = await response.json();
    return {
      message: "Video generated successfully",
      url: data.url || data.output_url || data.result?.url,
    };
  } catch (err: any) {
    return { message: `Higgsfield error: ${err.message}`, url: null };
  }
}

async function handleBanana(apiKey: string, inputs: Record<string, string>) {
  if (!apiKey) {
    return {
      message: "Banana API key not configured. Set BANANA_API_KEY in your environment.",
      url: null,
    };
  }

  try {
    const response = await fetch("https://api.banana.dev/v1/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: inputs.prompt,
        style: inputs.style || inputs.couleurs || "modern",
        format: inputs.format || inputs.type || "1080x1080",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { message: `Banana error: ${errText}`, url: null };
    }

    const data = await response.json();
    return {
      message: "Image generated successfully",
      url: data.url || data.output_url || data.result?.url,
    };
  } catch (err: any) {
    return { message: `Banana error: ${err.message}`, url: null };
  }
}
