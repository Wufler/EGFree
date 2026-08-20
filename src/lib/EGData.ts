const EGDATA_API = "https://api.egdata.app";

function getPlatform(tags: EgDataTag[]): "ios" | "android" | null {
  for (const tag of tags) {
    if (tag.id === "39070" || tag.name === "iOS") return "ios";
    if (tag.id === "39071" || tag.name === "Android") return "android";
  }
  return null;
}

export async function getMobileGame(
  offerId: string,
  initialOffer?: EgDataOffer,
): Promise<{
  gameData: MobileGameData;
  enteredPlatform: "ios" | "android" | null;
} | null> {
  try {
    let offer = initialOffer;
    if (!offer) {
      const offerRes = await fetch(`${EGDATA_API}/offers/${offerId}`);
      if (!offerRes.ok) return null;
      offer = await offerRes.json();
    }

    if (!offer) return null;

    const enteredPlatform = getPlatform(offer.tags || []);

    const [priceRes, sandboxRes] = await Promise.all([
      fetch(`${EGDATA_API}/offers/${offerId}/price`),
      fetch(
        `${EGDATA_API}/sandboxes/${offer.namespace}/offers?offerType=BASE_GAME`,
      ),
    ]);

    let originalPrice = 0;
    let currencyCode = "USD";
    let promoEndDate = offer.giveaway?.endDate || "";
    let appliedRules: EgDataAppliedRule[] = [];

    if (priceRes.ok) {
      const priceData: EgDataPrice = await priceRes.json();
      originalPrice = priceData.price.originalPrice;
      currencyCode = priceData.price.currencyCode;
      appliedRules = priceData.appliedRules || [];

      const freeRules = appliedRules.filter(
        (rule) => rule.discountSetting?.discountPercentage === 0,
      );

      const promoRule =
        freeRules.length > 0
          ? freeRules.reduce((latest, current) => {
              const latestDate = new Date(latest.endDate);
              const currentDate = new Date(current.endDate);
              return currentDate > latestDate ? current : latest;
            })
          : null;

      if (promoRule?.endDate) {
        promoEndDate = promoRule.endDate;
      }
    }

    const getSlug = (o: EgDataOffer): string =>
      o.offerMappings?.[0]?.pageSlug || o.urlSlug || "";

    const fallbackPageSlug = getSlug(offer);
    let iosOffer: MobileGameData["iosOffer"] =
      enteredPlatform === "ios"
        ? { id: offer.id, pageSlug: fallbackPageSlug }
        : null;
    let androidOffer: MobileGameData["androidOffer"] =
      enteredPlatform === "android"
        ? { id: offer.id, pageSlug: fallbackPageSlug }
        : null;

    const assignFromOffer = (o: EgDataOffer) => {
      const platform = getPlatform(o.tags || []);
      const pageSlug = getSlug(o);
      if (platform === "ios" && !iosOffer) {
        iosOffer = { id: o.id, pageSlug };
      } else if (platform === "android" && !androidOffer) {
        androidOffer = { id: o.id, pageSlug };
      }
    };

    if (sandboxRes.ok) {
      const sandboxData: EgDataSandboxResponse = await sandboxRes.json();
      for (const item of sandboxData.elements || []) {
        assignFromOffer(item);
        if (iosOffer && androidOffer) break;
      }
    } else if (sandboxRes.status !== 404) {
      console.warn(
        `Sandbox lookup failed for namespace ${offer.namespace} (${sandboxRes.status}); falling back to promotion offers.`,
      );
    }

    if (!iosOffer || !androidOffer) {
      const siblingIds = new Set<string>();
      for (const rule of appliedRules) {
        for (const entry of rule.promotionSetting?.discountOffers || []) {
          if (entry.offerId && entry.offerId !== offer.id) {
            siblingIds.add(entry.offerId);
          }
        }
      }

      if (siblingIds.size > 0) {
        const siblings = await Promise.all(
          [...siblingIds].map(async (id) => {
            try {
              const res = await fetch(`${EGDATA_API}/offers/${id}`);
              if (!res.ok) return null;
              return (await res.json()) as EgDataOffer;
            } catch {
              return null;
            }
          }),
        );
        for (const sibling of siblings) {
          if (sibling) assignFromOffer(sibling);
          if (iosOffer && androidOffer) break;
        }
      }
    }

    const imageUrl =
      (offer.keyImages || []).find(
        (img) =>
          img.type === "OfferImageWide" || img.type === "DieselStoreFrontWide",
      )?.url ||
      offer.keyImages?.[0]?.url ||
      "";

    const gameData: MobileGameData = {
      id: offer.id,
      title: offer.title,
      namespace: offer.namespace,
      imageUrl: `${imageUrl}?w=720&quality=high&resize=1`,
      originalPrice,
      currencyCode,
      promoEndDate,
      seller: offer.seller ? { name: offer.seller.name } : undefined,
      iosOffer,
      androidOffer,
    };
    return { gameData, enteredPlatform };
  } catch (error) {
    console.error("Error fetching mobile game data:", error);
    return null;
  }
}

