import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/* =========================================================
   APPROVED SELLER
========================================================= */

async function getApprovedSeller() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      seller: null,
      response: NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: String(session.user.id),
    },
    select: {
      id: true,
      role: true,
      isBlocked: true,
      seller: {
        select: {
          id: true,
          approved: true,
        },
      },
    },
  });

  if (!user) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        { success: false, message: "User not found." },
        { status: 401 }
      ),
    };
  }

  if (
    user.role !== "SELLER" ||
    user.isBlocked === true
  ) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        { success: false, message: "Seller access denied." },
        { status: 403 }
      ),
    };
  }

  if (!user.seller) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        { success: false, message: "Seller account not found." },
        { status: 403 }
      ),
    };
  }

  if (user.seller.approved !== true) {
    return {
      session,
      seller: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Seller account is not approved yet.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    seller: user.seller,
    response: null,
  };
}

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-_/\\]+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(word: string): string {
  const value = normalizeText(word);

  if (value.endsWith("ies") && value.length > 4) {
    return `${value.slice(0, -3)}y`;
  }

  if (
    value.endsWith("es") &&
    value.length > 4 &&
    !value.endsWith("ses")
  ) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }

  return value;
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(" ")
      .filter(Boolean)
      .map(singularize)
  );
}

/* =========================================================
   EXACT / PHRASE MATCH
========================================================= */

function matchesTerm(
  text: string,
  term: string
): boolean {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);

  if (!normalizedText || !normalizedTerm) {
    return false;
  }

  if (normalizedText === normalizedTerm) {
    return true;
  }

  const textTokens = tokenSet(normalizedText);
  const termTokens = normalizedTerm
    .split(" ")
    .filter(Boolean)
    .map(singularize);

  if (
    termTokens.length === 1 &&
    textTokens.has(termTokens[0])
  ) {
    return true;
  }

  const escaped = normalizedTerm
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\ /g, "\\s+");

  return new RegExp(
    `(?:^|\\s)${escaped}(?=\\s|$)`,
    "u"
  ).test(normalizedText);
}

function matchesAnyTerm(
  text: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    matchesTerm(text, term)
  );
}

/* =========================================================
   AUDIENCE KEYWORDS
========================================================= */

const audienceGroups: Record<string, string[]> = {
  men: [
    "men",
    "mens",
    "man",
    "male",
    "gents",
    "gent",
    "gentleman",
    "gentlemen",
    "menswear",
    "men wear",
    "menwear",
    "mard",
    "aadmi",
    "aadmiyon",
    "पुरुष",
    "आदमी",
  ],

  women: [
    "women",
    "womens",
    "woman",
    "female",
    "ladies",
    "lady",
    "ladieswear",
    "ladies wear",
    "womenswear",
    "women wear",
    "womenwear",
    "mahila",
    "mahilaon",
    "aurat",
    "auratein",
    "स्त्री",
    "महिला",
  ],

  boys: [
    "boy",
    "boys",
    "boyswear",
    "boys wear",
    "boy wear",
    "ladka",
    "ladke",
    "ladkon",
    "larka",
    "larke",
    "larkay",
    "बालक",
    "लड़का",
    "लड़के",
  ],

  girls: [
    "girl",
    "girls",
    "girlswear",
    "girls wear",
    "girl wear",
    "ladki",
    "ladkiyan",
    "ladkiyon",
    "larki",
    "larkiyan",
    "बालिका",
    "लड़की",
    "लड़कियां",
  ],

  kids: [
    "kid",
    "kids",
    "child",
    "children",
    "childrens",
    "childrenswear",
    "children wear",
    "kidswear",
    "kids wear",
    "junior",
    "juniors",
    "baccha",
    "bachcha",
    "bachche",
    "bachon",
    "बच्चा",
    "बच्चे",
  ],

  baby: [
    "baby",
    "babies",
    "newborn",
    "new born",
    "infant",
    "infants",
    "newborns",
    "shishu",
    "शिशु",
  ],

  toddler: [
    "toddler",
    "toddlers",
    "toddlerwear",
    "toddler wear",
  ],

  unisex: [
    "unisex",
    "uni sex",
    "gender neutral",
    "gender-neutral",
  ],
};

/* =========================================================
   PRODUCT CATEGORY KEYWORDS
========================================================= */

