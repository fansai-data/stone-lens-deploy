"use client";

import { useState } from "react";
import { sitePath } from "./sitePath";

type Birthstone = {
  name: string;
  english: string;
  image: string;
  story: string;
  care: string;
  zodiac: string;
  meaning: string;
};

type MonthStory = {
  month: string;
  englishMonth: string;
  representative: Birthstone;
  stones: Birthstone[];
};

const image = (name: string) => sitePath(`/atlas-thumbs/gemstone--${name}--1.webp`);
const stone = (name: string, english: string, story: string, care: string, zodiac: string, meaning: string): Birthstone => ({
  name, english, image: image(english.replaceAll(" ", "-")), story, care, zodiac, meaning,
});

const birthstoneOrigins: Record<string, { countries: string; note: string }> = {
  "Garnet-Red": { countries: "印度 India、斯里兰卡 Sri Lanka、坦桑尼亚 Tanzania、莫桑比克 Mozambique", note: "石榴石家族产地广泛，红色品种常见于变质岩与砂矿中，不同产地会带来微妙的红调差异。" },
  Amethyst: { countries: "巴西 Brazil、乌拉圭 Uruguay、赞比亚 Zambia、俄罗斯 Russia", note: "优质紫水晶常来自晶洞或热液脉，颜色从淡紫到深紫，受铁元素与天然辐照影响。" },
  Aquamarine: { countries: "巴西 Brazil、巴基斯坦 Pakistan、尼日利亚 Nigeria、马达加斯加 Madagascar", note: "海蓝宝石属于绿柱石家族，清澈的蓝绿色调让它很适合做成明亮的大颗粒切割。" },
  Bloodstone: { countries: "印度 India、巴西 Brazil、澳大利亚 Australia、美国 USA", note: "血石多为深绿色玉髓中带红色斑点，红点常由铁氧化物形成，因此每一颗纹理都不完全相同。" },
  Diamond: { countries: "博茨瓦纳 Botswana、南非 South Africa、加拿大 Canada、俄罗斯 Russia、澳大利亚 Australia", note: "钻石来自地幔深处，经火山岩筒带到地表；产地会影响开采历史与商业分级背景。" },
  Emerald: { countries: "哥伦比亚 Colombia、赞比亚 Zambia、巴西 Brazil、阿富汗 Afghanistan", note: "祖母绿以包裹体和裂隙著称，业内常把这些天然痕迹称作“花园”，也是它个性的一部分。" },
  Pearl: { countries: "中国 China、日本 Japan、澳大利亚 Australia、塔希提 Tahiti、印尼 Indonesia", note: "珍珠不是矿物晶体，而是由贝类孕育的有机宝石，产区与养殖环境会影响光泽、大小和颜色。" },
  Moonstone: { countries: "斯里兰卡 Sri Lanka、印度 India、缅甸 Myanmar、马达加斯加 Madagascar", note: "月光石属于长石家族，迷人的蓝白晕彩来自内部层状结构对光线的散射。" },
  Alexandrite: { countries: "俄罗斯 Russia、巴西 Brazil、斯里兰卡 Sri Lanka、坦桑尼亚 Tanzania", note: "亚历山大石以变色效应闻名，日光与灯光下呈现不同色调，因此常被称为“白天祖母绿，夜晚红宝石”。" },
  Ruby: { countries: "缅甸 Myanmar、莫桑比克 Mozambique、泰国 Thailand、斯里兰卡 Sri Lanka", note: "红宝石属于刚玉，红色主要来自铬元素；缅甸与莫桑比克红宝石在市场上都很有代表性。" },
  Peridot: { countries: "美国 Arizona、巴基斯坦 Pakistan、缅甸 Myanmar、中国 China、埃及 Egypt", note: "橄榄石有时来自地幔岩，也能在陨石中出现，明亮黄绿色让它很容易和深色背景形成对比。" },
  Spinel: { countries: "缅甸 Myanmar、斯里兰卡 Sri Lanka、坦桑尼亚 Tanzania、越南 Vietnam", note: "尖晶石曾长期被误认为红宝石，如今因色彩鲜明、火彩干净，逐渐成为很受关注的彩宝。" },
  "Onyx-Red": { countries: "巴西 Brazil、印度 India、乌拉圭 Uruguay、马达加斯加 Madagascar", note: "缠丝玛瑙与红玛瑙常见条带或层状纹理，适合雕刻和珠串，也很适合展示天然纹路。" },
  "Sapphire-Blue": { countries: "斯里兰卡 Sri Lanka、缅甸 Myanmar、克什米尔 Kashmir、马达加斯加 Madagascar、澳大利亚 Australia", note: "蓝宝石同属刚玉，蓝色多与铁、钛元素相关；不同产地的蓝调和丝绢感差别明显。" },
  Opal: { countries: "澳大利亚 Australia、埃塞俄比亚 Ethiopia、墨西哥 Mexico、巴西 Brazil", note: "欧泊的变彩来自内部二氧化硅微球排列，含水特性让它比多数宝石更需要温柔保养。" },
  Tourmaline: { countries: "巴西 Brazil、尼日利亚 Nigeria、莫桑比克 Mozambique、阿富汗 Afghanistan、美国 USA", note: "碧玺颜色跨度极大，同一晶体中也可能出现双色或多色，是最适合讲“彩虹感”的宝石之一。" },
  Citrine: { countries: "巴西 Brazil、玻利维亚 Bolivia、马达加斯加 Madagascar、西班牙 Spain", note: "黄水晶属于石英家族，天然黄水晶较少见，市场上也常见由紫水晶或烟晶加热形成的金黄色调。" },
  Topaz: { countries: "巴西 Brazil、巴基斯坦 Pakistan、斯里兰卡 Sri Lanka、俄罗斯 Russia", note: "托帕石晶体常能长到较大尺寸，颜色从无色、金黄到蓝色都有，切割后亮度很高。" },
  Tanzanite: { countries: "坦桑尼亚 Tanzania", note: "坦桑石商业级产地几乎集中在坦桑尼亚梅雷拉尼一带，稀有的单一产区是它故事感很强的原因。" },
  Turquoise: { countries: "伊朗 Iran、中国 China、美国 USA、埃及 Egypt", note: "绿松石常见铁线与孔隙结构，颜色会受铜、铁和围岩影响；佩戴时尤其要远离油污和化学品。" },
  Zircon: { countries: "柬埔寨 Cambodia、斯里兰卡 Sri Lanka、缅甸 Myanmar、澳大利亚 Australia", note: "锆石拥有很高的色散和明亮火彩，蓝色锆石尤其常见于加热处理后的商业品种。" },
};

