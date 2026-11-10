import { useState, useEffect } from "react";
import {
  Shield, Check, ArrowRight, X, QrCode, Sparkles, Terminal, Copy,
  CheckCircle2, Users, Cpu, FileText, ChevronRight, Lock, Eye
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

  // Polling payment check
  useEffect(() => {
    if (!paymentData || isPaid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscription/check/${paymentData.code}`);
        if (res.ok) {
          const data = (await res.json()) as { status: string };
          if (data.status === "paid") {
            setIsPaid(true);
            clearInterval(interval);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [paymentData, isPaid]);

  const handleOpenPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setPaymentData(null);
    setIsPaid(false);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      if (selectedPlan.tier === "trial") {
        // Free trial 14 days: simulate instant activation & auto-entry
        setTimeout(() => {
          setIsPaid(true);
          setIsSubmitting(false);
        }, 800);
        return;
      }
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedPlan.tier, email }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          payment: {
            qrUrl: string;
            bankAccount: string;
            bankName: string;
            amount: number;
            transferContent: string;
          };
          order: { code: string };
        };
        setPaymentData({
          ...data.payment,
          code: data.order.code,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyContent = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] font-sans antialiased selection:bg-[#ff8833]/30 selection:text-[#fafafa]">
      {/* 1. Top Announcement Bar */}
      <div className="w-full bg-[#171717] border-b border-[#262626] py-2 px-4 text-center">
        <div className="mx-auto max-w-[1152px] flex items-center justify-center gap-2 text-[14px]">
          <span className="font-semibold text-[#fafafa]">HỆ ĐIỀU HÀNH DOANH NGHIỆP RAI² FIRST OS</span>
          <span className="text-[#737373]">·</span>
          <span className="text-[#a1a1a1]">Bản Thiết Kế Giải Phóng Doanh Chủ Khỏi Chiếc Bẫy MeOS</span>
          <a href="#dan-kennedy-letter" className="ml-2 inline-flex items-center text-[#ff8833] hover:underline font-medium">
            Đọc lá thư mổ xẻ <ArrowRight className="ml-1 size-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Floating Primary Navigation */}
      <header className="sticky top-4 z-40 mx-auto max-w-[1152px] px-4 pt-2">
        <div className="flex h-14 items-center justify-between rounded-[10px] border border-[#262626] bg-[#0a0a0a]/90 px-4 backdrop-blur-md shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3">
            <img src="/assets/rai-logo.png" alt="RAI²" className="h-8 w-auto object-contain" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-[#fafafa] leading-tight">RAI²</span>
              <span className="text-[10px] tracking-wider text-[#737373] uppercase">Artificial + Actual Intelligence</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#a1a1a1]">
            <a href="#dan-kennedy-letter" className="hover:text-[#fafafa] transition-colors">Lá Thư Gửi Sếp</a>
            <a href="#seven-principles" className="hover:text-[#fafafa] transition-colors">7 Nguyên Tắc RAI²</a>
            <a href="#architecture" className="hover:text-[#fafafa] transition-colors">Kiến Trúc OS</a>
            <a href="#workforce" className="hover:text-[#fafafa] transition-colors">Đội Ngũ Nhân Sự Số</a>
            <a href="#pricing" className="hover:text-[#fafafa] transition-colors text-[#fafafa]">Bảng Giá</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAdminSignIn}
              className="rounded-[8px] border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-[13px] font-medium text-[#a1a1a1] hover:text-[#fafafa] hover:border-[#464646] transition-colors"
            >
              Đăng nhập Admin
            </button>
            <button
              type="button"
              onClick={() => handleOpenPlan(PLANS[0]!)}
              className="rounded-[8px] bg-[#e5e5e5] px-3.5 py-1.5 text-[13px] font-semibold text-[#171717] hover:bg-white transition-all shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_-2px_6px_0_rgba(0,0,0,0.1)_inset]"
            >
              Dùng thử 14 ngày
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Graphite Asymmetric Layout) */}
      <section className="relative mx-auto max-w-[1152px] px-4 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[12px] font-medium text-[#ff8833]">
              <Sparkles className="size-3.5 text-[#ff8833]" />
              <span>DÀNH RIÊNG CHO DOANH CHỦ 5–20 NHÂN SỰ</span>
            </div>

            <h1 className="text-[44px] md:text-[56px] font-medium leading-[1.05] tracking-[-1.5px] text-[#fafafa]">
              Đừng Đốt Tiền Chắp Vá AI Lên Một Bộ Máy Đang Rách Nát.
            </h1>

            <p className="text-[18px] leading-[1.45] text-[#a1a1a1]">
              Hầu hết doanh nghiệp đang rơi vào <strong className="text-[#fafafa]">“Cơn Ác Mộng AI First”</strong>: mỗi phòng mua 1 tài khoản ChatGPT Plus xé lẻ dữ liệu, nhân viên ỷ lại cỗ máy phỏng đoán internet, và không ai đứng ra chịu trách nhiệm P&L.
            </p>

            <div className="p-4 rounded-[10px] border border-[#262626] bg-[#171717]/60">
              <p className="text-[15px] italic text-[#fafafa] leading-relaxed">
                “Nếu hôm nay Bạn xây lại doanh nghiệp từ đầu, với năng lực AI đang có, Bạn có thiết kế bộ máy công ty theo cách cũ hay không?”
              </p>
              <span className="block mt-2 text-[12px] font-medium uppercase tracking-wider text-[#ff8833]">— Câu hỏi cốt tử của RAI² First OS</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleOpenPlan(PLANS[0]!)}
                className="rounded-[8px] bg-[#e5e5e5] px-6 py-3.5 text-[15px] font-semibold text-[#171717] hover:bg-white transition-all shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_-2px_6px_0_rgba(0,0,0,0.1)_inset]"
              >
                Kích Hoạt Dùng Thử 14 Ngày Miễn Phí
              </button>
              <a
                href="#pricing"
                className="rounded-[8px] border border-[#464646] bg-[#262626] px-6 py-3.5 text-[15px] font-medium text-[#fafafa] hover:border-[#737373] transition-colors"
              >
                Xem Bảng Giá 3 Gói
              </a>
            </div>

            <div className="flex items-center gap-6 pt-2 text-[13px] text-[#737373]">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#ff8833]" /> 100% Mô hình BYOK an toàn</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#ff8833]" /> Không cần thẻ tín dụng</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#ff8833]" /> Quét SePay VietQR tức thì</span>
            </div>
          </div>

          {/* Luminous Polygon & Terminal Lattice Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-[420px] rounded-[10px] border border-[#262626] bg-[#0a0a0a] p-5 shadow-[0_0_12px_0_rgba(0,0,0,0.5)_inset]">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-[#ff8833]" />
                  <span className="font-mono text-[12px] text-[#a1a1a1]">rai2_enterprise_os.sys</span>
                </div>
                <span className="rounded bg-[#171717] px-2 py-0.5 font-mono text-[10px] text-[#737373]">STABLE · V1.0</span>
              </div>

              <div className="space-y-3 font-mono text-[12px] leading-relaxed">
                <p className="text-[#a1a1a1]">
                  <span className="text-[#ff8833]">$</span> init rai2 --responsibility-mode=CAIO
                </p>
                <div className="p-3 rounded-[6px] bg-[#171717] border border-[#262626] space-y-1.5 text-[11px]">
                  <p className="text-[#ffb931]">✓ Audit MeOS: Phá vỡ bẫy người sáng lập</p>
                  <p className="text-[#a1a1a1]">✓ Single Source of Truth: Thư viện ngữ cảnh kết nối</p>
                  <p className="text-[#a1a1a1]">✓ 4 Nhân Sự Số: @NghienCuu, @NoiDung, @VanHanh, @DieuHanh</p>
                  <p className="text-emerald-400">✓ Security Sandbox: Linux Container Isolation READY</p>
                </div>
                <div className="border-t border-[#262626] pt-3 text-[11px] text-[#737373]">
                  RAI² = Responsibility AI × (Artificial Intelligence + Actual Intelligence)
                </div>
              </div>

              {/* Decorative luminous border accent */}
              <div className="absolute -inset-px rounded-[11px] pointer-events-none border border-[#ff8833]/20" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dan Kennedy Direct-Response Letter: Mổ Xẻ Chiếc Bẫy MeOS & Cơn Ác Mộng AI First */}
      <section id="dan-kennedy-letter" className="mx-auto max-w-[880px] px-4 py-20 border-t border-[#262626]">
        <div className="rounded-[10px] border border-[#262626] bg-[#171717]/40 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#ff8833] via-white to-[#2e73fc]" />

          <span className="block text-[12px] font-bold tracking-widest uppercase text-[#ff8833] mb-3">
            LÁ THƯ TÂM CAN TỪ CỐ VẤN TÁI THIẾT KẾ DOANH NGHIỆP RAI MAN
          </span>

          <h2 className="text-[28px] md:text-[36px] font-medium leading-[1.2] text-[#fafafa] mb-6">
            Gửi người Chủ Doanh Nghiệp 5–20 Nhân Sự Đang Mở Mắt Ra Là Lo Tiền Nhà, Tiền Lương Và Ngập Đầu Trong Việc!
          </h2>

          <div className="space-y-5 text-[16px] leading-[1.65] text-[#a1a1a1]">
            <p className="text-[#fafafa] font-medium">
              Bạn có nhận ra mình đang mắc kẹt trong chính cơ nghiệp mà mình đổ máu dựng nên?
            </p>
            <p>
              Phiên bản đầu tiên của hệ điều hành công ty bạn chính là <strong className="text-[#fafafa]">“MeOS” (Hệ Điều Hành Tôi-Là-Tất-Cả)</strong>. Bạn biết cách thu hút và chuyển đổi khách hàng... Bạn biết cách giao việc... Bạn biết số liệu tài chính... Bạn biết mọi bí mật và là người duy nhất giải quyết được mọi rắc rối. Vì điều đó, <em>doanh nghiệp của bạn hoàn toàn phụ thuộc vào BẠN</em>.
            </p>
            <p>
              Nhưng hãy nhìn thẳng vào sự thật cay đắng này: <strong>MeOS được tạo ra vào thời điểm công nghệ chưa có AI</strong>. Các quy trình của bạn được đắp vá xoay quanh sức người. Và khi làn sóng AI bùng nổ, bạn làm gì?
            </p>
            <div className="my-6 p-5 rounded-[8px] border border-[#ff8833]/30 bg-[#0a0a0a] text-[#fafafa]">
              <h3 className="text-[17px] font-semibold text-[#ff8833] mb-2">CƠN ÁC MỘNG "AI FIRST" MÀ CHÚNG TÔI ĐÃ MẤT 2 NĂM ĂN NẰM ĐỂ CHỨNG KIẾN:</h3>
              <p className="text-[14px] text-[#a1a1a1] leading-relaxed">
                Tất cả nhân viên ai cũng “AI First”, đụng việc gì cũng hỏi AI... nhưng đưa AI vào một quy trình cũ rách nát chỉ tạo ra rác ở tốc độ tên lửa. Phòng marketing có 1 tài khoản ChatGPT Plus, phòng sale 1 tài khoản, phòng CSKH 1 tài khoản... Mỗi phòng làm riêng, dữ liệu phân mảnh, kết quả không đo lường được. Nhân viên đánh mất luôn <strong>Trí Tuệ Thực Tế (Actual Intelligence)</strong> của mình, ỷ lại vào cỗ máy chỉ biết phỏng đoán thông tin từ internet.
              </p>
            </div>
            <p>
              Cuối tháng, sếp vẫn trả nguyên quỹ lương, gánh thêm hóa đơn phần mềm AI, mà hiệu suất chẳng tăng thêm một xu lợi nhuận P&L nào!
            </p>
            <p className="text-[#fafafa] font-semibold text-[18px]">
              Và khi AI làm sai, khách hàng khiếu nại... AI CÓ ĐỨNG RA CHỊU TRÁCH NHIỆM KHÔNG?
            </p>
            <p>
              Tuyệt đối không! Nhân viên đổ lỗi cho ChatGPT, còn đơn vị bán công cụ thì phủi tay. Đó là lý do bạn cần một Hệ điều hành có <strong>CHỈ SỐ TRÁCH NHIỆM (RESPONSIBILITY AI)</strong> và một người <strong>CAIO (Chief AI Officer)</strong> đứng ra cam kết con số thực tế.
            </p>
          </div>
        </div>
      </section>

      {/* 5. The 7 Core Principles of RAI² First OS */}
      <section id="seven-principles" className="mx-auto max-w-[1152px] px-4 py-20 border-t border-[#262626]">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#ff8833]">NỀN TẢNG BẤT BIẾN</span>
          <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#fafafa] mt-2 mb-4">
            7 Nguyên Tắc Cốt Tử Của Hệ Điều Hành RAI²
          </h2>
          <p className="text-[16px] text-[#a1a1a1]">
            Hợp nhất Người và Máy, bắt buộc có người chịu trách nhiệm chính để biến AI thành cỗ máy tạo ra dòng tiền và lợi nhuận thực tế.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: "01",
              title: "RESPONSIBILITY AI",
              sub: "Trách Nhiệm AI",
              desc: "Bắt buộc có một người chịu trách nhiệm chính (CAIO) cho câu hỏi: 'Làm sao AI giúp công ty kiếm được tiền và tiết kiệm cho công ty'. Không có trách nhiệm, AI chỉ là món đồ chơi đốt tiền."
            },
            {
              id: "02",
              title: "RETROFIT AI",
              sub: "Gỡ Bỏ Chắp Vá AI",
              desc: "Dứt khoát không đưa AI vào các quy trình cũ đã hư hỏng. Tháo dỡ các mảnh ghép chắp vá ChatGPT rời rạc để tránh khuếch đại sai lầm vận hành."
            },
            {
              id: "03",
              title: "RE-ENGINEERED AI",
              sub: "Tái Thiết Kế Quy Trình",
              desc: "Tái thiết kế lại quy trình xoay quanh năng lực AI: Việc gì AI làm tốt nhất (tổng hợp, cào dữ liệu, draft), việc gì Con Người làm tốt nhất (linh cảm, quan hệ, chốt deal)."
            },
            {
              id: "04",
              title: "RELIABLE AI",
              sub: "Quy Trình Tin Cậy",
              desc: "Xây dựng các chốt chặn phê duyệt (Approval Cards). Nhân viên và sếp hoàn toàn tin tưởng phối hợp cùng AI mà không sợ bot tự ý làm bậy."
            },
            {
              id: "05",
              title: "RESULTS-DRIVEN AI",
              sub: "Định Hướng Kết Quả",
              desc: "Mọi tác vụ của AI đều phải đo lường được bằng chỉ số cụ thể, thời gian tiết kiệm và năng suất đầu ra chứ không nói lý thuyết suông."
            },
            {
              id: "06",
              title: "REVENUE AI",
              sub: "Tập Trung Dòng Tiền",
              desc: "AI phải tác động trực tiếp vào P&L, tăng trưởng doanh thu hoặc cắt giảm chi phí vận hành có thể nhìn thấy trên tài khoản ngân hàng."
            },
            {
              id: "07",
              title: "RESILIENT AI",
              sub: "Thích Ứng Bền Bỉ",
              desc: "Hệ thống độc lập với nhà cung cấp mô hình (BYOK). Dù OpenAI, Claude hay Google thay đổi, doanh nghiệp của bạn vẫn bất biến và tự chủ 100%."
            }
          ].map((item) => (
            <div key={item.id} className="rounded-[10px] border border-[#262626] bg-[#171717] p-6 hover:border-[#464646] transition-colors relative flex flex-col justify-between">
              <div>
                <span className="font-mono text-[12px] font-bold text-[#ff8833]">{item.id}</span>
                <h3 className="text-[18px] font-semibold text-[#fafafa] mt-1">{item.title}</h3>
                <span className="text-[13px] text-[#737373] block mb-3">{item.sub}</span>
                <p className="text-[14px] leading-relaxed text-[#a1a1a1]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Enterprise OS Architecture: Algorithms + Common Language + Desired Outputs */}
      <section id="architecture" className="mx-auto max-w-[1152px] px-4 py-20 border-t border-[#262626]">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#ff8833]">ĐỊNH NGHĨA KHOA HỌC</span>
          <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#fafafa] mt-2 mb-4">
            Hệ Điều Hành Doanh Nghiệp (Enterprise OS) Là Gì?
          </h2>
          <p className="text-[16px] text-[#a1a1a1]">
            Theo định nghĩa hệ điều hành chuẩn, một OS doanh nghiệp gồm 3 thành tố hợp nhất:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6">
            <div className="size-10 rounded-[8px] bg-[#262626] flex items-center justify-center text-[#ff8833] mb-4">
              <Terminal className="size-5" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Set of Algorithms</h3>
            <span className="text-[13px] text-[#ff8833] block mb-3">Tập Hợp Thuật Toán</span>
            <p className="text-[14px] text-[#a1a1a1] leading-relaxed">
              Chính là <strong>Quy trình vận hành & SOP chuẩn hóa</strong> của từng nghiệp vụ. Khi các bước được số hóa rõ ràng, bot sẽ thực thi chính xác 100% không lệch lạc.
            </p>
          </div>

          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6">
            <div className="size-10 rounded-[8px] bg-[#262626] flex items-center justify-center text-[#ff8833] mb-4">
              <FileText className="size-5" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Common Language</h3>
            <span className="text-[13px] text-[#ff8833] block mb-3">Nguồn Sự Thật Duy Nhất</span>
            <p className="text-[14px] text-[#a1a1a1] leading-relaxed">
              Bộ não và <strong>Thư viện Ngữ cảnh Doanh nghiệp</strong>. Người và Máy cùng giao tiếp chung một ngôn ngữ, hiểu đúng mục tiêu mà không nói hai lời.
            </p>
          </div>

          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6">
            <div className="size-10 rounded-[8px] bg-[#262626] flex items-center justify-center text-[#ff8833] mb-4">
              <Cpu className="size-5" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Desired Outputs</h3>
            <span className="text-[13px] text-[#ff8833] block mb-3">Đầu Ra Mong Muốn</span>
            <p className="text-[14px] text-[#a1a1a1] leading-relaxed">
              Chỉ số KPI, doanh thu, thời gian hoàn vốn và dòng tiền thực tế. Toàn bộ cỗ máy vận hành để đạt được mục tiêu kinh doanh cuối cùng của bạn.
            </p>
          </div>
        </div>
      </section>

      {/* 7. The 4 Core Digital Workers (Bộ Tứ Nhân Sự Số) */}
      <section id="workforce" className="mx-auto max-w-[1152px] px-4 py-20 border-t border-[#262626]">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#ff8833]">THỰC THI THỰC TẾ TRÊN RAI2.SI</span>
          <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#fafafa] mt-2 mb-4">
            Đội Ngũ 4 Nhân Sự Số Cốt Lõi Trên RAI²
          </h2>
          <p className="text-[16px] text-[#a1a1a1]">
            Không phải là một khung chat rỗng. Khi đăng nhập vào `rai2.si`, bạn sở hữu ngay 4 nhân sự số chuyên môn hóa cao:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6 flex gap-4">
            <div className="size-12 rounded-[10px] bg-[#262626] shrink-0 flex items-center justify-center text-[#ff8833]">
              <Eye className="size-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">@KhaoSat_NghienCuu</h3>
              <span className="text-[12px] text-[#ff8833] font-medium">Chuyên viên Nghiên cứu & Tình báo Thị trường</span>
              <p className="text-[14px] text-[#a1a1a1] mt-2 leading-relaxed">
                Tự động mở trình duyệt Chromium thực thụ, quét website đối thủ, theo dõi giá bán, biến động ngành mỗi ngày và tổng hợp báo cáo lúc 7:00 sáng.
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6 flex gap-4">
            <div className="size-12 rounded-[10px] bg-[#262626] shrink-0 flex items-center justify-center text-[#ff8833]">
              <FileText className="size-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">@TruyenThong_NoiDung</h3>
              <span className="text-[12px] text-[#ff8833] font-medium">Cỗ Máy Sáng Tạo Nội Dung & Chuẩn Hóa Thông Điệp</span>
              <p className="text-[14px] text-[#a1a1a1] mt-2 leading-relaxed">
                Viết bài chuẩn SEO/AEO/GEO theo giọng văn độc quyền, tự động sinh ảnh thumbnail và lên lịch xuất bản qua Postiz đa nền tảng.
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6 flex gap-4">
            <div className="size-12 rounded-[10px] bg-[#262626] shrink-0 flex items-center justify-center text-[#ff8833]">
              <Terminal className="size-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">@VanHanh_DuLieu</h3>
              <span className="text-[12px] text-[#ff8833] font-medium">Kỹ sư Dữ liệu & Tự Động Hóa Vận Hành</span>
              <p className="text-[14px] text-[#a1a1a1] mt-2 leading-relaxed">
                Chạy trong môi trường Linux Sandbox riêng biệt: tự viết code Python bóc tách file Excel khách hàng, đối soát công nợ và vẽ biểu đồ dòng tiền.
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#262626] bg-[#171717] p-6 flex gap-4">
            <div className="size-12 rounded-[10px] bg-[#262626] shrink-0 flex items-center justify-center text-[#ff8833]">
              <Users className="size-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#fafafa]">@TroLy_DieuHanh</h3>
              <span className="text-[12px] text-[#ff8833] font-medium">Thư Ký Điều Phối & Bàn Giao Tác Vụ</span>
              <p className="text-[14px] text-[#a1a1a1] mt-2 leading-relaxed">
                Nhận lệnh bằng tiếng Việt từ sếp, triệu tập phòng họp AI (Room Coordinator), phân chia việc cho 3 bot trên và gửi thẻ phê duyệt (Approval Card) về máy sếp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pricing Section (4 Tiers with SePay Integration) */}
      <section id="pricing" className="mx-auto max-w-[1152px] px-4 py-20 border-t border-[#262626]">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#ff8833]">ĐẦU TƯ CHO HIỆU SUẤT</span>
          <h2 className="text-[32px] md:text-[44px] font-medium tracking-tight text-[#fafafa] mt-2 mb-4">
            Bảng Giá Đầu Tư Hệ Điều Hành RAI²
          </h2>
          <p className="text-[16px] text-[#a1a1a1]">
            100% Mô hình BYOK (Khách hàng tự điền API Key cá nhân) — Chi phí duy trì minh bạch, dữ liệu độc lập, hoàn vốn sau 90 ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-[10px] border p-6 flex flex-col justify-between transition-all ${
                plan.popular
                  ? "border-[#ff8833] bg-[#171717] shadow-[0_0_24px_rgba(255,136,51,0.15)]"
                  : "border-[#262626] bg-[#0a0a0a] hover:border-[#464646]"
              }`}
            >
              <div>
                {plan.badge && (
                  <span className={`inline-block text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-[4px] mb-3 ${
                    plan.popular ? "bg-[#ff8833] text-[#171717]" : "bg-[#262626] text-[#a1a1a1]"
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-[20px] font-bold text-[#fafafa]">{plan.name}</h3>
                <div className="my-3">
                  <span className="text-[28px] font-bold text-[#fafafa]">{plan.priceDisplay}</span>
                  <span className="text-[12px] text-[#737373] block">{plan.periodDisplay}</span>
                </div>
                <p className="text-[13px] text-[#a1a1a1] mb-6 leading-relaxed">{plan.description}</p>
                <div className="border-t border-[#262626] pt-4 mb-6">
                  <span className="text-[12px] font-semibold text-[#737373] uppercase tracking-wider block mb-3">Quyền lợi bao gồm:</span>
                  <ul className="space-y-2.5 text-[13px] text-[#a1a1a1]">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="size-4 shrink-0 text-[#ff8833] mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPlan(plan)}
                className={`w-full rounded-[8px] py-3 text-[14px] font-semibold transition-all ${
                  plan.popular
                    ? "bg-[#ff8833] text-[#171717] hover:bg-[#ff9944]"
                    : "bg-[#e5e5e5] text-[#171717] hover:bg-white"
                }`}
              >
                {plan.tier === "trial" ? "Bắt Đầu Dùng Thử 14 Ngày" : `Đăng Ký Gói ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Dan Kennedy Guarantee & P.S. (Cam Kết Không Rủi Ro) */}
      <section className="mx-auto max-w-[880px] px-4 py-16 border-t border-[#262626]">
        <div className="rounded-[10px] border border-[#ff8833]/40 bg-[#171717] p-8 md:p-10 text-center">
          <div className="size-12 rounded-full bg-[#ff8833]/20 text-[#ff8833] flex items-center justify-center mx-auto mb-4">
            <Shield className="size-6" />
          </div>
          <h3 className="text-[24px] font-bold text-[#fafafa] mb-3">
            CAM KẾT HOÀN VỐN TRONG 90 NGÀY (100% NO-RISK GUARANTEE)
          </h3>
          <p className="text-[15px] text-[#a1a1a1] leading-relaxed max-w-[700px] mx-auto mb-6">
            Nếu sau 90 ngày đưa Hệ điều hành RAI² First OS vào vận hành, hệ thống không giúp bạn <strong className="text-[#fafafa]">tiết kiệm tối thiểu 15.000.000 VNĐ chi phí</strong> hoặc <strong className="text-[#fafafa]">giải phóng ít nhất 10 giờ làm việc tay chân mỗi tuần</strong> cho bạn: Chúng tôi sẽ hoàn lại 100% tiền thuê bao không một câu hỏi vặn vẹo. Rủi ro thuộc về chúng tôi, hiệu suất thuộc về bạn.
          </p>

          <div className="text-left border-t border-[#262626] pt-6 mt-6 text-[14px] text-[#a1a1a1] space-y-3 font-mono">
            <p>
              <strong className="text-[#ff8833]">P.S. (Tái bút):</strong> Trong kinh doanh, cái đắt đỏ nhất không phải là tiền mua phần mềm, mà là <em>chi phí cơ hội của việc người chủ phải làm những việc lặt vặt của nhân viên 5 triệu/tháng</em>. Hãy ngừng làm khổ chủ cho chính công ty của mình.
            </p>
            <p>
              <strong className="text-[#ff8833]">P.P.S.:</strong> Gói dùng thử 14 ngày hoàn toàn miễn phí, không yêu cầu thẻ tín dụng, kích hoạt trong 30 giây. Bạn không mất gì cả ngoài chiếc bẫy MeOS đang giam cầm bạn.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-[#262626] bg-[#0a0a0a] py-12 px-4">
        <div className="mx-auto max-w-[1152px] flex flex-col md:flex-row items-center justify-between gap-6 text-[13px] text-[#737373]">
          <div className="flex items-center gap-3">
            <img src="/assets/rai-logo.png" alt="RAI²" className="h-6 w-auto object-contain" />
            <span>© 2026 RAI² First LLC. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://raifirst.si/news/he-dieu-hanh-doanh-nghiep-rai2-first-os-la-gi" target="_blank" rel="noopener noreferrer" className="hover:text-[#a1a1a1] transition-colors">
              Bài Phân Tích Gốc
            </a>
            <button type="button" onClick={onAdminSignIn} className="hover:text-[#fafafa] transition-colors">
              Đăng nhập Quản Trị Viên (Pairing Code)
            </button>
          </div>
        </div>
      </footer>

      {/* 11. Modal Thanh Toán SePay VietQR hoặc Đăng Ký 14 Ngày */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[480px] rounded-[10px] border border-[#262626] bg-[#171717] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute right-4 top-4 text-[#737373] hover:text-[#fafafa] transition-colors"
            >
              <X className="size-5" />
            </button>

            {isPaid ? (
              <div className="text-center py-6">
                <CheckCircle2 className="size-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-[22px] font-bold text-[#fafafa] mb-2">
                  {selectedPlan.tier === "trial" ? "Kích Hoạt 14 Ngày Thành Công!" : "Thanh Toán Thành Công!"}
                </h3>
                <p className="text-[14px] text-[#a1a1a1] mb-6">
                  {selectedPlan.tier === "trial"
                    ? "Tài khoản của bạn đã được mở khóa 14 ngày trải nghiệm đầy đủ quyền năng của RAI² First OS."
                    : "Hệ thống đã nhận được chuyển khoản từ SePay và kích hoạt 31 ngày dịch vụ."}
                </p>
                <button
                  type="button"
                  onClick={onAdminSignIn}
                  className="w-full rounded-[8px] bg-[#e5e5e5] py-3 text-[14px] font-semibold text-[#171717] hover:bg-white transition-all"
                >
                  Vào Không Gian Làm Việc Ngay →
                </button>
              </div>
            ) : paymentData ? (
              <div>
                <div className="text-center mb-4">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#ff8833]">QUÉT MÃ THANH TOÁN TỰ ĐỘNG</span>
                  <h3 className="text-[20px] font-bold text-[#fafafa] mt-1">Gói {selectedPlan.name}</h3>
                  <p className="text-[13px] text-[#a1a1a1]">Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR</p>
                </div>

                <div className="bg-white p-4 rounded-[10px] mx-auto w-fit shadow-md my-4">
                  <img src={paymentData.qrUrl} alt="SePay VietQR" className="size-56 object-contain" />
                </div>

                <div className="space-y-2 rounded-[8px] border border-[#262626] bg-[#0a0a0a] p-3 text-[13px] font-mono mb-4">
                  <div className="flex justify-between items-center text-[#a1a1a1]">
                    <span>Số tiền:</span>
                    <strong className="text-[#fafafa] text-[15px]">{paymentData.amount.toLocaleString("vi-VN")} đ</strong>
                  </div>
                  <div className="flex justify-between items-center text-[#a1a1a1]">
                    <span>Ngân hàng:</span>
                    <span className="text-[#fafafa]">{paymentData.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#a1a1a1]">
                    <span>Số tài khoản:</span>
                    <span className="text-[#fafafa]">{paymentData.bankAccount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#ff8833] pt-1 border-t border-[#262626]">
                    <span>Nội dung chuyển khoản:</span>
                    <button
                      type="button"
                      onClick={() => copyContent(paymentData.transferContent)}
                      className="flex items-center gap-1 font-bold hover:underline"
                    >
                      {paymentData.transferContent} <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                {copied && <p className="text-center text-[12px] text-emerald-400 mb-2">Đã sao chép nội dung chuyển khoản!</p>}

                <div className="flex items-center justify-center gap-2 text-[12px] text-[#737373]">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hệ thống tự động kích hoạt ngay khi nhận tiền (3 giây)...</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#ff8833]">
                    {selectedPlan.tier === "trial" ? "TRẢI NGHIỆM MIỄN PHÍ" : "ĐĂNG KÝ GÓI THUÊ BAO"}
                  </span>
                  <h3 className="text-[22px] font-bold text-[#fafafa] mt-1">{selectedPlan.name}</h3>
                  <p className="text-[14px] text-[#a1a1a1] mt-1">
                    Giá đầu tư: <strong className="text-[#fafafa]">{selectedPlan.priceDisplay}</strong> {selectedPlan.periodDisplay}
                  </p>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#a1a1a1] mb-1.5">
                      Email doanh nghiệp của bạn:
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ceo@congty.vn"
                      className="w-full rounded-[8px] border border-[#262626] bg-[#0a0a0a] px-3.5 py-2.5 text-[14px] text-[#fafafa] outline-none focus:border-[#ff8833]"
                    />
                  </div>

                  <div className="p-3 rounded-[8px] bg-[#0a0a0a] border border-[#262626] text-[12px] text-[#737373] space-y-1">
                    <p className="text-[#a1a1a1] font-semibold">Quy tắc bảo mật RAI²:</p>
                    <p>• Dữ liệu của bạn được cô lập trong Sandbox máy ảo riêng.</p>
                    <p>• Mô hình 100% BYOK – bạn tự cắm API Key cá nhân.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-[8px] bg-[#ff8833] py-3 text-[14px] font-semibold text-[#171717] hover:bg-[#ff9944] transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Đang khởi tạo..."
                      : selectedPlan.tier === "trial"
                      ? "Bắt Đầu Trải Nghiệm 14 Ngày Ngay"
                      : "Tạo Mã QR Chuyển Khoản Ngân Hàng"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
