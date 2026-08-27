import type { Client, TextChannel } from "discord.js";
import { getMobileGameKey } from "@/lib/utils";
import { logger } from "../logger";
import type { BotCredentials } from "../state";
import {
  getGuildPostedOfferIds,
  getGuildSeenUpcomingOfferIds,
  getGuildSettings,
  loadBotState,
  recordGuildPostedOffers,
  saveBotState,
} from "../state";
import { sendConfirmationPrompt } from "../ui/confirmationPrompt";
import { dispatchDiscordPayload } from "./discordService";
import {
  type FetchedOffers,
  fetchCurrentOffers,
  generateOfferPayloads,
  toMobileGame,
} from "./offerService";

export function getDropWindow(now: Date = new Date()): {
  inWindow: boolean;
  nextDropDate: Date;
  description: string;
} {
  const dayOfWeek = now.getUTCDay();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  const isThursday = dayOfWeek === 4;
  // Thursday from 14:58 UTC to 15:10 UTC covers the 15:00 UTC drop plus a 10-minute buffer with 1-minute checks
  const inWindow =
    isThursday &&
    ((currentHour === 14 && currentMinute >= 58) ||
      (currentHour === 15 && currentMinute <= 10));

  const nextDrop = new Date(now);
  let daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  if (
    daysUntilThursday === 0 &&
    (currentHour > 15 || (currentHour === 15 && currentMinute > 10))
  ) {
    daysUntilThursday = 7;
  }
  nextDrop.setUTCDate(now.getUTCDate() + daysUntilThursday);
  nextDrop.setUTCHours(15, 0, 0, 0);

  const description = inWindow
    ? "**Active Offer Window** (Checking every minute for new offers)"
    : `**Idle** (Next offer: <t:${Math.floor(nextDrop.getTime() / 1000)}:F>)`;

  return { inWindow, nextDropDate: nextDrop, description };
}

