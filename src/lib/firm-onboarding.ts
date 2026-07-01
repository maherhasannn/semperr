const STATE_ALIASES: Record<string, string> = {
  al: "Alabama",
  alabama: "Alabama",
  ak: "Alaska",
  alaska: "Alaska",
  az: "Arizona",
  arizona: "Arizona",
  ar: "Arkansas",
  arkansas: "Arkansas",
  ca: "California",
  california: "California",
  co: "Colorado",
  colorado: "Colorado",
  ct: "Connecticut",
  connecticut: "Connecticut",
  de: "Delaware",
  delaware: "Delaware",
  dc: "District of Columbia",
  "district of columbia": "District of Columbia",
  fl: "Florida",
  florida: "Florida",
  ga: "Georgia",
  georgia: "Georgia",
  hi: "Hawaii",
  hawaii: "Hawaii",
  id: "Idaho",
  idaho: "Idaho",
  il: "Illinois",
  illinois: "Illinois",
  in: "Indiana",
  indiana: "Indiana",
  ia: "Iowa",
  iowa: "Iowa",
  ks: "Kansas",
  kansas: "Kansas",
  ky: "Kentucky",
  kentucky: "Kentucky",
  la: "Louisiana",
  louisiana: "Louisiana",
  me: "Maine",
  maine: "Maine",
  md: "Maryland",
  maryland: "Maryland",
  ma: "Massachusetts",
  massachusetts: "Massachusetts",
  mi: "Michigan",
  michigan: "Michigan",
  mn: "Minnesota",
  minnesota: "Minnesota",
  ms: "Mississippi",
  mississippi: "Mississippi",
  mo: "Missouri",
  missouri: "Missouri",
  mt: "Montana",
  montana: "Montana",
  ne: "Nebraska",
  nebraska: "Nebraska",
  nv: "Nevada",
  nevada: "Nevada",
  nh: "New Hampshire",
  "new hampshire": "New Hampshire",
  nj: "New Jersey",
  "new jersey": "New Jersey",
  nm: "New Mexico",
  "new mexico": "New Mexico",
  ny: "New York",
  "new york": "New York",
  nc: "North Carolina",
  "north carolina": "North Carolina",
  nd: "North Dakota",
  "north dakota": "North Dakota",
  oh: "Ohio",
  ohio: "Ohio",
  ok: "Oklahoma",
  oklahoma: "Oklahoma",
  or: "Oregon",
  oregon: "Oregon",
  pa: "Pennsylvania",
  pennsylvania: "Pennsylvania",
  ri: "Rhode Island",
  "rhode island": "Rhode Island",
  sc: "South Carolina",
  "south carolina": "South Carolina",
  sd: "South Dakota",
  "south dakota": "South Dakota",
  tn: "Tennessee",
  tennessee: "Tennessee",
  tx: "Texas",
  texas: "Texas",
  ut: "Utah",
  utah: "Utah",
  vt: "Vermont",
  vermont: "Vermont",
  va: "Virginia",
  virginia: "Virginia",
  wa: "Washington",
  washington: "Washington",
  wv: "West Virginia",
  "west virginia": "West Virginia",
  wi: "Wisconsin",
  wisconsin: "Wisconsin",
  wy: "Wyoming",
  wyoming: "Wyoming",
};

export const US_STATE_OPTIONS = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

export type NormalizedUrlResult = {
  normalizedValue: string;
  error: string | null;
};

export type NormalizedStateResult = {
  normalizedValue: string;
  error: string | null;
};

export type NormalizedStateListResult = {
  normalizedValue: string[];
  error: string | null;
};

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeStateToken(value: string) {
  return clean(value).toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

export function normalizeWebsiteUrl(value: string): NormalizedUrlResult {
  const input = clean(value);
  if (!input) {
    return { normalizedValue: "", error: null };
  }

  const candidates = new Set<string>();
  const strippedWww = input.replace(/^www\./i, "");

  if (/^https?:\/\//i.test(input)) {
    candidates.add(input);
  } else {
    if (!input.includes(".")) {
      candidates.add(`https://${input}.com`);
      candidates.add(`https://www.${input}.com`);
      candidates.add(`https://${input}.org`);
      candidates.add(`https://${input}.net`);
      candidates.add(`https://${input}.io`);
      candidates.add(`https://${input}.co`);
      candidates.add(`https://${input}`);
    } else if (/^www\./i.test(input) && !/\.[a-z]{2,}$/i.test(strippedWww)) {
      candidates.add(`https://www.${strippedWww}.com`);
      candidates.add(`https://${strippedWww}.com`);
      candidates.add(`https://www.${strippedWww}.org`);
      candidates.add(`https://${strippedWww}.org`);
      candidates.add(`https://www.${strippedWww}.net`);
      candidates.add(`https://${strippedWww}.net`);
      candidates.add(`https://www.${strippedWww}.io`);
      candidates.add(`https://${strippedWww}.io`);
      candidates.add(`https://www.${strippedWww}.co`);
      candidates.add(`https://${strippedWww}.co`);
      candidates.add(`https://${input}`);
    } else {
      candidates.add(`https://${input}`);
    }
  }

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        continue;
      }

      return { normalizedValue: url.toString(), error: null };
    } catch {
      continue;
    }
  }

  return { normalizedValue: "", error: "Enter a valid website URL or domain." };
}

export function normalizeUsState(value: string): NormalizedStateResult {
  const token = normalizeStateToken(value);
  if (!token) {
    return { normalizedValue: "", error: null };
  }

  const normalizedValue = STATE_ALIASES[token];
  if (!normalizedValue) {
    return { normalizedValue: "", error: "Enter a valid US state name or abbreviation." };
  }

  return { normalizedValue, error: null };
}

export function normalizeUsStateList(value: string): NormalizedStateListResult {
  const rawTokens = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (rawTokens.length === 0) {
    return { normalizedValue: [], error: null };
  }

  const normalizedValues: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokens) {
    const normalized = normalizeUsState(token);
    if (normalized.error) {
      return { normalizedValue: [], error: normalized.error };
    }

    const dedupeKey = normalized.normalizedValue.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalizedValues.push(normalized.normalizedValue);
  }

  return { normalizedValue: normalizedValues, error: null };
}
