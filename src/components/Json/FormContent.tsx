"use client";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  Check,
  Clipboard,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  Loader2,
  Monitor,
  Paintbrush2,
  Palette,
  Pen,
  Save,
  Send,
  ShoppingCart,
  Smartphone,
  Undo2,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn, getMobileGameKey } from "@/lib/utils";

const defaultColor = "#85ce4b";

type IconType = ComponentType<{ className?: string; size?: number }>;

const optionCheckboxClass =
  "border-input has-data-checked:border-primary/50 has-data-checked:bg-primary/5 has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 shadow-none outline-none bg-background transition-all hover:bg-accent/50 hover:border-primary/50";

function SectionHeader({
  icon: Icon,
  title,
  trailing,
}: {
  icon: IconType;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border pb-2.5">
      <span className="flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="size-4" />
      </span>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {trailing ? <div className="ml-auto">{trailing}</div> : null}
    </div>
  );
}

function OptionRow({
  id,
  icon: Icon,
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  id: string;
  icon: IconType;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        optionCheckboxClass,
        "flex",
        disabled && "opacity-50 grayscale pointer-events-none",
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium leading-tight">
        <Icon className="opacity-70 shrink-0" size={14} />
        {label}
      </span>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        disabled={disabled}
        className="shadow-sm"
      />
    </Label>
  );
}

function GameSelectionList({
  games,
  type,
  settings,
  updateSetting,
}: {
  games: { id: string; title: string }[];
  type: string;
  settings: EgFreeSettings;
  updateSetting: <T extends keyof EgFreeSettings>(
    key: T,
    value: EgFreeSettings[T],
  ) => void;
}) {
  const allSelected = games.every((game) => settings.selectedGames[game.id]);
  const handleToggleAll = () => {
    const newSelectedGames = { ...settings.selectedGames };
    const shouldSelectAll = !allSelected;
    games.forEach((game) => {
      newSelectedGames[game.id] = shouldSelectAll;
    });
    updateSetting("selectedGames", newSelectedGames);
  };
  return (
    <div className="space-y-3 p-3.5 rounded-lg bg-muted/20 border border-border">
      <div className="flex items-center justify-between pb-2.5 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          {type === "Desktop" ? (
            <Monitor className="size-4" />
          ) : type === "Mobile" ? (
            <Smartphone className="size-4" />
          ) : (
            <CalendarDays className="size-4" />
          )}
          {type}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleAll}
          className="h-6 px-2.5 text-xs bg-muted/60 hover:bg-muted rounded-md"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>
      <div className="grid gap-2">
        {games.map((game) => (
          <Label
            key={game.id}
            htmlFor={game.id}
            className="relative flex items-center w-full gap-3 rounded-lg border border-input p-3 bg-background hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all has-data-checked:border-primary/50 has-data-checked:bg-primary/5 has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 group"
          >
            <Checkbox
              id={game.id}
              checked={settings.selectedGames[game.id] ?? false}
              onCheckedChange={(checked) => {
                updateSetting("selectedGames", {
                  ...settings.selectedGames,
                  [game.id]: checked as boolean,
                });
              }}
              className="mt-0"
            />
            <span className="font-medium text-sm cursor-pointer">
              {game.title}
            </span>
          </Label>
        ))}
      </div>
    </div>
  );
}

