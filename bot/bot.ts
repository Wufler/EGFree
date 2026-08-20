import { Client, type Interaction } from "discord.js";
import { handleChatInputCommand, registerSlashCommands } from "./commands";
import { handleInteraction } from "./interactions";
import { OfferSchedulerService } from "./services/schedulerService";
import {
  type BotCredentials,
  type BotPersistentSettings,
  getGuildSettings,
  loadBotCredentials,
  loadBotState,
} from "./state";

export type {
  DiscordRawComponent,
  DiscordV2Payload,
  SettingsCategory,
} from "./types";

export class DiscordOfferBot {
  public client: Client;
  public credentials: BotCredentials;
  public scheduler: OfferSchedulerService;

  constructor() {
    this.credentials = loadBotCredentials();
    this.client = new Client({
      intents: ["Guilds", "GuildMessages"],
    });
    this.scheduler = new OfferSchedulerService(this.client, this.credentials);

    this.setupEvents();
  }

  public get settings(): BotPersistentSettings {
    return loadBotState().settings;
  }

  public getGuildSettings(
    guildId: string | null | undefined,
  ): BotPersistentSettings {
    return getGuildSettings(guildId);
  }

  private setupEvents(): void {
    this.client.once("clientReady", async () => {
      console.log(`[EGFree] Logged in as ${this.client.user?.tag}!`);
      await registerSlashCommands(this.credentials, this.client);
      this.scheduler.start();
    });

    this.client.on("error", (error) => {
      console.error("[EGFree] Discord client error:", error);
    });

    this.client.on("interactionCreate", async (interaction: Interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await handleChatInputCommand(
            interaction,
            this.scheduler,
            this.credentials,
          );
        } else {
          await handleInteraction(
            interaction,
            this.scheduler,
            this.credentials,
          );
        }
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 10062
        ) {
          console.warn("[EGFree] Interaction expired or already acknowledged.");
          return;
        }
        console.error("[EGFree] Uncaught error handling interaction:", err);
      }
    });
  }

  public async start(): Promise<void> {
    if (!this.credentials.discordToken) {
      console.error(
        "[EGFree] Missing DISCORD_BOT_TOKEN in environment (.env or .env.local). Please supply it to start the bot.",
      );
      process.exit(1);
    }
    await this.client.login(this.credentials.discordToken);
  }
}

async function main() {
  console.log("Starting EGFree...");
  const bot = new DiscordOfferBot();
  await bot.start();
}

main().catch((err) => {
  console.error("Fatal error starting Discord bot:", err);
  process.exit(1);
});