const originFor = (english: string) =>
  birthstoneOrigins[english] ?? { countries: "主要产地资料整理中", note: "不同产地会影响颜色、包裹体与市场故事，建议结合证书或实物观察判断。" };

const englishName = (value: string) => value.replaceAll("-", " ");

const englishOriginCountries = (english: string) =>
  (birthstoneOrigins[english]?.countries || "")
    .split("、")
    .map((part) => part.replace(/[\u4e00-\u9fff]/g, "").trim())
    .filter(Boolean)
    .join(", ") || "Origin data unavailable";

const englishStoryFor = (item: Birthstone) =>
  `${englishName(item.english)} is a traditional birthstone associated with ${englishMeaningFor(item)}. This English version keeps the story concise for international visitors while preserving the gentle, symbolic tone of the original section.`;

const englishCareFor = (item: Birthstone) => {
  if (/Pearl/.test(item.english)) return "Keep away from perfume, cosmetics and sweat. Wipe gently with a soft cloth after wearing.";
  if (/Opal/.test(item.english)) return "Avoid heat, dryness and ultrasonic cleaning. Store gently and avoid sudden temperature changes.";
  if (/Diamond|Ruby|Sapphire/.test(item.english)) return "Durable for daily wear, but avoid hard impact and clean with care.";
  return "Avoid strong impact, harsh chemicals and prolonged exposure to intense heat or sunlight.";
};

