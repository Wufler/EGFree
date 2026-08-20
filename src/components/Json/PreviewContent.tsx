"use client";
import { Check, ClipboardCopy, Hammer } from "lucide-react";
import Link from "next/link";
import DiscordPreview from "@/components/Json/Embed";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Discord from "@/components/ui/discord";
import { Label } from "@/components/ui/label";

export function JsonPreviewButtons({
  idSuffix = "",
  settings,
  updateSetting,
  copyToClipboard,
  isCopied,
  className = "",
}: {
  idSuffix?: string;
  settings: EgFreeSettings;
  updateSetting: <T extends keyof EgFreeSettings>(
    key: T,
    value: EgFreeSettings[T],
  ) => void;
  copyToClipboard: () => void;
  isCopied: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full ${className}`}>
      <Button
        onClick={copyToClipboard}
        className="w-full sm:flex-1 sm:min-w-0"
        variant="outline"
        size="default"
      >
        {isCopied ? (
          <Check className="size-4" />
        ) : (
          <ClipboardCopy className="size-4" />
        )}
        Copy JSON
      </Button>
      <Label
        htmlFor={`discord${idSuffix}`}
        className="relative w-full sm:flex-1 sm:min-w-0 flex h-8 border border-border dark:border-input dark:bg-input/30 bg-background text-foreground shadow-none hover:bg-muted hover:text-foreground transition-all items-center justify-center gap-2 rounded-lg cursor-pointer text-sm font-medium select-none"
      >
        <Discord className="size-4" />
        Discord Preview
        <Checkbox
          id={`discord${idSuffix}`}
          checked={settings.showDiscordPreview}
          onCheckedChange={(checked) => {
            updateSetting("showDiscordPreview", checked as boolean);
          }}
          className="pointer-events-none shadow-none"
        />
      </Label>
    </div>
  );
}

export default function JsonPreviewContent({
  idSuffix = "",
  jsonData,
  settings,
  updateSetting,
  copyToClipboard,
  isCopied,
  games,
  checkoutLink,
  parsedMobileGames,
  inlineButtons = true,
}: {
  idSuffix?: string;
  jsonData: object;
  settings: EgFreeSettings;
  updateSetting: <T extends keyof EgFreeSettings>(
    key: T,
    value: EgFreeSettings[T],
  ) => void;
  copyToClipboard: () => void;
  isCopied: boolean;
  games: Game;
  checkoutLink: string;
  parsedMobileGames: MobileGame[];
  inlineButtons?: boolean;
}) {
  const activeMobile = parsedMobileGames.filter(
    (g) => !g.promoEndDate || new Date(g.promoEndDate) > new Date(),
  );
  const builderUrl = `https://builder.wolfey.me/?data=${Buffer.from(
    JSON.stringify(jsonData),
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}`;

  return (
    <div className="flex flex-col min-h-full">
      {inlineButtons && (
        <JsonPreviewButtons
          idSuffix={idSuffix}
          settings={settings}
          updateSetting={updateSetting}
          copyToClipboard={copyToClipboard}
          isCopied={isCopied}
          className="p-3 border-b border-border bg-background"
        />
      )}
      <div className="flex-1 p-3">
        {settings.showDiscordPreview ? (
          <div className="rounded-lg overflow-hidden border border-[#d4d7dc] dark:border-[#202225] shadow-xs">
            <DiscordPreview
              games={games}
              settings={settings}
              checkoutLink={checkoutLink}
              parsedMobileGames={activeMobile}
            />
          </div>
        ) : (
          <pre className="rounded-lg border border-border bg-muted/40 p-4 text-muted-foreground overflow-auto text-xs whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        )}
      </div>
      {!settings.componentsV2 && (
        <div className="p-3 border-t border-border bg-background mt-auto">
          <Link
            href={builderUrl}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              size: "default",
              className: "w-full",
            })}
          >
            <Hammer className="size-5" />
            Open in Builder
          </Link>
        </div>
      )}
    </div>
  );
}