const categoryGroups: Record<string, string[]> = {
  shirt: [
    "shirt",
    "shirts",
    "formal shirt",
    "casual shirt",
    "dress shirt",
    "overshirt",
    "overshirts",
  ],

  tshirt: [
    "tshirt",
    "tshirts",
    "t shirt",
    "t shirts",
    "tee",
    "tees",
    "graphic tee",
    "polo tee",
    "polo tshirt",
  ],

  jeans: [
    "jean",
    "jeans",
    "denim jeans",
  ],

  pants: [
    "pant",
    "pants",
    "trouser",
    "trousers",
    "bottom",
    "bottoms",
    "formal pants",
  ],

  cargo: [
    "cargo",
    "cargos",
    "cargo pant",
    "cargo pants",
  ],

  jogger: [
    "jogger",
    "joggers",
    "jogger pants",
  ],

  trackpants: [
    "trackpant",
    "trackpants",
    "track pant",
    "track pants",
  ],

  shorts: [
    "short",
    "shorts",
    "short pant",
    "short pants",
  ],

  kurti: [
    "kurti",
    "kurtis",
    "kurtee",
    "kurtiya",
    "kurti set",
  ],

  kurta: [
    "kurta",
    "kurtas",
    "kurtha",
  ],

  saree: [
    "saree",
    "sarees",
    "sari",
    "saris",
    "saari",
    "saadi",
    "साड़ी",
  ],

  blouse: [
    "blouse",
    "blouses",
  ],

  dress: [
    "dress",
    "dresses",
    "midi dress",
    "maxi dress",
    "mini dress",
    "bodycon dress",
    "western dress",
  ],

  gown: [
    "gown",
    "gowns",
  ],

  frock: [
    "frock",
    "frocks",
  ],

  top: [
    "top",
    "tops",
    "crop top",
    "crop tops",
    "croptop",
    "croptops",
    "tube top",
    "tank top",
  ],

  skirt: [
    "skirt",
    "skirts",
  ],

  lehenga: [
    "lehenga",
    "lehengas",
    "lehnga",
    "lehngas",
    "lehenga choli",
    "lehnga choli",
  ],

  suit: [
    "suit",
    "suits",
    "formal suit",
    "business suit",
    "salwar suit",
    "salwar suits",
    "suit set",
  ],

  salwarSuit: [
    "salwar",
    "salwars",
    "salwar suit",
    "salwar suits",
    "salwarsuit",
    "salwarsuits",
    "salwar kameez",
    "shalwar",
  ],

  anarkali: [
    "anarkali",
    "anarkalis",
  ],

  dupatta: [
    "dupatta",
    "dupattas",
    "dupatte",
    "dupatta set",
  ],

  palazzo: [
    "palazzo",
    "palazzos",
    "palazzo pants",
  ],

  leggings: [
    "legging",
    "leggings",
  ],

  jumpsuit: [
    "jumpsuit",
    "jumpsuits",
  ],

  coord: [
    "coord",
    "co ord",
    "co ord set",
    "co ords",
    "co-ord",
    "co-ord set",
    "coordinated set",
  ],

  tracksuit: [
    "tracksuit",
    "tracksuits",
    "track suit",
    "track suits",
  ],

  hoodie: [
    "hoodie",
    "hoodies",
  ],

  sweatshirt: [
    "sweatshirt",
    "sweatshirts",
  ],

  sweater: [
    "sweater",
    "sweaters",
    "pullover",
    "pullovers",
  ],

  jacket: [
    "jacket",
    "jackets",
    "bomber jacket",
    "denim jacket",
  ],

  coat: [
    "coat",
    "coats",
    "overcoat",
  ],

  blazer: [
    "blazer",
    "blazers",
  ],

  cardigan: [
    "cardigan",
    "cardigans",
  ],

  romper: [
    "romper",
    "rompers",
  ],

  onesie: [
    "onesie",
    "onesies",
  ],

  nightwear: [
    "nightwear",
    "night wear",
    "night suit",
    "night suits",
    "sleepwear",
    "sleep wear",
    "pajama",
    "pajamas",
    "pyjama",
    "pyjamas",
  ],

  innerwear: [
    "innerwear",
    "inner wear",
    "underwear",
    "under wear",
  ],

  activewear: [
    "activewear",
    "active wear",
    "sportswear",
    "sports wear",
    "gym wear",
    "gymwear",
    "workout wear",
  ],

  swimwear: [
    "swimwear",
    "swim wear",
    "swimsuit",
    "swimsuits",
    "swimming wear",
  ],

  rainwear: [
    "rainwear",
    "rain wear",
    "raincoat",
    "rain coat",
  ],

  socks: [
    "sock",
    "socks",
  ],

  /* FOOTWEAR */

  footwear: [
    "footwear",
    "foot wear",
    "foot wears",
    "joota",
    "jootey",
    "jute",
    "जूता",
    "जूते",
  ],

  shoes: [
    "shoe",
    "shoes",
    "joota",
    "jootey",
    "joota shoes",
  ],

  sneakers: [
    "sneaker",
    "sneakers",
    "sneekers",
    "sneekar",
    "trainer",
    "trainers",
    "sports shoes",
  ],

  sandals: [
    "sandal",
    "sandals",
    "sandle",
    "sandles",
  ],

  slippers: [
    "slipper",
    "slippers",
    "flip flop",
    "flip flops",
    "flipflop",
    "chappal",
    "chappals",
    "chapal",
    "chapals",
    "चप्पल",
  ],

  boots: [
    "boot",
    "boots",
  ],

  heels: [
    "heel",
    "heels",
    "high heel",
    "high heels",
    "block heel",
    "block heels",
  ],

  loafers: [
    "loafer",
    "loafers",
  ],

  flats: [
    "flat",
    "flats",
    "flat shoes",
  ],

  jutti: [
    "jutti",
    "juttis",
    "jooti",
    "jootis",
    "mojari",
    "mojaris",
    "mojri",
  ],

  /* ACCESSORIES */

  accessories: [
    "accessory",
    "accessories",
    "accessory items",
  ],

  bag: [
    "bag",
    "bags",
  ],

  handbag: [
    "handbag",
    "handbags",
    "hand bag",
    "hand bags",
  ],

  purse: [
    "purse",
    "purses",
  ],

  backpack: [
    "backpack",
    "backpacks",
    "back pack",
  ],

  wallet: [
    "wallet",
    "wallets",
  ],

  belt: [
    "belt",
    "belts",
  ],

  watch: [
    "watch",
    "watches",
    "wrist watch",
    "smart watch",
  ],

  sunglasses: [
    "sunglass",
    "sunglasses",
    "sun glasses",
    "goggles",
  ],

  cap: [
    "cap",
    "caps",
  ],

  hat: [
    "hat",
    "hats",
  ],

  scarf: [
    "scarf",
    "scarves",
    "stole",
    "stoles",
  ],

  tie: [
    "tie",
    "ties",
    "necktie",
  ],

  jewellery: [
    "jewellery",
    "jewelry",
    "jewelery",
    "jewels",
    "ornament",
    "ornaments",
    "abhushan",
  ],

  earrings: [
    "earring",
    "earrings",
    "ear ring",
    "ear rings",
  ],

  necklace: [
    "necklace",
    "necklaces",
    "neck piece",
  ],

  bracelet: [
    "bracelet",
    "bracelets",
    "bangle",
    "bangles",
    "chudi",
    "chudiya",
  ],

  ring: [
    "ring",
    "rings",
  ],

  hairAccessories: [
    "hair accessory",
    "hair accessories",
    "hair clip",
    "hair clips",
    "scrunchie",
    "scrunchies",
    "hair band",
    "hair bands",
  ],

  /* OTHER */

  ethnic: [
    "ethnic",
    "ethnicwear",
    "ethnic wear",
    "traditional",
    "traditionalwear",
    "traditional wear",
    "indianwear",
    "indian wear",
    "indian outfit",
    "indian outfits",
    "desi wear",
    "desiwear",
  ],

  beauty: [
    "beauty",
    "makeup",
    "cosmetic",
    "cosmetics",
    "skincare",
    "skin care",
    "personal care",
  ],

  home: [
    "home",
    "home living",
    "home decor",
    "homedecor",
    "decor",
    "decoration",
    "living",
  ],
};