const englishMeaningFor = (item: Birthstone) => {
  const fallback: Record<string, string> = {
    Diamond: "clarity, commitment and resilience",
    Ruby: "passion, courage and vitality",
    Pearl: "softness, grace and wholeness",
    Amethyst: "calmness, clarity and inner balance",
    Emerald: "renewal, hope and insight",
    "Sapphire-Blue": "wisdom, loyalty and dignity",
  };
  return fallback[item.english] || "personal reflection and gentle inspiration";
};

const birthstoneStoryMore: Record<string, string> = {
  "Garnet-Red": "在维多利亚时期，波希米亚石榴石首饰曾风靡欧洲，密镶的小颗红石榴石像烛火一样铺满胸针、项链和戒指，也让它从护身符慢慢走入日常装饰。",
  Amethyst: "紫水晶在欧洲宗教首饰中也很常见，主教戒指常用紫色宝石来象征节制与精神清明；它既有神话的浪漫，也有一种安静、克制的仪式感。",
  Aquamarine: "20 世纪，巴西曾将一批高品质海蓝宝石赠予美国第一夫人埃莉诺·罗斯福，后来被制作成珠宝收藏，也让海蓝宝石多了一层外交礼物的优雅故事。",
  Bloodstone: "血石的红斑让古人很容易联想到勇气、牺牲和守护，因此它常被雕刻成印章、护符或宗教题材小件，气质比海蓝宝石更厚重。",
  Diamond: "钻石后来成为订婚戒指的经典主石，也进入许多王室冠冕和博物馆收藏。著名的希望钻石曾与法国王室宝库、珠宝商 Harry Winston 和史密森尼博物馆联系在一起。",
  Emerald: "埃及艳后克利奥帕特拉对祖母绿的喜爱几乎成了宝石史中最有画面感的故事之一；从古埃及到哥伦比亚矿区，祖母绿一直与权力、春天和生命力相连。",
  Pearl: "珍珠在肖像画中常被用来表现身份与端庄。伊丽莎白一世的画像里常见大量珍珠装饰，到了 20 世纪，Coco Chanel 又把多层珍珠项链变成现代时装符号。",
  Moonstone: "新艺术运动时期，珠宝大师 René Lalique 等设计师偏爱带有朦胧光感的宝石，月光石因此很适合被做成花叶、昆虫和女性轮廓等柔美题材。",
  Alexandrite: "亚历山大石的命名与俄国沙皇亚历山大二世相关，它的红绿变色又正好呼应俄罗斯帝国军服色彩，因此常被赋予幸运、转折和时代记忆。",
  Ruby: "红宝石长期是王权与热情的象征。现代珠宝史中，Elizabeth Taylor 收藏过醒目的红宝石珠宝套装，也让红宝石继续保持戏剧化、强存在感的气质。",
  Peridot: "橄榄石在古埃及红海岛屿 Zabargad 的开采故事很有传奇感；夜间寻矿的传说，让它不像一般绿色宝石那样清冷，而带着一点太阳与火山的气息。",
  Spinel: "英国王冠上的“黑王子红宝石”后来被确认其实是尖晶石，这件事让尖晶石从被误认的配角变成了宝石史里的主角之一。",
  "Onyx-Red": "玛瑙类宝石在古罗马印章戒指和护身符中十分常见，层状纹理适合雕刻，也适合承载家族标记、军团符号和私人印记。",
  "Sapphire-Blue": "维多利亚女王在婚礼当天佩戴了阿尔伯特亲王赠送的蓝宝石钻石胸针；后来戴安娜王妃的蓝宝石订婚戒指，又让蓝宝石成为现代王室珠宝记忆的一部分。",
  Opal: "欧泊曾因色彩变幻被赋予神秘感。维多利亚女王喜欢欧泊，并曾把欧泊首饰赠予女儿们，这在一定程度上帮助它摆脱了“带来厄运”的迷信阴影。",
  Tourmaline: "碧玺因为颜色跨度极大，很受现代珠宝设计师欢迎；帕拉伊巴碧玺的霓虹蓝绿色更是让碧玺在当代彩宝市场中拥有极高辨识度。",
  Citrine: "黄水晶常被称作“商人之石”，这种说法更像文化寓意而非科学功效；在首饰设计中，它的金黄色调很容易营造阳光、丰盛和复古感。",
  Topaz: "托帕石在欧洲宫廷和宗教首饰中都出现过，黄金色托帕石尤其适合与太阳、丰收和温暖意象相连；蓝色托帕石则更偏现代、清爽。",
  Tanzanite: "坦桑石发现时间很晚，却迅速进入高级珠宝视野。Tiffany & Co. 曾推动它走向国际市场，也让这种来自单一产区的蓝紫色宝石有了现代商业传奇。",
  Turquoise: "绿松石在波斯、古埃及和美洲原住民文化中都很重要，它既可以出现在宫殿装饰中，也可以被做成银饰、护符和马具装饰。",
  Zircon: "锆石常因名字与人造立方氧化锆混淆，但天然锆石有自己的火彩与历史。中世纪欧洲传说里，它常与安眠、智慧和驱散阴影联系在一起。",
};

