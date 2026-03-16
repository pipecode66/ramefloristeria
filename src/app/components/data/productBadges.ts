export interface ArrangementBadge {
  text: string;
  emoji?: string;
  backgroundColor: string;
  textColor: string;
}

export const DEFAULT_BADGE_BACKGROUND_COLOR = "#4a6741";
export const DEFAULT_BADGE_TEXT_COLOR = "#fdf6f0";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const sanitizeBadgeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const sanitizeBadgeColor = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
};

export const splitLegacyBadgeLabel = (label: string) => {
  const trimmed = label.trim();
  if (!trimmed) {
    return { text: "", emoji: "" };
  }

  const firstSpaceIndex = trimmed.indexOf(" ");
  if (firstSpaceIndex <= 0) {
    return { text: trimmed, emoji: "" };
  }

  const possibleEmoji = trimmed.slice(0, firstSpaceIndex).trim();
  const text = trimmed.slice(firstSpaceIndex + 1).trim();
  const looksLikeEmoji = /\p{Extended_Pictographic}/u.test(possibleEmoji);

  if (!looksLikeEmoji || !text) {
    return { text: trimmed, emoji: "" };
  }

  return { text, emoji: possibleEmoji };
};

export const normalizeBadge = (value: unknown): ArrangementBadge | undefined => {
  if (!value) return undefined;

  if (typeof value === "string") {
    const parsed = splitLegacyBadgeLabel(value);
    if (!parsed.text) return undefined;

    return {
      text: parsed.text,
      emoji: parsed.emoji || undefined,
      backgroundColor: DEFAULT_BADGE_BACKGROUND_COLOR,
      textColor: DEFAULT_BADGE_TEXT_COLOR,
    };
  }

  if (typeof value !== "object") return undefined;
  const parsed = value as Partial<ArrangementBadge>;
  const text = sanitizeBadgeText(parsed.text);
  const emoji = sanitizeBadgeText(parsed.emoji);

  if (!text) return undefined;

  return {
    text,
    emoji: emoji || undefined,
    backgroundColor: sanitizeBadgeColor(
      parsed.backgroundColor,
      DEFAULT_BADGE_BACKGROUND_COLOR
    ),
    textColor: sanitizeBadgeColor(parsed.textColor, DEFAULT_BADGE_TEXT_COLOR),
  };
};

export const formatBadgeLabel = (badge?: ArrangementBadge) => {
  if (!badge?.text) return "";
  return badge.emoji ? `${badge.emoji} ${badge.text}` : badge.text;
};