/* =========================================================
   STYLE / FIT / OCCASION / MATERIAL
========================================================= */

const attributeGroups: Record<string, string[]> = {
  casual: [
    "casual",
    "casualwear",
    "casual wear",
  ],

  formal: [
    "formal",
    "formalwear",
    "formal wear",
  ],

  partywear: [
    "partywear",
    "party wear",
    "party",
    "party outfit",
  ],

  wedding: [
    "wedding",
    "weddingwear",
    "wedding wear",
    "bridal",
    "bride",
    "marriage",
    "shaadi",
    "shadi",
    "shaadi wear",
    "wedding outfit",
  ],

  festive: [
    "festive",
    "festivewear",
    "festive wear",
    "festival wear",
    "festival",
    "tyohar",
  ],

  office: [
    "office",
    "officewear",
    "office wear",
    "workwear",
    "work wear",
  ],

  dailywear: [
    "dailywear",
    "daily wear",
    "everyday",
    "everyday wear",
    "daily use",
    "regular wear",
  ],

  western: [
    "western",
    "westernwear",
    "western wear",
  ],

  streetwear: [
    "streetwear",
    "street wear",
  ],

  oversized: [
    "oversized",
    "oversize",
    "oversized fit",
    "oversize fit",
  ],

  slimfit: [
    "slim fit",
    "slimfit",
    "slim",
  ],

  regularfit: [
    "regular fit",
    "regularfit",
    "regular",
  ],

  relaxedfit: [
    "relaxed fit",
    "relaxedfit",
    "relaxed",
  ],

  loosefit: [
    "loose fit",
    "loosefit",
    "loose",
  ],

  skinnyfit: [
    "skinny",
    "skinny fit",
    "skinnyfit",
  ],

  straightfit: [
    "straight fit",
    "straightfit",
  ],

  bootcut: [
    "bootcut",
    "boot cut",
  ],

  highwaist: [
    "high waist",
    "highwaist",
    "high waisted",
  ],

  lowwaist: [
    "low waist",
    "lowwaist",
    "low waisted",
  ],

  printed: [
    "printed",
    "print",
    "prints",
    "print design",
  ],

  floral: [
    "floral",
    "flower",
    "flowers",
    "flower print",
  ],

  striped: [
    "striped",
    "stripe",
    "stripes",
    "strip",
  ],

  checked: [
    "checked",
    "check",
    "checks",
    "checkered",
    "check shirt",
  ],

  plain: [
    "plain",
    "solid",
    "solid color",
    "solid colour",
  ],

  embroidered: [
    "embroidered",
    "embroidery",
    "embroider",
  ],

  sequin: [
    "sequin",
    "sequins",
    "sequin work",
  ],

  embellished: [
    "embellished",
    "embellishment",
  ],

  lace: [
    "lace",
    "laced",
  ],

  /* MATERIAL */

  cotton: [
    "cotton",
    "cotton fabric",
    "cotton cloth",
    "sooti",
    "सूती",
  ],

  silk: [
    "silk",
    "silk fabric",
    "resham",
    "रेशम",
  ],

  linen: [
    "linen",
    "linen fabric",
  ],

  rayon: [
    "rayon",
  ],

  viscose: [
    "viscose",
  ],

  polyester: [
    "polyester",
  ],

  wool: [
    "wool",
    "woollen",
    "woolen",
    "oon",
    "ऊन",
  ],

  georgette: [
    "georgette",
  ],

  chiffon: [
    "chiffon",
  ],

  crepe: [
    "crepe",
  ],

  velvet: [
    "velvet",
  ],

  satin: [
    "satin",
  ],

  leather: [
    "leather",
  ],

  fauxLeather: [
    "faux leather",
    "fauxleather",
    "synthetic leather",
  ],

  denim: [
    "denim",
  ],

  khadi: [
    "khadi",
    "khaddar",
  ],

  organza: [
    "organza",
  ],

  modal: [
    "modal",
  ],

  nylon: [
    "nylon",
  ],
};

