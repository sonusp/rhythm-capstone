/**
 * Generates an audio stream from text using Deepgram's Aura TTS.
 * Returns a Blob URL that can be played natively in an <audio> element.
 */
export const generateAuraVoice = async (text) => {
  try {
    // 1. Fetch short-lived token from our serverless proxy
    const tokenRes = await fetch('/api/deepgram-token');
    if (!tokenRes.ok) {
      throw new Error(`Failed to get Deepgram token from backend: ${tokenRes.status}`);
    }
    
    const tokenData = await tokenRes.json();
    const tempToken = tokenData.key;

    if (!tempToken) {
      throw new Error("Received empty Deepgram token from backend.");
    }

    // 2. We use aura-asteria-en for a soothing, natural female voice.
    const url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${tempToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Deepgram TTS Error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    // Create a local URL for the <audio> tag to play
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("Failed to generate Aura voice:", error);
    throw error;
  }
};
