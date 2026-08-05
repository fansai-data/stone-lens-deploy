"use client";

import { useEffect, useRef, useState } from "react";

type PaymentState = "idle" | "verifying" | "success";

/* 优化：会员弹窗提供完整的本地模拟支付流程，不发起任何真实扣款。 */
export default function MembershipView({
  onClose,
  onPaymentSuccess,
  isMember,
}: {
  onClose: () => void;
  onPaymentSuccess: () => void;
  isMember: boolean;
}) {
  const [paymentState, setPaymentState] = useState<PaymentState>(isMember ? "success" : "idle");
  const timers = useRef<number[]>([]);

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
    <div className="membership-view" role="dialog" aria-modal="true" aria-label="StoneLens 会员中心">
      <header className="membership-header">
        {/* 优化 */}
        <div className="brand"><img className="brand-logo" src="/images/diamond-logo.png" alt="石相 StoneLens Logo" /><span><b>石相会员</b><small>StoneLens Membership</small></span></div>
        <button className="secondary-button" onClick={onClose}>返回识别</button>
      </header>
      <main className="membership-main">
        <section className="membership-hero">
          <span className="eyebrow">UNLOCK THE FULL STONELENS</span>
          <h1>打开更完整的石头探索体验</h1>
          <p>免费用户可完成 10 次图片识别；会员可不限次数识别，并解锁 AI 宝石知识问答。</p>
        </section>
        <section className="membership-grid">
          <article>
            <span>FREE EXPERIENCE</span><h2>免费体验</h2><b>¥0</b>
            <ul><li>10 次静态图片识别</li><li>Top‑5 相似类别</li><li>3D 类别模型与基础资料</li></ul>
          </article>
          <article className="membership-featured">
            <span>STONELENS MEMBER</span><h2>月度会员</h2><b>¥19.9 <small>/ 月</small></b>
            <ul><li>无限次图片识别</li><li>AI 宝石知识问答</li><li>历史记录云同步</li></ul>
          </article>
        </section>
        <section className="payment-section">
          <div><span className="eyebrow">DEMO PAYMENT</span><h2>开通会员</h2><p>选择支付宝或微信二维码，完成演示后点击下方按钮。</p></div>
          <div className="payment-codes">
            {/* 优化 */}
            <div><img src="/images/payment/zfbpay.jpg" alt="支付宝会员支付二维码" /><b>支付宝</b></div>
            <div><img src="/images/payment/WeChatpay.jpg" alt="微信会员支付二维码" /><b>微信支付</b></div>
          </div>
          <div className={`payment-status ${paymentState}`} aria-live="polite">
            {paymentState === "verifying" && <><span className="button-spinner" />正在验证支付...</>}
            {paymentState === "success" && <b>🎉 支付成功！已开通会员</b>}
          </div>
          <button className="payment-confirm-button" disabled={paymentState !== "idle"} onClick={confirmPayment}>
            {paymentState === "idle" ? "我已支付，立即开通" : paymentState === "verifying" ? "正在验证支付..." : "会员已开通"}
          </button>
        </section>
        <p className="membership-note"></p>
      </main>
    </div>
  );
}
