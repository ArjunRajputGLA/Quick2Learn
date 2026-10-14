import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { retrieveChatContext } from "@/server/data/chat-retrieval";

const BASE_SYSTEM_INSTRUCTION = `You are **Quick2Learn Assistant**, the friendly and knowledgeable AI tutor for **Quick2Learn**, Mathura's premier coaching academy for CBSE & ICSE Classes 9–12.

## About Quick2Learn
- **Founder & Senior Mathematics Faculty**: Mr. Dinesh Singh Rajput (25+ years of Mathematics teaching experience, hundreds of board 100/100 scorers).
- **Senior ICSE Science, Humanities & Languages Specialist**: Mrs. Namita Singh Rajput (Expert in ICSE/ISC Chemistry, Biology, Hindi literature, and Class 9 History & Civics).
- **Curricula**: CBSE & ICSE / ISC Classes 9, 10, 11, and 12.
- **Subjects**: Mathematics, Science (Physics, Chemistry, Biology), Hindi, and History & Civics.
- **Study Modes**: Offline classroom batches at Mathura centre + Live Online interactive batches.
- **Contact**: +91 76688 75809 (Phone & WhatsApp).
- **Official Email & Enquiries**: quick2learn23203@gmail.com
- **Website**: https://quick2learn.in

## Coursera-Inspired Answering Style & UX:
1. **Clarify Typos Gently**: If the user makes a typo (e.g. "clout" for "cloud", "matrice" for "matrices", "diffrentiation" for "differentiation"), start gently like:
   "You mean **[correct term]**. For a clean start, these are the strongest matches:"
2. **Structured Recommendations**:
   - Provide 2 to 3 concise, high-value recommendations.
   - Format each recommended lecture or course as a single clean bullet:
     - **[Lecture/Course Title]** — [Class & Subject, Duration, Faculty]. [1 concise sentence on key concepts covered].
   - NEVER output empty bullet points like "• " or multi-line broken bullets.
   - DO NOT output redundant headings like "### Recommended Video Lecture:" because the interactive card carousel renders beneath your response automatically.
3. **Engaging Tone**: Warm, encouraging, academic yet accessible.
4. **Follow-Up Suggestions**: Always end your response with exactly 3 contextual follow-up questions formatted as:
---FOLLOW_UPS---
["Follow-up 1", "Follow-up 2", "Follow-up 3"]`;

