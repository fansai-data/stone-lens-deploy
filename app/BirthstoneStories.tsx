"use client";

import { useState } from "react";

type Birthstone = { name: string; english: string; image: string; story: string; meaning: string };
type MonthStory = { month: string; englishMonth: string; representative: Birthstone; stones: Birthstone[] };

const image = (name: string) => `/atlas-thumbs/gemstone--${name}--1.webp`;

const months: MonthStory[] = [
  { month: "一月", englishMonth: "January", representative: { name: "石榴石", english: "Garnet", image: image("Garnet-Red"), story: "名称常被认为源自“石榴”一词；古代红色石榴石常被制成护符和印章。", meaning: "传统象征友谊、忠诚与平安归来。" }, stones: [] },
  { month: "二月", englishMonth: "February", representative: { name: "紫水晶", english: "Amethyst", image: image("Amethyst"), story: "紫水晶在古希腊语传统中与清醒、自持的故事相连，曾长期是珍贵的王室紫色宝石。", meaning: "传统象征平静、清醒与内在力量。" }, stones: [] },
  { month: "三月", englishMonth: "March", representative: { name: "海蓝宝石", english: "Aquamarine", image: image("Aquamarine"), story: "清澈蓝色令人联想到海水，欧洲航海传统中常把它视作旅途守护石。", meaning: "传统象征宁静、勇气与清晰表达。" }, stones: [
    { name: "血石", english: "Bloodstone", image: image("Bloodstone"), story: "深绿色底色上的红色斑点孕育了许多关于勇气和守护的古老故事。", meaning: "传统象征力量、坚韧与守护。" },
  ] },
  { month: "四月", englishMonth: "April", representative: { name: "钻石", english: "Diamond", image: image("Diamond"), story: "钻石以极高硬度和璀璨火彩闻名，历史上常与坚不可摧和恒久承诺联系。", meaning: "传统象征坚定、纯粹与恒久。" }, stones: [] },
  { month: "五月", englishMonth: "May", representative: { name: "祖母绿", english: "Emerald", image: image("Emerald"), story: "浓郁绿色长期与春天和新生相连；古代王室也喜爱以祖母绿制作珍贵饰物。", meaning: "传统象征希望、新生与洞察。" }, stones: [] },
  { month: "六月", englishMonth: "June", representative: { name: "珍珠", english: "Pearl", image: image("Pearl"), story: "珍珠来自水域中的生命过程；古代中东曾流传它是从天而降的泪滴。", meaning: "传统象征纯洁、温柔与圆满。" }, stones: [
    { name: "亚历山大石", english: "Alexandrite", image: image("Alexandrite"), story: "因不同光线下呈现绿色与红色变化而著名，名称与十九世纪俄国历史相关。", meaning: "传统象征变化、好运与平衡。" },
    { name: "月光石", english: "Moonstone", image: image("Moonstone"), story: "漂浮般的月光效应让它在多个文化中与月亮和夜色传说相连。", meaning: "传统象征直觉、新开始与柔和守护。" },
  ] },
  { month: "七月", englishMonth: "July", representative: { name: "红宝石", english: "Ruby", image: image("Ruby"), story: "鲜红色让红宝石在许多文化中被视作生命力与权力的象征。", meaning: "传统象征热情、勇气与成功。" }, stones: [] },
  { month: "八月", englishMonth: "August", representative: { name: "橄榄石", english: "Peridot", image: image("Peridot"), story: "明亮黄绿色常让人联想到阳光；古代矿区曾在夜色中寻找它的光泽。", meaning: "传统象征活力、保护与好心情。" }, stones: [
    { name: "尖晶石", english: "Spinel", image: image("Spinel"), story: "历史上不少著名“红宝石”后来被证实是红色尖晶石。", meaning: "传统象征复苏、热忱与韧性。" },
    { name: "缠丝玛瑙", english: "Sardonyx", image: image("Onyx-Red"), story: "层状条带适合雕刻印章，古罗马时代便被用于护身饰物。", meaning: "传统象征勇气、稳定与守信。" },
  ] },
  { month: "九月", englishMonth: "September", representative: { name: "蓝宝石", english: "Sapphire", image: image("Sapphire-Blue"), story: "深蓝色长期出现在王室珠宝和宗教饰物中，也存在粉、黄、紫等多种颜色。", meaning: "传统象征智慧、忠诚与高贵。" }, stones: [] },
  { month: "十月", englishMonth: "October", representative: { name: "欧泊", english: "Opal", image: image("Opal"), story: "变彩效应曾被比作闪电、烟火和星系；贝都因传说认为欧泊伴随雷雨从天空落下。", meaning: "传统象征希望、灵感与想象力。" }, stones: [
    { name: "碧玺", english: "Tourmaline", image: image("Tourmaline"), story: "名称与“混合颜色的石头”有关，一颗晶体中可同时出现多种颜色。", meaning: "传统象征创造力、包容与丰富情感。" },
  ] },
  { month: "十一月", englishMonth: "November", representative: { name: "托帕石", english: "Topaz", image: image("Topaz"), story: "托帕石拥有多种颜色，历史文献中也曾与其他黄色宝石混淆。", meaning: "传统象征真诚、温暖与丰盛。" }, stones: [
    { name: "黄水晶", english: "Citrine", image: image("Citrine"), story: "金黄色石英因温暖色调而广受喜爱，名称与柑橘色彩相关。", meaning: "传统象征乐观、活力与繁荣。" },
  ] },
  { month: "十二月", englishMonth: "December", representative: { name: "坦桑石", english: "Tanzanite", image: image("Tanzanite"), story: "二十世纪发现于坦桑尼亚北部，并因产地而得名，以蓝至蓝紫色著称。", meaning: "传统象征转变、发现与独特个性。" }, stones: [
    { name: "绿松石", english: "Turquoise", image: image("Turquoise"), story: "古埃及、中国和美洲原住民文化都留下了关于绿松石守护力量的传统。", meaning: "传统象征平安、好运与守护。" },
    { name: "锆石", english: "Zircon", image: image("Zircon"), story: "天然锆石拥有强烈火彩，中世纪传说曾把它与安睡和驱散恶意联系。", meaning: "传统象征智慧、安宁与光明。" },
  ] },
];

