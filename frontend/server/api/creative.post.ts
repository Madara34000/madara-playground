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

  if (provider === "google") {
    return await handleGoogleGemini(config.googleAiApiKey, inputs, botId);
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

async function handleGoogleGemini(apiKey: string, inputs: Record<string, string>, botId: string) {
  if (!apiKey) {
    return {
      message: "Google AI API key not configured. Set GOOGLE_AI_API_KEY in your environment.",
      url: null,
    };
  }

  try {
    // Build the prompt based on bot type
    let imagePrompt = inputs.prompt;
    if (inputs.style) {
      imagePrompt += `, style: ${inputs.style}`;
    }
    if (inputs.couleurs) {
      imagePrompt += `, colors: ${inputs.couleurs}`;
    }
    if (inputs.format) {
      imagePrompt += `, format: ${inputs.format}`;
    }
    if (inputs.type) {
      imagePrompt += `, type: ${inputs.type}`;
    }

    // Use Gemini 2.0 Flash with image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate an image: ${imagePrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { message: `Google Gemini error: ${errText}`, url: null };
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          // Return as base64 data URL
          const mimeType = part.inlineData.mimeType || "image/png";
          const base64 = part.inlineData.data;
          return {
            message: "Image generated successfully via Google Gemini",
            url: `data:${mimeType};base64,${base64}`,
          };
        }
      }
      // If no image but text response
      const textParts = parts.filter((p: any) => p.text);
      if (textParts.length > 0) {
        return {
          message: textParts.map((p: any) => p.text).join("\n"),
          url: null,
        };
      }
    }

    return {
      message: "No image generated. Try a more descriptive prompt.",
      url: null,
    };
  } catch (err: any) {
    return { message: `Google Gemini error: ${err.message}`, url: null };
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