/* =========================================================
   COLOUR SYNONYMS
========================================================= */

const colorGroups: Record<string, string[]> = {
  black: [
    "black",
    "jet black",
    "kala",
    "kaala",
    "काल",
    "काला",
  ],

  white: [
    "white",
    "off white",
    "offwhite",
    "safed",
    "सफेद",
  ],

  red: [
    "red",
    "bright red",
    "dark red",
    "lal",
    "laal",
    "लाल",
  ],

  blue: [
    "blue",
    "dark blue",
    "light blue",
    "royal blue",
    "neela",
    "nila",
    "नीला",
  ],

  navy: [
    "navy",
    "navy blue",
  ],

  skyblue: [
    "sky blue",
    "skyblue",
    "sky",
  ],

  green: [
    "green",
    "dark green",
    "light green",
    "hara",
    "हरा",
  ],

  olive: [
    "olive",
    "olive green",
  ],

  yellow: [
    "yellow",
    "bright yellow",
    "peela",
    "pila",
    "पीला",
  ],

  pink: [
    "pink",
    "light pink",
    "hot pink",
    "gulabi",
    "गुलाबी",
  ],

  purple: [
    "purple",
    "baingani",
    "बैंगनी",
  ],

  violet: [
    "violet",
  ],

  orange: [
    "orange",
    "narangi",
    "नारंगी",
  ],

  brown: [
    "brown",
    "light brown",
    "dark brown",
    "bhura",
    "भूरा",
  ],

  grey: [
    "grey",
    "gray",
    "light grey",
    "dark grey",
    "slate grey",
    "slate gray",
    "sleti",
    "स्लेटी",
  ],

  beige: [
    "beige",
  ],

  cream: [
    "cream",
    "creamy",
  ],

  maroon: [
    "maroon",
    "dark maroon",
  ],

  gold: [
    "gold",
    "golden",
    "golden color",
    "golden colour",
    "sunehra",
    "sunhera",
    "सुनहरा",
  ],

  silver: [
    "silver",
    "chandi",
    "चांदी",
  ],

  peach: [
    "peach",
  ],

  magenta: [
    "magenta",
  ],

  wine: [
    "wine",
    "wine color",
    "wine colour",
  ],

  rust: [
    "rust",
    "rust color",
    "rust colour",
  ],

  teal: [
    "teal",
  ],

  turquoise: [
    "turquoise",
    "turquoise blue",
  ],

  mustard: [
    "mustard",
  ],

  coral: [
    "coral",
  ],

  lavender: [
    "lavender",
  ],

  mint: [
    "mint",
    "mint green",
  ],

  lime: [
    "lime",
    "lime green",
  ],

  khaki: [
    "khaki",
  ],

  charcoal: [
    "charcoal",
  ],
};

