import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline";
import { readdirSync } from "node:fs";
import { join, basename } from "node:path";

const BOTS_DIR = new URL("./bots/", import.meta.url);

async function loadBots() {
  const files = readdirSync(new URL(BOTS_DIR))
    .filter((f) => f.endsWith(".js") && f !== "index.js");

  const bots = {};
  for (const file of files) {
    const mod = await import(new URL(file, BOTS_DIR));
    const key = basename(file, ".js");
    bots[key] = mod.default;
  }
  return bots;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function fillPrompt(prompt, answers) {
  let filled = prompt;
  for (const [key, value] of Object.entries(answers)) {
    if (value.trim()) {
      const patterns = [
        new RegExp(`\\[${key}\\]`, "gi"),
        new RegExp(`\\[décris\\]`, "gi"),
        new RegExp(`\\[précise\\]`, "gi"),
        new RegExp(`\\[TON SUJET\\]`, "gi"),
      ];
      // Simple replacement based on variable position
      filled = filled.replace(`[${key}]`, value);
    }
  }
  return filled;
}

async function runBot(bot, answers) {
  const client = new Anthropic();

  // Build the user message by replacing placeholders with actual answers
  let userMessage = bot.prompt;
  for (const variable of bot.variables) {
    const value = answers[variable.key];
    if (value) {
      // Replace placeholder patterns in the prompt
      const placeholderPatterns = [
        `[${variable.placeholder}]`,
        `[précise]`,
        `[décris]`,
        `[TON SUJET]`,
        `[ce que je maîtrise]`,
        `[qui je cible]`,
        `[qui]`,
        `[démographie + psychographie]`,
        `[liste 3-5]`,
        `[notoriété/engagement/ventes/communauté]`,
        `[Instagram/LinkedIn/Twitter/TikTok/etc.]`,
        `[Instagram/LinkedIn/Twitter/etc.]`,
        `[Instagram Reels/TikTok/YouTube Shorts]`,
        `[X posts/semaine]`,
        `[engagement/partages/commentaires/clics]`,
        `[viralité/éducation/conversion/divertissement]`,
        `[15s/30s/60s/90s]`,
      ];
      // Use label-based matching
      userMessage = userMessage.replace(
        new RegExp(`\\[${escapeRegex(variable.label)}\\]`, "gi"),
        value
      );
    }
  }

  // Also do a smart replacement: fill [précise], [décris], etc. based on variable order
  const varValues = bot.variables.map((v) => answers[v.key] || v.placeholder);
  let idx = 0;
  userMessage = userMessage.replace(/\[[^\]]+\]/g, (match) => {
    // Skip if it looks like a section header
    if (match.includes("/") && match.length > 30) {
      if (idx < varValues.length) return varValues[idx++];
    }
    if (idx < varValues.length) return varValues[idx++];
    return match;
  });

  console.log("\n⏳ Génération en cours...\n");
  console.log("─".repeat(60));

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }

  console.log("\n" + "─".repeat(60));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const bots = await loadBots();
  const botKeys = Object.keys(bots);
  const rl = createInterface();

  // Check if a specific bot was requested via CLI args
  const requestedBot = process.argv.find((arg) => arg.startsWith("--bot="))
    ? process.argv.find((arg) => arg.startsWith("--bot=")).split("=")[1]
    : process.argv[process.argv.indexOf("--bot") + 1];

  let selectedKey;

  if (requestedBot && bots[requestedBot]) {
    selectedKey = requestedBot;
  } else {
    console.log("\n🤖 MADARA PLAYGROUND - Bots Social Media AI\n");
    console.log("Sélectionne un bot :\n");
    botKeys.forEach((key, i) => {
      console.log(`  ${i + 1}. ${bots[key].name}`);
      console.log(`     ${bots[key].description}\n`);
    });

    const choice = await ask(rl, "Ton choix (1-" + botKeys.length + ") : ");
    const index = parseInt(choice, 10) - 1;

    if (index < 0 || index >= botKeys.length) {
      console.log("Choix invalide.");
      rl.close();
      return;
    }
    selectedKey = botKeys[index];
  }

  const bot = bots[selectedKey];
  console.log(`\n✅ Bot sélectionné : ${bot.name}\n`);

  // Collect variable values from user
  const answers = {};
  for (const variable of bot.variables) {
    const value = await ask(rl, `${variable.label} (${variable.placeholder}) :\n> `);
    answers[variable.key] = value;
  }

  rl.close();

  await runBot(bot, answers);
  console.log("\n✅ Terminé !\n");
}

main().catch(console.error);
