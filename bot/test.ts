import {
  fetchCurrentOffers,
  generateOfferPayloads,
  getCandidateGames,
} from "./services/offerService";
import { loadBotState } from "./state";
import { buildConfirmationPayload } from "./ui/confirmationPrompt";

async function testOfferPayload() {
  console.log("=== 1. Testing offer fetch and candidate games ===");
  const state = loadBotState();
  console.log("Loaded settings:", {
    requireConfirmation: state.settings.requireConfirmation,
    useComponentsV2: state.settings.useComponentsV2,
    splitDesktopMobile: state.settings.splitDesktopMobile,
  });

  const offers = await fetchCurrentOffers([]);
  console.log(
    `Fetched current PC offers: ${offers.effectiveGames.currentGames.length}`,
  );
  console.log(
    `Fetched active Mobile offers: ${offers.activeMobileGames.length}`,
  );
  console.log("Offers list:", offers.titles);

  const candidateGames = getCandidateGames(offers, {
    includeUpcoming: true,
  });
  console.log(`Extracted candidate games (${candidateGames.length}):`);
  for (const cg of candidateGames) {
    console.log(
      `  [${cg.index}] ${cg.emoji} ${cg.title} (${cg.platformLabel}) -> ID: ${cg.id}`,
    );
  }

  console.log("\n=== 2. Testing game selection filtering ===");
  if (candidateGames.length > 1) {
    // Select only the first candidate game
    const singleGameId = candidateGames[0].id;
    const singlePayload = generateOfferPayloads(offers, state.settings, {
      selectedGameIds: [singleGameId],
    });
    console.log(
      "Generated single game payload successfully! Has content:",
      Boolean(singlePayload.combinedPayload || singlePayload.desktopPayload),
    );

    // If mobile game exists, test mobile-only selection
    const mobileCandidate = candidateGames.find((c) => c.type === "mobile");
    if (mobileCandidate) {
      const mobileOnlyPayload = generateOfferPayloads(offers, state.settings, {
        selectedGameIds: [mobileCandidate.id],
      });
      console.log("Generated mobile-only payload successfully! Sample:");
      console.log(
        JSON.stringify(
          mobileOnlyPayload.combinedPayload || mobileOnlyPayload.mobilePayload,
          null,
          2,
        ).slice(0, 300),
      );
    }
  }

  console.log(
    "\n=== 3. Testing Confirmation Prompt Payload (V2 & Classic) ===",
  );
  const v2Prompt = buildConfirmationPayload(offers, {
    includeUpcoming: false,
    selectedIndices: candidateGames.map((c) => c.index),
  });
  console.log(
    "V2 Confirmation Prompt components count:",
    v2Prompt.v2Payload?.components?.length,
  );

  const classicPrompt = buildConfirmationPayload(offers, {
    includeUpcoming: false,
    selectedIndices: [0],
  });
  console.log(
    "Confirmation Prompt (selected index 0) components count:",
    classicPrompt.v2Payload?.components?.length ||
      classicPrompt.classicPayload?.components?.length,
  );

  console.log("\n=== 4. Testing onlyNew mobile addition simulation ===");
  // Simulate PC game already posted, mobile game new
  const simulatedPrevOfferIds = offers.effectiveGames.currentGames.map(
    (g) => g.id,
  );
  const updatedOffers = await fetchCurrentOffers(simulatedPrevOfferIds);
  console.log(
    "Has new offers when PC already posted:",
    updatedOffers.hasNewOffers,
  );
  console.log("Has new desktop offers:", updatedOffers.hasNewDesktopOffers);
  console.log("Has new mobile offers:", updatedOffers.hasNewMobileOffers);
  console.log("New mobile IDs:", updatedOffers.newMobileIds);

  const autoMobilePayload = generateOfferPayloads(
    updatedOffers,
    state.settings,
    {
      onlyNew: true,
    },
  );
  console.log(
    "Generated auto-post payload for newly added mobile game:",
    Boolean(
      autoMobilePayload.combinedPayload || autoMobilePayload.mobilePayload,
    ),
  );

  console.log("\n=== 5. Testing Mystery Games with Custom Checkout Link ===");
  const mysteryGameMock: GameItem = {
    id: "mystery-offer-123",
    title: "Mystery Game",
    description: "Unlock a mystery game every day!",
    offerType: "BASE_GAME",
    namespace: "mysteryns",
    seller: { id: "test", name: "Epic Dev Test Account" },
    productSlug: "mystery-game",
    urlSlug: "mystery-game",
    keyImages: [],
    categories: [{ path: "games" }],
    items: [],
    customAttributes: [],
    price: {
      totalPrice: {
        discountPrice: 0,
        originalPrice: 2999,
        voucherDiscount: 0,
        discount: 2999,
        currencyCode: "USD",
        currencyInfo: { decimals: 2 },
        fmtPrice: {
          originalPrice: "$29.99",
          discountPrice: "0",
          intermediatePrice: "0",
        },
      },
      lineOffers: [],
    },
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 86400000).toISOString(),
              discountSetting: {
                discountType: "PERCENTAGE",
                discountPercentage: 0,
              },
            },
          ],
        },
      ],
      upcomingPromotionalOffers: [],
    },
  };

  const mockMysteryOffers: FetchedOffers = {
    ...offers,
    effectiveGames: {
      currentGames: [mysteryGameMock],
      nextGames: [],
    },
    currentOfferIds: [mysteryGameMock.id],
    newDesktopIds: [mysteryGameMock.id],
    hasNewOffers: true,
    hasNewDesktopOffers: true,
  };

  const customTestLink =
    "https://store.epicgames.com/purchase?offers=1-mysteryns-mystery-offer-123-";

  // Test mystery game with custom link
  const mysteryPayloadWithLink = generateOfferPayloads(
    mockMysteryOffers,
    state.settings,
    { checkoutLink: customTestLink },
  );
  console.log(
    "Generated mystery game payload with custom link successfully:",
    Boolean(
      mysteryPayloadWithLink.combinedPayload ||
        mysteryPayloadWithLink.desktopPayload,
    ),
  );

  const mysteryV2Prompt = buildConfirmationPayload(mockMysteryOffers, {
    checkoutLink: customTestLink,
  });
  console.log(
    "Mystery game V2 confirmation prompt with custom checkout link built successfully. Components:",
    mysteryV2Prompt.v2Payload?.components?.length,
  );

  console.log("\n✅ All tests passed successfully!");
}

testOfferPayload().catch(console.error);