months.forEach((month) => { if (month.stones.length === 0) month.stones = [month.representative]; else month.stones = [month.representative, ...month.stones]; });

export default function BirthstoneStories() {
  const [selected, setSelected] = useState<MonthStory | null>(null);

  const openMonth = (month: MonthStory) => {
    setSelected(month);
    window.setTimeout(() => document.getElementById("birthstone-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  };

  return (
    <section className="birthstone-stories" id="birthstones">
      <div className="birthstone-heading">
        <div><span className="eyebrow">BIRTHSTONE STORIES</span><h2>十二个月，十二种宝石故事</h2></div>
        <p>点击月份查看该月全部生辰石、传统传说与象征意义。传说内容属于文化故事，不代表科学功效。</p>
      </div>
      <div className="birthstone-month-grid">
        {months.map((month, index) => (
          <button key={month.englishMonth} onClick={() => openMonth(month)}>
            <img src={month.representative.image} alt={`${month.month}生辰石${month.representative.name}`} loading="lazy" />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{month.month} · {month.englishMonth}</small><b>{month.representative.name}</b><em>{month.representative.english}</em></div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="birthstone-detail" id="birthstone-detail">
          <div className="birthstone-detail-head">
            <div><span>{selected.englishMonth.toUpperCase()} BIRTHSTONES</span><h3>{selected.month}生辰石</h3></div>
            <button onClick={() => setSelected(null)}>收起详情 ×</button>
          </div>
          <div className="birthstone-detail-grid">
            {selected.stones.map((stone) => (
              <article key={stone.english}>
                <img src={stone.image} alt={`${stone.name} ${stone.english}`} loading="lazy" />
                <div><h4>{stone.name}<small>{stone.english}</small></h4><p>{stone.story}</p><b>{stone.meaning}</b></div>
              </article>
            ))}
          </div>
          <a href="https://www.gia.edu/birthstones" target="_blank" rel="noreferrer">资料参考：GIA 生辰石指南 ↗</a>
        </div>
      )}
    </section>
  );
}