const birthstoneLegacy: Record<string, string> = {
  "Garnet-Red": "历史线索：19 世纪波希米亚石榴石首饰曾是欧洲流行风格。",
  Amethyst: "历史线索：紫水晶常见于王室、宗教戒指与主教饰品。",
  Aquamarine: "名人线索：埃莉诺·罗斯福曾收到来自巴西的海蓝宝石礼物。",
  Bloodstone: "历史线索：中世纪血石常被雕刻成宗教护符和印章。",
  Diamond: "名人线索：希望钻石曾由 Harry Winston 捐赠给史密森尼博物馆。",
  Emerald: "名人线索：埃及艳后克利奥帕特拉以喜爱祖母绿闻名。",
  Pearl: "名人线索：伊丽莎白一世肖像和 Coco Chanel 风格都离不开珍珠。",
  Moonstone: "历史线索：新艺术运动珠宝中常能看到月光石的柔光。",
  Alexandrite: "历史线索：亚历山大石与俄国帝国时期的命名故事相连。",
  Ruby: "名人线索：Elizabeth Taylor 的红宝石珠宝让这种宝石极具戏剧感。",
  Peridot: "历史线索：古埃及 Zabargad 岛的橄榄石矿曾很著名。",
  Spinel: "历史线索：英国王冠上的“黑王子红宝石”其实是红色尖晶石。",
  "Onyx-Red": "历史线索：玛瑙常用于古罗马印章戒指和护身符。",
  "Sapphire-Blue": "名人线索：维多利亚女王和戴安娜王妃都留下了蓝宝石珠宝故事。",
  Opal: "名人线索：维多利亚女王曾喜欢并赠送欧泊首饰。",
  Tourmaline: "设计线索：帕拉伊巴碧玺让现代珠宝中的电光蓝绿色很出圈。",
  Citrine: "文化线索：黄水晶常被赋予财富、阳光和商贸寓意。",
  Topaz: "历史线索：金黄色托帕石常与太阳神话和宫廷珠宝相连。",
  Tanzanite: "品牌线索：Tiffany & Co. 推动坦桑石进入国际珠宝市场。",
  Turquoise: "历史线索：绿松石横跨波斯、古埃及与美洲原住民装饰传统。",
  Zircon: "历史线索：天然锆石在中世纪传说中常与智慧和安眠相关。",
};

const storyFor = (item: Birthstone) => {
  const more = birthstoneStoryMore[item.english];
  return more ? `${item.story}${more}` : item.story;
};

const legacyFor = (english: string) => birthstoneLegacy[english] ?? "历史线索：相关名人与佩戴资料整理中，可结合博物馆藏品和证书继续补充。";