export class OfferSchedulerService {
  private pollIntervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private client: Client,
    private credentials: BotCredentials,
  ) {}

  public start(): void {
    if (this.pollIntervalHandle) {
      clearInterval(this.pollIntervalHandle);
    }

    logger.info(
      `Offer scheduler started. Active on Thursdays 14:58-15:10 UTC (1m checks) + 24h idle checks.`,
    );

    setTimeout(() => this.runOfferCheck(), 5000);

    this.pollIntervalHandle = setInterval(() => {
      const now = new Date();
      const { inWindow } = getDropWindow(now);
      const state = loadBotState();
      const lastCheckMs = state.lastCheckTimestamp
        ? new Date(state.lastCheckTimestamp).getTime()
        : 0;
      const timeSinceLastCheckMinutes =
        (Date.now() - lastCheckMs) / (60 * 1000);

      const checkInterval = state.settings.checkIntervalMinutes || 1440;
      const thresholdMinutes = inWindow ? 1 : checkInterval;

      if (timeSinceLastCheckMinutes >= thresholdMinutes) {
        this.runOfferCheck();
      }
    }, 60 * 1000);
  }

  public async broadcastOffers(
    offers: FetchedOffers,
    options: {
      includeUpcoming?: boolean;
      onlyNew?: boolean;
      guildId?: string | null;
      includeAddOns?: boolean;
      selectedGameIds?: string[];
    } = {},
  ): Promise<{ success: boolean; error?: string }> {
    const s = getGuildSettings(options.guildId);
    if (s.enabled === false) {
      return {
        success: false,
        error: "Currently disabled in bot settings.",
      };
    }
    const mainChannelId =
      s.announcementChannelId || s.mobileAnnouncementChannelId;
    if (!mainChannelId) {
      return {
        success: false,
        error:
          "Announcement channel is not configured. Run `/settings` in Discord first.",
      };
    }

    try {
      const shouldSplit =
        s.splitDesktopMobile || Boolean(s.mobileAnnouncementChannelId);
      const { desktopPayload, mobilePayload, combinedPayload } =
        generateOfferPayloads(
          offers,
          { ...s, splitDesktopMobile: shouldSplit },
          options,
        );

      let sentCount = 0;

      if (shouldSplit) {
        let shouldSendDesktop = options.onlyNew
          ? offers.hasNewDesktopOffers
          : true;
        let shouldSendMobile = options.onlyNew
          ? offers.hasNewMobileOffers
          : true;

        if (options.selectedGameIds && options.selectedGameIds.length > 0) {
          shouldSendDesktop = offers.effectiveGames.currentGames.some((g) =>
            options.selectedGameIds?.includes(g.id),
          );
          shouldSendMobile = offers.activeMobileGames.some((m) =>
            options.selectedGameIds?.includes(
              getMobileGameKey(toMobileGame(m)),
            ),
          );
        }

        if (
          shouldSendDesktop &&
          desktopPayload &&
          s.announcementChannelId &&
          offers.effectiveGames.currentGames.length > 0
        ) {
          const desktopChannel = await this.client.channels.fetch(
            s.announcementChannelId,
          );
          if (desktopChannel?.isTextBased()) {
            await dispatchDiscordPayload(
              this.credentials.discordToken,
              desktopChannel as TextChannel,
              desktopPayload,
            );
            sentCount++;
          }
        }

        const mobileTargetId =
          s.mobileAnnouncementChannelId || s.announcementChannelId;
        if (
          shouldSendMobile &&
          mobilePayload &&
          mobileTargetId &&
          offers.activeMobileGames.length > 0
        ) {
          const mobileChannel =
            await this.client.channels.fetch(mobileTargetId);
          if (mobileChannel?.isTextBased()) {
            await dispatchDiscordPayload(
              this.credentials.discordToken,
              mobileChannel as TextChannel,
              mobilePayload,
            );
            sentCount++;
          }
        }
      } else if (combinedPayload && mainChannelId) {
        const targetChannel = await this.client.channels.fetch(mainChannelId);
        if (targetChannel?.isTextBased()) {
          await dispatchDiscordPayload(
            this.credentials.discordToken,
            targetChannel as TextChannel,
            combinedPayload,
          );
          sentCount++;
        }
      }

      if (sentCount === 0) {
        return {
          success: false,
          error: "No channels reached or no matching offers to post.",
        };
      }

      return { success: true };
    } catch (error) {
      logger.error("Posting failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async runOfferCheck(): Promise<void> {
    try {
      const now = new Date();
      const { inWindow } = getDropWindow(now);
      logger.info(
        `Checking for Epic free games... (Window: ${inWindow ? "Thursday Active" : "Idle"})`,
      );

      const state = loadBotState();
      state.lastCheckTimestamp = new Date().toISOString();
      saveBotState(state);

      const guilds = await this.client.guilds.fetch();
      const guildList: (string | null)[] =
        guilds.size === 0 ? [null] : Array.from(guilds.keys());

      for (const guildId of guildList) {
        try {
          const s = getGuildSettings(guildId);
          if (s.enabled === false) {
            continue;
          }

          const prevOfferIds = getGuildPostedOfferIds(guildId);
          const prevUpcomingIds = getGuildSeenUpcomingOfferIds(guildId);

          const offers = await fetchCurrentOffers(prevOfferIds, {
            previousUpcomingOfferIds: prevUpcomingIds,
            includeAddOns: s.includeAddOns,
            includeMobile: s.includeMobile !== false,
          });

          if (!offers.hasNewOffers) {
            continue;
          }

          logger.info(
            `${guildId ? `[Guild ${guildId}] ` : ""}New offers found: ${offers.titles.join(", ")}`,
          );

          if (s.requireConfirmation) {
            logger.info(
              `${guildId ? `[Guild ${guildId}] ` : ""}Requirement confirmation enabled. Sending prompt to review channel...`,
            );
            await sendConfirmationPrompt(
              this.client,
              this.credentials.discordToken,
              this.credentials.clientId,
              null,
              offers,
              { guildId },
            );
          } else {
            logger.info(
              `${guildId ? `[Guild ${guildId}] ` : ""}Requirement confirmation disabled. Posting directly to announcement channel...`,
            );
            const res = await this.broadcastOffers(offers, {
              onlyNew: true,
              guildId,
              includeAddOns: s.includeAddOns,
            });
            if (res.success) {
              recordGuildPostedOffers(
                guildId,
                offers.currentOfferIds,
                offers.upcomingOfferIds,
              );
            } else {
              logger.warn(
                `${guildId ? `[Guild ${guildId}] ` : ""}Failed to broadcast offers: ${res.error || "Unknown error"}`,
              );
            }
          }
        } catch (guildBroadcastErr) {
          logger.error(
            `Error processing guild ${guildId || "default"}:`,
            guildBroadcastErr,
          );
        }
      }
    } catch (error) {
      logger.error("Error during scheduled offer check:", error);
    }
  }
}
