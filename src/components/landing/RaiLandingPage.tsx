import { useState, useEffect } from "react";
import {
  Shield, Check, ArrowRight, X, QrCode, Sparkles, Terminal, Copy,
  CheckCircle2, Users, Cpu, FileText, ChevronRight, Lock, Eye, AlertTriangle, Zap
} from "lucide-react";

interface PlanOption {
  tier: "trial" | "starter" | "pro" | "team";
  name: string;
  priceDisplay: string;
  periodDisplay: string;
  badge?: string;
  popular?: boolean;
  description: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    tier: "trial",
    name: "Trải Nghiệm 14 Ngày",
    priceDisplay: "0 VNĐ",
    periodDisplay: "/ 14 ngày dùng thử",
    badge: "BẮT ĐẦU NGAY",
    description: "Trải nghiệm sức mạnh thực thi của Hệ điều hành RAI² First OS trên quy trình thực tế của bạn trước khi bỏ ra bất kỳ đồng nào.",
    features: [
      "14 ngày truy cập đầy đủ tính năng nền tảng",
      "Kích hoạt Bộ Tứ Nhân Sự Số Tự Hành",
      "Mô hình 100% BYOK (Tự kết nối API Key cá nhân)",
      "1 Môi trường Sandbox Máy Ảo Linux cô lập",
      "Không yêu cầu thẻ tín dụng, kích hoạt trong 30 giây",
      "Bộ câu hỏi Khảo sát Chuẩn đoán Điểm Nghẽn MeOS"
    ]
  },
  {
    tier: "starter",
    name: "RAI² Khởi Động",
    priceDisplay: "299.000 VNĐ",
    periodDisplay: "/ tháng",
    description: "Dành cho Solo Founder hoặc doanh nghiệp nhỏ bắt đầu thay thế các việc lặp đi lặp lại bằng nhân sự số.",
    features: [
      "Bộ Tứ Nhân Sự Số Chuyên Trách 24/7",
      "Mô hình 100% BYOK – Kiểm soát 100% dữ liệu",
      "Sandbox Linux cá nhân xử lý tệp & cào dữ liệu",
      "Lập lịch Routines tự động hóa hàng ngày",
      "Hỗ trợ qua kênh thảo luận RAI² Community"
    ]
  },
  {
    tier: "pro",
    name: "RAI² Chuyên Nghiệp",
    priceDisplay: "699.000 VNĐ",
    periodDisplay: "/ tháng",
    badge: "KHUYÊN DÙNG CHO SẾP",
    popular: true,
    description: "Cỗ máy tự hành hoàn chỉnh giải phóng người sáng lập khỏi bẫy MeOS, tự động vận hành phòng ban số hóa.",
    features: [
      "Đầy đủ quyền năng Bộ Tứ Nhân Sự Số + Tùy Biến Agent",
      "100% BYOK – Không giới hạn lượt gọi qua key cá nhân",
      "Trình duyệt Chromium Tự Hành (Browser Automation)",
      "Kết Nối 500+ Ứng Dụng (Composio, Webhooks, CRM)",
      "Bảo Mật Quyết Định (Decision Log) & Phê Duyệt Di Động",
      "Bộ 3 Quy Trình Tự Động Hóa 24/7 Chuẩn Hóa Sẵn"
    ]
  },
  {
    tier: "team",
    name: "RAI² Doanh Nghiệp",
    priceDisplay: "1.890.000 VNĐ",
    periodDisplay: "/ tháng (Đội ngũ 5–20 người)",
    badge: "DOANH NGHIỆP 5-20 NGƯỜI",
    description: "Tái cấu trúc toàn bộ bộ máy công ty, đồng bộ một ngôn ngữ chung và nguồn sự thật duy nhất giữa Người và Máy.",
    features: [
      "Workspace Dùng Chung Cho Đội Ngũ 5–20 Nhân Sự",
      "Phòng Họp Multi-Agent Phối Hợp Đa Nhiệm (AI Rooms)",
      "Private Chat Cho Từng Nhân Viên & Shared Bot Công Ty",
      "TẶNG 1 Buổi Audit 1-1 Chuẩn Hóa Quy Trình Cùng CAIO",
      "Cam Kết Hoàn Vốn (Payback Guarantee) Trong 90 Ngày",
      "Sao Lưu Dữ Liệu Tự Động Lên Cloud Storage Riêng"
    ]
  }
];

