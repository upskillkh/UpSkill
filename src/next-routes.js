// next-routes.js — HTTP surface for the 2027-2031 platform.
//
// Split out of worker.js so the new surface stays readable. Every handler here
// receives an already-authenticated `user`, so there is no path that reaches
// private data without a session. Admin actions re-check the role server side;
// hiding a button in the UI is never treated as authorisation.

import {
  getCatalog, getSkillDetail, getAssessmentQuestions, submitAssessment, getProficiency,
  listStructures, recommendStructure,
  listExercises, getExercise, saveSubmission, listSubmissions,
  getUserAnalytics, getAdminOverview, exportUserData, deleteUserAccount,
  normLocale,
} from "./catalog.js";
import { askCoach, coachHistory, clearCoachHistory, aiStatus } from "./coach.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const err = (status, error, extra = {}) => json({ error, ...extra }, status);

const readBody = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

function isAdmin(user, request, env) {
  if (user?.role === "admin") return true;
  // The Worker secret remains a valid admin credential for operational use
  // (CLI, cron tooling). It is never accepted from a browser form.
  const auth = request.headers.get("authorization") || "";
  return Boolean(env.ADMIN_SECRET) && auth === "Bearer " + env.ADMIN_SECRET;
}

// Routes this module owns. Anything else must fall through untouched, or the
// older /api/platform/* handlers would be shadowed.
// The diagnostic questions are fixed published content with no user data, so
// they render for anyone. Only the submission is user-scoped.
const PUBLIC_ROUTES = ["/catalog", "/catalog/skill", "/structures", "/structures/recommend",
  "/ai/status", "/lab/exercises", "/lab/exercise", "/assessment/questions"];
const OWNED_ROUTES = [...PUBLIC_ROUTES, "/assessment", "/proficiency", "/analytics",
  "/lab/submissions", "/lab/submit", "/coach", "/coach/history", "/settings", "/export", "/account", "/admin"];

const owns = (r) => OWNED_ROUTES.some((p) => r === p || r.startsWith(p + "/"));

