/* Günlüğüm 2B -> Google Gemini Interactions API için Cloudflare Worker.
   Gemini API anahtarını Cloudflare'de AI_API_KEY adıyla Secret olarak tut.
   Bu dosya web sitesine değil, Cloudflare Worker'a dağıtılmalıdır.
*/
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemini-3.8-flash";
const MAX_BODY_CHARS = 18000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "https://umutmelihakyol.com,https://www.umutmelihakyol.com")
    .split(",").map(function (value) { return value.trim(); }).filter(Boolean);
}
function makeHeaders(origin, allowed) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (origin && allowed.indexOf(origin) !== -1) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}
function respond(data, status, origin, allowed) {
  return new Response(JSON.stringify(data), { status: status, headers: makeHeaders(origin, allowed) });
}

// Gemini Interactions API, geçmişi user_input/model_output adımları olarak alır.
// Bu sürüm store:false kullanır; sohbet geçmişi tarayıcıdan her istekte tekrar gönderilir.
function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  var cleaned = [];
  input.slice(-MAX_MESSAGES).forEach(function (item) {
    if (!item || (item.role !== "user" && item.role !== "assistant")) return;
    if (typeof item.content !== "string") return;
    var content = item.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return;

    var type = item.role === "assistant" ? "model_output" : "user_input";
    var previous = cleaned[cleaned.length - 1];
    if (previous && previous.type === type) {
      if (type === "user_input") previous.content += "\n" + content;
      else previous.content[0].text += "\n" + content;
      return;
    }

    if (type === "user_input") {
      cleaned.push({ type: type, content: content });
    } else {
      cleaned.push({
        type: type,
        status: "done",
        content: [{ type: "text", text: content }]
      });
    }
  });

  // Konuşma kullanıcı mesajıyla başlamalıdır.
  while (cleaned.length && cleaned[0].type !== "user_input") cleaned.shift();
  return cleaned.length ? cleaned : null;
}

function extractAnswer(result) {
  if (result && typeof result.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }
  var steps = result && Array.isArray(result.steps) ? result.steps : [];
  for (var i = steps.length - 1; i >= 0; i -= 1) {
    var step = steps[i];
    if (!step || step.type !== "model_output" || !Array.isArray(step.content)) continue;
    var text = step.content.map(function (part) {
      return part && typeof part.text === "string" ? part.text : "";
    }).join("").trim();
    if (text) return text;
  }
  return "";
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var origin = request.headers.get("Origin") || "";
    var allowed = allowedOrigins(env);

    if (origin && allowed.indexOf(origin) === -1) {
      return respond({ error: "Bu alan adından gelen isteğe izin verilmiyor." }, 403, "", allowed);
    }
    if (request.method === "OPTIONS") {
      if (!origin || allowed.indexOf(origin) === -1) {
        return respond({ error: "Origin izni bulunamadı." }, 403, "", allowed);
      }
      return new Response(null, { status: 204, headers: makeHeaders(origin, allowed) });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return respond({ status: "ok", service: "gunlugum-2b-gemini", model: env.AI_MODEL || DEFAULT_MODEL }, 200, origin, allowed);
    }
    if (url.pathname !== "/api/chat") return respond({ error: "Endpoint bulunamadı." }, 404, origin, allowed);
    if (request.method !== "POST") return respond({ error: "Yalnızca POST isteği kabul edilir." }, 405, origin, allowed);
    if (!env.AI_API_KEY) return respond({ error: "Cloudflare Worker üzerinde AI_API_KEY Secret tanımlanmamış." }, 503, origin, allowed);

    var model = String(env.AI_MODEL || DEFAULT_MODEL).trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
      return respond({ error: "AI_MODEL geçerli bir Gemini model adı değil." }, 500, origin, allowed);
    }

    var raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) {
      return respond({ error: "İstek çok büyük. Sohbet geçmişini kısaltıp tekrar dene." }, 413, origin, allowed);
    }
    var body;
    try { body = JSON.parse(raw); } catch (_) {
      return respond({ error: "Geçersiz JSON isteği." }, 400, origin, allowed);
    }

    var input = cleanMessages(body.messages);
    if (!input) return respond({ error: "Mesaj listesi boş veya geçersiz." }, 400, origin, allowed);

    var pageTitle = body.page && typeof body.page.title === "string" ? body.page.title.slice(0, 160) : "Günlüğüm";
    var pagePath = body.page && typeof body.page.path === "string" ? body.page.path.slice(0, 240) : "/";
    var systemInstruction = [
      "Sen Günlüğüm sitesinin 2B adlı kişisel arşiv asistanısın.",
      "Kullanıcıyla Türkçe konuş; kullanıcı başka bir dil isterse o dile geç.",
      "Açık, dostça ve doğrudan yanıt ver. Bilmediğin bilgiyi uydurma; emin değilsen belirt.",
      "Kullanıcının arşivine veya site verilerine erişimin olduğunu iddia etme. Yalnızca konuşmada sağlanan bilgileri kullan.",
      "Kullanıcıdan API anahtarı, parola veya hassas hesap bilgisi isteme.",
      "Şu anda açık olan sayfa: " + pageTitle + " (" + pagePath + ")."
    ].join("\n");

    var upstream;
    try {
      upstream = await fetch(GEMINI_INTERACTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.AI_API_KEY
        },
        body: JSON.stringify({
          model: model,
          input: input,
          system_instruction: systemInstruction,
          store: false
        })
      });
    } catch (_) {
      return respond({ error: "Gemini API servisine ulaşılamadı." }, 502, origin, allowed);
    }

    var upstreamText = await upstream.text();
    var result;
    try { result = JSON.parse(upstreamText); } catch (_) { result = null; }
    if (!upstream.ok) {
      var providerMessage = result && result.error && result.error.message
        ? String(result.error.message).slice(0, 400)
        : "Gemini API hata döndürdü (" + upstream.status + ").";
      return respond({ error: providerMessage }, 502, origin, allowed);
    }

    var answer = extractAnswer(result);
    if (!answer) {
      return respond({ error: "Gemini yanıt oluşturamadı veya okunabilir metin döndürmedi." }, 502, origin, allowed);
    }
    return respond({ answer: answer }, 200, origin, allowed);
  }
};