const months: MonthStory[] = [
  { month: "一月", englishMonth: "January", representative: stone("石榴石", "Garnet-Red", "据《圣经》记载，诺亚曾以一枚巨大的石榴石作为灯笼，照亮方舟在黑暗中的航行。古人也相信它能为夜行旅人指引方向。", "硬度 7–7.5；日常佩戴耐久，避免剧烈撞击。", "摩羯座 · Capricorn（12.22–1.19）", "友谊、忠诚与平安归来"), stones: [] },
  { month: "二月", englishMonth: "February", representative: stone("紫水晶", "Amethyst", "希腊神话中，少女阿米瑟斯特被化为白色水晶，酒神悔悟后将葡萄酒洒在雕像上，水晶由此染成紫色。", "避免长时间暴晒，以免颜色逐渐变淡。", "水瓶座 · Aquarius（1.20–2.18）", "平静、清醒与内在力量"), stones: [] },
  { month: "三月", englishMonth: "March", representative: stone("海蓝宝石", "Aquamarine", "地中海水手相信海蓝宝石来自美人鱼的宝箱，出海时佩戴可以平息海浪、保佑平安归来。", "硬度 7.5–8，较耐磨；避免强烈碰撞。", "双鱼座 · Pisces（2.19–3.20）", "宁静、勇气与清晰表达"), stones: [stone("血石", "Bloodstone", "中世纪传说认为，血石是基督的鲜血滴落在碧玉上形成的守护石。", "硬度约 7；避免强酸和强烈化学品。", "双鱼座 · Pisces（2.19–3.20）", "力量、坚韧与守护")] },
  { month: "四月", englishMonth: "April", representative: stone("钻石", "Diamond", "古印度人相信钻石是闪电击中岩石时诞生的碎片；希腊人称它为 adamas，意为“不可征服”。", "硬度 10，但仍需避免撞击解理面；远离油脂。", "白羊座 · Aries（3.21–4.19）", "坚定、纯粹与恒久承诺"), stones: [] },
  { month: "五月", englishMonth: "May", representative: stone("祖母绿", "Emerald", "相传埃及艳后克利奥帕特拉酷爱祖母绿。古巴比伦传说则把它与春天女神和土地丰收联系在一起。", "性脆易碎，避免高温和超声波；用温水与软布清洁。", "金牛座 · Taurus（4.20–5.20）", "希望、新生与洞察"), stones: [] },
  { month: "六月", englishMonth: "June", representative: stone("珍珠", "Pearl", "古人认为珍珠是月光落入海中凝成的泪珠，也有人把它想象成人鱼哭泣时留下的温柔印记。", "硬度 2.5–4.5；远离香水、化妆品和汗水，佩戴后用软布擦干。", "双子座 · Gemini（5.21–6.20）", "纯洁、温柔与圆满"), stones: [
    stone("月光石", "Moonstone", "印度传说中，月光石是凝固的月光，能让恋人预知未来。", "性脆，避免碰撞和剧烈温差。", "双子座 · Gemini（5.21–6.20）", "直觉、新开始与柔和守护"),
    stone("亚历山大石", "Alexandrite", "因在日光下呈绿色、灯光下呈红色，亚历山大石的变色被视为幸运与转机的象征。", "硬度约 8.5，日常佩戴耐久；避免剧烈撞击。", "双子座 · Gemini（5.21–6.20）", "变化、平衡与好运"),
  ] },
  { month: "七月", englishMonth: "July", representative: stone("红宝石", "Ruby", "缅甸传说中，战士把红宝石视为勇气护符；古印度人称它为“宝石之王”，相信内部燃烧着永恒火焰。", "硬度 9，日常佩戴耐久；避免高温和长时间强光照射。", "巨蟹座 · Cancer（6.21–7.22）", "热情、勇气与成功"), stones: [] },
  { month: "八月", englishMonth: "August", representative: stone("橄榄石", "Peridot", "古埃及矿工曾在夜晚寻找橄榄石，相信阳光会隐藏它的光芒。", "硬度 6.5–7；避免酸性清洗剂和剧烈撞击。", "狮子座 · Leo（7.23–8.22）", "活力、保护与好心情"), stones: [
    stone("尖晶石", "Spinel", "历史上不少著名“红宝石”后来被鉴定为尖晶石，它因此拥有一段从误认到正名的传奇。", "硬度 8，耐磨耐热；日常佩戴较稳定。", "狮子座 · Leo（7.23–8.22）", "复苏、热忱与韧性"),
    stone("缠丝玛瑙", "Onyx-Red", "古罗马军人佩戴雕刻的缠丝玛瑙作为护身符，寄托对稳定与勇气的期望。", "硬度约 7；避免强烈碰撞。", "狮子座 · Leo（7.23–8.22）", "勇气、稳定与守信"),
  ] },
  { month: "九月", englishMonth: "September", representative: stone("蓝宝石", "Sapphire-Blue", "中世纪欧洲人相信蓝宝石能守护纯洁、揭露欺骗；波斯传说则把天空的蓝色归于蓝宝石的倒映。", "硬度 9，仅次于钻石；避免撞击解理面。", "处女座 · Virgo（8.23–9.22）", "智慧、忠诚与高贵"), stones: [] },
  { month: "十月", englishMonth: "October", representative: stone("欧泊", "Opal", "澳大利亚原住民传说中，造物主踩着彩虹来到大地，每一步都诞生一颗色彩斑斓的欧泊。", "含水量较高，怕干燥和高温；避免暴晒与超声波清洗。", "天秤座 · Libra（9.23–10.22）", "希望、灵感与想象力"), stones: [stone("碧玺", "Tourmaline", "古埃及传说碧玺在从地心上升时穿越彩虹，因此拥有彩虹的多种颜色。", "硬度 7–7.5，日常佩戴耐久；避免剧烈撞击。", "天秤座 · Libra（9.23–10.22）", "创造力、包容与丰富情感")] },
  { month: "十一月", englishMonth: "November", representative: stone("黄水晶", "Citrine", "古罗马商人把黄水晶雕成护身符放在钱袋中，相信它能守护财富与交易。", "硬度 7；避免长时间暴晒和骤冷骤热。", "天蝎座 · Scorpio（10.23–11.21）", "乐观、活力与丰盛"), stones: [stone("托帕石", "Topaz", "古埃及人认为托帕石被太阳神拉赋予金色光芒，可以驱散黑暗与邪恶。", "硬度 8，耐磨损；避免剧烈撞击和长时间暴晒。", "天蝎座 · Scorpio（10.23–11.21）", "真诚、温暖与丰盛")] },
  { month: "十二月", englishMonth: "December", representative: stone("坦桑石", "Tanzanite", "坦桑石于 1967 年在坦桑尼亚被发现，当地传说闪电击中岩石后，蓝色火球冷却成了这种宝石。", "硬度 6.5–7，性脆；忌超声波、蒸汽和磕碰。", "射手座 · Sagittarius（11.22–12.21）", "转变、发现与独特个性"), stones: [
    stone("绿松石", "Turquoise", "波斯人把绿松石镶嵌在宫殿穹顶，认为它会以颜色变化预示风险。", "多孔，远离油污、香水和化学试剂。", "射手座 · Sagittarius（11.22–12.21）", "平安、好运与守护"),
    stone("锆石", "Zircon", "中世纪欧洲传说把锆石与安睡、驱散邪意和获得智慧联系在一起。", "硬度 7–7.5，但有脆性；避免磕碰。", "射手座 · Sagittarius（11.22–12.21）", "智慧、安宁与光明"),
  ] },
];