/* =========================================================
   SEARCH STOP WORDS
========================================================= */

const stopWords = new Set([
  "a",
  "an",
  "the",
  "for",
  "of",
  "to",
  "in",
  "on",
  "with",
  "and",
  "or",
  "me",
  "my",
  "please",
  "show",
  "find",
  "want",
  "need",
  "give",
  "looking",
  "look",
  "buy",
  "best",
  "good",
  "nice",
  "new",
  "latest",
  "popular",
  "trending",
  "premium",
  "fashion",
  "fashionable",
  "wear",
  "wears",
  "clothes",
  "clothing",
  "cloth",
  "kapda",
  "kapde",
  "kapdon",
  "outfit",
  "outfits",
  "collection",
  "collections",
  "item",
  "items",
  "product",
  "products",
]);

/* =========================================================
   DETECT GROUP
========================================================= */

function detectGroups(
  query: string,
  groups: Record<string, string[]>
): string[] {
  return Object.keys(groups).filter((group) =>
    matchesAnyTerm(
      query,
      groups[group]
    )
  );
}

function matchesGroup(
  text: string,
  groups: Record<string, string[]>,
  group: string
): boolean {
  return matchesAnyTerm(
    text,
    groups[group] || []
  );
}

/* =========================================================
   SEARCH DATA
========================================================= */

function getProductSearchData(
  product: any
) {
  const name =
    normalizeText(product.name);

  const description =
    normalizeText(product.description);

  const category =
    normalizeText(
      product.category?.name
    );

  let colors = "";

  if (Array.isArray(product.colors)) {
    colors = normalizeText(
      product.colors.join(" ")
    );
  } else {
    colors = normalizeText(
      product.colors
    );
  }

  let sizes = "";

  if (Array.isArray(product.sizes)) {
    sizes = normalizeText(
      product.sizes.join(" ")
    );
  } else {
    sizes = normalizeText(
      product.sizes
    );
  }

  const sizeChart =
    normalizeText(
      product.sizeChart
    );

  const searchableText = [
    name,
    description,
    category,
    colors,
    sizes,
    sizeChart,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    name,
    description,
    category,
    colors,
    sizes,
    sizeChart,
    searchableText,
  };
}

/* =========================================================
   SEARCH SCORE
========================================================= */

