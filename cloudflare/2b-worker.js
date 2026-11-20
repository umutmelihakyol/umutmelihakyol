/* Cloudflare Worker: Gunlugum 2B secure AI proxy.
   Keep AI_API_KEY in Cloudflare Secrets. Never place it in website files. */
const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
const MAX_BODY_CHARS = 14000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "https://umutmelihakyol.com,https://www.umutmelihakyol.com")
    .split(",").map(function (value) { return value.trim(); }).filter(Boolean);
}
function makeHeaders(origin, allowed) {
  var headers = { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "Vary":"Origin" };
  if (origin && allowed.indexOf(origin) !== -1) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}
function respond(data, status, origin, allowed) {
  return new Response(JSON.stringify(data), { status:status, headers:makeHeaders(origin, allowed) });
}
function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  var cleaned = [];
  input.slice(-MAX_MESSAGES).forEach(function (item) {
    if (!item || (item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string") return;
    var content = item.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return;
    cleaned.push({ role:item.role, content:content });
  });
  return cleaned.length ? cleaned : null;
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var origin = request.headers.get("Origin") || "";
    var allowed = allowedOrigins(env);

    if (origin && allowed.indexOf(origin) === -1) return respond({ error:"Bu alan adından gelen isteğe izin verilmiyor." }, 403, "", allowed);

    if (request.method === "OPTIONS") {
      if (!origin || allowed.indexOf(origin) === -1) return respond({ error:"Origin izni bulunamadı." }, 403, "", allowed);
      return new Response(null, { status:204, headers:makeHeaders(origin, allowed) });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return respond({ status:"ok", service:"gunlugum-2b" }, 200, origin, allowed);
    }
    if (url.pathname !== "/api/chat") return respond({ error:"Endpoint bulunamadı." }, 404, origin, allowed);
    if (request.method !== "POST") return respond({ error:"Yalnızca POST isteği kabul edilir." }, 405, origin, allowed);
    if (!env.AI_API_KEY) return respond({ error:"Worker üzerinde AI_API_KEY secret tanımlanmamış." }, 503, origin, allowed);
    if (!env.AI_MODEL) return respond({ error:"Worker üzerinde AI_MODEL değişkeni tanımlanmamış." }, 503, origin, allowed);

    var raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return respond({ error:"İstek çok büyük. Sohbet geçmişini kısaltıp tekrar dene." }, 413, origin, allowed);
    var body;
    try { body = JSON.parse(raw); } catch (_) { return respond({ error:"Geçersiz JSON isteği." }, 400, origin, allowed); }

    var messages = cleanMessages(body.messages);
    if (!messages) return respond({ error:"Mesaj listesi boş veya geçersiz." }, 400, origin, allowed);

    var pageTitle = body.page && typeof body.page.title === "string" ? body.page.title.slice(0,160) : "Günlüğüm";
    var pagePath = body.page && typeof body.page.path === "string" ? body.page.path.slice(0,240) : "/";
    var systemPrompt = [
      "Sen Günlüğüm sitesinin 2B adlı kişisel arşiv asistanısın.",
      "Kullanıcıyla Türkçe konuş; kullanıcı başka dil isterse o dile geç.",
      "Açık ve doğrudan yanıt ver. Bilmediğin bilgiyi uydurma; emin değilsen belirt.",
      "Kullanıcının arşivine veya site verilerine erişimin olduğunu iddia etme. Yalnızca konuşmada sağlanan bilgileri kullan.",
      "Kullanıcıdan API anahtarı, parola veya hassas hesap bilgisi isteme.",
      "Şu an açık olan sayfa: " + pageTitle + " (" + pagePath + ")."
    ].join("\n");

    var apiUrl = String(env.AI_API_URL || DEFAULT_API_URL);
    var parsedUrl;
    try { parsedUrl = new URL(apiUrl); } catch (_) { return respond({ error:"AI_API_URL geçerli bir URL değil." }, 500, origin, allowed); }
    if (parsedUrl.protocol !== "https:") return respond({ error:"AI_API_URL HTTPS kullanmalı." }, 500, origin, allowed);

    var upstream;
    try {
      upstream = await fetch(parsedUrl.href, {
        method:"POST",
        headers:{ "Authorization":"Bearer " + env.AI_API_KEY, "Content-Type":"application/json" },
        body:JSON.stringify({
          model:env.AI_MODEL,
          messages:[{ role:"system", content:systemPrompt }].concat(messages),
          temperature:0.7,
          max_tokens:900
        })
      });
    } catch (_) {
      return respond({ error:"Yapay zekâ sağlayıcısına ulaşılamadı." }, 502, origin, allowed);
    }

    var upstreamText = await upstream.text();
    var result;
    try { result = JSON.parse(upstreamText); } catch (_) { result = null; }
    if (!upstream.ok) {
      var message = result && result.error && result.error.message
        ? String(result.error.message).slice(0,300)
        : "Sağlayıcı hata döndürdü (" + upstream.status + ").";
      return respond({ error:message }, 502, origin, allowed);
    }

    var answer = result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
    if (Array.isArray(answer)) answer = answer.map(function (part) { return part && typeof part.text === "string" ? part.text : ""; }).join("");
    if (typeof answer !== "string" || !answer.trim()) return respond({ error:"Yapay zekâ sağlayıcısından okunabilir yanıt alınamadı." }, 502, origin, allowed);
    return respond({ answer:answer.trim() }, 200, origin, allowed);
  }
};
