import { buildDiscordMessagePayload } from "@/lib/builder/payload";
import { getMobileGames } from "@/lib/EGData";
import { getEpicFreeGames } from "@/lib/getGames";
import { getEffectiveGames, getMobileGameKey } from "@/lib/utils";
import type { BotPersistentSettings } from "../state";

export interface FetchedOffers {
  games: Game;
  effectiveGames: Game;
  mobileGames: MobileGameData[];
  activeMobileGames: MobileGameData[];
  currentOfferIds: string[];
  upcomingOfferIds: string[];
  hasNewOffers: boolean;
  hasNewDesktopOffers: boolean;
  hasNewMobileOffers: boolean;
  newDesktopIds: string[];
  newMobileIds: string[];
  titles: string[];
}

export function convertMobileGameData(m: MobileGameData): MobileGame {
  return {
    id: m.id,
    title: m.title,
    namespace: m.namespace,
    imageUrl: m.imageUrl,
    originalPrice: m.originalPrice,
    currencyCode: m.currencyCode,
    promoEndDate: m.promoEndDate,
    seller: m.seller,
    iosOffer: m.iosOffer,
    androidOffer: m.androidOffer,
  };
}

export async function fetchCurrentOffers(
  previousOfferIds: string[] = [],
  options: {
    includeUpcoming?: boolean;
    previousUpcomingOfferIds?: string[];
  } = {},
): Promise<FetchedOffers> {
  const [rawGames, rawMobile] = await Promise.all([
    getEpicFreeGames(),
    getMobileGames(),
  ]);

  const effectiveGames = getEffectiveGames(rawGames);
  const now = new Date();

  const activeMobileGames = (rawMobile || []).filter(
    (g) => !g.promoEndDate || new Date(g.promoEndDate) > now,
  );

  const currentPCIds = effectiveGames.currentGames.map((g) => g.id);
  const currentMobileIds = activeMobileGames.map((g) =>
    getMobileGameKey(convertMobileGameData(g)),
  );
  const upcomingPCIds = effectiveGames.nextGames.map((g) => g.id);
  const currentOfferIds = [...currentPCIds, ...currentMobileIds];
  const upcomingOfferIds = [...upcomingPCIds];

  const newDesktopIds = currentPCIds.filter(
    (id) => !previousOfferIds.includes(id),
  );
  const newMobileIds = currentMobileIds.filter(
    (id) => !previousOfferIds.includes(id),
  );

  const hasNewDesktopOffers = newDesktopIds.length > 0;
  const hasNewMobileOffers = newMobileIds.length > 0;
  const hasNewOffers = hasNewDesktopOffers || hasNewMobileOffers;

  const titles: string[] = [];

  for (const g of effectiveGames.currentGames) {
    const isNew = !previousOfferIds.includes(g.id);
    titles.push(`**${g.title}** (PC)${isNew ? " *(New)*" : ""}`);
  }

  for (const g of activeMobileGames) {
    const key = getMobileGameKey(convertMobileGameData(g));
    const isNew = !previousOfferIds.includes(key);
    const plat =
      g.iosOffer && g.androidOffer
        ? "iOS & Android"
        : g.iosOffer
          ? "iOS"
          : "Android";
    titles.push(`**${g.title}** (${plat})${isNew ? " *(New)*" : ""}`);
  }

  if (options.includeUpcoming) {
    const prevUpcoming = options.previousUpcomingOfferIds || [];
    for (const g of effectiveGames.nextGames) {
      const isNew = !prevUpcoming.includes(g.id);
      titles.push(`**${g.title}** (Upcoming)${isNew ? " *(New)*" : ""}`);
    }
  }

  return {
    games: rawGames,
    effectiveGames,
    mobileGames: rawMobile || [],
    activeMobileGames,
    currentOfferIds,
    upcomingOfferIds,
    hasNewOffers,
    hasNewDesktopOffers,
    hasNewMobileOffers,
    newDesktopIds,
    newMobileIds,
    titles,
  };
}

export function generateOfferPayloads(
  offers: FetchedOffers,
  settings: BotPersistentSettings,
  options: { includeUpcoming?: boolean; onlyNew?: boolean } = {},
): {
  desktopPayload?: Record<string, unknown>;
  mobilePayload?: Record<string, unknown>;
  combinedPayload?: Record<string, unknown>;
} {
  const parsedMobile = offers.activeMobileGames.map(convertMobileGameData);

  const selectedGames: Record<string, boolean> = {};
  for (const g of offers.effectiveGames.currentGames) {
    selectedGames[g.id] = true;
  }
  for (const g of offers.effectiveGames.nextGames) {
    selectedGames[g.id] = !!options.includeUpcoming;
  }
  for (const g of parsedMobile) {
    selectedGames[getMobileGameKey(g)] = true;
  }

  const mobileRole = settings.mobileMentionRoleId || settings.mentionRoleId;
  const baseSettings: EgFreeSettings = {
    selectedGames,
    embedContent: settings.mentionRoleId ? `<@&${settings.mentionRoleId}>` : "",
    embedContentMobile: mobileRole ? `<@&${mobileRole}>` : "",
    splitDesktopMobile: settings.splitDesktopMobile,
    sendDesktop: true,
    sendMobile: true,
    useDesktopWebhookForMobile: false,
    embedColor: settings.embedColor,
    includeFooter: settings.includeFooter,
    includePrice: settings.includePrice,
    includeImage: settings.includeImage,
    includeCheckout: settings.includeCheckout,
    includeClaimGame: settings.includeClaimGame,
    componentsV2: settings.useComponentsV2,
    webhookUrl: "",
    webhookUrlMobile: "",
    showDiscordPreview: true,
  };

  if (settings.splitDesktopMobile) {
    const desktopSettings: EgFreeSettings = {
      ...baseSettings,
      sendDesktop: true,
      sendMobile: false,
      embedContent: settings.mentionRoleId
        ? `<@&${settings.mentionRoleId}>`
        : "",
    };
    const mobileSettings: EgFreeSettings = {
      ...baseSettings,
      sendDesktop: false,
      sendMobile: true,
      embedContent: mobileRole ? `<@&${mobileRole}>` : "",
    };

    return {
      desktopPayload: buildDiscordMessagePayload(
        offers.effectiveGames,
        desktopSettings,
        "",
        parsedMobile,
      ) as Record<string, unknown>,
      mobilePayload: buildDiscordMessagePayload(
        offers.effectiveGames,
        mobileSettings,
        "",
        parsedMobile,
      ) as Record<string, unknown>,
    };
  }

  return {
    combinedPayload: buildDiscordMessagePayload(
      offers.effectiveGames,
      baseSettings,
      "",
      parsedMobile,
    ) as Record<string, unknown>,
  };
}
