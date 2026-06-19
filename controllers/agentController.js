const axios = require('axios');

// System prompts kept server-side so the client can only pick a mode key,
// never inject its own system instructions.
const SYSTEM_PROMPTS = {
  ops: "You are GaonConnect ka Operations AI Agent. GaonConnect ek Ola/Uber jaisi rural India ki app hai — Auto, Tractor, JCB, Ambulance, Goods, Wedding Car — Rewa MP mein. Hinglish mein short practical replies do. Bookings, drivers, operations ke liye help karo.",
  mkt: "You are GaonConnect ka Marketing Agent. Rural India ke gaon walon ke liye Ola/Uber type app ka marketing karna hai. WhatsApp, Instagram, village hoardings ke liye Hindi/Hinglish mein catchy content banao. Orange theme brand hai.",
  drv: "You are GaonConnect ka Driver Relations specialist. Rural tractor drivers, auto drivers, JCB operators ko onboard, train, motivate karo. Simple Hinglish mein baat karo unhe samjhao.",
  kis: "You are GaonConnect ka Kisan Seva expert. Kisano ko transport, mandi, fasal bechne, agri transport mein help karo. Simple Hindi/Hinglish mein practical advice do.",
  sup: "You are GaonConnect ka Customer Support Agent. Rural India ke users ke liye Hindi/Hinglish mein friendly support do. Booking problems, driver issues, payment complaints handle karo.",
};

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * POST /api/agent/chat
 */
exports.chat = async (req, res) => {
  const { message, mode } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message required hai.' });
  }

  const system = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.ops;

  try {
    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [{ role: 'user', parts: [{ text: message.trim() }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: 700 },
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Kuch error aaya. Dobara try karo.';
    return res.json({ success: true, reply });
  } catch (error) {
    console.error('❌ Agent chat error:', error.response?.data || error.message);
    return res.status(502).json({ success: false, message: 'AI Agent abhi available nahi hai. Dobara try karo.' });
  }
};