export async function handlePlatformNext(request, env, url, user) {
  // Accepts both /api/platform/<route> and the shorter /api/<route> alias.
  const route = url.pathname.replace(/^\/api\/platform/, "").replace(/^\/api/, "") || "/";
  const method = request.method;

  if (!owns(route)) return null;

  // ---- public catalog: no session required --------------------------------
  // The taxonomy is published content, so it is readable by anyone. It contains
  // no per-user data.
  if (route === "/catalog" && method === "GET") {
    return json(await getCatalog(env, url.searchParams.get("locale")));
  }

  if (route === "/structures" && method === "GET") {
    return json(await listStructures(env, url.searchParams.get("locale")));
  }

  // Decision aid. POST because the answers are structured input, not a
  // bookmarkable resource. Returns a ranking plus the reasons both ways, so the
  // learner can see why an option lost as well as why it won.
  if (route === "/structures/recommend" && method === "POST") {
    const body = await readBody(request);
    return json(await recommendStructure(env, body.locale || url.searchParams.get("locale"), body));
  }

  // Skill detail. Public, like the catalog, but optionally enriched with the
  // signed-in learner's own progress when a session exists.
  if (route === "/catalog/skill" && method === "GET") {
    const d = await getSkillDetail(env, url.searchParams.get("locale"), url.searchParams.get("key") || "", user?.id);
    return d ? json(d) : err(404, "Skill not found");
  }

  if (route === "/ai/status" && method === "GET") {
    const s = aiStatus(env);
    // Reports whether a key exists. Never reports the key, and never calls the
    // provider, so this endpoint cannot be used to probe or spend quota.
    return json({ configured: s.configured, model: s.model });
  }

  if (route === "/lab/exercises" && method === "GET") {
    return json({ exercises: await listExercises(env, url.searchParams.get("locale"), url.searchParams.get("category") || undefined) });
  }

  if (route === "/lab/exercise" && method === "GET") {
    const ex = await getExercise(env, url.searchParams.get("locale"), url.searchParams.get("key") || "");
    return ex ? json(ex) : err(404, "Exercise not found");
  }

  // The diagnostic questions are fixed published content with no user data, so
  // they render for anyone. Only the submission is user-scoped. This handler
  // must sit ABOVE the session gate below, not merely be listed as public.
  if (route === "/assessment/questions" && method === "GET") {
    return json({ questions: await getAssessmentQuestions(env, url.searchParams.get("locale")) });
  }

  // ---- everything below requires a session ---------------------------------
  // Admin routes are excluded here so that a signed-out admin attempt gets a
  // precise 403 from the role check below rather than a misleading 401.
  if (!user && !route.startsWith("/admin")) return err(401, "Sign in required");

  // user is null for anonymous admin attempts, so this must not dereference it.
  const locale = normLocale(url.searchParams.get("locale") || user?.locale || "en");

  if (route === "/assessment" && method === "POST") {
    const body = await readBody(request);
    return json(await submitAssessment(env, user.id, body.locale || locale, body.answers || {}));
  }

  if (route === "/proficiency" && method === "GET") {
    return json({ skills: await getProficiency(env, user.id) });
  }

  if (route === "/analytics" && method === "GET") {
    return json(await getUserAnalytics(env, user.id));
  }

  if (route === "/lab/submissions" && method === "GET") {
    return json({ submissions: await listSubmissions(env, user.id) });
  }

  if (route === "/lab/submit" && method === "POST") {
    const body = await readBody(request);
    const key = String(body.key || "").slice(0, 80);
    if (!key) return err(400, "key is required");
    if (!String(body.answer || "").trim()) return err(400, "answer is required");
    const saved = await saveSubmission(env, user.id, key, body.answer, body.selfScore, body.rubricScores);
    return saved ? json({ ok: true, locale, ...saved }) : err(404, "Exercise not found");
  }

  if (route === "/coach" && method === "POST") {
    const body = await readBody(request);
    const r = await askCoach(env, user.id, body.locale || locale, body.question, { consent: body.consent === true });
    return r.error ? err(r.status || 400, r.error) : json(r);
  }

  if (route === "/coach/history" && method === "GET") {
    return json({ sessions: await coachHistory(env, user.id) });
  }

  if (route === "/coach/history" && method === "DELETE") {
    await clearCoachHistory(env, user.id);
    return json({ ok: true });
  }

  // ---- account settings ---------------------------------------------------
  // Locale lives on the account so the website and Telegram agree. Writing here
  // also updates users.locale, which /api/auth/me returns, so a learner who
  // switches language in Telegram sees it on the web on their next visit.
  if (route === "/settings" && method === "POST") {
    const body = await readBody(request);
    const want = String(body.locale || "").toLowerCase();
    if (!["km", "en"].includes(want)) return err(400, "locale must be km or en");
    await env.DB.prepare("UPDATE users SET locale = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(want, user.id).run();
    await env.DB.prepare(`
      INSERT INTO user_settings (user_id, key, value, updated_at) VALUES (?, 'locale', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`)
      .bind(user.id, want).run();
    return json({ ok: true, locale: want });
  }

  if (route === "/settings" && method === "GET") {
    const rows = await env.DB.prepare("SELECT key, value FROM user_settings WHERE user_id = ?")
      .bind(user.id).all();
    const out = {};
    for (const r of rows.results || []) out[r.key] = r.value;
    return json({ locale: user.locale, settings: out });
  }

  // ---- Telegram linking ---------------------------------------------------
  // Generates a short, single-use code. The code is never returned for anyone
  // else: it is scoped to the requesting account and invalidated on use.
  if (route === "/telegram/link-code" && method === "POST") {
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
    await env.DB.prepare(`
      INSERT INTO telegram_links (user_id, link_code, reminder_enabled, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        link_code = excluded.link_code, verified_at = NULL, updated_at = CURRENT_TIMESTAMP`)
      .bind(user.id, code).run();
    return json({ code, instructions: `Send /link ${code} to the Up Skill Telegram bot.` });
  }

  if (route === "/telegram/status" && method === "GET") {
    const row = await env.DB.prepare(
      "SELECT chat_id, verified_at, reminder_enabled, locale_override FROM telegram_links WHERE user_id = ?")
      .bind(user.id).first();
    return json({
      linked: Boolean(row?.verified_at),
      // The chat id is partially masked: it identifies the account but is not
      // something that needs exposing to the page.
      chatHint: row?.chat_id ? String(row.chat_id).slice(0, 3) + "****" : null,
      reminders: Boolean(row?.reminder_enabled),
    });
  }

  // ---- privacy: export and delete -----------------------------------------
  if (route === "/export" && method === "GET") {
    return json(await exportUserData(env, user.id, locale));
  }

  if (route === "/account" && method === "DELETE") {
    // Guarded by a body confirmation so a stray or replayed request cannot
    // destroy an account. Cascades remove all child records.
    const body = await readBody(request);
    if (body.confirm !== "DELETE") return err(400, 'Send {"confirm":"DELETE"} to delete the account');
    await deleteUserAccount(env, user.id);
    return json({ ok: true });
  }

  // ---- admin --------------------------------------------------------------
  if (route.startsWith("/admin")) {
    if (!isAdmin(user, request, env)) return err(403, "Administrator access required");

    if (route === "/admin/overview" && method === "GET") {
      return json(await getAdminOverview(env));
    }

    if (route === "/admin/deliveries" && method === "GET") {
      const { results } = await env.DB.prepare(`
        SELECT d.*, u.email FROM notification_deliveries d
          LEFT JOIN users u ON u.id = d.user_id
         ORDER BY d.created_at DESC LIMIT 50`).all();
      return json({ deliveries: results || [] });
    }

    if (route === "/admin/curriculum" && method === "GET") {
      // `lessons` carries `difficulty`, not `level`. Level lives on `skills`.
      const lessons = await env.DB.prepare(`
        SELECT l.id, l.slug, l.day, l.skill_key, l.difficulty, l.status,
               (SELECT COUNT(*) FROM lesson_translations t WHERE t.lesson_id = l.id) AS translations,
               (SELECT COUNT(*) FROM lesson_translations t WHERE t.lesson_id = l.id AND t.review_status='human_reviewed') AS reviewed
          FROM lessons l ORDER BY l.day`).all();
      return json({ lessons: lessons.results || [] });
    }

    // Merge or retire a skill without deleting rows, so historical records stay
    // readable. This is the "living taxonomy" requirement.
    if (route === "/admin/skill" && method === "POST") {
      const body = await readBody(request);
      const key = String(body.key || "").slice(0, 60);
      if (!key) return err(400, "key is required");
      const allowed = ["active", "planned", "retired"];
      const status = allowed.includes(body.status) ? body.status : null;
      if (!status) return err(400, `status must be one of ${allowed.join(", ")}`);
      const level = ["L1", "L2", "L3", "L4"].includes(body.level) ? body.level : null;

      const res = await env.DB.prepare(`
        UPDATE skills SET status = COALESCE(?, status),
                          level  = COALESCE(?, level),
                          updated_at = CURRENT_TIMESTAMP
         WHERE key = ?`).bind(status, level, key).run();

      if (!res.meta?.changes) return err(404, "Skill not found");
      await env.DB.prepare(`
        INSERT INTO admin_audit (actor_id, action, entity, entity_id, detail)
        VALUES (?, 'skill.update', 'skills', ?, ?)`)
        .bind(user.id, key, JSON.stringify({ status, level })).run();
      return json({ ok: true });
    }

    if (route === "/admin/category" && method === "POST") {
      const body = await readBody(request);
      const key = String(body.key || "").replace(/[^a-z0-9_]/gi, "").slice(0, 40);
      if (!key) return err(400, "key must be alphanumeric");
      if (!body.nameEn || !body.nameKm) return err(400, "nameEn and nameKm are required");
      await env.DB.prepare(`
        INSERT INTO categories (key, name_en, name_km, summary_en, summary_km, icon, sort_order, established)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          name_en=excluded.name_en, name_km=excluded.name_km,
          summary_en=excluded.summary_en, summary_km=excluded.summary_km,
          established=excluded.established, updated_at=CURRENT_TIMESTAMP`)
        .bind(key, String(body.nameEn).slice(0, 120), String(body.nameKm).slice(0, 120),
          String(body.summaryEn || "").slice(0, 600), String(body.summaryKm || "").slice(0, 600),
          String(body.icon || "").slice(0, 4), Number(body.sortOrder) || 99,
          body.established === false ? 0 : 1).run();
      await env.DB.prepare(`
        INSERT INTO admin_audit (actor_id, action, entity, entity_id, detail)
        VALUES (?, 'category.upsert', 'categories', ?, ?)`)
        .bind(user.id, key, String(body.nameEn).slice(0, 120)).run();
      return json({ ok: true, key });
    }

    if (route === "/admin/users" && method === "GET") {
      const { results } = await env.DB.prepare(`
        SELECT id, email, display_name, role, locale, status, created_at,
               (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = users.id AND p.status='completed') AS completed
          FROM users ORDER BY created_at DESC LIMIT 100`).all();
      // Password hashes and salts are deliberately not selected.
      return json({ users: results || [] });
    }
  }

  // Unknown route: return null so the caller can fall through to the older
  // platform handlers. Returning 404 here would shadow every existing
  // /api/platform/* route that this module does not own.
  return null;
}