export function RaiLandingPage({ onAdminSignIn }: { onAdminSignIn: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    qrUrl: string;
    bankAccount: string;
    bankName: string;
    amount: number;
    transferContent: string;
    code: string;
  } | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  // Polling kiểm tra thanh toán SePay
  useEffect(() => {
    if (!paymentData || isPaid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscription/check?code=${paymentData.code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid) {
            setIsPaid(true);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Lỗi polling kiểm tra hóa đơn:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentData, isPaid]);

  const handleCheckout = async (plan: PlanOption) => {
    setSelectedPlan(plan);
    setIsPaid(false);
    setPaymentData(null);
    if (plan.tier === "trial") {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: plan.tier, email: email || "customer@rai2.si" })
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentData({
          qrUrl: data.payment.qrUrl,
          bankAccount: data.payment.bankAccount,
          bankName: data.payment.bankName,
          amount: data.payment.amount,
          transferContent: data.payment.transferContent,
          code: data.order.code,
        });
      }
    } catch (err) {
      console.error("Lỗi tạo đơn hàng thanh toán:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] font-sans antialiased selection:bg-[#0099ff] selection:text-white">
      {/* 1. TOP NAVIGATION - Framer Cinematic Style */}
      <header className="sticky top-0 z-50 bg-[#000000]/90 backdrop-blur-md border-b border-[#242424]/60">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo duy nhất trên nền đen, không chèn text */}
          <a href="/" className="flex items-center group py-2">
            <img
              src="/logo-white.png"
              alt="Logo"
              className="h-8 md:h-9 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80"
            />
          </a>

          {/* 4 Menu ngắn gọn đúng yêu cầu */}
          <nav className="flex items-center gap-6 md:gap-8">
            <button
              onClick={() => scrollTo("triet-ly")}
              className="text-[14px] font-medium text-[#8c8c8c] hover:text-[#ffffff] transition-colors"
            >
              Triết lý
            </button>
            <button
              onClick={() => scrollTo("tinh-nang")}
              className="text-[14px] font-medium text-[#8c8c8c] hover:text-[#ffffff] transition-colors"
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollTo("bang-gia")}
              className="text-[14px] font-medium text-[#8c8c8c] hover:text-[#ffffff] transition-colors"
            >
              Bảng giá
            </button>
            <button
              onClick={onAdminSignIn}
              className="text-[14px] font-medium text-[#8c8c8c] hover:text-[#ffffff] transition-colors"
            >
              Đăng nhập
            </button>
          </nav>

          {/* Action Button: Filled White Pill */}
          <div className="hidden sm:block">
            <button
              onClick={() => scrollTo("bang-gia")}
              className="px-5 py-2 rounded-full bg-[#ffffff] text-[#000000] text-[13px] font-medium hover:bg-[#e6e6e6] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Dùng thử 14 ngày
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - Editorial Framer Typographic Mass */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Subtle radial glow on edges */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#0099ff]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
          {/* Tagline Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#242424] bg-[#080808] mb-8 hover:border-[#0099ff]/50 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
            <span className="text-[12px] font-medium text-[#8c8c8c] tracking-wide uppercase">
              Retrofit AI Architecture • RAI² First OS
            </span>
          </div>

          {/* Headline Display - GT Walsheim Editorial Style */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[82px] font-medium tracking-[-0.04em] leading-[0.95] text-white max-w-[1050px] mx-auto mb-8">
            Nếu hôm nay Bạn xây lại doanh nghiệp từ đầu, Bạn có tổ chức bộ máy theo cách cũ?
          </h1>

          {/* Subhead Dan Kennedy style */}
          <p className="text-base sm:text-lg md:text-xl text-[#999999] max-w-[800px] mx-auto leading-relaxed mb-10 tracking-[-0.01em]">
            Đa số các chủ doanh nghiệp đang rơi vào cái bẫy <strong className="text-white font-medium">"chắp vá AI"</strong> trên các quy trình cũ nát. Kết quả: AI khuếch đại sai lầm với tốc độ nhanh gấp 10 lần. Đã đến lúc trang bị một Hệ điều hành tự hành thực thụ cho đội ngũ 5–20 nhân sự.
          </p>

          {/* CTA Buttons: Filled White Pill + Ghost Outline Pill */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleCheckout(PLANS[0])}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[15px] font-medium hover:bg-[#e6e6e6] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5"
            >
              Trải nghiệm 14 ngày miễn phí
            </button>
            <button
              onClick={() => scrollTo("triet-ly")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/20 text-[#ffffff] text-[15px] font-medium hover:border-[#0099ff] hover:text-[#0099ff] transition-all"
            >
              Khám phá triết lý RAI²
            </button>
          </div>

          {/* Metrics micro-bar */}
          <div className="mt-16 pt-10 border-t border-[#242424]/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[900px] mx-auto text-left">
            <div className="p-3 border-l border-[#242424]">
              <div className="text-[12px] text-[#666666] uppercase tracking-wider font-medium">Bảo chứng ROI</div>
              <div className="text-2xl font-medium text-white mt-1">90 Ngày</div>
              <div className="text-[12px] text-[#8c8c8c] mt-0.5">Cam kết hoàn vốn rõ ràng</div>
            </div>
            <div className="p-3 border-l border-[#242424]">
              <div className="text-[12px] text-[#666666] uppercase tracking-wider font-medium">Dữ liệu cốt lõi</div>
              <div className="text-2xl font-medium text-white mt-1">100% BYOK</div>
              <div className="text-[12px] text-[#8c8c8c] mt-0.5">Quyền sở hữu key & API tuyệt đối</div>
            </div>
            <div className="p-3 border-l border-[#242424]">
              <div className="text-[12px] text-[#666666] uppercase tracking-wider font-medium">Bộ máy tự hành</div>
              <div className="text-2xl font-medium text-white mt-1">4 Chuyên Trách</div>
              <div className="text-[12px] text-[#8c8c8c] mt-0.5">Sales, Ops, Marketing & CAIO</div>
            </div>
            <div className="p-3 border-l border-[#242424]">
              <div className="text-[12px] text-[#666666] uppercase tracking-wider font-medium">Quy mô tối ưu</div>
              <div className="text-2xl font-medium text-white mt-1">5–20 Người</div>
              <div className="text-[12px] text-[#8c8c8c] mt-0.5">Thiết kế đo ni đóng giày cho SME</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: BÓC TRẦN SỰ THẬT - Dan Kennedy Hard-hitting Copy */}
      <section id="triet-ly" className="py-20 border-t border-[#242424]/60 bg-[#080808]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[800px] mb-14">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Mổ xẻ tử huyệt vận hành
            </div>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight text-white mb-6">
              Cơn ác mộng "AI-First" và ảo tưởng nguy hiểm về MeOS
            </h2>
            <p className="text-base sm:text-lg text-[#999999] leading-relaxed">
              Các chuyên gia tự phong đang rao giảng việc biến một cá nhân thành "bản sao AI" (MeOS). Nhưng đây là sự thật cay đắng mà không ai dám nói với bạn:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Ảo tưởng MeOS */}
            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#000000] border border-[#242424] flex items-center justify-center text-[#ff4444] mb-6">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3 tracking-[-0.02em]">
                Ảo tưởng MeOS: Đóng gói sự hỗn loạn
              </h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Nếu một người làm việc theo cảm hứng, thiếu tính kỷ luật và quy trình chuẩn, thì việc tạo ra một "bản sao AI" chỉ nhân bản sự lộn xộn đó lên gấp hàng trăm lần.
              </p>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed">
                Khi công ty mở rộng từ 5 lên 10 hay 20 người, MeOS trở thành cái bẫy giam cầm chính người sáng lập, biến sếp thành điểm nghẽn nghẹt thở nhất của doanh nghiệp.
              </p>
            </div>

            {/* Card 2: Cơn ác mộng chắp vá AI */}
            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#000000] border border-[#242424] flex items-center justify-center text-[#ff8833] mb-6">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3 tracking-[-0.02em]">
                Cái bẫy công cụ: Ném AI vào quy trình rác
              </h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Mua tài khoản ChatGPT, cài thêm bot trả lời tin nhắn, trang bị tool tự động tạo bài viết... nhưng doanh thu không tăng, chi phí phình to và không một ai chịu trách nhiệm về kết quả cuối cùng.
              </p>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed">
                Đưa AI vào một quy trình hỏng chỉ giúp bạn tạo ra rác nhanh hơn, đốt tiền nhanh hơn và làm khách hàng thất vọng nhanh hơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: 7 NGUYÊN TẮC CỐT TỬ RAI² FIRST OS */}
      <section className="py-24 border-t border-[#242424]/60 bg-[#000000]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[800px] mx-auto mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Triết lý nền tảng
            </div>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight text-white mb-5">
              7 Nguyên Tắc Cốt Tử Của RAI² First OS
            </h2>
            <p className="text-base text-[#999999] leading-relaxed">
              Khung năng lực biến tổ chức của bạn thành một thực thể số tự hành, có trách nhiệm giải trình và cam kết tỷ suất hoàn vốn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Hệ Thống Trước — AI Theo Sau",
                desc: "Không có phép màu nào cứu được một quy trình rách nát. Trước khi kết nối bất kỳ bot hay agent nào, hệ thống phải được chuẩn hóa và cắt bỏ các bước thừa."
              },
              {
                num: "02",
                title: "AI²: Artificial + Actual Intelligence",
                desc: "Trí tuệ nhân tạo (Artificial Intelligence) chỉ phát huy sức mạnh khi được dẫn dắt bởi Trí tuệ thực chiến (Actual Intelligence) từ người có kinh nghiệm thực tế."
              },
              {
                num: "03",
                title: "Chuẩn Hóa Trước Khi Tự Động Hóa",
                desc: "Chỉ tự động hóa những gì đã được kiểm chứng bằng tay và lặp lại tối thiểu 10 lần thành công. Không bao giờ tự động hóa một giả định chưa được chứng minh."
              },
              {
                num: "04",
                title: "Đo Bằng P&L Và Dòng Tiền Thực Tế",
                desc: "Dẹp bỏ số lượng token, lượt prompt hay số bài viết vô thưởng vô phạt. Thước đo duy nhất của AI tại RAI² là: Nó mang lại bao nhiêu tiền mặt hoặc tiết kiệm bao nhiêu giờ lương?"
              },
              {
                num: "05",
                title: "Cam Kết Hoàn Vốn Trong 90 Ngày",
                desc: "Một khoản đầu tư vào kiến trúc AI phải chứng minh được giá trị hoàn vốn (Payback Period) trong vòng 90 ngày, nếu không đó là một sự lãng phí."
              },
              {
                num: "06",
                title: "Tấn Công Vào Điểm Nghẽn (TOC)",
                desc: "Dựa trên Lý thuyết điểm nghẽn (Theory of Constraints): Chỉ tập trung đội ngũ bot vào mắt xích đang kìm hãm dòng tiền của toàn bộ công ty."
              }
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-7 rounded-[15px] bg-[#080808] border border-[#242424] hover:border-[#0099ff]/60 transition-all group"
              >
                <div className="text-[12px] font-mono text-[#0099ff] mb-4">
                  PRINCIPLE // {p.num}
                </div>
                <h3 className="text-lg font-medium text-white mb-2.5 tracking-[-0.01em] group-hover:text-white transition-colors">
                  {p.title}
                </h3>
                <p className="text-[13px] text-[#8c8c8c] leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}

            {/* Nguyên tắc 7: Full width highlight */}
            <div className="md:col-span-2 lg:col-span-3 p-8 rounded-[15px] bg-[#080808] border border-[#0099ff]/30 hover:border-[#0099ff] transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0099ff]/5 blur-3xl pointer-events-none" />
              <div className="text-[12px] font-mono text-[#0099ff] mb-3">
                PRINCIPLE // 07 — CỐT LÕI
              </div>
              <h3 className="text-xl sm:text-2xl font-medium text-white mb-3 tracking-[-0.02em]">
                Trách Nhiệm Giải Trình & Vai Trò Của CAIO
              </h3>
              <p className="text-[14px] text-[#999999] leading-relaxed max-w-[950px]">
                AI không thể bị thả nổi. Tại RAI², mọi tác vụ số đều có một Giám đốc AI (CAIO) đứng sau giám sát: chịu trách nhiệm về số liệu P&L, kiểm soát rủi ro bảo mật và cam kết kết quả đầu ra cho toàn bộ các phòng ban của doanh nghiệp bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: TÍNH NĂNG - BỘ TỨ NHÂN SỰ SỐ TỰ HÀNH */}
      <section id="tinh-nang" className="py-24 border-t border-[#242424]/60 bg-[#080808]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[800px] mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Năng lực thực thi
            </div>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight text-white mb-5">
              Bộ Tứ Nhân Sự Số Vận Hành 24/7
            </h2>
            <p className="text-base text-[#999999] leading-relaxed">
              Không chỉ là chatbot trả lời suông. Đây là những trợ lý tự hành sở hữu Sandbox Linux cô lập, có khả năng duyệt web thực tế, đọc tài liệu nội bộ và phối hợp đa nhiệm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="text-[12px] font-mono text-[#8c8c8c] mb-2">AGENT 01</div>
              <h3 className="text-xl font-medium text-white mb-2">Trợ Lý Vận Hành & Tự Động Hóa (Ops Bot)</h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Chạy định kỳ các routine hàng ngày: thu thập báo cáo bán hàng, đồng bộ đơn hàng về Sheet, kiểm tra lỗi hệ thống và gửi thông báo trực tiếp qua Telegram/Zalo.
              </p>
              <div className="text-[12px] text-[#0099ff] flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" /> Tự động hóa không cần giám sát 24/7
              </div>
            </div>

            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="text-[12px] font-mono text-[#8c8c8c] mb-2">AGENT 02</div>
              <h3 className="text-xl font-medium text-white mb-2">Trợ Lý Nghiên Cứu & Trình Duyệt Web (Browser Bot)</h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Tự động đăng nhập vào cổng thông tin, tải hóa đơn, cào dữ liệu đối thủ cạnh tranh trên Shopee/Tiki và tóm tắt thành các quyết định thực thi.
              </p>
              <div className="text-[12px] text-[#0099ff] flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" /> Điều khiển trình duyệt Chromium độc lập
              </div>
            </div>

            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="text-[12px] font-mono text-[#8c8c8c] mb-2">AGENT 03</div>
              <h3 className="text-xl font-medium text-white mb-2">Trợ Lý Truyền Thông & Tiếp Thị (Content Bot)</h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Soạn thảo nội dung theo chuẩn giọng văn thương hiệu của bạn, chuyển đổi bài viết chuyên sâu thành bài đăng đa kênh, chuẩn SEO và không tạo ra nội dung rác.
              </p>
              <div className="text-[12px] text-[#0099ff] flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" /> Đảm bảo tiêu chuẩn SEO/AEO/GEO
              </div>
            </div>

            <div className="p-8 rounded-[15px] bg-[#111111] border border-[#242424] hover:border-[#0099ff]/50 transition-colors">
              <div className="text-[12px] font-mono text-[#8c8c8c] mb-2">AGENT 04</div>
              <h3 className="text-xl font-medium text-white mb-2">Phòng Họp Multi-Agent & Giám Sát CAIO</h3>
              <p className="text-[14px] text-[#8c8c8c] leading-relaxed mb-4">
                Không gian làm việc chung (AI Rooms) nơi các bot cùng trao đổi, phản biện và hợp tác giải quyết một bài toán hóc búa của ban giám đốc.
              </p>
              <div className="text-[12px] text-[#0099ff] flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" /> Đưa ra nguồn sự thật duy nhất (Single Source of Truth)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: BẢNG GIÁ & ĐĂNG KÝ (PRICING) */}
      <section id="bang-gia" className="py-24 border-t border-[#242424]/60 bg-[#000000]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[750px] mx-auto mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Minh bạch • Không rủi ro
            </div>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight text-white mb-5">
              Bắt Đầu Với Chi Phí Chưa Bằng Một Bữa Trưa
            </h2>
            <p className="text-base text-[#999999] leading-relaxed">
              Mô hình BYOK (Bring Your Own Key) giúp bạn nắm 100% quyền kiểm soát chi phí API trực tiếp với nhà cung cấp. Không phụ phí ẩn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative flex flex-col justify-between p-7 rounded-[15px] transition-all ${
                  plan.popular
                    ? "bg-[#080808] border-2 border-[#0099ff] shadow-xl shadow-[#0099ff]/5"
                    : "bg-[#080808] border border-[#242424] hover:border-[#333333]"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    plan.popular ? "bg-[#0099ff] text-white" : "bg-white text-black"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="text-base font-medium text-white mb-2">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                      {plan.priceDisplay}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#666666] mb-5">{plan.periodDisplay}</div>

                  <p className="text-[13px] text-[#8c8c8c] leading-relaxed mb-6 min-h-[55px]">
                    {plan.description}
                  </p>

                  <div className="space-y-3 mb-8 pt-6 border-t border-[#242424]">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[12px] text-[#cccccc]">
                        <Check className="w-3.5 h-3.5 text-[#0099ff] mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(plan)}
                  className={`w-full py-3 rounded-full text-[13px] font-medium transition-all ${
                    plan.popular
                      ? "bg-[#0099ff] text-white hover:bg-[#0088ee]"
                      : plan.tier === "trial"
                      ? "bg-white text-black hover:bg-[#e6e6e6]"
                      : "border border-white/20 text-white hover:border-[#0099ff] hover:text-[#0099ff]"
                  }`}
                >
                  {plan.tier === "trial" ? "Bắt đầu dùng thử ngay" : "Chọn gói này"}
                </button>
              </div>
            ))}
          </div>

          {/* Cam kết hoàn vốn 90 ngày của Dan Kennedy */}
          <div className="mt-16 p-8 rounded-[15px] bg-[#080808] border border-[#242424] max-w-[900px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[#0099ff] text-[13px] font-medium uppercase tracking-wider mb-3">
              <Shield className="w-4 h-4" /> Cam kết không rủi ro
            </div>
            <h3 className="text-xl sm:text-2xl font-medium text-white mb-3">
              Bảo Chứng Hoàn Vốn 90 Ngày (Dan Kennedy Style)
            </h3>
            <p className="text-[14px] text-[#8c8c8c] leading-relaxed max-w-[750px] mx-auto">
              Nếu trong vòng 90 ngày kể từ khi triển khai RAI² First OS theo đúng quy trình chuẩn hóa, doanh nghiệp của bạn không tiết kiệm được tối thiểu 30 giờ làm việc vô nghĩa hoặc không nhìn thấy sự gia tăng rõ rệt về hiệu suất P&L, chúng tôi sẽ hoàn trả 100% chi phí đăng ký nền tảng. Không đôi co. Không thủ tục phiền hà.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOOTER - Minimalist Framer Aesthetic */}
      <footer className="py-16 border-t border-[#242424]/60 bg-[#000000]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo trắng trên nền đen, không chèn text */}
          <div className="flex items-center">
            <img
              src="/logo-white.png"
              alt="Logo"
              className="h-7 w-auto object-contain opacity-90"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-[13px] text-[#8c8c8c]">
            <button onClick={() => scrollTo("triet-ly")} className="hover:text-white transition-colors">Triết lý</button>
            <button onClick={() => scrollTo("tinh-nang")} className="hover:text-white transition-colors">Tính năng</button>
            <button onClick={() => scrollTo("bang-gia")} className="hover:text-white transition-colors">Bảng giá</button>
            <button onClick={onAdminSignIn} className="hover:text-white transition-colors">Đăng nhập</button>
          </div>

          {/* Copyright */}
          <div className="text-[12px] text-[#666666]">
            © {new Date().getFullYear()} RAI² • All rights reserved.
          </div>
        </div>
      </footer>

      {/* 8. MODAL THANH TOÁN SEPAY & DÙNG THỬ */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-[480px] bg-[#111111] border border-[#242424] rounded-[20px] p-6 sm:p-8 shadow-2xl">
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-5 right-5 text-[#8c8c8c] hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedPlan.tier === "trial" ? (
              /* Modal Dùng thử 14 ngày */
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0099ff]/10 text-[#0099ff] text-[11px] font-medium uppercase tracking-wide mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Dùng thử 14 ngày hoàn toàn miễn phí
                </div>
                <h3 className="text-2xl font-medium text-white mb-2">Bắt Đầu Trải Nghiệm RAI²</h3>
                <p className="text-[13px] text-[#8c8c8c] mb-6">
                  Điền email nhận tài khoản truy cập ngay trong 30 giây. Không cần thẻ tín dụng.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(`Đăng ký thành công tài khoản trải nghiệm 14 ngày cho: ${email || "bạn"}. Vui lòng đăng nhập hệ thống!`);
                    setSelectedPlan(null);
                    onAdminSignIn();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[12px] font-medium text-[#cccccc] mb-1.5">
                      Email doanh nghiệp của bạn
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ceo@company.com"
                      className="w-full px-4 py-3 rounded-[10px] bg-[#000000] border border-[#242424] text-white text-[14px] focus:outline-none focus:border-[#0099ff] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[14px] font-medium hover:bg-[#e6e6e6] transition-all"
                  >
                    Kích hoạt tài khoản ngay
                  </button>
                </form>
              </div>
            ) : (
              /* Modal Thanh toán VietQR SePay */
              <div>
                <div className="text-[12px] font-medium text-[#0099ff] uppercase tracking-wider mb-2">
                  Thanh toán an toàn qua VietQR
                </div>
                <h3 className="text-xl sm:text-2xl font-medium text-white mb-1">
                  Đăng ký {selectedPlan.name}
                </h3>
                <div className="text-lg font-medium text-white mb-5">
                  {selectedPlan.priceDisplay} <span className="text-[12px] text-[#8c8c8c]">{selectedPlan.periodDisplay}</span>
                </div>

                {isPaid ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="w-16 h-16 text-[#0099ff] mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-white mb-2">Thanh Toán Thành Công!</h4>
                    <p className="text-[13px] text-[#8c8c8c] mb-6">
                      Hệ thống đã nhận được chuyển khoản tự động. Tài khoản của bạn đã được kích hoạt.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        onAdminSignIn();
                      }}
                      className="w-full py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[14px] font-medium hover:bg-[#e6e6e6] transition-all"
                    >
                      Truy cập hệ thống ngay
                    </button>
                  </div>
                ) : isSubmitting ? (
                  <div className="py-12 text-center text-[#8c8c8c]">
                    <div className="w-8 h-8 border-2 border-[#0099ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[13px]">Đang khởi tạo mã QR thanh toán...</p>
                  </div>
                ) : paymentData ? (
                  <div>
                    <div className="bg-[#000000] p-4 rounded-[12px] border border-[#242424] flex flex-col items-center mb-5">
                      <img
                        src={paymentData.qrUrl}
                        alt="VietQR SePay"
                        className="w-48 h-48 object-contain rounded-[8px] bg-white p-2"
                      />
                      <div className="mt-3 text-[11px] text-[#8c8c8c] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0099ff] animate-ping" />
                        Hệ thống tự động kích hoạt ngay khi chuyển khoản
                      </div>
                    </div>

                    <div className="space-y-2 text-[12px] bg-[#080808] p-3.5 rounded-[10px] border border-[#242424] mb-5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#8c8c8c]">Ngân hàng:</span>
                        <span className="font-medium text-white">{paymentData.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#8c8c8c]">Số tài khoản:</span>
                        <span className="font-mono text-white">{paymentData.bankAccount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#8c8c8c]">Số tiền:</span>
                        <span className="font-medium text-[#0099ff]">
                          {paymentData.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#242424]">
                        <span className="text-[#8c8c8c]">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-[#171717] px-2 py-0.5 rounded">
                            {paymentData.transferContent}
                          </span>
                          <button
                            onClick={() => copyToClipboard(paymentData.transferContent)}
                            className="text-[#8c8c8c] hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {copied && (
                      <div className="text-center text-[12px] text-[#0099ff] mb-2">
                        Đã sao chép nội dung chuyển khoản!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-[#8c8c8c] mb-4">
                      Vui lòng thử lại nếu mã thanh toán chưa hiển thị.
                    </p>
                    <button
                      onClick={() => handleCheckout(selectedPlan)}
                      className="px-6 py-2.5 rounded-full bg-white text-black text-[13px] font-medium"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
