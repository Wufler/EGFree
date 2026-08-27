import type {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export type SettingsCategory =
  | "main"
  | "channels"
  | "format"
  | "toggles"
  | "scheduler";

export interface DiscordRawComponent {
  type: number;
  components?: DiscordRawComponent[];
  accessory?: DiscordRawComponent;
  content?: string;
  items?: Array<{ media: { url: string } }>;
  style?: number;
  label?: string;
  custom_id?: string;
  url?: string;
  divider?: boolean;
  spacing?: number;
}

export interface DiscordV2Payload {
  flags: number;
  components: Array<
    | DiscordRawComponent
    | ActionRowBuilder<
        | ButtonBuilder
        | ChannelSelectMenuBuilder
        | RoleSelectMenuBuilder
        | StringSelectMenuBuilder
      >
  >;
}

export interface CandidateGame {
  index: number;
  id: string;
  title: string;
  type: "pc" | "pc_addon" | "mobile" | "upcoming" | "upcoming_addon";
  platformLabel: string;
  emoji: string;
  isNew: boolean;
  rawDesktopGame?: GameItem;
  rawMobileGame?: MobileGameData;
}