function WebhookInput({
  id,
  label,
  value,
  onChange,
  onPaste,
  onSave,
  isVisible,
  setIsVisible,
  isValid,
  isValidating,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  onSave: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  isValid: boolean;
  isValidating?: boolean;
}) {
  const filled = value.trim().length > 0;
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-semibold flex items-center gap-1.5"
      >
        {label}
      </Label>
      <div className="flex items-stretch h-9 ring-1 ring-input rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary transition-all">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
          placeholder="https://discord.com/api/webhooks/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").trim();
            if (text) {
              e.preventDefault();
              onChange(text);
            }
          }}
          className="h-auto grow min-w-0 border-0 rounded-none focus-visible:ring-0 shadow-none text-sm"
        />
        {filled && (
          <span
            className={cn(
              "flex w-8 shrink-0 items-center justify-center",
              isValidating
                ? "text-muted-foreground"
                : isValid
                  ? "text-primary"
                  : "text-red-500",
            )}
            title={
              isValidating
                ? "Checking webhook URL..."
                : isValid
                  ? "Valid webhook URL"
                  : "Invalid webhook URL"
            }
          >
            {isValidating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isValid ? (
              <Check className="size-4" />
            ) : (
              <X className="size-4" />
            )}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-none border-l hover:bg-accent hover:text-accent-foreground disabled:opacity-100 disabled:text-muted-foreground"
          disabled={!filled || !isValid || isValidating}
          onClick={onSave}
          title="Save webhook locally"
        >
          <Save className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPaste}
          className="size-9 shrink-0 rounded-none border-l hover:bg-accent hover:text-accent-foreground"
          title="Paste from clipboard"
        >
          <Clipboard className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageIdField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const pasteMessageId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (/^\d+$/.test(text.trim())) {
        onChange(text.trim());
      } else {
        toast.error("Message ID must contain only numbers");
      }
    } catch {
      toast.error("Clipboard permission denied", {
        description:
          "Please allow clipboard permissions in your browser or paste directly using Ctrl+V.",
      });
    }
  };
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-semibold flex items-center gap-1.5"
      >
        {label}
      </Label>
      <div className="flex items-stretch h-9 ring-1 ring-input rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary transition-all">
        <Input
          id={id}
          placeholder="Optional — leave empty to send a new message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-auto grow min-w-0 border-0 rounded-none focus-visible:ring-0 shadow-none text-sm"
          disabled={disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={pasteMessageId}
          className="size-9 shrink-0 rounded-none border-l hover:bg-accent hover:text-accent-foreground"
          disabled={disabled}
          title="Paste message ID"
        >
          <Clipboard className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function JsonFormActions({
  isLoading,
  showWarning,
  canSendWebhook,
  settings,
  messageId,
  mobileMessageId,
  handleWebhook,
}: {
  isLoading: boolean;
  showWarning: boolean;
  canSendWebhook: boolean;
  settings: EgFreeSettings;
  messageId: string;
  mobileMessageId: string;
  handleWebhook: () => void | Promise<void>;
}) {
  const isUpdate = settings.splitDesktopMobile
    ? Boolean(messageId || mobileMessageId)
    : Boolean(messageId);
  return (
    <Button
      onClick={handleWebhook}
      className={`w-full py-6 text-md transition-all duration-300 ${
        showWarning
          ? "bg-yellow-500 hover:bg-yellow-600 text-black outline-8 outline-yellow-500/20"
          : "bg-primary hover:bg-primary/90 text-white dark:text-black"
      }`}
      disabled={isLoading || !canSendWebhook}
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : showWarning ? (
        <AlertTriangle className="size-5" />
      ) : isUpdate ? (
        <Pen className="size-5" />
      ) : (
        <Send className="size-5" />
      )}
      {showWarning
        ? "Click again to confirm"
        : settings.splitDesktopMobile
          ? isUpdate
            ? "Update Split Messages"
            : "Send Split Messages"
          : isUpdate
            ? "Update Existing Message"
            : "Send Messages"}
    </Button>
  );
}

