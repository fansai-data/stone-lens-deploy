import type { StoneDomain } from "./stoneRecognition";

export const domainNames: Record<StoneDomain, string> = {
  gemstone: "彩色宝石",
  jade_raw: "玉石原石",
  common_rock: "普通岩石（负样本）",
};

export const domainEnglishNames: Record<StoneDomain, string> = {
  gemstone: "Colored Gemstone",
  jade_raw: "Raw Jade",
  common_rock: "Common Rock · Negative Sample",
};

const normalizeStoneName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const stoneIdentities: Record<string, [string, string]> = {
  alexandrite: ["亚历山大石", "斜方晶系"], almandine: ["铁铝榴石", "立方晶系"],
  amazonite: ["天河石", "三斜晶系"], amber: ["琥珀", "非晶质体"],
  amethyst: ["紫水晶", "三方晶系"], ametrine: ["紫黄晶", "三方晶系"],
  andalusite: ["红柱石", "斜方晶系"], andradite: ["钙铁榴石", "立方晶系"],
  aquamarine: ["海蓝宝石", "六方晶系"], aventurinegreen: ["绿东陵石", "三方晶系（石英质）"],
  aventurineyellow: ["黄东陵石", "三方晶系（石英质）"], benitoite: ["蓝锥石", "三方晶系（罕见）"],
  berylgolden: ["金绿柱石", "六方晶系"], bixbite: ["红绿柱石", "六方晶系"],
  bloodstone: ["血石", "三方晶系（石英质）"], bluelaceagate: ["蓝纹玛瑙", "三方晶系（石英质）"],
  carnelian: ["红玉髓", "三方晶系（石英质）"], catseye: ["猫眼石", "斜方晶系（金绿宝石）"],
  chalcedony: ["玉髓", "三方晶系（石英质）"], chalcedonyblue: ["蓝玉髓", "三方晶系（石英质）"],
  chromediopside: ["铬透辉石", "单斜晶系"], chrysoberyl: ["金绿宝石", "斜方晶系"],
  chrysocolla: ["硅孔雀石", "单斜晶系（隐晶质）"], chrysoprase: ["绿玉髓", "三方晶系（石英质）"],
  citrine: ["黄水晶", "三方晶系"], coral: ["珊瑚", "非晶质/隐晶质"],
  danburite: ["赛黄晶", "斜方晶系"], diamond: ["钻石", "立方晶系"],
  diaspore: ["硬水铝石", "斜方晶系"], dumortierite: ["蓝线石", "斜方晶系"],
  emerald: ["祖母绿", "六方晶系"], fluorite: ["萤石", "立方晶系"],
  garnetred: ["红色石榴石", "立方晶系"], goshenite: ["透绿柱石", "六方晶系"],
  grossular: ["钙铝榴石", "立方晶系"], hessonite: ["桂榴石", "立方晶系"],
  hiddenite: ["翠绿锂辉石", "单斜晶系"], iolite: ["堇青石", "斜方晶系"],
  jade: ["玉", "多晶集合体"], jasper: ["碧玉", "三方晶系（石英质）"],
  kunzite: ["紫锂辉石", "单斜晶系"], kyanite: ["蓝晶石", "三斜晶系"],
  labradorite: ["拉长石", "三斜晶系"], lapislazuli: ["青金石", "隐晶质（含方钠石）"],
  larimar: ["海纹石", "三斜晶系"], malachite: ["孔雀石", "单斜晶系"],
  moonstone: ["月光石", "单斜晶系（正长石）"], morganite: ["摩根石", "六方晶系"],
  onyxblack: ["黑玛瑙", "三方晶系（石英质）"], onyxgreen: ["绿玛瑙", "三方晶系（石英质）"],
  onyxred: ["红玛瑙", "三方晶系（石英质）"], opal: ["欧泊", "非晶质体"],
  pearl: ["珍珠", "非晶质/生物质"], peridot: ["橄榄石", "斜方晶系"],
  prehnite: ["葡萄石", "斜方晶系"], pyrite: ["黄铁矿", "立方晶系"],
  pyrope: ["镁铝榴石", "立方晶系"], quartzbeer: ["啤酒石英", "三方晶系"],
  quartzlemon: ["柠檬石英", "三方晶系"], quartzrose: ["粉晶", "三方晶系"],
  quartzrutilated: ["发晶", "三方晶系"], quartzsmoky: ["烟晶", "三方晶系"],
  rhodochrosite: ["菱锰矿", "三方晶系"], rhodolite: ["玫瑰榴石", "立方晶系"],
  rhodonite: ["蔷薇辉石", "三斜晶系"], ruby: ["红宝石", "三方晶系"],
  sapphireblue: ["蓝色蓝宝石", "三方晶系"], sapphirepink: ["粉色蓝宝石", "三方晶系"],
  sapphirepurple: ["紫色蓝宝石", "三方晶系"], sapphireyellow: ["黄色蓝宝石", "三方晶系"],
  scapolite: ["方柱石", "四方晶系"], serpentine: ["蛇纹石", "单斜晶系"],
  sodalite: ["方钠石", "立方晶系"], spessartite: ["锰铝榴石", "立方晶系"],
  sphene: ["榍石", "单斜晶系"], spinel: ["尖晶石", "立方晶系"],
  spodumene: ["锂辉石", "单斜晶系"], sunstone: ["日光石", "三斜晶系"],
  tanzanite: ["坦桑石", "斜方晶系"], tigerseye: ["虎眼石", "三方晶系（石英质）"],
  topaz: ["托帕石", "斜方晶系"], tourmaline: ["碧玺", "三方晶系"],
  tsavorite: ["沙弗莱石", "立方晶系（石榴石）"], turquoise: ["绿松石", "三斜晶系"],
  variscite: ["磷铝石", "斜方晶系"], zircon: ["锆石", "四方晶系"],
  zoisite: ["黝帘石", "斜方晶系"],
  agateraw: ["玛瑙原石", "三方晶系（石英质）"], chalcedonyraw: ["玉髓原石", "三方晶系（石英质）"],
  dushanjade: ["独山玉", "多晶集合体（含斜长石等）"], feicuiraw: ["翡翠原石", "单斜晶系（硬玉）"],
  hetianjadeseed: ["和田玉籽料", "单斜晶系（透闪石）"], lapislazuliraw: ["青金石原石", "隐晶质"],
  malachiteraw: ["孔雀石原石", "单斜晶系"], quartzitejade: ["石英岩玉", "三方晶系（石英）"],
  turquoiseraw: ["绿松石原石", "三斜晶系"], xiujade: ["岫玉", "单斜晶系（蛇纹石）"],
  basalt: ["玄武岩", "多晶集合体"], chert: ["燧石", "隐晶质"], clay: ["粘土", "隐晶质"],
  conglomerate: ["砾岩", "多晶集合体"], diatomite: ["硅藻土", "非晶质"], gypsum: ["石膏", "单斜晶系"],
  olivinebasalt: ["橄榄玄武岩", "多晶集合体"], shale: ["页岩", "隐晶质"], shalemudstone: ["页岩（泥岩）", "隐晶质"],
  siliceoussinter: ["硅华", "非晶质/隐晶质"],
};

