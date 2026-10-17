// learn-telegram.js — learning commands layered onto the existing Telegram bot.
//
// Everything here is additive. The existing news commands (/today, /cambodia,
// /asean, /global, /opportunities, /refresh) and the existing skill commands
// (/learn, /complete, /skills, /progress, /quiz, ...) are handled before this
// module is consulted, so nothing that already worked can change behaviour.
//
// Returns null for any command it does not own, which lets the caller fall
// through to the existing handler untouched.

import { getCatalog, listExercises } from "./catalog.js";
import { OWNER_ID } from "./skills.js";

const linkCode = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  // Crockford-ish alphabet: no 0/O/1/I, because this is read aloud and typed by
  // hand in a chat window.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
};

export const LEARNING_HELP =
  "🌱 FUTURE SKILLS 2027-2031\n\n" +
  "/catalog — the 12 skill categories\n" +
  "/lab — Business Lab exercises\n" +
  "/language km|en — switch my language\n" +
  "/link CODE — link this chat to my Up Skill account\n" +
  "/unlink — disconnect my account\n" +
  "/reminder_on — daily 06:00 lesson\n" +
  "/reminder_off — stop daily lessons\n\n" +
  "Also: /learn /complete /skills /progress /quiz\n" +
  "News: /today /cambodia /asean /global /opportunities /refresh";

// Owner account. The bot is currently restricted to a single allowed chat, so
// linking binds that chat to the migrated owner account rather than creating a
// new one. Multi-user broadcast delivery is schema-ready (telegram_links,
// notification_deliveries) but not enabled; see SECURITY.md.
async function linkedUserId(env, chatId) {
  const row = await env.DB.prepare("SELECT user_id FROM telegram_links WHERE chat_id = ? AND verified_at IS NOT NULL")
    .bind(String(chatId)).first();
  return row?.user_id || OWNER_ID;
}

const LAB_TRUNC = 700;

export async function handleLearningCommand(env, command, arg, chatId) {
  try {
    if (command === "/catalog") {
      const cat = await getCatalog(env, "en");
      const withContent = cat.categories.filter((c) => c.skills.some((s) => s.available));
      const line = (i, c) =>
        `${i}. ${c.name}${c.established ? "" : " (emerging)"} — ${c.skills.filter((s) => s.available).length} available`;
      return {
        text: [
          "🗂️ TWELVE SKILL CATEGORIES (2027-2031)",
          "",
          line(1, withContent[0] || cat.categories[0]),
          ...withContent.slice(1).map((c, i) => line(i + 2, c)),
          "",
          "Open the full platform to browse all 12, including the 7 still being written:",
          `${env.SITE_URL || "https://your-worker.workers.dev"}/learn.html`,
        ].join("\n"),
      };
    }

    if (command === "/lab") {
      const ex = await listExercises(env, "en");
      return {
        text: [
          "🧰 BUSINESS LAB",
          "",
          "Real exercises with a scoring rubric. Submit your work on the website.",
          ...ex.slice(0, 10).map((e) => `• ${e.title} — ${e.estMinutes} min`),
          "",
          `${env.SITE_URL || "https://your-worker.workers.dev"}/learn.html`,
        ].join("\n"),
      };
    }

    if (command === "/language") {
      const want = String(arg || "").trim().toLowerCase();
      if (!want) return { text: "Current setting is below. Use: /language km  or  /language en" };
      if (!["km", "en"].includes(want)) return { text: "Language must be km or en." };
      const userId = await linkedUserId(env, chatId);
      // Locale lives on the account so the website and Telegram agree. Scoped
      // per user via user_settings, not the legacy global user_preferences.
      await env.DB.prepare(
        `INSERT INTO user_settings (user_id, key, value) VALUES (?, 'locale', ?)
         ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`)
        .bind(userId, want).run();
      await env.DB.prepare("UPDATE users SET locale = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(want, userId).run();
      return {
        text: want === "km"
          ? "✅ ភាសាប្តូរទៅខ្មែររួចរាល់។ សូមប្រើ /learn ដើម្បីទទួលការណ៍ថ្ងៃនេះ។\n✅ Switched to Khmer. Use /learn for today's lesson."
          : "✅ Switched to English. Use /learn for today's lesson.",
      };
    }

    if (command === "/link") {
      const code = String(arg || "").trim().toUpperCase();
      if (!code) return { text: "Usage: /link CODE — generate the code from your Up Skill account page." };
      const link = await env.DB.prepare(
        "SELECT user_id FROM telegram_links WHERE link_code = ? AND verified_at IS NULL")
        .bind(code).first();
      if (!link) return { text: "That code is not valid or has already been used. Generate a new one on the website." };
      await env.DB.prepare(`
        INSERT INTO telegram_links (user_id, chat_id, link_code, verified_at, reminder_enabled, updated_at)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id, verified_at = excluded.verified_at, updated_at = CURRENT_TIMESTAMP`)
        .bind(link.user_id, String(chatId), code, new Date().toISOString()).run();
      return { text: "✅ Linked. Daily lessons will arrive here at 06:00 Cambodia time. /reminder_off to stop." };
    }

    if (command === "/unlink") {
      await env.DB.prepare("UPDATE telegram_links SET chat_id = NULL, verified_at = NULL WHERE chat_id = ?")
        .bind(String(chatId)).run();
      return { text: "✅ Unlinked. Daily lessons to Telegram are off; the website is unaffected." };
    }

    if (command === "/help" || command === "/skills2027") {
      return { text: LEARNING_HELP };
    }

    return null;
  } catch (e) {
    // A learning command must never take the news bot down with it.
    console.warn(`learn command ${command} failed: ${e.message}`);
    return { text: "⚠️ That learning command hit a problem. The news commands still work." };
  }
}

// Exposed so the website can generate a code without duplicating the alphabet.
export { linkCode as newLinkCode, LAB_TRUNC };