export default function JsonFormContent({
  idSuffix = "",
  games,
  settings,
  parsedMobileGames,
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
  onSaveDesktop,
  onSaveMobile,
  updateSetting,
  handleColorChange,
  handlePaste,
  handlePasteMobile,
  debouncedFetchWebhookInfo,
  defaultContent,
  defaultMobileContent,
}: {
  idSuffix?: string;
  games: Game;
  settings: EgFreeSettings;
  parsedMobileGames: MobileGame[];
  canSplitDesktopMobile: boolean;
  webhookUrl: string;
  setWebhookUrl: (v: string) => void;
  webhookUrlMobile: string;
  setWebhookUrlMobile: (v: string) => void;
  messageId: string;
  setMessageId: (v: string) => void;
  mobileMessageId: string;
  setMobileMessageId: (v: string) => void;
  checkoutLink: string;
  setCheckoutLink: (v: string) => void;
  isVisible: boolean;
  setIsVisible: (v: boolean) => void;
  isMobileWebhookVisible: boolean;
  setIsMobileWebhookVisible: (v: boolean) => void;
  isWebhookValid: boolean;
  isWebhookLoading: boolean;
  isMobileWebhookValid: boolean;
  isMobileWebhookLoading: boolean;
  onSaveDesktop: () => void;
  onSaveMobile: () => void;
  updateSetting: <T extends keyof EgFreeSettings>(
    key: T,
    value: EgFreeSettings[T],
  ) => void;
  handleColorChange: (color: string) => void;
  handlePaste: () => void;
  handlePasteMobile: () => void;
  debouncedFetchWebhookInfo: (
    url: string,
    target?: "desktop" | "mobile",
  ) => void;
  defaultContent: string;
  defaultMobileContent: string;
}) {
  const activeMobile = parsedMobileGames.filter(
    (g) => !g.promoEndDate || new Date(g.promoEndDate) > new Date(),
  );
  const selectedCurrentCount = games.currentGames.filter(
    (game) => settings.selectedGames[game.id],
  ).length;
  const hasGames =
    games.currentGames.length > 0 ||
    games.nextGames.length > 0 ||
    activeMobile.length > 0;
  const isDesktopMessageIdDisabled =
    settings.splitDesktopMobile && !settings.sendDesktop;
  const isMobileMessageIdDisabled =
    settings.splitDesktopMobile && !settings.sendMobile;
  const showDesktopWebhookField =
    !settings.splitDesktopMobile ||
    (settings.splitDesktopMobile && canSplitDesktopMobile);
  const showMobileWebhookField =
    settings.splitDesktopMobile &&
    canSplitDesktopMobile &&
    !settings.useDesktopWebhookForMobile;
  const allOptionsSelected =
    settings.includePrice &&
    settings.includeImage &&
    settings.includeFooter &&
    settings.includeCheckout &&
    settings.includeClaimGame;

  const clearMessageIds = () => {
    setMessageId("");
    setMobileMessageId("");
  };

  const pasteRoleId = async (append: (roleId: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (/^\d+$/.test(trimmed)) {
        append(trimmed);
      } else {
        toast.error("Clipboard content must be a role ID");
      }
    } catch {
      toast.error("Clipboard permission denied", {
        description:
          "Please allow clipboard permissions in your browser or paste directly.",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="px-5 sm:px-6 py-5 space-y-6 pb-8">
        <section className="space-y-3">
          <SectionHeader icon={Gamepad2} title="Games" />
          {!hasGames ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              No games available to select.
            </div>
          ) : (
            <div className="grid gap-4">
              {games.currentGames.length > 0 && (
                <GameSelectionList
                  games={games.currentGames}
                  type="Desktop"
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}
              {activeMobile.length > 0 && (
                <GameSelectionList
                  games={activeMobile.map((g) => ({
                    id: getMobileGameKey(g),
                    title:
                      g.title +
                      (g.iosOffer && !g.androidOffer
                        ? " (iOS)"
                        : !g.iosOffer && g.androidOffer
                          ? " (Android)"
                          : ""),
                  }))}
                  type="Mobile"
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}
              {games.nextGames.length > 0 && (
                <GameSelectionList
                  games={games.nextGames}
                  type="Upcoming"
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {canSplitDesktopMobile && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <OptionRow
                id={`split-toggle${idSuffix}`}
                icon={Edit}
                label="Split desktop & mobile"
                checked={settings.splitDesktopMobile}
                onCheckedChange={(checked) => {
                  clearMessageIds();
                  updateSetting("splitDesktopMobile", checked);
                }}
              />
              {settings.splitDesktopMobile && (
                <>
                  <OptionRow
                    id={`split-use-desktop-webhook${idSuffix}`}
                    icon={ArrowRightLeft}
                    label="Use same webhook for both"
                    checked={settings.useDesktopWebhookForMobile}
                    onCheckedChange={(checked) => {
                      clearMessageIds();
                      updateSetting("useDesktopWebhookForMobile", checked);
                    }}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <OptionRow
                      id={`split-send-desktop${idSuffix}`}
                      icon={Monitor}
                      label="Send desktop"
                      checked={settings.sendDesktop}
                      onCheckedChange={(checked) => {
                        clearMessageIds();
                        updateSetting("sendDesktop", checked);
                      }}
                    />
                    <OptionRow
                      id={`split-send-mobile${idSuffix}`}
                      icon={Smartphone}
                      label="Send mobile"
                      checked={settings.sendMobile}
                      onCheckedChange={(checked) => {
                        clearMessageIds();
                        updateSetting("sendMobile", checked);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-4">
            {showDesktopWebhookField && (
              <WebhookInput
                id={`webhook-url${idSuffix}`}
                label={
                  settings.splitDesktopMobile &&
                  !settings.useDesktopWebhookForMobile ? (
                    <>
                      <Monitor className="size-3.5 text-primary" /> Desktop
                      Webhook URL
                    </>
                  ) : (
                    "Webhook URL"
                  )
                }
                value={webhookUrl}
                onChange={(value) => {
                  setWebhookUrl(value);
                  debouncedFetchWebhookInfo(value, "desktop");
                }}
                onPaste={handlePaste}
                onSave={onSaveDesktop}
                isVisible={isVisible}
                setIsVisible={setIsVisible}
                isValid={isWebhookValid}
                isValidating={isWebhookLoading}
              />
            )}
            {showMobileWebhookField && (
              <WebhookInput
                id={`webhook-url-mobile${idSuffix}`}
                label={
                  <>
                    <Smartphone className="size-3.5 text-primary" /> Mobile
                    Webhook URL
                  </>
                }
                value={webhookUrlMobile}
                onChange={(value) => {
                  setWebhookUrlMobile(value);
                  debouncedFetchWebhookInfo(value, "mobile");
                }}
                onPaste={handlePasteMobile}
                onSave={onSaveMobile}
                isVisible={isMobileWebhookVisible}
                setIsVisible={setIsMobileWebhookVisible}
                isValid={isMobileWebhookValid}
                isValidating={isMobileWebhookLoading}
              />
            )}
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor={`message-content${idSuffix}`}
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  {settings.splitDesktopMobile && (
                    <Monitor className="size-3.5 text-primary" />
                  )}
                  {settings.splitDesktopMobile
                    ? "Desktop Message Content"
                    : "Message Content"}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
                  onClick={() =>
                    pasteRoleId((roleId) =>
                      updateSetting(
                        "embedContent",
                        `${settings.embedContent}<@&${roleId}>`,
                      ),
                    )
                  }
                >
                  Paste Role ID
                </Button>
              </div>
              <Textarea
                id={`message-content${idSuffix}`}
                placeholder={defaultContent}
                value={settings.embedContent}
                onChange={(e) => updateSetting("embedContent", e.target.value)}
                className="min-h-16 max-h-32 text-sm wrap-anywhere resize-y border-input focus-visible:ring-primary"
              />
            </div>

            {settings.splitDesktopMobile && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor={`message-content-mobile${idSuffix}`}
                      className="text-sm font-semibold flex items-center gap-1.5"
                    >
                      <Smartphone className="size-3.5 text-primary" />
                      Mobile Message Content
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs text-muted-foreground hover:text-primary"
                      onClick={() =>
                        pasteRoleId((roleId) =>
                          updateSetting(
                            "embedContentMobile",
                            `${settings.embedContentMobile}<@&${roleId}>`,
                          ),
                        )
                      }
                    >
                      Paste Role ID
                    </Button>
                  </div>
                  <Textarea
                    id={`message-content-mobile${idSuffix}`}
                    placeholder={defaultMobileContent}
                    value={settings.embedContentMobile}
                    onChange={(e) =>
                      updateSetting("embedContentMobile", e.target.value)
                    }
                    className="min-h-16 max-h-32 text-sm wrap-anywhere resize-y border-input focus-visible:ring-primary"
                  />
                </div>

                <MessageIdField
                  id={`message-id${idSuffix}`}
                  label={
                    <>
                      {settings.splitDesktopMobile && (
                        <Monitor className="size-3.5 text-primary" />
                      )}
                      {settings.splitDesktopMobile
                        ? "Desktop Message ID"
                        : "Message ID"}
                    </>
                  }
                  value={messageId}
                  onChange={setMessageId}
                  disabled={isDesktopMessageIdDisabled}
                />

                <MessageIdField
                  id={`message-id-mobile${idSuffix}`}
                  label={
                    <>
                      <Smartphone className="size-3.5 text-primary" /> Mobile
                      Message ID
                    </>
                  }
                  value={mobileMessageId}
                  onChange={setMobileMessageId}
                  disabled={isMobileMessageIdDisabled}
                />
              </>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            icon={Palette}
            title="Appearance"
            trailing={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newValue = !allOptionsSelected;
                  updateSetting("includePrice", newValue);
                  updateSetting("includeImage", newValue);
                  updateSetting("includeFooter", newValue);
                  updateSetting("includeCheckout", newValue);
                  updateSetting("includeClaimGame", newValue);
                }}
                className="px-3 text-xs rounded-full"
              >
                {allOptionsSelected ? "Deselect All" : "Select All"}
              </Button>
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <OptionRow
              id={`components-v2${idSuffix}`}
              icon={Paintbrush2}
              label="Components V2"
              checked={settings.componentsV2}
              onCheckedChange={(checked) => {
                setMessageId("");
                updateSetting("componentsV2", checked);
              }}
            />
            <OptionRow
              id={`include-price${idSuffix}`}
              icon={DollarSign}
              label="Price"
              checked={settings.includePrice}
              onCheckedChange={(checked) =>
                updateSetting("includePrice", checked)
              }
            />
            <OptionRow
              id={`include-image${idSuffix}`}
              icon={ImageIcon}
              label="Thumbnails"
              checked={settings.includeImage}
              onCheckedChange={(checked) =>
                updateSetting("includeImage", checked)
              }
            />
            <OptionRow
              id={`include-footer${idSuffix}`}
              icon={Clock}
              label="Timestamp"
              checked={settings.includeFooter}
              onCheckedChange={(checked) =>
                updateSetting("includeFooter", checked)
              }
            />
            <OptionRow
              id={`include-claim${idSuffix}`}
              icon={ExternalLink}
              label="Claim Links"
              checked={settings.includeClaimGame}
              onCheckedChange={(checked) =>
                updateSetting("includeClaimGame", checked)
              }
            />
            <OptionRow
              id={`include-checkout${idSuffix}`}
              icon={ShoppingCart}
              label="Checkout Button"
              checked={settings.includeCheckout}
              onCheckedChange={(checked) =>
                updateSetting("includeCheckout", checked)
              }
              disabled={selectedCurrentCount < 1}
            />
          </div>

          {settings.includeCheckout && selectedCurrentCount >= 1 && (
            <div className="p-4 bg-muted/40 rounded-lg border border-dashed space-y-3">
              <Label
                htmlFor={`checkout-link${idSuffix}`}
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <ShoppingCart className="size-4 text-primary" />
                Manual Checkout Override
              </Label>
              <Textarea
                id={`checkout-link${idSuffix}`}
                placeholder="https://store.epicgames.com/purchase?offers=1-{namespace}-{id}-#"
                value={checkoutLink}
                onChange={(e) => setCheckoutLink(e.target.value)}
                className="max-h-24 text-sm font-mono bg-background focus-visible:ring-primary"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Leave empty to use automatic link.</span>
                <a
                  href="https://up.wolfey.me/milb5OsF"
                  target="_blank"
                  className="text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-primary/20"
                  rel="noopener"
                >
                  <ImageIcon className="size-3" /> View instruction image
                </a>
              </div>
            </div>
          )}

          {!settings.componentsV2 && (
            <div className="space-y-3 pt-2">
              <Label
                htmlFor={`sidebar-color${idSuffix}`}
                className="text-sm font-semibold"
              >
                Embed Color
              </Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-9 h-9 p-0 rounded-md border-2 shadow-sm transition-all hover:scale-105"
                        style={{
                          backgroundColor: settings.embedColor,
                          borderColor: settings.embedColor,
                        }}
                      />
                    }
                  />
                  <PopoverContent
                    className="w-auto p-4 z-90 border-border/50 shadow-xl rounded-xl"
                    align="start"
                  >
                    <HexColorPicker
                      color={settings.embedColor}
                      onChange={handleColorChange}
                      className="w-full mb-4"
                    />
                    <Button
                      onClick={() => handleColorChange(defaultColor)}
                      variant="secondary"
                      size="sm"
                      className="w-full font-medium"
                    >
                      <Undo2 className="size-4" />
                      Reset Default
                    </Button>
                  </PopoverContent>
                </Popover>
                <Input
                  id={`sidebar-color${idSuffix}`}
                  value={settings.embedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  maxLength={7}
                  className="text-sm font-mono max-w-30 uppercase tracking-wider"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