export function chineseNameForStone(className: string): string {
  return stoneIdentities[normalizeStoneName(className)]?.[0] || className.replaceAll("_", " ").replaceAll("-", " ");
}

export const countryCoordinates: Record<string, [number, number]> = {
  Afghanistan: [67.7, 33.9],
  Australia: [133.8, -25.3],
  Botswana: [24.7, -22.3],
  Brazil: [-51.9, -14.2],
  Canada: [-106.3, 56.1],
  Chile: [-71.5, -35.7],
  China: [104.2, 35.9],
  Colombia: [-74.3, 4.6],
  "Dem. Rep. Congo": [23.7, -2.9],
  "Dominican Rep.": [-70.2, 18.7],
  Ethiopia: [40.5, 9.1],
  Iceland: [-19.0, 64.9],
  India: [78.9, 20.6],
  Iran: [53.7, 32.4],
  Italy: [12.6, 41.9],
  Japan: [138.3, 36.2],
  Madagascar: [46.9, -18.8],
  Mexico: [-102.6, 23.6],
  Mozambique: [35.5, -18.7],
  Myanmar: [96.0, 21.9],
  Namibia: [18.5, -22.6],
  "New Zealand": [174.9, -40.9],
  Pakistan: [69.3, 30.4],
  Poland: [19.1, 51.9],
  Russia: [105.3, 61.5],
  "South Africa": [22.9, -30.6],
  "Sri Lanka": [80.8, 7.9],
  Tanzania: [34.9, -6.4],
  Turkey: [35.2, 39.0],
  "United Kingdom": [-3.4, 55.4],
  "United States": [-98.6, 39.8],
  Uruguay: [-55.8, -32.5],
  Zambia: [27.8, -13.1],
};

