"use client";

import { useEffect, useRef, useState } from "react";
import { sitePath } from "./sitePath";

type PaymentState = "idle" | "verifying" | "success";

/* 优化：会员弹窗提供完整的本地模拟支付流程，不发起任何真实扣款。 */
export default function MembershipView({
  onClose,
  onPaymentSuccess,
  isMember,
  language = "zh",
}: {
  onClose: () => void;
  onPaymentSuccess: () => void;
  isMember: boolean;
  language?: "zh" | "en";
}) {
  const [paymentState, setPaymentState] = useState<PaymentState>(isMember ? "success" : "idle");
  const timers = useRef<number[]>([]);
  const copy = language === "en" ? {
    title: "Unlock the full StoneLens experience",
    intro: "Free users can complete 10 image identifications. Members unlock unlimited recognition, AI gem Q&A and Stone Inspiration.",
    free: "Free Experience",
    freePrice: "$0",
    freeItems: ["10 static image identifications", "Top‑5 similar categories", "3D category model and basic facts"],
    member: "Monthly Membership",
    memberPrice: "¥19.9",
    memberPeriod: "/ month",
    memberItems: ["Unlimited image identification", "AI gem knowledge Q&A", "Stone Inspiration interaction", "Cloud history sync"],
    payment: "Membership Payment",
    paymentText: "Scan with Alipay or WeChat, then click the demo confirmation button below.",
    back: "Back to recognition",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    verifying: "Verifying payment...",
    success: "🎉 Payment successful! Membership activated",
    confirm: "I have paid, activate now",
    activated: "Membership activated",
    dialogLabel: "StoneLens membership center",
    logoAlt: "StoneLens logo",
    alipayAlt: "Alipay membership payment QR code",
    wechatAlt: "WeChat Pay membership payment QR code",
  } : {
    title: "打开更完整的石头探索体验",
    intro: "免费用户可完成 10 次图片识别；会员可不限次数识别，并解锁 AI 宝石知识问答与石之启示灵感互动。",
    free: "免费体验",
    freePrice: "¥0",
    freeItems: ["10 次静态图片识别", "Top‑5 相似类别", "3D 类别模型与基础资料"],
    member: "月度会员",
    memberPrice: "¥19.9",
    memberPeriod: "/ 月",
    memberItems: ["无限次图片识别", "AI 宝石知识问答", "石之启示灵感互动", "历史记录云同步"],
    payment: "开通会员",
    paymentText: "选择支付宝或微信二维码，完成演示后点击下方按钮。",
    back: "返回识别",
    alipay: "支付宝",
    wechat: "微信支付",
    verifying: "正在验证支付...",
    success: "🎉 支付成功！已开通会员",
    confirm: "我已支付，立即开通",
    activated: "会员已开通",
    dialogLabel: "StoneLens 会员中心",
    logoAlt: "石相 StoneLens Logo",
    alipayAlt: "支付宝会员支付二维码",
    wechatAlt: "微信会员支付二维码",
  };

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const confirmPayment = () => {
    if (paymentState !== "idle") return;
    setPaymentState("verifying");
    timers.current.push(window.setTimeout(() => {
      setPaymentState("success");
      onPaymentSuccess();
      timers.current.push(window.setTimeout(onClose, 1200));
    }, 1500));
  };

  return (
    <div className="membership-view" role="dialog" aria-modal="true" aria-label={copy.dialogLabel}>
      <header className="membership-header">
        {/* 优化 */}
        <div className="brand"><img className="brand-logo" src={sitePath("/images/diamond-logo.png")} alt={copy.logoAlt} /><span><b>{language === "en" ? "StoneLens Member" : "石相会员"}</b><small>StoneLens Membership</small></span></div>
        <button className="secondary-button" onClick={onClose}>{copy.back}</button>
      </header>
      <main className="membership-main">
        <section className="membership-hero">
          <span className="eyebrow">UNLOCK THE FULL STONELENS</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </section>
        <section className="membership-grid">
          <article>
            <span>FREE EXPERIENCE</span><h2>{copy.free}</h2><b>{copy.freePrice}</b>
            <ul>{copy.freeItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="membership-featured">
            <span>STONELENS MEMBER</span><h2>{copy.member}</h2><b>{copy.memberPrice} <small>{copy.memberPeriod}</small></b>
            <ul>{copy.memberItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </section>
        <section className="payment-section">
          <div><span className="eyebrow">DEMO PAYMENT</span><h2>{copy.payment}</h2><p>{copy.paymentText}</p></div>
          <div className="payment-codes">
            {/* 优化 */}
            <div><img src={sitePath("/images/payment/zfbpay.jpg")} alt={copy.alipayAlt} /><b>{copy.alipay}</b></div>
            <div><img src={sitePath("/images/payment/WeChatpay.jpg")} alt={copy.wechatAlt} /><b>{copy.wechat}</b></div>
          </div>
          <div className={`payment-status ${paymentState}`} aria-live="polite">
            {paymentState === "verifying" && <><span className="button-spinner" />{copy.verifying}</>}
            {paymentState === "success" && <b>{copy.success}</b>}
          </div>
          <button className="payment-confirm-button" disabled={paymentState !== "idle"} onClick={confirmPayment}>
            {paymentState === "idle" ? copy.confirm : paymentState === "verifying" ? copy.verifying : copy.activated}
          </button>
        </section>
        <p className="membership-note"></p>
      </main>
    </div>
  );
}
