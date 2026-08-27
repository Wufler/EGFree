"use client";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  FileJson2,
  Save,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import JsonFormContent, {
  JsonFormActions,
} from "@/components/Json/FormContent";
import JsonPreviewContent from "@/components/Json/PreviewContent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Discord from "@/components/ui/discord";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDiscordMessagePayload } from "@/lib/builder/payload";
import { decrypt, encrypt } from "@/lib/encryption";
import { getEffectiveGames, getMobileGameKey } from "@/lib/utils";

const defaultColor = "#85ce4b";
const defaultContent = "<@&847939354978811924>";
const defaultMobileContent = "<@&1494404105471266936>";

const isValidDiscordWebhook = (url: string) => {
  const webhookPattern =
    /^https:\/\/(?:(?:canary\.|ptb\.)?discord\.com|discordapp\.com)\/api(?:\/v\d+)?\/webhooks\/\d+\/[a-zA-Z0-9_-]+(?:\?[^\s#]*)?\/?$/;
  return webhookPattern.test(url.trim());
};

export default function Json({
  games,
  mobile,
}: {
  games: Game;
  mobile: MobileGameData[];
}) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookUrlMobile, setWebhookUrlMobile] = useState("");
  const [messageId, setMessageId] = useState("");
  const [mobileMessageId, setMobileMessageId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileWebhookVisible, setIsMobileWebhookVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [checkoutLink, setCheckoutLink] = useState("");
  const [isWebhookValid, setIsWebhookValid] = useState(false);
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [isMobileWebhookValid, setIsMobileWebhookValid] = useState(false);
  const [isMobileWebhookLoading, setIsMobileWebhookLoading] = useState(false);
  const [saveWebhookTarget, setSaveWebhookTarget] = useState<
    "desktop" | "mobile" | null
  >(null);

  const effectiveGames = useMemo(() => getEffectiveGames(games), [games]);

  const [settings, setSettings] = useState<EgFreeSettings>({
    selectedGames: {},
    embedContent: "",
    embedContentMobile: "",
    splitDesktopMobile: false,
    sendDesktop: true,
    sendMobile: true,
    useDesktopWebhookForMobile: false,
    embedColor: defaultColor,
    includeFooter: true,
    includePrice: true,
    includeImage: true,
    includeCheckout: true,
    includeClaimGame: true,
    componentsV2: true,
    webhookUrl: "",
    webhookUrlMobile: "",
    webhookName: undefined,
    webhookAvatar: undefined,
    webhookNameMobile: undefined,
    webhookAvatarMobile: undefined,
    webhookChannelName: undefined,
    webhookChannelNameMobile: undefined,
    showDiscordPreview: true,
  });
  const activeMobileGames = useMemo(
    () =>
      mobile.filter(
        (game) =>
          !game.promoEndDate || new Date(game.promoEndDate) > new Date(),
      ),
    [mobile],
  );
  const canSplitDesktopMobile = useMemo(() => {
    const hasSelectedDesktopGames = [
      ...effectiveGames.currentGames,
      ...effectiveGames.nextGames,
    ].some((game) => settings.selectedGames[game.id]);
    const hasSelectedMobileGames = activeMobileGames.some(
      (game) => settings.selectedGames[getMobileGameKey(game)],
    );

    return hasSelectedDesktopGames && hasSelectedMobileGames;
  }, [activeMobileGames, effectiveGames, settings.selectedGames]);

  const updateSetting = useCallback(
    <T extends keyof EgFreeSettings>(key: T, value: EgFreeSettings[T]) => {
      setSettings((prev) => {
        if (key === "componentsV2" && prev.componentsV2 !== value) {
          setMessageId("");
        }
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const fetchWebhookInfo = useCallback(
    async (url: string, target: "desktop" | "mobile" = "desktop") => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl || !isValidDiscordWebhook(trimmedUrl)) {
        if (target === "mobile") {
          setIsMobileWebhookValid(false);
          setIsMobileWebhookLoading(false);
          updateSetting("webhookNameMobile", undefined);
          updateSetting("webhookAvatarMobile", undefined);
          updateSetting("webhookChannelNameMobile", undefined);
        } else {
          setIsWebhookValid(false);
          setIsWebhookLoading(false);
          updateSetting("webhookName", undefined);
          updateSetting("webhookAvatar", undefined);
          updateSetting("webhookChannelName", undefined);
        }
        return false;
      }

      if (target === "mobile") {
        setIsMobileWebhookLoading(true);
      } else {
        setIsWebhookLoading(true);
      }

      try {
        const response = await fetch("/api/webhook-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ webhookUrl: trimmedUrl }),
        });

        if (response.ok) {
          const webhookInfo = await response.json();
          if (target === "mobile") {
            updateSetting("webhookNameMobile", webhookInfo.name);
            updateSetting("webhookAvatarMobile", webhookInfo.avatar);
            updateSetting("webhookChannelNameMobile", webhookInfo.channelName);
            setIsMobileWebhookValid(true);
          } else {
            updateSetting("webhookName", webhookInfo.name);
            updateSetting("webhookAvatar", webhookInfo.avatar);
            updateSetting("webhookChannelName", webhookInfo.channelName);
            setIsWebhookValid(true);
          }
          return true;
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch webhook info:", errorText);
          if (target === "mobile") {
            updateSetting("webhookNameMobile", undefined);
            updateSetting("webhookAvatarMobile", undefined);
            updateSetting("webhookChannelNameMobile", undefined);
            setIsMobileWebhookValid(false);
          } else {
            updateSetting("webhookName", undefined);
            updateSetting("webhookAvatar", undefined);
            updateSetting("webhookChannelName", undefined);
            setIsWebhookValid(false);
          }
          return false;
        }
      } catch (error) {
        console.error("Failed to fetch webhook info:", error);
        if (target === "mobile") {
          updateSetting("webhookNameMobile", undefined);
          updateSetting("webhookAvatarMobile", undefined);
          updateSetting("webhookChannelNameMobile", undefined);
          setIsMobileWebhookValid(false);
        } else {
          updateSetting("webhookName", undefined);
          updateSetting("webhookAvatar", undefined);
          updateSetting("webhookChannelName", undefined);
          setIsWebhookValid(false);
        }
        return false;
      } finally {
        if (target === "mobile") {
          setIsMobileWebhookLoading(false);
        } else {
          setIsWebhookLoading(false);
        }
      }
    },
    [updateSetting],
  );

  const jsonData = useMemo(() => {
    return buildDiscordMessagePayload(
      effectiveGames,
      settings,
      checkoutLink,
      mobile,
    );
  }, [effectiveGames, settings, checkoutLink, mobile]);

  if (!canSplitDesktopMobile && settings.splitDesktopMobile) {
    setMessageId("");
    setMobileMessageId("");
    setSettings((prev) => ({ ...prev, splitDesktopMobile: false }));
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadSettings = async () => {
        const savedSettings = localStorage.getItem("egFreeSettings");
        if (savedSettings) {
          try {
            const parsed = JSON.parse(
              savedSettings,
            ) as Partial<EgFreeSettings> & {
              openAccordions?: string[];
              lastCurrentGameIds?: string[];
              lastMobileGameKeys?: string[];
            };
            const { openAccordions, ...parsedRest } = parsed;
            void openAccordions;
            const decryptedWebhook = parsedRest.webhookUrl
              ? await decrypt(parsedRest.webhookUrl)
              : "";
            const decryptedMobileWebhook = parsedRest.webhookUrlMobile
              ? await decrypt(parsedRest.webhookUrlMobile)
              : "";

            const savedCurrentGameIds = new Set(
              parsedRest.lastCurrentGameIds || [],
            );
            const savedMobileKeys = new Set(
              parsedRest.lastMobileGameKeys || [],
            );

            const cleanedSelectedGames: Record<string, boolean> = {};

            effectiveGames.currentGames.forEach((game) => {
              if (savedCurrentGameIds.has(game.id)) {
                cleanedSelectedGames[game.id] =
                  parsedRest.selectedGames?.[game.id] ?? true;
              } else {
                cleanedSelectedGames[game.id] = true;
              }
            });

            effectiveGames.nextGames.forEach((game) => {
              cleanedSelectedGames[game.id] =
                parsedRest.selectedGames?.[game.id] ?? false;
            });

            mobile.forEach((game) => {
              const key = getMobileGameKey(game);
              if (savedMobileKeys.has(key)) {
                cleanedSelectedGames[key] =
                  parsedRest.selectedGames?.[key] ?? true;
              } else {
                cleanedSelectedGames[key] = true;
              }
            });

            setSettings((prev) => ({
              ...prev,
              ...parsedRest,
              selectedGames: cleanedSelectedGames,
              embedColor: parsedRest.embedColor ?? defaultColor,
              webhookUrl: decryptedWebhook,
              webhookUrlMobile: decryptedMobileWebhook,
              webhookName: parsedRest.webhookName,
              webhookAvatar: parsedRest.webhookAvatar,
              webhookNameMobile: parsedRest.webhookNameMobile,
              webhookAvatarMobile: parsedRest.webhookAvatarMobile,
              webhookChannelName: parsedRest.webhookChannelName,
              webhookChannelNameMobile: parsedRest.webhookChannelNameMobile,
              componentsV2: parsedRest.componentsV2 ?? true,
            }));
            setWebhookUrl(decryptedWebhook);
            setWebhookUrlMobile(decryptedMobileWebhook);
            setMessageId("");
            if (decryptedWebhook && isValidDiscordWebhook(decryptedWebhook)) {
              await fetchWebhookInfo(decryptedWebhook);
            }
            if (
              decryptedMobileWebhook &&
              isValidDiscordWebhook(decryptedMobileWebhook)
            ) {
              await fetchWebhookInfo(decryptedMobileWebhook, "mobile");
            }
          } catch (error) {
            console.error("Failed to load settings:", error);
          }
        } else {
          const initialSelectedGames: Record<string, boolean> = {};
          effectiveGames.currentGames.forEach((game) => {
            initialSelectedGames[game.id] = true;
          });
          effectiveGames.nextGames.forEach((game) => {
            initialSelectedGames[game.id] = false;
          });
          mobile.forEach((game) => {
            initialSelectedGames[getMobileGameKey(game)] = true;
          });
          setSettings((prev) => ({
            ...prev,
            selectedGames: initialSelectedGames,
          }));
        }
      };
      loadSettings();
    }
  }, [mobile, effectiveGames, fetchWebhookInfo]);

  useEffect(() => {
    const saveSettings = async () => {
      if (typeof window !== "undefined") {
        try {
          const encryptedWebhook = settings.webhookUrl
            ? await encrypt(settings.webhookUrl)
            : "";
          const encryptedMobileWebhook = settings.webhookUrlMobile
            ? await encrypt(settings.webhookUrlMobile)
            : "";
          const settingsToSave = {
            ...settings,
            webhookUrl: encryptedWebhook,
            webhookUrlMobile: encryptedMobileWebhook,
            checkoutLink,
            lastCurrentGameIds: effectiveGames.currentGames.map((g) => g.id),
            lastMobileGameKeys: mobile.map((g) => getMobileGameKey(g)),
          };
          localStorage.setItem(
            "egFreeSettings",
            JSON.stringify(settingsToSave),
          );
        } catch (error) {
          console.error("Failed to save settings:", error);
        }
      }
    };
    saveSettings();
  }, [settings, checkoutLink, effectiveGames, mobile]);

  const handleColorChange = (color: string) => {
    updateSetting("embedColor", color === defaultColor ? defaultColor : color);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy JSON Data.");
    }
  };

  const canSendWebhook =
    settings.splitDesktopMobile && canSplitDesktopMobile
      ? (!settings.sendDesktop ||
          (isValidDiscordWebhook(webhookUrl) && isWebhookValid)) &&
        (!settings.sendMobile ||
          (settings.useDesktopWebhookForMobile
            ? isValidDiscordWebhook(webhookUrl) && isWebhookValid
            : isValidDiscordWebhook(webhookUrlMobile) && isMobileWebhookValid))
      : isValidDiscordWebhook(webhookUrl) && isWebhookValid;

  const [noOffers, setNoOffers] = useState(false);

  const hasSelectedGames = useMemo(() => {
    const hasSelectedDesktop = [
      ...effectiveGames.currentGames,
      ...effectiveGames.nextGames,
    ].some((game) => settings.selectedGames[game.id]);

    const hasSelectedMobile = activeMobileGames.some(
      (game) => settings.selectedGames[getMobileGameKey(game)],
    );

    if (settings.splitDesktopMobile && canSplitDesktopMobile) {
      if (settings.sendDesktop && !hasSelectedDesktop) return false;
      if (settings.sendMobile && !hasSelectedMobile) return false;
      return true;
    }

    return hasSelectedDesktop || hasSelectedMobile;
  }, [
    effectiveGames,
    activeMobileGames,
    settings.selectedGames,
    settings.splitDesktopMobile,
    canSplitDesktopMobile,
    settings.sendDesktop,
    settings.sendMobile,
  ]);

  const executeSendWebhook = async () => {
    const desktopWebhookUrl = webhookUrl.trim();
    const mobileWebhookTargetUrl = (
      settings.useDesktopWebhookForMobile ? webhookUrl : webhookUrlMobile
    ).trim();

    try {
      setIsLoading(true);
      setShowWarning(false);

      if (settings.splitDesktopMobile && canSplitDesktopMobile) {
        const desktopPayload = buildDiscordMessagePayload(
          effectiveGames,
          settings,
          checkoutLink,
          [],
        );
        const mobilePayload = buildDiscordMessagePayload(
          { currentGames: [], nextGames: [] },
          {
            ...settings,
            embedContent: settings.embedContentMobile || defaultMobileContent,
          },
          checkoutLink,
          mobile,
        );

        const sendOne = async (
          payload: object,
          targetWebhookUrl: string,
          msgId: string,
          label: string,
        ): Promise<{ ok: boolean; messageId?: string; label: string }> => {
          const res = await fetch("/api/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              webhookUrl: targetWebhookUrl,
              jsonData: payload,
              messageId: msgId,
            }),
          });
          if (!res.ok) {
            return { ok: false, label };
          }
          const data = await res.json();
          return { ok: true, messageId: data.messageId, label };
        };

        if (settings.sendDesktop) {
          const deskRes = await sendOne(
            desktopPayload,
            desktopWebhookUrl,
            messageId,
            "desktop",
          );
          if (deskRes.ok) {
            if (!messageId && deskRes.messageId)
              setMessageId(deskRes.messageId);
            toast.success(
              messageId ? "Desktop message updated." : "Desktop message sent.",
            );
          } else {
            toast.error("Failed to send desktop message.");
          }
        }

        if (settings.sendMobile) {
          const mobRes = await sendOne(
            mobilePayload,
            mobileWebhookTargetUrl,
            mobileMessageId,
            "mobile",
          );
          if (mobRes.ok) {
            if (!mobileMessageId && mobRes.messageId)
              setMobileMessageId(mobRes.messageId);
            toast.success(
              mobileMessageId
                ? "Mobile message updated."
                : "Mobile message sent.",
            );
          } else {
            toast.error("Failed to send mobile message.");
          }
        }

        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhookUrl: desktopWebhookUrl,
          jsonData,
          messageId,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (messageId) {
          toast.success("Successfully updated message.");
        } else {
          toast.success("Successfully sent data.");
          if (responseData.messageId) {
            setMessageId(responseData.messageId);
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send JSON Data.");
      }
    } catch (error) {
      console.error("Failed to send:", error);
      toast.error("Failed to send JSON Data.", {
        description: "The webhook or data might be invalid.",
      });
    }
    setIsLoading(false);
  };

  const handleWebhook = async () => {
    const desktopWebhookUrl = webhookUrl.trim();
    const mobileWebhookTargetUrl = (
      settings.useDesktopWebhookForMobile ? webhookUrl : webhookUrlMobile
    ).trim();
    if (settings.splitDesktopMobile && canSplitDesktopMobile) {
      if (!settings.sendDesktop && !settings.sendMobile) {
        toast.error("Select at least desktop or mobile to send.");
        return;
      }
      if (
        settings.sendDesktop &&
        (!isValidDiscordWebhook(desktopWebhookUrl) || !isWebhookValid)
      ) {
        toast.error("Insert a valid desktop webhook URL.");
        return;
      }
      if (
        settings.sendMobile &&
        (!isValidDiscordWebhook(mobileWebhookTargetUrl) ||
          (settings.useDesktopWebhookForMobile
            ? !isWebhookValid
            : !isMobileWebhookValid))
      ) {
        toast.error("Insert a valid mobile webhook URL.");
        return;
      }
    } else {
      if (!desktopWebhookUrl) {
        toast.error("Insert a webhook.");
        return;
      }
      if (!isValidDiscordWebhook(desktopWebhookUrl) || !isWebhookValid) {
        toast.error("Invalid Discord webhook URL.");
        return;
      }
    }

    if (!showWarning) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    if (!hasSelectedGames) {
      setShowWarning(false);
      setNoOffers(true);
      return;
    }

    await executeSendWebhook();
  };

  const desktopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedFetchWebhookInfo = useCallback(
    (url: string, target: "desktop" | "mobile" = "desktop") => {
      const timeoutRef =
        target === "mobile" ? mobileTimeoutRef : desktopTimeoutRef;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const trimmed = url.trim();
      if (!trimmed || !isValidDiscordWebhook(trimmed)) {
        if (target === "mobile") {
          setIsMobileWebhookValid(false);
          setIsMobileWebhookLoading(false);
          updateSetting("webhookNameMobile", undefined);
          updateSetting("webhookAvatarMobile", undefined);
          updateSetting("webhookChannelNameMobile", undefined);
        } else {
          setIsWebhookValid(false);
          setIsWebhookLoading(false);
          updateSetting("webhookName", undefined);
          updateSetting("webhookAvatar", undefined);
          updateSetting("webhookChannelName", undefined);
        }
        return;
      }

      if (target === "mobile") {
        setIsMobileWebhookLoading(true);
      } else {
        setIsWebhookLoading(true);
      }

      timeoutRef.current = setTimeout(() => {
        fetchWebhookInfo(trimmed, target);
      }, 500);
    },
    [fetchWebhookInfo, updateSetting],
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setWebhookUrl(trimmed);
      if (trimmed) {
        await fetchWebhookInfo(trimmed, "desktop");
      }
    } catch (err) {
      console.error("Failed to paste text:", err);
      toast.error("Clipboard permission denied", {
        description:
          "Please allow clipboard permissions in your browser or paste directly using Ctrl+V.",
      });
    }
  };
  const handlePasteMobile = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setWebhookUrlMobile(trimmed);
      if (trimmed) {
        await fetchWebhookInfo(trimmed, "mobile");
      }
    } catch (err) {
      console.error("Failed to paste mobile webhook text:", err);
      toast.error("Clipboard permission denied", {
        description:
          "Please allow clipboard permissions in your browser or paste directly using Ctrl+V.",
      });
    }
  };

  const handleConfirmSaveWebhook = () => {
    if (saveWebhookTarget === "mobile") {
      updateSetting("webhookUrlMobile", webhookUrlMobile);
      fetchWebhookInfo(webhookUrlMobile, "mobile");
      toast.success("Mobile webhook saved locally");
    } else {
      updateSetting("webhookUrl", webhookUrl);
      fetchWebhookInfo(webhookUrl, "desktop");
      toast.success("Webhook saved locally");
    }
    setSaveWebhookTarget(null);
  };

  const formProps = {
    games: effectiveGames,
    settings,
    parsedMobileGames: mobile,
    canSplitDesktopMobile,
    webhookUrl,
    setWebhookUrl,
    webhookUrlMobile,
    setWebhookUrlMobile,
    messageId,
    setMessageId,
    mobileMessageId,
    setMobileMessageId,
    checkoutLink,
    setCheckoutLink,
    isVisible,
    setIsVisible,
    isMobileWebhookVisible,
    setIsMobileWebhookVisible,
    isWebhookValid,
    isWebhookLoading,
    isMobileWebhookValid,
    isMobileWebhookLoading,
    onSaveDesktop: () => setSaveWebhookTarget("desktop"),
    onSaveMobile: () => setSaveWebhookTarget("mobile"),
    isLoading,
    showWarning,
    updateSetting,
    handleColorChange,
    handleWebhook,
    handlePaste,
    handlePasteMobile,
    canSendWebhook,
    debouncedFetchWebhookInfo,
    defaultContent,
    defaultMobileContent,
  };

  const previewProps = {
    jsonData,
    settings,
    updateSetting,
    copyToClipboard,
    isCopied,
    games: effectiveGames,
    checkoutLink,
    parsedMobileGames: mobile,
  };

  return (
    <>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" className="rounded-full">
              <FileJson2 className="size-5!" />
              JSON
            </Button>
          }
        />
        <DialogContent
          showCloseButton={false}
          className="top-0! left-0! translate-x-0! translate-y-0! sm:top-1/2! sm:left-1/2! sm:-translate-x-1/2! sm:-translate-y-1/2! w-full max-w-none sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl sm:w-[calc(100%-2rem)] h-dvh sm:h-[90vh] sm:max-h-[900px] p-0 gap-0 overflow-hidden bg-background border-0 sm:border sm:border-border rounded-none sm:rounded-xl shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border shrink-0 bg-background relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileJson2 className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold tracking-tight truncate">
                  JSON Builder
                </DialogTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isCopied ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <ClipboardCopy className="size-3.5" />
                  )}
                  {isCopied ? "Copied!" : "Copy JSON"}
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    updateSetting(
                      "showDiscordPreview",
                      !settings.showDiscordPreview,
                    )
                  }
                  className={`gap-1.5 text-xs font-semibold transition-all ${
                    settings.showDiscordPreview
                      ? "bg-[#5865F2] hover:bg-[#4752C4] text-white border-transparent shadow-sm"
                      : "border border-border dark:border-input dark:bg-input/30 bg-background text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Discord
                    className={`size-3.5 ${
                      settings.showDiscordPreview
                        ? "text-white"
                        : "text-[#5865F2]"
                    }`}
                  />
                  Discord Preview
                </Button>
              </div>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </Button>
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden relative">
            <div className="lg:hidden h-full">
              <Tabs
                defaultValue="form"
                className="h-full flex flex-col min-h-0 gap-0"
              >
                <TabsList className="w-full h-auto rounded-none border-b border-border bg-transparent p-0 shrink-0">
                  <TabsTrigger
                    value="form"
                    className="flex-1 relative rounded-none py-2.5 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-active:bg-transparent data-active:shadow-none data-active:after:bg-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary font-medium text-sm"
                  >
                    Configure
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex-1 relative rounded-none py-2.5 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-active:bg-transparent data-active:shadow-none data-active:after:bg-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary font-medium text-sm"
                  >
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="form"
                  className="flex-1 min-h-0 m-0 outline-none flex flex-col overflow-hidden"
                >
                  <ScrollArea className="flex-1 min-h-0">
                    <JsonFormContent idSuffix="-mobile" {...formProps} />
                  </ScrollArea>
                  <div className="p-4 border-t border-border bg-background shrink-0">
                    <JsonFormActions {...formProps} />
                  </div>
                </TabsContent>
                <TabsContent
                  value="preview"
                  className="flex-1 min-h-0 m-0 p-4 outline-none overflow-y-auto"
                >
                  <JsonPreviewContent inlineButtons={true} {...previewProps} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="hidden lg:grid h-full lg:grid-cols-[1fr_auto_1fr] xl:grid-cols-[1fr_auto_1.2fr] divide-x divide-border">
              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
                <ScrollArea className="flex-1 min-h-0">
                  <JsonFormContent {...formProps} />
                </ScrollArea>
                <div className="p-4 border-t border-border bg-background shrink-0">
                  <JsonFormActions {...formProps} />
                </div>
              </div>

              <div className="w-px bg-border h-full shrink-0" />

              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-muted/10">
                <ScrollArea className="h-full bg-background">
                  <div className="w-full">
                    <JsonPreviewContent
                      inlineButtons={false}
                      {...previewProps}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={saveWebhookTarget !== null}
        onOpenChange={(open) => !open && setSaveWebhookTarget(null)}
      >
        <AlertDialogContent className="border-primary/20 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <Save className="size-5" /> Warning
            </AlertDialogTitle>
            <AlertDialogDescription
              render={<div />}
              className="space-y-2 text-base"
            >
              <p>
                {saveWebhookTarget === "mobile"
                  ? "This will encrypt and save your mobile webhook in your browser's local storage."
                  : "This will encrypt and save your webhook in your browser's local storage and will automatically populate the URL input."}
              </p>
              <p className="font-semibold text-foreground text-sm mt-1">
                Consider manually pasting the webhook as a safer alternative.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveWebhook}>
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={noOffers} onOpenChange={setNoOffers}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="size-5" />
              No Offers Selected
            </AlertDialogTitle>
            <AlertDialogDescription>
              You haven&apos;t selected any offers to include in the webhook
              message. Are you sure you want to send without any offers?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setNoOffers(false);
                executeSendWebhook();
              }}
              className="text-white dark:text-black"
            >
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