export const countryChineseNames: Record<string, string> = {
  Afghanistan: "阿富汗", Australia: "澳大利亚", Botswana: "博茨瓦纳", Brazil: "巴西",
  Canada: "加拿大", Chile: "智利", China: "中国", Colombia: "哥伦比亚",
  "Dem. Rep. Congo": "刚果（金）", "Dominican Rep.": "多米尼加共和国", Ethiopia: "埃塞俄比亚",
  Iceland: "冰岛", India: "印度", Iran: "伊朗", Italy: "意大利", Japan: "日本",
  Madagascar: "马达加斯加", Mexico: "墨西哥", Mozambique: "莫桑比克", Myanmar: "缅甸",
  Namibia: "纳米比亚", "New Zealand": "新西兰", Pakistan: "巴基斯坦", Poland: "波兰",
  Russia: "俄罗斯", "South Africa": "南非", "Sri Lanka": "斯里兰卡", Tanzania: "坦桑尼亚",
  Turkey: "土耳其", "United Kingdom": "英国", "United States": "美国", Uruguay: "乌拉圭",
  Zambia: "赞比亚",
};

export function bilingualCountryName(country: string): string {
  const chinese = countryChineseNames[country];
  return chinese ? `${chinese} ${country}` : country;
}

export function hardnessForStone(domain: StoneDomain, className: string): string {
  const name = className.toLowerCase();
  if (domain === "common_rock") {
    if (/gypsum/.test(name)) return "莫氏 2";
    if (/diatomite/.test(name)) return "莫氏约 1–1.5";
    if (/clay/.test(name)) return "莫氏约 1–2.5";
    if (/chert/.test(name)) return "莫氏约 7";
    if (/shale/.test(name)) return "莫氏约 3";
    if (/basalt|siliceous/.test(name)) return "莫氏约 5–7";
    return "随组成矿物而变化";
  }
  if (/diamond/.test(name)) return "莫氏 10";
  if (/ruby|sapphire/.test(name)) return "莫氏 9";
  if (/chrysoberyl|alexandrite|cat.?s.eye/.test(name)) return "莫氏 8.5";
  if (/topaz|spinel/.test(name)) return "莫氏 8";
  if (/dumortierite/.test(name)) return "莫氏 7–8.5";
  if (/emerald|aquamarine|beryl|morganite|goshenite|bixbite/.test(name)) return "莫氏 7.5–8";
  if (/garnet|almandine|andradite|grossular|hessonite|pyrope|rhodolite|spessartite|tsavorite/.test(name)) return "莫氏 6.5–7.5";
  if (/quartz|amethyst|ametrine|citrine|agate|chalcedony|chrysoprase|jasper|aventurine|tiger|carnelian|bloodstone|onyx/.test(name)) return "莫氏约 7";
  if (/tourmaline|zircon|iolite|kunzite|spodumene/.test(name)) return "莫氏 7–7.5";
  if (/andalusite|danburite|diaspore/.test(name)) return "莫氏 6.5–7.5";
  if (/benitoite|amazonite|labradorite|moonstone|sunstone|prehnite|pyrite/.test(name)) return "莫氏 6–6.5";
  if (/hiddenite|jade$|dushan/.test(name)) return "莫氏约 6–7";
  if (/jadeite|feicui/.test(name)) return "莫氏 6.5–7";
  if (/peridot|olivine/.test(name)) return "莫氏 6.5–7";
  if (/lapis|sodalite|rhodonite/.test(name)) return "莫氏约 5.5–6.5";
  if (/chrome.diopside|scapolite|zoisite|tanzanite/.test(name)) return "莫氏约 5.5–7";
  if (/kyanite/.test(name)) return "莫氏 4.5–7（方向相关）";
  if (/larimar|sphene/.test(name)) return "莫氏约 4.5–5.5";
  if (/hetian|xiu|serpentine/.test(name)) return "莫氏约 5–6.5";
  if (/turquoise/.test(name)) return "莫氏 5–6";
  if (/opal/.test(name)) return "莫氏 5.5–6.5";
  if (/malachite/.test(name)) return "莫氏 3.5–4";
  if (/chrysocolla/.test(name)) return "莫氏 2.5–3.5";
  if (/rhodochrosite/.test(name)) return "莫氏 3.5–4";
  if (/variscite/.test(name)) return "莫氏 3.5–4.5";
  if (/fluorite/.test(name)) return "莫氏 4";
  if (/pearl/.test(name)) return "莫氏 2.5–4.5";
  if (/amber/.test(name)) return "莫氏 2–2.5";
  if (/coral/.test(name)) return "莫氏 3–4";
  return "暂无可靠统一数值";
}