export async function getMobileGames(): Promise<MobileGameData[]> {
  try {
    const res = await fetch(`${EGDATA_API}/free-games/mobile`);
    if (!res.ok) return [];
    const offers: EgDataOffer[] = await res.json();
    if (!Array.isArray(offers)) return [];

    const results = await Promise.all(
      offers.map((offer) => getMobileGame(offer.id, offer)),
    );

    const getEndTime = (promoEndDate: string) => {
      const endTime = new Date(promoEndDate).getTime();
      return Number.isFinite(endTime) ? endTime : 0;
    };

    const byNamespace = new Map<string, MobileGameData>();
    for (const result of results) {
      if (!result) continue;
      const current = byNamespace.get(result.gameData.namespace);
      const currentEndTime = current ? getEndTime(current.promoEndDate) : 0;
      const nextEndTime = getEndTime(result.gameData.promoEndDate);
      if (!current || nextEndTime > currentEndTime) {
        byNamespace.set(result.gameData.namespace, result.gameData);
      }
    }

    return [...byNamespace.values()];
  } catch (error) {
    console.error("getMobileGames:", error);
    return [];
  }
}

export function formatPrice(cents: number, currencyCode: string): string {
  const amount = cents / 100;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function generateDiscordEmbed(gameData: MobileGameData): object {
  const {
    iosOffer,
    androidOffer,
    namespace,
    title,
    imageUrl,
    originalPrice,
    currencyCode,
    promoEndDate,
  } = gameData;

  const isCombined = Boolean(iosOffer && androidOffer);
  const storeUrl = iosOffer?.pageSlug
    ? `https://store.epicgames.com/en-US/p/${iosOffer.pageSlug}`
    : androidOffer?.pageSlug
      ? `https://store.epicgames.com/en-US/p/${androidOffer.pageSlug}`
      : null;

  const offerParams: string[] = [];
  if (iosOffer) offerParams.push(`1-${namespace}-${iosOffer.id}--`);
  if (androidOffer) offerParams.push(`1-${namespace}-${androidOffer.id}--`);

  const checkoutUrl =
    offerParams.length > 0
      ? `https://store.epicgames.com/purchase?offers=${offerParams.join("&offers=")}#/`
      : null;

  const fieldParts: string[] = [];

  if (checkoutUrl) {
    fieldParts.push(`[Claim Game](${checkoutUrl})`);
  }

  if (originalPrice > 0) {
    const priceStr = formatPrice(originalPrice, currencyCode);
    fieldParts.push(`~~${priceStr}~~ **Free**`);
  } else {
    fieldParts.push(`**Free**`);
  }

  if (isCombined && iosOffer?.pageSlug) {
    fieldParts.push(
      `[iOS](https://store.epicgames.com/en-US/p/${iosOffer.pageSlug})`,
    );
  }
  if (isCombined && androidOffer?.pageSlug) {
    fieldParts.push(
      `[Android](https://store.epicgames.com/en-US/p/${androidOffer.pageSlug})`,
    );
  }

  const embed: EgDataDiscordEmbed = {
    color: 8769099,
    ...(!isCombined && storeUrl && { url: storeUrl }),
    fields: [
      {
        name: "",
        value: fieldParts.join("\n"),
        inline: true,
      },
    ],
    author: {
      name: "Epic Games Store Mobile",
      url: "https://free.wolfey.me/",
      icon_url: "https://up.wolfey.me/gO16VwIQ",
    },
    footer: {
      text: "Offer ends",
    },
    timestamp: promoEndDate ? new Date(promoEndDate).toISOString() : undefined,
    image: imageUrl ? { url: imageUrl } : undefined,
    title,
  };

  return {
    embeds: [embed],
    username: "Free Games",
    avatar_url: "https://up.wolfey.me/gO16VwIQ",
  };
}
