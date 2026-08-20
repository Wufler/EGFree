import { buildDiscordMessagePayload } from "@/lib/builder/payload";
import { getMobileGames } from "@/lib/EGData";
import { getEpicFreeGames } from "@/lib/getGames";
import { getEffectiveGames, getMobileGameKey } from "@/lib/utils";
import type { BotPersistentSettings } from "../state";
import type { CandidateGame } from "../types";

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

export function toMobileGame(m: MobileGameData): MobileGame {
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

export function getCandidateGames(
  offers: FetchedOffers,
  options: {
    includeUpcoming?: boolean;
    previousOfferIds?: string[];
    previousUpcomingOfferIds?: string[];
  } = {},
): CandidateGame[] {
  const list: CandidateGame[] = [];
  let index = 0;
  const prevIds = options.previousOfferIds || [];
  const prevUpcoming = options.previousUpcomingOfferIds || [];

  for (const g of offers.effectiveGames.currentGames) {
    const isAddon = g.offerType === "ADD_ON";
    list.push({
      index: index++,
      id: g.id,
      title: g.title,
      type: isAddon ? "pc_addon" : "pc",
      platformLabel: isAddon ? "PC Add-on" : "PC",
      emoji: isAddon ? "🎁" : "💻",
      isNew: !prevIds.includes(g.id),
      rawDesktopGame: g,
    });
  }

  for (const m of offers.activeMobileGames) {
    const key = getMobileGameKey(toMobileGame(m));
    const plat =
      m.iosOffer && m.androidOffer
        ? "iOS & Android"
        : m.iosOffer
          ? "iOS"
          : "Android";
    list.push({
      index: index++,
      id: key,
      title: m.title,
      type: "mobile",
      platformLabel: `Mobile (${plat})`,
      emoji: "📱",
      isNew: !prevIds.includes(key),
      rawMobileGame: m,
    });
  }

  if (options.includeUpcoming) {
    for (const g of offers.effectiveGames.nextGames) {
      const isAddon = g.offerType === "ADD_ON";
      list.push({
        index: index++,
        id: g.id,
        title: g.title,
        type: isAddon ? "upcoming_addon" : "upcoming",
        platformLabel: isAddon ? "Upcoming Add-on" : "Upcoming PC",
        emoji: "⏳",
        isNew: !prevUpcoming.includes(g.id),
        rawDesktopGame: g,
      });
    }
  }

  return list;
}

export async function fetchCurrentOffers(
  previousOfferIds: string[] = [],
  options: {
    includeUpcoming?: boolean;
    previousUpcomingOfferIds?: string[];
    includeAddOns?: boolean;
  } = {},
): Promise<FetchedOffers> {
  const [rawGames, rawMobile] = await Promise.all([
    getEpicFreeGames(),
    getMobileGames(),
  ]);

  let effectiveGames = getEffectiveGames(rawGames);
  if (options.includeAddOns === false) {
    effectiveGames = {
      currentGames: effectiveGames.currentGames.filter(
        (g) => g.offerType !== "ADD_ON",
      ),
      nextGames: effectiveGames.nextGames.filter(
        (g) => g.offerType !== "ADD_ON",
      ),
    };
  }
  const now = new Date();

  const activeMobileGames = (rawMobile || []).filter((g) => {
    if (!g.promoEndDate) return true;
    const time = new Date(g.promoEndDate).getTime();
    return Number.isFinite(time) ? time > now.getTime() : true;
  });

  const currentPCIds = effectiveGames.currentGames.map((g) => g.id);
  const currentMobileIds = activeMobileGames.map((g) =>
    getMobileGameKey(toMobileGame(g)),
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
    const tag = g.offerType === "ADD_ON" ? "PC Add-on" : "PC";
    titles.push(`**${g.title}** (${tag})${isNew ? " *(New)*" : ""}`);
  }

  for (const g of activeMobileGames) {
    const key = getMobileGameKey(toMobileGame(g));
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
      const tag = g.offerType === "ADD_ON" ? "Upcoming Add-on" : "Upcoming";
      titles.push(`**${g.title}** (${tag})${isNew ? " *(New)*" : ""}`);
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
  options: {
    includeUpcoming?: boolean;
    onlyNew?: boolean;
    selectedGameIds?: string[];
  } = {},
): {
  desktopPayload?: Record<string, unknown>;
  mobilePayload?: Record<string, unknown>;
  combinedPayload?: Record<string, unknown>;
} {
  const parsedMobile = offers.activeMobileGames.map(toMobileGame);

  const selectedGames: Record<string, boolean> = {};

  if (options.selectedGameIds && options.selectedGameIds.length > 0) {
    for (const g of offers.effectiveGames.currentGames) {
      selectedGames[g.id] = options.selectedGameIds.includes(g.id);
    }
    for (const g of offers.effectiveGames.nextGames) {
      selectedGames[g.id] = options.selectedGameIds.includes(g.id);
    }
    for (const g of parsedMobile) {
      const key = getMobileGameKey(g);
      selectedGames[key] = options.selectedGameIds.includes(key);
    }
  } else if (options.onlyNew) {
    for (const g of offers.effectiveGames.currentGames) {
      selectedGames[g.id] = offers.newDesktopIds.includes(g.id);
    }
    for (const g of offers.effectiveGames.nextGames) {
      selectedGames[g.id] =
        !!options.includeUpcoming && offers.upcomingOfferIds.includes(g.id);
    }
    for (const g of parsedMobile) {
      const key = getMobileGameKey(g);
      selectedGames[key] = offers.newMobileIds.includes(key);
    }
  } else {
    for (const g of offers.effectiveGames.currentGames) {
      selectedGames[g.id] = true;
    }
    for (const g of offers.effectiveGames.nextGames) {
      selectedGames[g.id] = !!options.includeUpcoming;
    }
    for (const g of parsedMobile) {
      selectedGames[getMobileGameKey(g)] = true;
    }
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