export function crystalSystemForStone(domain: StoneDomain, className: string): string {
  const exact = stoneIdentities[normalizeStoneName(className)]?.[1];
  if (exact) return exact;
  const name = className.toLowerCase();
  if (domain === "common_rock") return "多矿物集合体，无单一晶系";
  if (/diamond|garnet|spinel|lapis|sodalite|pyrite/.test(name)) return "等轴晶系";
  if (/ruby|sapphire|quartz|amethyst|citrine|agate|chalcedony|jasper/.test(name)) return "三方晶系";
  if (/emerald|aquamarine|beryl/.test(name)) return "六方晶系";
  if (/topaz|peridot|olivine|chrysoberyl/.test(name)) return "斜方晶系";
  if (/jadeite|feicui|hetian|xiu|serpentine|malachite/.test(name)) return "单斜晶系矿物集合体";
  if (/turquoise|rhodonite/.test(name)) return "三斜晶系";
  if (/opal|amber/.test(name)) return "非晶质";
  if (/pearl|coral/.test(name)) return "有机宝石材料";
  return "暂无可靠统一资料";
}

export function countriesForStone(domain: StoneDomain, className: string): string[] {
  const name = className.toLowerCase();
  if (domain === "jade_raw") {
    if (/dushan|hetian|xiu/.test(name)) return ["China"];
    if (/feicui/.test(name)) return ["Myanmar", "China"];
    if (/lapis/.test(name)) return ["Afghanistan", "Chile", "Russia"];
    if (/malachite/.test(name)) return ["Dem. Rep. Congo", "Zambia", "Russia"];
    if (/turquoise/.test(name)) return ["Iran", "China", "United States"];
    if (/agate/.test(name)) return ["Brazil", "Uruguay", "China"];
    if (/chalcedony/.test(name)) return ["Brazil", "India", "Turkey"];
    return ["China", "India", "Brazil"];
  }
  if (domain === "common_rock") {
    if (/basalt/.test(name)) return ["Iceland", "United States", "China", "India"];
    if (/gypsum/.test(name)) return ["United States", "China", "Iran"];
    if (/diatomite/.test(name)) return ["United States", "China", "Turkey"];
    if (/siliceous/.test(name)) return ["New Zealand", "United States", "Iceland"];
    if (/chert/.test(name)) return ["United States", "Australia", "United Kingdom"];
    return ["China", "United States", "India", "Australia"];
  }

  if (/diamond/.test(name)) return ["Botswana", "South Africa", "Russia", "Canada", "Australia"];
  if (/emerald/.test(name)) return ["Colombia", "Zambia", "Brazil"];
  if (/ruby/.test(name)) return ["Myanmar", "Mozambique", "Sri Lanka", "Tanzania"];
  if (/sapphire/.test(name)) return ["Sri Lanka", "Myanmar", "Madagascar", "Australia"];
  if (/tanzanite/.test(name)) return ["Tanzania"];
  if (/opal/.test(name)) return ["Australia", "Ethiopia", "Mexico"];
  if (/turquoise/.test(name)) return ["Iran", "China", "United States"];
  if (/lapis/.test(name)) return ["Afghanistan", "Chile", "Russia"];
  if (/malachite/.test(name)) return ["Dem. Rep. Congo", "Zambia", "Russia"];
  if (/amber/.test(name)) return ["Poland", "Dominican Rep.", "Myanmar"];
  if (/pearl/.test(name)) return ["China", "Japan", "Australia"];
  if (/coral/.test(name)) return ["Italy", "Japan"];
  if (/garnet|almandine|andradite|grossular|hessonite|pyrope|rhodolite|spessartite|tsavorite/.test(name)) return ["India", "Sri Lanka", "Tanzania", "Madagascar"];
  if (/jade|serpentine/.test(name)) return ["Myanmar", "China", "Canada", "Russia"];
  if (/aquamarine|beryl|morganite|topaz|tourmaline|quartz|amethyst|citrine/.test(name)) return ["Brazil", "Madagascar", "Pakistan"];
  if (/peridot/.test(name)) return ["Pakistan", "Myanmar", "United States"];
  return ["Brazil", "Sri Lanka", "Madagascar"];
}