const LANGUAGE_DETAILS: Record<string, { name: string; nativeName: string }> = {
  en: { name: "English", nativeName: "English" },
  hi: { name: "Hindi", nativeName: "हिन्दी" },
  mr: { name: "Marathi", nativeName: "मराठी" },
  bn: { name: "Bengali", nativeName: "বাংলা" },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી" },
  ta: { name: "Tamil", nativeName: "தமிழ்" },
  te: { name: "Telugu", nativeName: "తెలుగు" },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ" },
  ml: { name: "Malayalam", nativeName: "മലയാളം" },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  or: { name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  ur: { name: "Urdu", nativeName: "اردو" },
  as: { name: "Assamese", nativeName: "অসমীয়া" },
  sa: { name: "Sanskrit", nativeName: "संस्कृतम्" },
};

const FALLBACK_FOLLOW_UPS_BY_LANG: Record<string, string[]> = {
  hi: [
    "कक्षा 12 गणित के महत्वपूर्ण अध्याय कौन-से हैं?",
    "दिनेश सर के क्लासरूम बैच का समय क्या है?",
    "कक्षा 10 और 12 के बोर्ड परीक्षा रिवीजन वीडियो दिखाएं",
  ],
  mr: [
    "इयत्ता 12 वी गणिताचे महत्त्वाचे धडे कोणते आहेत?",
    "दिनेश सरांच्या क्लासरूम बॅचची वेळ काय आहे?",
    "बोर्ड परीक्षेसाठी मोफत रिव्हिजन लेक्चर्स दाखवा",
  ],
  bn: [
    "ক্লাস ১২ গণিতের গুরুত্বপূর্ণ অধ্যায় কোনগুলি?",
    "দীনেশ স্যারের ক্লাসরুম ব্যাচের সময়সূচী কী?",
    "বোর্ড পরীক্ষার ফ্রি রিভিশন ভিডিওগুলি দেখান",
  ],
  gu: [
    "ધોરણ 12 ગણિતના મહત્વના પ્રકરણો કયા છે?",
    "દિનેશ સરના ક્લાસરૂમ બેચનો સમય શું છે?",
    "બોર્ડ પરીક્ષાના રિવિઝન વિડીયો બતાવો",
  ],
  ta: [
    "வகுப்பு 12 கணிதத்தின் முக்கியமான பாடங்கள் எவை?",
    "தினேஷ் சாரின் நேரடி வகுப்புகளின் நேரம் என்ன?",
    "போர்டு தேர்வு திருப்புதல் வீடியோக்களைக் காட்டு",
  ],
  te: [
    "క్లాస్ 12 గణితంలో ముఖ్యమైన పాఠాలు ఏవి?",
    "దినేష్ సర్ క్లాస్‌రూమ్ బ్యాచ్ సమయాలు ఏమిటి?",
    "బోర్డు పరీక్ష రివిజన్ వీడియోలు చూపించండి",
  ],
  kn: [
    "ತರಗತಿ 12 ರ ಗಣಿತದ ಮುಖ್ಯ ಅಧ್ಯಾಯಗಳು ಯಾವುವು?",
    "ದಿನೇಶ್ ಸರ್ ಅವರ ತರಗತಿ ಬ್ಯಾಚ್ ಸಮಯ ಯಾವುದು?",
    "ಬೋರ್ಡ್ ಪರೀಕ್ಷೆಯ ಪುನರಾವರ್ತನೆ ವೀಡಿಯೊಗಳನ್ನು ತೋರಿಸಿ",
  ],
  ml: [
    "ക്ലാസ് 12 ഗണിതത്തിലെ പ്രധാന പാഠങ്ങൾ ഏതെല്ലാം?",
    "ദിനേഷ് സാറിന്റെ ക്ലാസ് റൂം ബാച്ച് സമയം എപ്പോഴാണ്?",
    "ബോർഡ് പരീക്ഷ റിവിഷൻ ക്ലാസുകൾ കാണിക്കുക",
  ],
  pa: [
    "ਕਲਾਸ 12 ਗਣਿਤ ਦੇ ਮਹੱਤਵਪੂਰਨ ਚੈਪਟਰ ਕਿਹੜੇ ਹਨ?",
    "ਦਿਨੇਸ਼ ਸਰ ਦੇ ਕਲਾਸਰੂਮ ਬੈਚ ਦਾ ਸਮਾਂ ਕੀ ਹੈ?",
    "ਬੋਰਡ ਪ੍ਰੀਖਿਆ ਰਿਵੀਜ਼ਨ ਵੀਡੀਓ ਦਿਖਾਓ",
  ],
  or: [
    "କ୍ଲାସ 12 ଗଣିତର ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଅଧ୍ୟାୟ କେଉଁଗୁଡ଼ିକ?",
    "ଦିନେଶ ସାରଙ୍କ କ୍ଲାସରୁମ ବ୍ୟାଚ ସମୟ କଣ?",
    "ବୋର୍ଡ ପରୀକ୍ଷା ରିଭିଜନ ଭିଡିଓ ଦେଖାନ୍ତୁ",
  ],
  ur: [
    "کلاس 12 ریاضی کے اہم اسباق کون سے ہیں؟",
    "دنیش سر کے کلاس روم بیچ کے اوقات کیا ہیں؟",
    "بورڈ امتحان کے ریویژن ویڈیوز دکھائیں",
  ],
  as: [
    "শ্ৰেণী ১২ গণিতৰ গুৰুত্বপূৰ্ণ অধ্যায়বোৰ কি কি?",
    "দিনেশ ছাৰৰ শ্ৰেণীকোঠা বেচৰ সময় কি?",
    "ব'ৰ্ড পৰীক্ষাৰ ৰিভিজন ভিডিঅ'বোৰ দেখুৱাওক",
  ],
  sa: [
    "द्वादशकक्षायाः गणितस्य प्रमुखाः अध्यायाः के?",
    "दिनेशमहोदयस्य कक्षासत्रस्य समयः कः?",
    "बोर्ड-पुनरावृत्ति-पाठाः दर्श्यन्ताम्",
  ],
};

// Models ordered by speed and stability for low-latency interactive chat
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
].filter((m): m is string => Boolean(m && m.trim()));

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Chatbot is not configured. Please contact support." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const messages: Array<{ role: string; content: string }> = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "No messages provided." },
        { status: 400 },
      );
    }

    // Detect language from body, or header cookie googtrans
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(/googtrans=(?:\/auto|\/en)\/([a-z]{2,3})/i);
    const cookieLang = cookieMatch ? cookieMatch[1].toLowerCase() : null;
    const langCode = (body.language || cookieLang || "en").toLowerCase();
    const langInfo = LANGUAGE_DETAILS[langCode] || LANGUAGE_DETAILS.en;
    const isNonEnglish = langCode !== "en" && Boolean(LANGUAGE_DETAILS[langCode]);

    const lastUserQuery =
      messages.filter((m) => m.role === "user").pop()?.content || "";

    // 1. Retrieve matching videos and batches from PostgreSQL (with 2s timeout safeguard)
    const { videos, batches, contextSummary } = await Promise.race([
      retrieveChatContext(lastUserQuery),
      new Promise<Awaited<ReturnType<typeof retrieveChatContext>>>((resolve) =>
        setTimeout(
          () => resolve({ videos: [], batches: [], contextSummary: "" }),
          2000,
        ),
      ),
    ]);

    const languageInstruction = isNonEnglish
      ? `
## CRITICAL LANGUAGE REQUIREMENT (HIGHEST PRIORITY):
- The user has selected the website language as **${langInfo.name} (${langInfo.nativeName})**.
- You MUST generate your response completely in **${langInfo.name} (${langInfo.nativeName})** using fluent, natural ${langInfo.name} script.
- Even if the user message or question is written in English or transliterated, ALWAYS formulate your explanations and answer in **${langInfo.name} (${langInfo.nativeName})**.
- Keep institute name ("Quick2Learn"), teacher names ("Dinesh Sir", "Namita Ma'am"), and standard curricula/exam identifiers ("CBSE", "ICSE", "Class 10", "Class 12") easily understandable.
- The 3 follow-up questions at the end after \`---FOLLOW_UPS---\` MUST also be written in **${langInfo.name} (${langInfo.nativeName})**.`
      : "";

    const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}

