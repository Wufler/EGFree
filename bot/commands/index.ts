import {
  type ChatInputCommandInteraction,
  type Client,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import type { OfferSchedulerService } from "../services/schedulerService";
import type { BotCredentials } from "../state";
import { handleOffersCommand } from "./offers";
import { handleSettingsCommand } from "./settings";

export function getSlashCommands() {
  return [
    new SlashCommandBuilder()
      .setName("offers")
      .setDescription("Manage Epic Games free offers")
      .addSubcommand((sub) =>
        sub
          .setName("check")
          .setDescription("Check current and upcoming free Epic Games offers"),
      )
      .addSubcommand((sub) =>
        sub
          .setName("post")
          .setDescription("Publish offers or request review")
          .addBooleanOption((option) =>
            option
              .setName("upcoming")
              .setDescription("Include upcoming free games")
              .setRequired(false),
          )
          .addBooleanOption((option) =>
            option
              .setName("force")
              .setDescription("Post even if already posted before")
              .setRequired(false),
          )
          .addBooleanOption((option) =>
            option
              .setName("confirm")
              .setDescription("Require approval buttons before posting")
              .setRequired(false),
          ),
      ),

    new SlashCommandBuilder()
      .setName("settings")
      .setDescription(
        "Open interactive control panel to configure all bot settings",
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  ].map((cmd) => cmd.toJSON());
}

export async function registerCommandsForGuild(
  credentials: BotCredentials,
  guildId: string,
  guildName?: string,
): Promise<void> {
  if (!credentials.clientId) return;
  const rest = new REST({ version: "10" }).setToken(credentials.discordToken);
  const commands = getSlashCommands();

  try {
    await rest.put(
      Routes.applicationGuildCommands(credentials.clientId, guildId),
      { body: commands },
    );
    console.log(
      `[EGFree] Registered slash commands for guild: ${guildName || guildId}`,
    );
  } catch (guildErr) {
    console.warn(
      `[EGFree] Failed to register slash commands for guild ${guildName || guildId}:`,
      guildErr,
    );
  }
}

export async function registerSlashCommands(
  credentials: BotCredentials,
  client: Client,
): Promise<void> {
  if (!credentials.clientId) {
    console.warn(
      "[EGFree] DISCORD_CLIENT_ID not set. Skipping automatic slash command registration.",
    );
    return;
  }

  const commands = getSlashCommands();
  const rest = new REST({ version: "10" }).setToken(credentials.discordToken);

  try {
    console.log("[EGFree] Registering global slash commands...");
    await rest.put(Routes.applicationCommands(credentials.clientId), {
      body: commands,
    });
    console.log("[EGFree] Registered global application commands.");

    const guilds = await client.guilds.fetch();
    for (const [guildId] of guilds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(credentials.clientId, guildId),
          { body: [] },
        );
      } catch (error) {
        console.warn("[EGFree] Failed to unregister guild commands:", error);
      }
    }
  } catch (error) {
    console.error("[EGFree] Failed to register slash commands:", error);
  }
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  scheduler: OfferSchedulerService,
  credentials: BotCredentials,
): Promise<void> {
  if (interaction.commandName === "offers") {
    await handleOffersCommand(interaction, scheduler, credentials);
  } else if (interaction.commandName === "settings") {
    await handleSettingsCommand(interaction, credentials);
  }
}