months.forEach((month) => { month.stones = [month.representative, ...month.stones]; });

export default function BirthstoneStories({ language = "zh" }: { language?: "zh" | "en" }) {
  const isEnglish = language === "en";
  const [selected, setSelected] = useState<MonthStory | null>(null);

  const openMonth = (month: MonthStory) => {
    setSelected(month);
    window.setTimeout(() => document.getElementById("birthstone-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  };

  return (
    <section className="birthstone-stories" id="birthstones">
      <div className="birthstone-heading">
        <div><span className="eyebrow">{isEnglish ? "BIRTHSTONE STORIES" : "BIRTHSTONE STORIES · 生辰石趣闻"}</span><h2>{isEnglish ? "Twelve months, twelve gemstone stories" : "十二个月，十二组宝石故事"}</h2></div>
        <p>{isEnglish ? "Choose a month to explore its representative birthstones, symbolic meaning, origin notes and care tips. Stories are cultural references, not scientific claims or purchase advice." : "点击月份，查看该月生辰石的传说、保养建议、适配星座与象征意义。传说属于文化故事，不代表科学功效或购买建议。"}</p>
      </div>
      <div className="birthstone-month-grid">
        {months.map((month, index) => (
          <button
            key={month.englishMonth}
            className={selected?.englishMonth === month.englishMonth ? "is-active" : undefined}
            onClick={() => openMonth(month)}
            aria-label={isEnglish ? `View ${month.englishMonth} birthstone details` : `查看${month.month}${month.englishMonth}生辰石详情`}
            aria-pressed={selected?.englishMonth === month.englishMonth}
          >
            <img src={month.representative.image} alt={isEnglish ? `${month.englishMonth} birthstone ${englishName(month.representative.english)}` : `${month.month}生辰石 ${month.representative.name}`} loading="lazy" />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{isEnglish ? month.englishMonth : `${month.month} · ${month.englishMonth}`}</small><b>{isEnglish ? englishName(month.representative.english) : month.representative.name}</b><em>{isEnglish ? "" : month.representative.english.replaceAll("-", " ")}</em><i>{isEnglish ? "EXPLORE STORY" : "EXPLORE STORY"}&nbsp; →</i></div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="birthstone-detail" id="birthstone-detail">
          <div className="birthstone-detail-head">
            <div><span>{isEnglish ? `${selected.englishMonth.toUpperCase()} BIRTHSTONES` : `${selected.englishMonth.toUpperCase()} BIRTHSTONES · 生辰石`}</span><h3>{isEnglish ? `${selected.englishMonth} Birthstones` : `${selected.month}生辰石`}</h3></div>
          </div>
          <div className="birthstone-detail-grid">
            {selected.stones.map((item) => {
              const origin = originFor(item.english);
              return (
              <article key={item.english}>
                <img src={item.image} alt={isEnglish ? englishName(item.english) : `${item.name} ${item.english}`} loading="lazy" />
                <div>
                  <h4>{isEnglish ? englishName(item.english) : item.name}<small>{isEnglish ? "" : item.english.replaceAll("-", " ")}</small></h4>
                  <p>{isEnglish ? englishStoryFor(item) : storyFor(item)}</p>
                  <dl>
                    <div><dt>{isEnglish ? "Care tips" : "保养建议"}</dt><dd>{isEnglish ? englishCareFor(item) : item.care}</dd></div>
                    <div><dt>{isEnglish ? "Zodiac season" : "适配星座"}</dt><dd>{isEnglish ? item.zodiac.replace(/[\u4e00-\u9fff·（）：]/g, "").trim() : item.zodiac}</dd></div>
                    <div className="birthstone-origin"><dt>{isEnglish ? "Principal origins" : "主要产地"}</dt><dd>{isEnglish ? englishOriginCountries(item.english) : origin.countries}</dd></div>
                  </dl>
                  <div className="birthstone-extra">
                    <b>{isEnglish ? `Symbolism: ${englishMeaningFor(item)}` : `象征：${item.meaning}`}</b>
                    <span>{isEnglish ? "Origin, color and inclusions vary by source. For buying or appraisal, combine visual reference with a certificate or expert inspection." : origin.note}</span>
                    <span>{isEnglish ? "Cultural note: birthstone stories are symbolic traditions rather than guaranteed effects." : legacyFor(item.english)}</span>
                  </div>
                </div>
              </article>
            );})}
          </div>
          <button className="birthstone-collapse-bottom" onClick={() => setSelected(null)}>{isEnglish ? "Close details ×" : "收起详情 ×"}</button>
          <a href="https://www.gia.edu/birthstones" target="_blank" rel="noreferrer">{isEnglish ? "Reference: GIA Birthstone Guide ↗" : "资料参考：GIA 生辰石指南 ↗"}</a>
        </div>
      )}
    </section>
  );
}
