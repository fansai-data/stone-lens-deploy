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

export default function BirthstoneStories() {
  const [selected, setSelected] = useState<MonthStory | null>(null);

  const openMonth = (month: MonthStory) => {
    setSelected(month);
    window.setTimeout(() => document.getElementById("birthstone-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  };

  return (
    <section className="birthstone-stories" id="birthstones">
      <div className="birthstone-heading">
        <div><span className="eyebrow">BIRTHSTONE STORIES · 生辰石趣闻</span><h2>十二个月，十二组宝石故事</h2></div>
        <p>点击月份，查看该月生辰石的传说、保养建议、适配星座与象征意义。传说属于文化故事，不代表科学功效或购买建议。</p>
      </div>
      <div className="birthstone-month-grid">
        {months.map((month, index) => (
          <button
            key={month.englishMonth}
            className={selected?.englishMonth === month.englishMonth ? "is-active" : undefined}
            onClick={() => openMonth(month)}
            aria-label={`查看${month.month}${month.englishMonth}生辰石详情`}
            aria-pressed={selected?.englishMonth === month.englishMonth}
          >
            <img src={month.representative.image} alt={`${month.month}生辰石 ${month.representative.name}`} loading="lazy" />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{month.month} · {month.englishMonth}</small><b>{month.representative.name}</b><em>{month.representative.english.replaceAll("-", " ")}</em><i>EXPLORE STORY&nbsp; →</i></div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="birthstone-detail" id="birthstone-detail">
          <div className="birthstone-detail-head">
            <div><span>{selected.englishMonth.toUpperCase()} BIRTHSTONES · 生辰石</span><h3>{selected.month}生辰石</h3></div>
          </div>
          <div className="birthstone-detail-grid">
            {selected.stones.map((item) => (
              <article key={item.english}>
                <img src={item.image} alt={`${item.name} ${item.english}`} loading="lazy" />
                <div><h4>{item.name}<small>{item.english.replaceAll("-", " ")}</small></h4><p>{item.story}</p><dl><div><dt>保养建议</dt><dd>{item.care}</dd></div><div><dt>适配星座</dt><dd>{item.zodiac}</dd></div></dl><b>象征：{item.meaning}</b></div>
              </article>
            ))}
          </div>
          <button className="birthstone-collapse-bottom" onClick={() => setSelected(null)}>收起详情 ×</button>
          <a href="https://www.gia.edu/birthstones" target="_blank" rel="noreferrer">资料参考：GIA 生辰石指南 ↗</a>
        </div>
      )}
    </section>
  );
}