function calculateSearchScore(
  product: any,
  data: ReturnType<
    typeof getProductSearchData
  >,
  query: string,
  detectedCategories: string[],
  detectedAudiences: string[],
  detectedAttributes: string[],
  requestedColors: string[]
) {
  let score = 0;

  /* Exact query */

  if (data.name === query) {
    score += 1000;
  }

  if (data.category === query) {
    score += 900;
  }

  if (matchesTerm(data.name, query)) {
    score += 700;
  }

  /* Query phrase */

  if (
    data.name.includes(query)
  ) {
    score += 350;
  }

  if (
    data.category.includes(query)
  ) {
    score += 300;
  }

  /* Category */

  for (const category of detectedCategories) {
    if (
      matchesGroup(
        data.category,
        categoryGroups,
        category
      )
    ) {
      score += 300;
    }

    if (
      matchesGroup(
        data.name,
        categoryGroups,
        category
      )
    ) {
      score += 250;
    }

    if (
      matchesGroup(
        data.searchableText,
        categoryGroups,
        category
      )
    ) {
      score += 120;
    }
  }

  /* Audience */

  for (const audience of detectedAudiences) {
    if (
      matchesGroup(
        data.category,
        audienceGroups,
        audience
      )
    ) {
      score += 300;
    }

    if (
      matchesGroup(
        data.name,
        audienceGroups,
        audience
      )
    ) {
      score += 260;
    }

    if (
      matchesGroup(
        data.searchableText,
        audienceGroups,
        audience
      )
    ) {
      score += 130;
    }
  }

  /* Attributes */

  for (const attribute of detectedAttributes) {
    if (
      matchesGroup(
        data.name,
        attributeGroups,
        attribute
      )
    ) {
      score += 180;
    }

    if (
      matchesGroup(
        data.description,
        attributeGroups,
        attribute
      )
    ) {
      score += 120;
    }

    if (
      matchesGroup(
        data.searchableText,
        attributeGroups,
        attribute
      )
    ) {
      score += 80;
    }
  }

  /* Colours */

  for (const color of requestedColors) {
    if (
      matchesGroup(
        data.colors,
        colorGroups,
        color
      )
    ) {
      score += 220;
    }

    if (
      matchesGroup(
        data.name,
        colorGroups,
        color
      )
    ) {
      score += 180;
    }

    if (
      matchesGroup(
        data.description,
        colorGroups,
        color
      )
    ) {
      score += 100;
    }
  }

  /* Individual words */

  const words = query
    .split(" ")
    .filter(
      (word) =>
        word.length > 1 &&
        !stopWords.has(word)
    );

  for (const word of words) {
    if (
      matchesTerm(data.name, word)
    ) {
      score += 50;
    }

    if (
      matchesTerm(data.category, word)
    ) {
      score += 45;
    }

    if (
      matchesTerm(
        data.description,
        word
      )
    ) {
      score += 20;
    }
  }

  /* Rating */

  score +=
    Number(product.averageRating || 0) *
    5;

  /* Reviews */

  score += Math.min(
    Number(product.reviewCount || 0),
    30
  );

  /* In-stock */

  if (
    Number(product.stock || 0) > 0
  ) {
    score += 10;
  }

  return score;
}