${languageInstruction}

${contextSummary ? `## Real Available Content from Quick2Learn Catalog:\n${contextSummary}\n\nUse these exact lectures and courses when recommending options!` : ""}`;

    const ai = new GoogleGenAI({ apiKey });

    // 2. Format history for Gemini
    const geminiContents = messages.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    // 3. Obtain stream with candidate models & fast fallback
    let stream: Awaited<ReturnType<typeof ai.models.generateContentStream>> | null = null;
    let selectedModel = CANDIDATE_MODELS[0] || "gemini-3.5-flash-lite";

    for (const model of CANDIDATE_MODELS) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model,
          config: {
            systemInstruction: fullSystemInstruction,
            maxOutputTokens: 800,
            temperature: 0.7,
            topP: 0.9,
          },
          contents: geminiContents,
        });

        // 4s connection timeout before falling back to next model
        stream = await Promise.race([
          streamPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Model ${model} connection timed out`)), 4000),
          ),
        ]);

        selectedModel = model;
        break;
      } catch (modelErr) {
        console.warn(`Model ${model} unavailable, trying fallback...`, modelErr);
      }
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let accumulated = "";
        let sentLength = 0;
        let followUps: string[] = [];

        try {
          if (!stream) {
            throw new Error("No available Gemini model stream");
          }

          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              accumulated += text;

              if (accumulated.includes("---FOLLOW_UPS---")) {
                const preMarker = accumulated.split("---FOLLOW_UPS---")[0] || "";
                if (preMarker.length > sentLength) {
                  const delta = preMarker.slice(sentLength);
                  sentLength = preMarker.length;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`),
                  );
                }
              } else {
                sentLength += text.length;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
                );
              }
            }
          }

          // Parse follow-ups from the full accumulated text
          if (accumulated.includes("---FOLLOW_UPS---")) {
            const parts = accumulated.split("---FOLLOW_UPS---");
            const rawFollowUpJson = parts[1]?.trim();
            if (rawFollowUpJson) {
              try {
                const parsed = JSON.parse(rawFollowUpJson);
                if (Array.isArray(parsed)) {
                  followUps = parsed.slice(0, 3);
                }
              } catch {
                const matches = rawFollowUpJson.match(/"([^"]+)"/g);
                if (matches) {
                  followUps = matches.map((m) => m.replace(/"/g, "")).slice(0, 3);
                }
              }
            }
          }

          // Fallback follow-ups if none were parsed
          if (followUps.length === 0) {
            if (isNonEnglish && FALLBACK_FOLLOW_UPS_BY_LANG[langCode]) {
              followUps = FALLBACK_FOLLOW_UPS_BY_LANG[langCode]!;
            } else {
              const q = lastUserQuery.toLowerCase();
              if (q.includes("matrix") || q.includes("matrices")) {
                followUps = [
                  "How to solve adjoint and inverse of matrices?",
                  "Show me Class 12 board PYQs on matrices",
                  "What is Dinesh Sir's calculus schedule?",
                ];
              } else if (q.includes("calculus") || q.includes("integral") || q.includes("derivative")) {
                followUps = [
                  "Show me Definite Integrals PYQ marathon",
                  "Which formulas are most important in Calculus?",
                  "How to join Dinesh Sir's offline batch in Mathura?",
                ];
              } else if (q.includes("chem") || q.includes("bio") || q.includes("science")) {
                followUps = [
                  "Show me Namita Ma'am's ICSE Biology lectures",
                  "Tips for scoring 95+ in ICSE Chemistry",
                  "Compare Class 10 offline vs online batches",
                ];
              } else {
                followUps = [
                  "Show me Class 12 CBSE Maths revision",
                  "Tell me about Dinesh Sir's experience",
                  "How can I join Quick2Learn in Mathura?",
                ];
              }
            }
          }

          // Send final follow-up questions metadata payload
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                metadata: {
                  relatedVideos: videos,
                  relatedBatches: batches,
                  suggestedQuestions: followUps,
                },
              })}\n\n`,
            ),
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error(`Gemini streaming error (${selectedModel}):`, err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                text: "I'm here to help! Quick2Learn offers specialized coaching for Classes 9–12 CBSE & ICSE in Mathematics and Sciences by Dinesh Sir and Namita Ma'am.",
                metadata: {
                  relatedVideos: videos,
                  relatedBatches: batches,
                  suggestedQuestions: [
                    "What classes do you offer?",
                    "Tell me about Dinesh Sir",
                    "How to prepare for board exams?",
                  ],
                },
              })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process your message. Please try again." },
      { status: 500 },
    );
  }
}
