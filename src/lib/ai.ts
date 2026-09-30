// AI content generation service.
// Uses the Gemini API when GEMINI_API_KEY is configured on the server.
// Falls back to a deterministic, extractive/heuristic generator so the
// AI-assisted workflow remains fully demonstrable without external keys.
// The Gemini API key is NEVER exposed to the client; all calls happen here.

export type AiOutputs = {
  generatedTitle: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  article: string;
  educationalExplanation: string;
  socialPost: string;
  suggestedTags: string[];
  suggestedCategory: string;
  model: string;
};

const STOPWORDS = new Set(
  "the a an and or but of to in on for with is are was were be been being this that these those it its as at by from into over under between about which who whom whose will would can could should shall may might must not no nor so than then too very s t just don now".split(
    " ",
  ),
);

function extractiveSummary(text: string, maxSentences = 5): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
  if (sentences.length === 0) return [text.slice(0, 240)];

  const freq = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z]{3,}/g) ?? []) {
    if (STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z]{3,}/g) ?? [];
    const score =
      words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.max(words.length, 1);
    return { sentence, score, index };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxSentences).sort((a, b) => a.index - b.index);
  return top.map((t) => t.sentence);
}

function extractKeywords(text: string, max = 10): string[] {
  const freq = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
    if (STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word[0].toUpperCase() + word.slice(1));
}

function heuristicGenerate(sourceText: string, sourceTitle?: string): AiOutputs {
  const cleanText = sourceText.trim() || "No source content was supplied.";
  const summarySentences = extractiveSummary(cleanText, 4);
  const summary = summarySentences.join(" ");
  const keyPoints = extractiveSummary(cleanText, 6).map((s) => s.replace(/\s+/g, " "));
  const keywords = extractKeywords(cleanText, 10);
  const title =
    sourceTitle && sourceTitle.trim().length > 0
      ? sourceTitle.trim()
      : (keywords.slice(0, 4).join(" ") || "Polar Science Update") + ": Field Report Highlights";

  const article = [
    `${title}`,
    "",
    `${summary}`,
    "",
    "Key highlights from this work include:",
    ...keyPoints.map((p) => `- ${p}`),
    "",
    "This article is a plain-language summary prepared with AI assistance from an approved source document. It has been reviewed for accuracy before publication.",
  ].join("\n");

  const educationalExplanation = `In simple terms: ${summarySentences[0] ?? cleanText.slice(0, 200)} Scientists study this to better understand how the polar regions affect climate, oceans and life on Earth.`;

  const socialPost = `🧊 New polar science update: ${summarySentences[0]?.slice(0, 180) ?? title} #PolarScience #NCPOR #Antarctica #Arctic`;

  return {
    generatedTitle: title,
    summary: summary || cleanText.slice(0, 300),
    keyPoints: keyPoints.length ? keyPoints : [cleanText.slice(0, 200)],
    keywords: keywords.length ? keywords : ["Polar", "Science", "Research"],
    article,
    educationalExplanation,
    socialPost,
    suggestedTags: keywords.slice(0, 5),
    suggestedCategory: "Polar Research",
    model: "heuristic-extractive-v1 (offline fallback — configure GEMINI_API_KEY for LLM-based generation)",
  };
}

async function geminiGenerate(
  sourceText: string,
  sourceTitle: string | undefined,
  apiKey: string,
): Promise<AiOutputs> {
  const prompt = `You are assisting the NCPOR Polar Science Outreach Portal.
Use ONLY information present in the supplied source material. Do not invent scientific findings.
Preserve uncertainty and limitations where mentioned. Audience: students and the general public.

Source title: ${sourceTitle || "(untitled)"}
Source material:
"""
${sourceText.slice(0, 15000)}
"""

Return a JSON object with exactly these fields:
{
  "generatedTitle": string,
  "summary": string (3-5 sentences),
  "keyPoints": string[] (4-6 bullet points),
  "keywords": string[] (6-10 keywords),
  "article": string (a short public-friendly web article, 200-350 words),
  "educationalExplanation": string (a simple explanation suitable for students),
  "socialPost": string (a short social media draft under 280 characters with relevant hashtags),
  "suggestedTags": string[] (3-6 tags),
  "suggestedCategory": string (one short category label)
}
Return ONLY the JSON object, no markdown fences.`;

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini API returned no content");

  const parsed = JSON.parse(text);
  return {
    generatedTitle: parsed.generatedTitle ?? sourceTitle ?? "Polar Science Update",
    summary: parsed.summary ?? "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    article: parsed.article ?? "",
    educationalExplanation: parsed.educationalExplanation ?? "",
    socialPost: parsed.socialPost ?? "",
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
    suggestedCategory: parsed.suggestedCategory ?? "Polar Research",
    model,
  };
}

export async function generateAiContent(
  sourceText: string,
  sourceTitle?: string,
): Promise<AiOutputs> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      return await geminiGenerate(sourceText, sourceTitle, apiKey);
    } catch (err) {
      console.error("Gemini generation failed, falling back to heuristic generator:", err);
      return heuristicGenerate(sourceText, sourceTitle);
    }
  }
  return heuristicGenerate(sourceText, sourceTitle);
}