/* =========================================================
   GET PRODUCTS
========================================================= */

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mine =
      searchParams.get("mine") === "true";

    const searchQuery =
      searchParams
        .get("search")
        ?.trim() || "";

    /* =====================================================
       SELLER PRODUCTS
    ===================================================== */

    if (mine) {
      const auth =
        await getApprovedSeller();

      if (auth.response) {
        return auth.response;
      }

      const products =
        await prisma.product.findMany({
          where: {
            sellerId: auth.seller!.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          include: {
            category: true,

            seller: {
              select: {
                id: true,
                shopName: true,
                ownerName: true,
                city: true,
                address: true,
                approved: true,
              },
            },

            reviews: {
              select: {
                rating: true,
              },
            },
          },
        });

      const productsWithRating =
        products.map((product) => {
          const ratings =
            product.reviews.map(
              (review) =>
                review.rating
            );

          const reviewCount =
            ratings.length;

          const averageRating =
            reviewCount > 0
              ? Number(
                  (
                    ratings.reduce(
                      (sum, rating) =>
                        sum + rating,
                      0
                    ) /
                    reviewCount
                  ).toFixed(1)
                )
              : 0;

          const {
            reviews,
            ...productData
          } = product;

          return {
            ...productData,
            averageRating,
            reviewCount,
          };
        });

      return NextResponse.json({
        success: true,
        products:
          productsWithRating,
      });
    }

    /* =====================================================
       PUBLIC PRODUCTS
    ===================================================== */

    const products =
      await prisma.product.findMany({
        where: {
          seller: {
            approved: true,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          category: true,

          seller: {
            select: {
              id: true,
              shopName: true,
              ownerName: true,
              city: true,
              address: true,
              approved: true,
            },
          },

          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

    const productsWithRating =
      products.map((product) => {
        const ratings =
          product.reviews.map(
            (review) =>
              review.rating
          );

        const reviewCount =
          ratings.length;

        const averageRating =
          reviewCount > 0
            ? Number(
                (
                  ratings.reduce(
                    (sum, rating) =>
                      sum + rating,
                    0
                  ) /
                  reviewCount
                ).toFixed(1)
              )
            : 0;

        const {
          reviews,
          ...productData
        } = product;

        return {
          ...productData,
          averageRating,
          reviewCount,
        };
      });

    /* =====================================================
       NO SEARCH
    ===================================================== */

    if (!searchQuery) {
      return NextResponse.json({
        success: true,
        products:
          productsWithRating,
      });
    }

    /* =====================================================
       SMART SEARCH
    ===================================================== */

    const normalizedQuery =
      normalizeText(searchQuery);

    const detectedCategories =
      detectGroups(
        normalizedQuery,
        categoryGroups
      );

    const detectedAudiences =
      detectGroups(
        normalizedQuery,
        audienceGroups
      );

    const detectedAttributes =
      detectGroups(
        normalizedQuery,
        attributeGroups
      );

    const requestedColors =
      detectGroups(
        normalizedQuery,
        colorGroups
      );

    const wantsTrending =
      matchesAnyTerm(
        normalizedQuery,
        [
          "trending",
          "trend",
          "popular",
          "bestseller",
          "best seller",
          "top selling",
          "viral",
        ]
      );

    const wantsNew =
      matchesAnyTerm(
        normalizedQuery,
        [
          "new",
          "newest",
          "latest",
          "new arrival",
          "new arrivals",
        ]
      );

    const wantsPremium =
      matchesAnyTerm(
        normalizedQuery,
        [
          "premium",
          "luxury",
          "designer",
          "high quality",
          "high-quality",
        ]
      );

    /* =====================================================
       STRICT FILTER
    ===================================================== */

    const filteredAndRanked =
      productsWithRating
        .map((product) => {
          const data =
            getProductSearchData(
              product
            );

          let matches = true;

          /* -----------------------------------------------
             CATEGORY
          ------------------------------------------------ */

          if (
            detectedCategories.length > 0
          ) {
            const categoryMatches =
              detectedCategories.every(
                (category) =>
                  matchesGroup(
                    data.searchableText,
                    categoryGroups,
                    category
                  )
              );

            if (!categoryMatches) {
              matches = false;
            }
          }

          /* -----------------------------------------------
             AUDIENCE
          ------------------------------------------------ */

          if (
            matches &&
            detectedAudiences.length > 0
          ) {
            const isUnisex =
              matchesGroup(
                data.searchableText,
                audienceGroups,
                "unisex"
              );

            for (const audience of
              detectedAudiences) {
              /* KIDS = boys + girls + baby + toddler */

              if (
                audience === "kids"
              ) {
                const isKids =
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "kids"
                  ) ||
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "boys"
                  ) ||
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "girls"
                  ) ||
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "baby"
                  ) ||
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "toddler"
                  );

                if (!isKids) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* BOYS */

              if (
                audience === "boys"
              ) {
                const isBoys =
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "boys"
                  ) ||
                  isUnisex;

                if (!isBoys) {
                  matches = false;
                  break;
                }

                if (
                  !isUnisex &&
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "girls"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* GIRLS */

              if (
                audience === "girls"
              ) {
                const isGirls =
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "girls"
                  ) ||
                  isUnisex;

                if (!isGirls) {
                  matches = false;
                  break;
                }

                if (
                  !isUnisex &&
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "boys"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* MEN */

              if (
                audience === "men"
              ) {
                const isMen =
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "men"
                  ) ||
                  isUnisex;

                if (!isMen) {
                  matches = false;
                  break;
                }

                if (
                  !isUnisex &&
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "women"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* WOMEN */

              if (
                audience === "women"
              ) {
                const isWomen =
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "women"
                  ) ||
                  isUnisex;

                if (!isWomen) {
                  matches = false;
                  break;
                }

                if (
                  !isUnisex &&
                  matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "men"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* BABY */

              if (
                audience === "baby"
              ) {
                if (
                  !matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "baby"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* TODDLER */

              if (
                audience === "toddler"
              ) {
                if (
                  !matchesGroup(
                    data.searchableText,
                    audienceGroups,
                    "toddler"
                  )
                ) {
                  matches = false;
                  break;
                }

                continue;
              }

              /* UNISEX */

              if (
                audience === "unisex"
              ) {
                if (!isUnisex) {
                  matches = false;
                  break;
                }
              }
            }
          }

          /* -----------------------------------------------
             ATTRIBUTES
          ------------------------------------------------ */

          if (
            matches &&
            detectedAttributes.length > 0
          ) {
            const attributesMatch =
              detectedAttributes.every(
                (attribute) =>
                  matchesGroup(
                    data.searchableText,
                    attributeGroups,
                    attribute
                  )
              );

            if (!attributesMatch) {
              matches = false;
            }
          }

          /* -----------------------------------------------
             COLOUR
             
             Colour is NOT a hard filter.
             It ranks matching colour products higher.
          ------------------------------------------------ */

          /* -----------------------------------------------
             GENERAL WORD SEARCH
          ------------------------------------------------ */

          if (
            matches &&
            detectedCategories.length === 0 &&
            detectedAudiences.length === 0 &&
            detectedAttributes.length === 0 &&
            requestedColors.length === 0
          ) {
            const words =
              normalizedQuery
                .split(" ")
                .filter(
                  (word) =>
                    word.length > 1 &&
                    !stopWords.has(word)
                );

            if (words.length > 0) {
              const wordMatch =
                words.some((word) =>
                  matchesTerm(
                    data.searchableText,
                    word
                  )
                );

              if (!wordMatch) {
                matches = false;
              }
            }
          }

          if (!matches) {
            return null;
          }

          let score =
            calculateSearchScore(
              product,
              data,
              normalizedQuery,
              detectedCategories,
              detectedAudiences,
              detectedAttributes,
              requestedColors
            );

          /* -----------------------------------------------
             TRENDING
          ------------------------------------------------ */

          if (wantsTrending) {
            score +=
              Number(
                product.averageRating || 0
              ) * 30;

            score += Math.min(
              Number(
                product.reviewCount || 0
              ),
              100
            );
          }

          /* -----------------------------------------------
             NEW
          ------------------------------------------------ */

          if (wantsNew) {
            const created =
              new Date(
                product.createdAt
              ).getTime();

            const ageDays =
              Math.max(
                0,
                (Date.now() - created) /
                  86400000
              );

            if (ageDays <= 7) {
              score += 300;
            } else if (
              ageDays <= 30
            ) {
              score += 180;
            } else if (
              ageDays <= 90
            ) {
              score += 80;
            }
          }

          /* -----------------------------------------------
             PREMIUM
          ------------------------------------------------ */

          if (wantsPremium) {
            const premiumText =
              [
                data.name,
                data.description,
                data.category,
              ].join(" ");

            if (
              matchesAnyTerm(
                premiumText,
                [
                  "premium",
                  "luxury",
                  "designer",
                  "high quality",
                  "high-quality",
                  "premium quality",
                  "royal",
                  "exclusive",
                ]
              )
            ) {
              score += 350;
            }

            if (
              Number(
                product.averageRating || 0
              ) >= 4
            ) {
              score += 50;
            }
          }

          return {
            product,
            score,
          };
        })
        .filter(
          (
            item
          ): item is {
            product: (typeof productsWithRating)[number];
            score: number;
          } => item !== null
        )
        .sort((a, b) => {
          if (
            b.score !== a.score
          ) {
            return (
              b.score - a.score
            );
          }

          return (
            new Date(
              b.product.createdAt
            ).getTime() -
            new Date(
              a.product.createdAt
            ).getTime()
          );
        });

    return NextResponse.json({
      success: true,
      products:
        filteredAndRanked.map(
          (item) => item.product
        ),
    });
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Products could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const auth =
      await getApprovedSeller();

    if (auth.response) {
      return auth.response;
    }

    const seller = auth.seller!;

    const body = await request.json();

    const {
      name,
      description,
      price,
      stock,
      category,
      image,
      images,
      sizes,
      colors,
      sizeChart,
    } = body;

    if (
      !name ||
      !description ||
      price === undefined ||
      stock === undefined ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Required product fields are missing.",
        },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product data.",
        },
        { status: 400 }
      );
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product price.",
        },
        { status: 400 }
      );
    }

    if (
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product stock.",
        },
        { status: 400 }
      );
    }

    let categoryRecord =
      await prisma.category.findUnique({
        where: {
          name: category.trim(),
        },
      });

    if (!categoryRecord) {
      categoryRecord =
        await prisma.category.create({
          data: {
            name: category.trim(),
          },
        });
    }

    const finalImages =
      Array.isArray(images)
        ? images
        : [];

    const finalSizes =
      Array.isArray(sizes)
        ? sizes
        : [];

    const finalColors =
      Array.isArray(colors)
        ? colors
        : [];

    const product =
      await prisma.product.create({
        data: {
          name:
            name.trim(),

          description:
            description.trim(),

          price,

          stock,

          image:
            typeof image ===
              "string"
              ? image
              : "",

          images:
            JSON.stringify(
              finalImages
            ),

          sizes:
            JSON.stringify(
              finalSizes
            ),

          colors:
            JSON.stringify(
              finalColors
            ),

          sizeChart:
            typeof sizeChart ===
            "string"
              ? sizeChart
              : "",

          sellerId:
            seller.id,

          categoryId:
            categoryRecord.id,
        },

        include: {
          category: true,

          seller: {
            select: {
              id: true,
              shopName: true,
              ownerName: true,
              city: true,
              address: true,
              approved: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Product published successfully.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Product could not be published.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const auth =
      await getApprovedSeller();

    if (auth.response) {
      return auth.response;
    }

    const seller = auth.seller!;

    const body =
      await request.json();

    const id =
      typeof body?.id ===
      "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          sellerId: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    if (
      product.sellerId !==
      seller.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to delete this product.",
        },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Product could not be deleted.",
      },
      { status: 500 }
    );
  }
}