import { useState, useEffect, useSyncExternalStore } from "react";
import { readSessionState } from "../../lib/session";
import {
  Shield, Check, ArrowRight, X, Sparkles, Copy,
  CheckCircle2, AlertTriangle, Zap,
  Sun, Moon, Menu as MenuIcon, X as CloseIcon
} from "lucide-react";
import { applySkinChoice, readSkin, subscribeSkin, THEME_SKINS } from "@/lib/skins";
import { cn } from "@/lib/cn";

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
    name: "RAI² Tăng Tốc",
    priceDisplay: "799.000 VNĐ",
    periodDisplay: "/ tháng",
    badge: "PHỔ BIẾN NHẤT",
    popular: true,
    description: "Lựa chọn tối ưu cho doanh nghiệp 5–20 nhân sự muốn giải phóng đội ngũ khỏi các mắt xích trì trệ.",
    features: [
      "Toàn bộ quyền lợi của gói Khởi Động",
      "Kích hoạt phòng họp Multi-Agent phối hợp",
      "Browser Sandbox duyệt web & tương tác UI",
      "Kho lưu trữ quy trình SOP nội bộ không giới hạn",
      "Cam kết bảo chứng hoàn vốn 90 ngày (Dan Kennedy Style)",
      "Hỗ trợ ưu tiên 1-1 qua nhóm riêng"
    ]
  },
  {
    tier: "team",
    name: "RAI² Chuyển Đổi Doanh Nghiệp",
    priceDisplay: "1.990.000 VNĐ",
    periodDisplay: "/ tháng",
    description: "Giải pháp toàn diện biến doanh nghiệp thành thực thể số tự hành với vai trò CAIO đồng hành.",
    features: [
      "Toàn bộ tính năng cao cấp của gói Tăng Tốc",
      "Triển khai không giới hạn thành viên & nhóm",
      "Định danh CAIO chịu trách nhiệm giám sát P&L",
      "Custom Connector tích hợp ERP / CRM nội bộ",
      "Đào tạo chuyển giao khung tư duy RAI² First OS",
      "Ký hợp đồng bảo mật SLA & Hỗ trợ kỹ thuật 24/7"
    ]
  }
];

export interface AiTeamMascot {
  id: string;
  name: string;
  role: string;
  badge: string;
  desc: string;
  avatar: string;
  color: string;
}

export const AI_TEAM_MASCOTS: AiTeamMascot[] = [
  {
    id: "mascot-1",
    name: "Biscuit",
    role: "Trợ Lý Khởi Tạo & Điều Phối",
    badge: "Sẵn sàng 24/7",
    desc: "Tiếp nhận yêu cầu ban đầu, phân bổ đầu việc và kết nối tất cả các RAI trong phòng họp số.",
    avatar: "/assets/mascots/mascot-1.png?v=7",
    color: "#0099ff",
  },
  {
    id: "mascot-2",
    name: "Browser RAI",
    role: "Kỹ Sư Trình Duyệt Web",
    badge: "Chromium Sandbox",
    desc: "Đăng nhập cổng thông tin, cào dữ liệu đối thủ, tải hóa đơn và cập nhật giá tự động.",
    avatar: "/assets/mascots/mascot-2.png?v=7",
    color: "#10b981",
  },
  {
    id: "mascot-3",
    name: "Content RAI",
    role: "Chiến Lược Gia Nội Dung",
    badge: "Chuẩn SEO / AEO",
    desc: "Soạn thảo bài viết chuyên sâu theo giọng văn thương hiệu, chuyển đổi đa kênh không tạo rác.",
    avatar: "/assets/mascots/mascot-3.png?v=7",
    color: "#f59e0b",
  },
  {
    id: "mascot-4",
    name: "Support RAI",
    role: "Chuyên Viên Dịch Vụ & CSKH",
    badge: "Phản hồi tức thì",
    desc: "Lắng nghe tâm tư khách hàng, phân loại khiếu nại và phản hồi kịp thời qua Zalo/Telegram.",
    avatar: "/assets/mascots/mascot-4.png?v=7",
    color: "#ec4899",
  },
  {
    id: "mascot-5",
    name: "CAIO Master",
    role: "Tổng Quản Giám Sát AI",
    badge: "Bảo chứng P&L",
    desc: "Giám sát hiệu suất vận hành, kiểm soát rủi ro bảo mật và cam kết hoàn vốn 90 ngày.",
    avatar: "/assets/mascots/mascot-5.png?v=7",
    color: "#8b5cf6",
  },
  {
    id: "mascot-6",
    name: "Data RAI",
    role: "Kỹ Sư Dữ Liệu & Báo Cáo",
    badge: "Google Sheets & SQL",
    desc: "Tự động hóa sổ sách kế toán, trích xuất báo cáo doanh thu và đồng bộ dữ liệu thời gian thực.",
    avatar: "/assets/mascots/mascot-6.png?v=7",
    color: "#06b6d4",
  },
  {
    id: "mascot-7",
    name: "Market Scout",
    role: "Trinh Sát Thị Trường",
    badge: "Radar Cạnh Tranh",
    desc: "Quét xu hướng ngành, phân tích chiến dịch đối thủ và phát hiện cơ hội tăng trưởng mới.",
    avatar: "/assets/mascots/mascot-7.png?v=7",
    color: "#6366f1",
  },
  {
    id: "mascot-8",
    name: "Ops Executive",
    role: "Giám Đốc Vận Hành Định Kỳ",
    badge: "Routines Tự Hành",
    desc: "Chạy các luồng công việc lặp lại mỗi ngày, nhắc việc và duy trì nhịp độ chuẩn xác 100%.",
    avatar: "/assets/mascots/mascot-8.png?v=7",
    color: "#14b8a6",
  },
];

const DARK_SKINS = new Set([
  "midnight",
  "foundry",
  "graphite",
  "dusk",
  "halloween",
  "diwali",
  "aurora",
]);

export function RaiLandingPage({ onAdminSignIn: _onAdminSignIn }: { onAdminSignIn?: () => void }) {
  const currentSkin = useSyncExternalStore(subscribeSkin, readSkin, readSkin);
  const isDark = DARK_SKINS.has(currentSkin);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
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
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-landing-page");
    return () => {
      document.body.classList.remove("has-landing-page");
    };
  }, []);

  useEffect(() => {
    void readSessionState().then((sess) => {
      if (sess && sess.kind === "session") {
        setCurrentUser(sess.label || sess.email || "Active User");
      }
    }).catch(() => {});
  }, []);

  const handleInstantAccess = async (targetEmail: string, tier: string = "trial") => {
    if (!targetEmail || !targetEmail.includes("@")) {
      setAuthError("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    setActivating(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/subscription/instant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: targetEmail, tier })
      });
      if (res.ok) {
        const data = await res.json();
        setActivationSuccess(true);
        setTimeout(() => {
          window.location.href = data.redirectUrl || "/app";
        }, 800);
      } else {
        const err = await res.json().catch(() => ({}));
        setAuthError(err.error || "Không thể cấp quyền truy cập. Vui lòng thử lại!");
      }
    } catch (e: any) {
      setAuthError("Lỗi kết nối máy chủ: " + e.message);
    } finally {
      setActivating(false);
    }
  };

  const handleCheckout = async (plan: PlanOption) => {
    setSelectedPlan(plan);
    setPaymentData(null);
    setActivationSuccess(false);
    setAuthError(null);

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
    <div
      id="landing-page-root"
      className={cn(
        "min-h-screen w-full font-sans antialiased selection:bg-[#0099ff] selection:text-white transition-colors duration-200",
        isDark ? "bg-[#000000] text-[#ffffff]" : "bg-[#f8f9fa] text-[#111111]"
      )}
    >
      {/* 1. TOP NAVIGATION - Fixed Sticky & Responsive Framer Style */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all backdrop-blur-md border-b",
          isDark
            ? "bg-[#000000]/90 border-[#242424]/60 text-white"
            : "bg-[#ffffff]/90 border-[#e5e5e5]/80 text-[#111111] shadow-xs"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center group py-1">
            <img
              src={isDark ? "/assets/rai-core-white.png?v=6" : "/assets/rai-core-black.png?v=6"}
              alt="RAI²"
              className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-opacity duration-200 group-hover:opacity-85"
            />
          </a>

          {/* Desktop Nav - 5 Menu items */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => scrollTo("triet-ly")}
              className={cn(
                "text-[14px] font-medium transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-[#ffffff]" : "text-[#666666] hover:text-[#000000]"
              )}
            >
              Triết lý
            </button>
            <button
              onClick={() => scrollTo("doi-ngu-rai")}
              className={cn(
                "text-[14px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5",
                isDark ? "text-[#8c8c8c] hover:text-[#ffffff]" : "text-[#666666] hover:text-[#000000]"
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Nhân sự số
            </button>
            <button
              onClick={() => scrollTo("tinh-nang")}
              className={cn(
                "text-[14px] font-medium transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-[#ffffff]" : "text-[#666666] hover:text-[#000000]"
              )}
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollTo("bang-gia")}
              className={cn(
                "text-[14px] font-medium transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-[#ffffff]" : "text-[#666666] hover:text-[#000000]"
              )}
            >
              Bảng giá
            </button>
            {currentUser ? (
              <a
                href="/app"
                className="text-[14px] font-medium text-[#0099ff] hover:underline transition-colors cursor-pointer"
              >
                Vào Workspace
              </a>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className={cn(
                  "text-[14px] font-medium transition-colors cursor-pointer",
                  isDark ? "text-[#8c8c8c] hover:text-[#ffffff]" : "text-[#666666] hover:text-[#000000]"
                )}
              >
                Đăng nhập
              </button>
            )}
          </nav>

          {/* Desktop Actions: Theme Toggle + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => applySkinChoice(isDark ? THEME_SKINS.light : THEME_SKINS.dark)}
              title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              aria-label="Đổi giao diện Sáng/Tối"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
                isDark
                  ? "text-[#8c8c8c] hover:text-[#ffffff] hover:bg-[#1a1a1a]"
                  : "text-[#666666] hover:text-[#000000] hover:bg-[#eaeaea]"
              )}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {currentUser ? (
              <a
                href="/app"
                className={cn(
                  "px-5 py-2 rounded-full text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5",
                  isDark ? "bg-[#ffffff] text-[#000000] hover:bg-[#e6e6e6]" : "bg-[#000000] text-[#ffffff] hover:bg-[#222222]"
                )}
              >
                Vào Hệ Thống RAI² <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/pair"
                  className={cn(
                    "px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                    isDark ? "text-[#a3a3a3] hover:text-[#ffffff]" : "text-[#475569] hover:text-[#0f172a]"
                  )}
                >
                  Đăng Nhập
                </a>
                <a
                  href="/pair"
                  className="px-4 py-2 rounded-full text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 bg-[#0099ff] hover:bg-[#0088ee] text-white shadow-sm"
                >
                  Đăng Ký <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => applySkinChoice(isDark ? THEME_SKINS.light : THEME_SKINS.dark)}
              title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              aria-label="Đổi giao diện Sáng/Tối"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
                isDark
                  ? "text-[#8c8c8c] hover:text-[#ffffff] hover:bg-[#1a1a1a]"
                  : "text-[#666666] hover:text-[#000000] hover:bg-[#eaeaea]"
              )}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
                isDark
                  ? "text-[#ffffff] bg-[#141414] hover:bg-[#222222]"
                  : "text-[#000000] bg-[#f0f0f0] hover:bg-[#e4e4e4]"
              )}
            >
              {mobileMenuOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            className={cn(
              "md:hidden w-full border-t px-6 py-5 space-y-4 shadow-2xl animate-fade-in",
              isDark ? "bg-[#0a0a0a] border-[#242424] text-white" : "bg-[#ffffff] border-[#e5e5e5] text-[#111111]"
            )}
          >
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  scrollTo("triet-ly");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-left py-2 text-[15px] font-medium transition-colors",
                  isDark ? "text-[#cccccc] hover:text-white" : "text-[#444444] hover:text-black"
                )}
              >
                Triết lý RAI²
              </button>
              <button
                onClick={() => {
                  scrollTo("doi-ngu-rai");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-left py-2 text-[15px] font-medium transition-colors flex items-center gap-2",
                  isDark ? "text-[#cccccc] hover:text-white" : "text-[#444444] hover:text-black"
                )}
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Nhân sự số (8 RAI)
              </button>
              <button
                onClick={() => {
                  scrollTo("tinh-nang");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-left py-2 text-[15px] font-medium transition-colors",
                  isDark ? "text-[#cccccc] hover:text-white" : "text-[#444444] hover:text-black"
                )}
              >
                Tính năng
              </button>
              <button
                onClick={() => {
                  scrollTo("bang-gia");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-left py-2 text-[15px] font-medium transition-colors",
                  isDark ? "text-[#cccccc] hover:text-white" : "text-[#444444] hover:text-black"
                )}
              >
                Bảng giá
              </button>
              {currentUser ? (
                <a
                  href="/app"
                  className="text-left py-2 text-[15px] font-medium text-[#0099ff]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Vào Không Gian Làm Việc
                </a>
              ) : (
                <a
                  href="/pair"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-left py-2 text-[15px] font-medium transition-colors",
                    isDark ? "text-[#cccccc] hover:text-white" : "text-[#444444] hover:text-black"
                  )}
                >
                  Đăng nhập
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-hairline/20">
              {currentUser ? (
                <a
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "w-full py-3 rounded-full text-center text-[14px] font-medium inline-flex items-center justify-center gap-2",
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  )}
                >
                  Vào Hệ Thống RAI² <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="/pair"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full text-center text-[14px] font-semibold inline-flex items-center justify-center gap-2 bg-[#0099ff] hover:bg-[#0088ee] text-white shadow-sm"
                >
                  Đăng Ký & Dùng Thử Ngay <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION - Editorial Framer Typographic Mass */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-16 md:pb-24 overflow-hidden">
        {/* Subtle radial glow on edges */}
        <div
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] blur-[120px] pointer-events-none rounded-full",
            isDark ? "bg-[#0099ff]/5" : "bg-[#0099ff]/10"
          )}
        />

        <div className="max-w-[1200px] mx-auto px-6 text-center relative z-20">
          {/* Tagline Announcement: Cân đối khoảng cách với menu bar */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1 rounded-full border mb-5 sm:mb-6 transition-colors",
              isDark
                ? "border-[#242424] bg-[#080808] hover:border-[#0099ff]/50"
                : "border-[#e2e8f0] bg-[#ffffff] hover:border-[#0099ff]/50 shadow-xs"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
            <span
              className={cn(
                "text-[12px] font-medium tracking-wide uppercase",
                isDark ? "text-[#8c8c8c]" : "text-[#555555]"
              )}
            >
              Retrofit AI Architecture • RAI² First OS
            </span>
          </div>

          {/* Headline Display: GT Walsheim Editorial Style with Inline Character Badge */}
          <h1
            className={cn(
              "text-3xl sm:text-5xl md:text-6xl lg:text-[76px] font-medium tracking-[-0.04em] leading-[1.12] sm:leading-[1.04] max-w-[1050px] mx-auto mb-6 sm:mb-7",
              isDark ? "text-white" : "text-[#111111]"
            )}
          >
            Nếu hôm nay Bạn{" "}
            <span className="inline-flex items-center align-middle mx-1 sm:mx-2.5">
              <img
                src="/assets/headline-badge-circle.png?v=6"
                alt="RAI² Avatar"
                className="size-8 sm:size-12 md:size-14 lg:size-16 rounded-full object-cover shadow-lg border-2 border-white/20 inline-block align-middle transform -translate-y-0.5 sm:-translate-y-1 hover:scale-105 transition-transform duration-200"
              />
            </span>{" "}
            xây lại doanh nghiệp từ đầu, Bạn có tổ chức bộ máy theo cách cũ?
          </h1>

          {/* Subhead Dan Kennedy style */}
          <p
            className={cn(
              "text-base sm:text-lg md:text-xl max-w-[800px] mx-auto leading-relaxed mb-8 sm:mb-9 tracking-[-0.01em]",
              isDark ? "text-[#999999]" : "text-[#4b5563]"
            )}
          >
            Đa số các chủ doanh nghiệp đang rơi vào cái bẫy{" "}
            <strong className={isDark ? "text-white font-medium" : "text-[#111111] font-medium"}>
              "chắp vá AI"
            </strong>{" "}
            trên các quy trình cũ nát. Kết quả: AI khuếch đại sai lầm với tốc độ nhanh gấp 10 lần. Đã đến lúc trang bị một Hệ điều hành tự hành thực thụ cho đội ngũ 5–20 nhân sự.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-30">
            {currentUser ? (
              <a
                href="/app"
                className={cn(
                  "w-full sm:w-auto px-8 py-3.5 rounded-full text-[15px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer inline-flex items-center justify-center gap-2",
                  isDark ? "bg-[#ffffff] text-[#000000] hover:bg-[#e6e6e6]" : "bg-[#000000] text-[#ffffff] hover:bg-[#222222]"
                )}
              >
                Vào Không Gian Làm Việc RAI² <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={() => handleCheckout(PLANS[0])}
                className={cn(
                  "w-full sm:w-auto px-8 py-3.5 rounded-full text-[15px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer",
                  isDark ? "bg-[#ffffff] text-[#000000] hover:bg-[#e6e6e6]" : "bg-[#000000] text-[#ffffff] hover:bg-[#222222]"
                )}
              >
                Trải nghiệm 14 ngày miễn phí
              </button>
            )}
            <button
              onClick={() => scrollTo("triet-ly")}
              className={cn(
                "w-full sm:w-auto px-8 py-3.5 rounded-full border text-[15px] font-medium transition-all cursor-pointer",
                isDark
                  ? "border-white/20 text-[#ffffff] hover:border-[#0099ff] hover:text-[#0099ff]"
                  : "border-black/20 text-[#111111] hover:border-[#0099ff] hover:text-[#0099ff]"
              )}
            >
              Khám phá triết lý RAI²
            </button>
          </div>

          {/* Metrics micro-bar */}
          <div
            className={cn(
              "mt-14 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[900px] mx-auto text-left",
              isDark ? "border-[#242424]/60" : "border-[#e2e8f0]"
            )}
          >
            <div className={cn("p-3 border-l", isDark ? "border-[#242424]" : "border-[#e2e8f0]")}>
              <div className="text-[12px] text-[#0099ff] uppercase tracking-wider font-medium">Bảo chứng ROI</div>
              <div className={cn("text-2xl font-medium mt-1", isDark ? "text-white" : "text-[#111111]")}>90 Ngày</div>
              <div className={cn("text-[12px] mt-0.5", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>Cam kết hoàn vốn rõ ràng</div>
            </div>
            <div className={cn("p-3 border-l", isDark ? "border-[#242424]" : "border-[#e2e8f0]")}>
              <div className="text-[12px] text-[#0099ff] uppercase tracking-wider font-medium">Dữ liệu cốt lõi</div>
              <div className={cn("text-2xl font-medium mt-1", isDark ? "text-white" : "text-[#111111]")}>100% BYOK</div>
              <div className={cn("text-[12px] mt-0.5", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>Quyền sở hữu key & API tuyệt đối</div>
            </div>
            <div className={cn("p-3 border-l", isDark ? "border-[#242424]" : "border-[#e2e8f0]")}>
              <div className="text-[12px] text-[#0099ff] uppercase tracking-wider font-medium">Bộ máy tự hành</div>
              <div className={cn("text-2xl font-medium mt-1", isDark ? "text-white" : "text-[#111111]")}>4 Chuyên Trách</div>
              <div className={cn("text-[12px] mt-0.5", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>Sales, Ops, Marketing & CAIO</div>
            </div>
            <div className={cn("p-3 border-l", isDark ? "border-[#242424]" : "border-[#e2e8f0]")}>
              <div className="text-[12px] text-[#0099ff] uppercase tracking-wider font-medium">Quy mô tối ưu</div>
              <div className={cn("text-2xl font-medium mt-1", isDark ? "text-white" : "text-[#111111]")}>5–20 Người</div>
              <div className={cn("text-[12px] mt-0.5", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>Thiết kế đo ni đóng giày cho SME</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 SECTION: ĐỘI NGŨ NHÂN SỰ SỐ RAI² - Mascot Team Showcase (Mausbot.com Style) */}
      <section
        id="doi-ngu-rai"
        className={cn(
          "py-16 sm:py-20 md:py-24 border-t transition-colors relative overflow-hidden",
          isDark ? "bg-[#0b0b0b] border-[#242424]/60" : "bg-[#f8fafc] border-[#e2e8f0]"
        )}
      >
        {/* Subtle decorative background glow */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] blur-[140px] pointer-events-none rounded-full",
            isDark ? "bg-[#0099ff]/5" : "bg-[#0099ff]/10"
          )}
        />

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-[800px] mx-auto mb-12 sm:mb-16">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1 rounded-full border mb-4 text-[11px] sm:text-[12px] font-medium tracking-widest uppercase transition-colors",
                isDark
                  ? "border-[#242424] bg-[#111111] text-[#0099ff]"
                  : "border-[#e2e8f0] bg-[#ffffff] text-[#0099ff] shadow-xs"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
              Đội Ngũ Nhân Sự Số • Meet The Autonomous Team
            </div>
            <h2
              className={cn(
                "text-2xl sm:text-4xl md:text-5xl font-medium tracking-[-0.03em] leading-tight mb-4",
                isDark ? "text-white" : "text-[#111111]"
              )}
            >
              Đội Ngũ Tự Hành Sẵn Sàng 24/7 Cho Doanh Nghiệp Bạn
            </h2>
            <p
              className={cn(
                "text-sm sm:text-base md:text-lg leading-relaxed max-w-[700px] mx-auto",
                isDark ? "text-[#999999]" : "text-[#4b5563]"
              )}
            >
              Không cần tuyển dụng rườm rà hay đào tạo từ đầu. Mỗi nhân sự số sở hữu cá tính, chuyên môn sâu và tự động kết nối phối hợp nhịp nhàng trong cùng một Không gian làm việc.
            </p>
          </div>

          {/* Responsive Mascot Grid: 2 cols on mobile, 4 cols on tablet/desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {AI_TEAM_MASCOTS.map((bot) => (
              <div
                key={bot.id}
                className={cn(
                  "group relative p-4 sm:p-5 rounded-[18px] sm:rounded-[22px] border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl",
                  isDark
                    ? "bg-[#111111]/85 hover:bg-[#151515] border-[#222222] hover:border-[#0099ff]/50"
                    : "bg-[#ffffff] hover:bg-[#ffffff] border-[#e2e8f0] hover:border-[#0099ff]/50 shadow-xs"
                )}
              >
                <div>
                  {/* Avatar & Pill Badge */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2.5 mb-3 sm:mb-4 text-center sm:text-left">
                    <div className="relative">
                      <div
                        className={cn(
                          "size-14 sm:size-16 md:size-18 rounded-full overflow-hidden p-0.5 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md mx-auto",
                          isDark ? "border-[#2a2a2a] bg-[#1a1a1a]" : "border-[#e2e8f0] bg-[#f8fafc]"
                        )}
                      >
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          className="size-full rounded-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 sm:right-0.5 size-3 sm:size-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111111]" />
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border text-center whitespace-nowrap"
                      style={{
                        borderColor: isDark ? "#242424" : "#e2e8f0",
                        backgroundColor: isDark ? "#171717" : "#f1f5f9",
                        color: bot.color,
                      }}
                    >
                      {bot.badge}
                    </span>
                  </div>

                  {/* Name & Role */}
                  <div className="text-center sm:text-left">
                    <h3
                      className={cn(
                        "text-[15px] sm:text-[17px] font-medium tracking-tight mb-0.5 group-hover:text-[#0099ff] transition-colors truncate",
                        isDark ? "text-white" : "text-[#111111]"
                      )}
                    >
                      {bot.name}
                    </h3>
                    <div className="text-[11px] sm:text-[12px] font-medium text-[#0099ff] mb-2 truncate">
                      {bot.role}
                    </div>

                    {/* Description */}
                    <p
                      className={cn(
                        "text-[12px] sm:text-[13px] leading-relaxed line-clamp-3 sm:line-clamp-none mb-3",
                        isDark ? "text-[#8c8c8c]" : "text-[#64748b]"
                      )}
                    >
                      {bot.desc}
                    </p>
                  </div>
                </div>

                {/* Status Footer */}
                <div
                  className="pt-2.5 sm:pt-3 border-t flex items-center justify-between text-[11px] sm:text-[12px]"
                  style={{ borderColor: isDark ? "#1e1e1e" : "#f1f5f9" }}
                >
                  <span className={cn("text-[10px] sm:text-[11px]", isDark ? "text-[#666666]" : "text-[#94a3b8]")}>
                    Trạng thái
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-500 text-[11px] sm:text-[12px]">
                    <span className="size-1 sm:size-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Trực chiến
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA strip below team cards */}
          <div className="mt-10 sm:mt-12 text-center">
            <button
              onClick={() => handleCheckout(PLANS[0])}
              className={cn(
                "inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-[13px] sm:text-[14px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer",
                isDark ? "bg-[#ffffff] text-[#000000] hover:bg-[#e6e6e6]" : "bg-[#000000] text-[#ffffff] hover:bg-[#222222]"
              )}
            >
              Kích hoạt toàn bộ đội ngũ nhân sự số ngay <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. SECTION: BÓC TRẦN SỰ THẬT - Dan Kennedy Hard-hitting Copy */}
      <section
        id="triet-ly"
        className={cn(
          "py-20 border-t transition-colors",
          isDark ? "bg-[#080808] border-[#242424]/60" : "bg-[#f8fafc] border-[#e2e8f0]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[800px] mb-14">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Mổ xẻ tử huyệt vận hành
            </div>
            <h2 className={cn("text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight mb-6", isDark ? "text-white" : "text-[#111111]")}>
              Cơn ác mộng "AI-First" và ảo tưởng nguy hiểm về MeOS
            </h2>
            <p className={cn("text-base sm:text-lg leading-relaxed", isDark ? "text-[#999999]" : "text-[#4b5563]")}>
              Các chuyên gia tự phong đang rao giảng việc biến một cá nhân thành "bản sao AI" (MeOS). Nhưng đây là sự thật cay đắng mà không ai dám nói với bạn:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Ảo tưởng MeOS */}
            <div
              className={cn(
                "p-8 rounded-[15px] border transition-colors",
                isDark
                  ? "bg-[#111111] border-[#242424] hover:border-[#0099ff]/50"
                  : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#0099ff]/50 shadow-xs"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center text-[#ff4444] mb-6", isDark ? "bg-[#000000] border-[#242424]" : "bg-[#fef2f2] border-[#fecaca]")}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className={cn("text-xl font-medium mb-3 tracking-[-0.02em]", isDark ? "text-white" : "text-[#111111]")}>
                Ảo tưởng MeOS: Đóng gói sự hỗn loạn
              </h3>
              <p className={cn("text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Nếu một người làm việc theo cảm hứng, thiếu tính kỷ luật và quy trình chuẩn, thì việc tạo ra một "bản sao AI" chỉ nhân bản sự lộn xộn đó lên gấp hàng trăm lần.
              </p>
              <p className={cn("text-[14px] leading-relaxed", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Khi công ty mở rộng từ 5 lên 10 hay 20 người, MeOS trở thành cái bẫy giam cầm chính người sáng lập, biến sếp thành điểm nghẽn nghẹt thở nhất của doanh nghiệp.
              </p>
            </div>

            {/* Card 2: Cơn ác mộng chắp vá AI */}
            <div
              className={cn(
                "p-8 rounded-[15px] border transition-colors",
                isDark
                  ? "bg-[#111111] border-[#242424] hover:border-[#0099ff]/50"
                  : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#0099ff]/50 shadow-xs"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center text-[#ff8833] mb-6", isDark ? "bg-[#000000] border-[#242424]" : "bg-[#fff7ed] border-[#fed7aa]")}>
                <Zap className="w-5 h-5" />
              </div>
              <h3 className={cn("text-xl font-medium mb-3 tracking-[-0.02em]", isDark ? "text-white" : "text-[#111111]")}>
                Cái bẫy công cụ: Ném AI vào quy trình rác
              </h3>
              <p className={cn("text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Mua tài khoản ChatGPT, cài thêm RAI trả lời tin nhắn, trang bị tool tự động tạo bài viết... nhưng doanh thu không tăng, chi phí phình to và không một ai chịu trách nhiệm về kết quả cuối cùng.
              </p>
              <p className={cn("text-[14px] leading-relaxed", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Đưa AI vào một quy trình hỏng chỉ giúp bạn tạo ra rác nhanh hơn, đốt tiền nhanh hơn và làm khách hàng thất vọng nhanh hơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: 7 NGUYÊN TẮC CỐT TỬ RAI² FIRST OS */}
      <section
        className={cn(
          "py-24 border-t transition-colors",
          isDark ? "bg-[#000000] border-[#242424]/60" : "bg-[#ffffff] border-[#e2e8f0]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[800px] mx-auto mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Triết lý nền tảng
            </div>
            <h2 className={cn("text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight mb-5", isDark ? "text-white" : "text-[#111111]")}>
              7 Nguyên Tắc Cốt Tử Của RAI² First OS
            </h2>
            <p className={cn("text-base leading-relaxed", isDark ? "text-[#999999]" : "text-[#4b5563]")}>
              Khung năng lực biến tổ chức của bạn thành một thực thể số tự hành, có trách nhiệm giải trình và cam kết tỷ suất hoàn vốn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Hệ Thống Trước — AI Theo Sau",
                desc: "Không có phép màu nào cứu được một quy trình rách nát. Trước khi kết nối bất kỳ RAI hay agent nào, hệ thống phải được chuẩn hóa và cắt bỏ các bước thừa."
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
                desc: "Dựa trên Lý thuyết điểm nghẽn (Theory of Constraints): Chỉ tập trung đội ngũ RAI vào mắt xích đang kìm hãm dòng tiền của toàn bộ công ty."
              }
            ].map((p, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-7 rounded-[15px] border transition-all group",
                  isDark
                    ? "bg-[#080808] border-[#242424] hover:border-[#0099ff]/60"
                    : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#0099ff]/60 shadow-xs"
                )}
              >
                <div className="text-[12px] font-mono text-[#0099ff] mb-4">
                  PRINCIPLE // {p.num}
                </div>
                <h3 className={cn("text-lg font-medium mb-2.5 tracking-[-0.01em] transition-colors", isDark ? "text-white group-hover:text-white" : "text-[#111111] group-hover:text-black")}>
                  {p.title}
                </h3>
                <p className={cn("text-[13px] leading-relaxed", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                  {p.desc}
                </p>
              </div>
            ))}

            {/* Nguyên tắc 7: Full width highlight */}
            <div
              className={cn(
                "md:col-span-2 lg:col-span-3 p-8 rounded-[18px] border transition-all relative overflow-hidden",
                isDark
                  ? "bg-[#080808] border-[#0099ff]/30 hover:border-[#0099ff]"
                  : "bg-[#f0f9ff] border-[#0099ff]/30 hover:border-[#0099ff] shadow-xs"
              )}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0099ff]/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="text-[12px] font-mono text-[#0099ff] font-medium">
                  PRINCIPLE // 07 — CỐT LÕI
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium border",
                    isDark
                      ? "bg-[#141414] border-[#8b5cf6]/30 text-[#a78bfa]"
                      : "bg-[#ffffff] border-[#8b5cf6]/30 text-[#7c3aed] shadow-xs"
                  )}
                >
                  <img
                    src="/assets/mascots/mascot-5.png?v=7"
                    alt="CAIO Master"
                    className="size-5 rounded-full object-cover"
                  />
                  Giám sát trực tiếp bởi CAIO Master
                </div>
              </div>
              <h3 className={cn("text-xl sm:text-2xl font-medium mb-3 tracking-[-0.02em]", isDark ? "text-white" : "text-[#111111]")}>
                Trách Nhiệm Giải Trình & Vai Trò Của CAIO
              </h3>
              <p className={cn("text-[14px] leading-relaxed max-w-[950px]", isDark ? "text-[#999999]" : "text-[#334155]")}>
                AI không thể bị thả nổi. Tại RAI², mọi tác vụ số đều có một Giám đốc AI (CAIO) đứng sau giám sát: chịu trách nhiệm về số liệu P&L, kiểm soát rủi ro bảo mật và cam kết kết quả đầu ra cho toàn bộ các phòng ban của doanh nghiệp bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: TÍNH NĂNG - BỘ TỨ NHÂN SỰ SỐ TỰ HÀNH */}
      <section
        id="tinh-nang"
        className={cn(
          "py-24 border-t transition-colors",
          isDark ? "bg-[#080808] border-[#242424]/60" : "bg-[#f8fafc] border-[#e2e8f0]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[800px] mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Năng lực thực thi
            </div>
            <h2 className={cn("text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight mb-5", isDark ? "text-white" : "text-[#111111]")}>
              Bộ Tứ Nhân Sự Số Vận Hành 24/7
            </h2>
            <p className={cn("text-base leading-relaxed", isDark ? "text-[#999999]" : "text-[#4b5563]")}>
              Không chỉ là chatbot trả lời suông. Đây là những trợ lý tự hành sở hữu Sandbox Linux cô lập, có khả năng duyệt web thực tế, đọc tài liệu nội bộ và phối hợp đa nhiệm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AGENT 01: Ops RAI */}
            <div
              className={cn(
                "p-7 sm:p-8 rounded-[20px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                isDark ? "bg-[#111111] border-[#242424] hover:border-[#0099ff]/50" : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#0099ff]/50 shadow-xs"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "size-14 sm:size-16 rounded-full overflow-hidden p-0.5 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md",
                      isDark ? "border-[#0099ff]/40 bg-[#141414]" : "border-[#0099ff]/30 bg-[#f0f9ff]"
                    )}
                  >
                    <img
                      src="/assets/mascots/mascot-1.png?v=7"
                      alt="Ops RAI"
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111111]" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-[12px] font-mono text-[#0099ff] font-medium uppercase tracking-wider">
                    AGENT 01 • VẬN HÀNH
                  </div>
                  <h3 className={cn("text-lg sm:text-xl font-medium mt-0.5 group-hover:text-[#0099ff] transition-colors", isDark ? "text-white" : "text-[#111111]")}>
                    Trợ Lý Vận Hành & Tự Động Hóa (Ops RAI)
                  </h3>
                  <div className="text-[11px] sm:text-[12px] text-emerald-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Chạy routines 24/7
                  </div>
                </div>
              </div>
              <p className={cn("text-[13px] sm:text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Chạy định kỳ các routine hàng ngày: thu thập báo cáo bán hàng, đồng bộ đơn hàng về Sheet, kiểm tra lỗi hệ thống và gửi thông báo trực tiếp qua Telegram/Zalo.
              </p>
              <div className="text-[12px] text-[#0099ff] flex items-center gap-1.5 font-medium pt-3 border-t border-hairline/20">
                <Check className="w-4 h-4" /> Tự động hóa không cần giám sát 24/7
              </div>
            </div>

            {/* AGENT 02: Browser RAI */}
            <div
              className={cn(
                "p-7 sm:p-8 rounded-[20px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                isDark ? "bg-[#111111] border-[#242424] hover:border-[#10b981]/50" : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#10b981]/50 shadow-xs"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "size-14 sm:size-16 rounded-full overflow-hidden p-0.5 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md",
                      isDark ? "border-[#10b981]/40 bg-[#141414]" : "border-[#10b981]/30 bg-[#ecfdf5]"
                    )}
                  >
                    <img
                      src="/assets/mascots/mascot-2.png?v=7"
                      alt="Browser RAI"
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111111]" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-[12px] font-mono text-[#10b981] font-medium uppercase tracking-wider">
                    AGENT 02 • TRÌNH DUYỆT
                  </div>
                  <h3 className={cn("text-lg sm:text-xl font-medium mt-0.5 group-hover:text-[#10b981] transition-colors", isDark ? "text-white" : "text-[#111111]")}>
                    Trợ Lý Nghiên Cứu & Web (Browser RAI)
                  </h3>
                  <div className="text-[11px] sm:text-[12px] text-emerald-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Chromium độc lập
                  </div>
                </div>
              </div>
              <p className={cn("text-[13px] sm:text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Tự động đăng nhập vào cổng thông tin, tải hóa đơn, cào dữ liệu đối thủ cạnh tranh trên Shopee/Tiki và tóm tắt thành các quyết định thực thi.
              </p>
              <div className="text-[12px] text-[#10b981] flex items-center gap-1.5 font-medium pt-3 border-t border-hairline/20">
                <Check className="w-4 h-4" /> Điều khiển trình duyệt Chromium độc lập
              </div>
            </div>

            {/* AGENT 03: Content RAI */}
            <div
              className={cn(
                "p-7 sm:p-8 rounded-[20px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                isDark ? "bg-[#111111] border-[#242424] hover:border-[#f59e0b]/50" : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#f59e0b]/50 shadow-xs"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "size-14 sm:size-16 rounded-full overflow-hidden p-0.5 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md",
                      isDark ? "border-[#f59e0b]/40 bg-[#141414]" : "border-[#f59e0b]/30 bg-[#fffbeb]"
                    )}
                  >
                    <img
                      src="/assets/mascots/mascot-3.png?v=7"
                      alt="Content RAI"
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111111]" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-[12px] font-mono text-[#f59e0b] font-medium uppercase tracking-wider">
                    AGENT 03 • NỘI DUNG
                  </div>
                  <h3 className={cn("text-lg sm:text-xl font-medium mt-0.5 group-hover:text-[#f59e0b] transition-colors", isDark ? "text-white" : "text-[#111111]")}>
                    Trợ Lý Truyền Thông & Tiếp Thị (Content RAI)
                  </h3>
                  <div className="text-[11px] sm:text-[12px] text-amber-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chuẩn SEO / AEO / GEO
                  </div>
                </div>
              </div>
              <p className={cn("text-[13px] sm:text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Soạn thảo nội dung theo chuẩn giọng văn thương hiệu của bạn, chuyển đổi bài viết chuyên sâu thành bài đăng đa kênh, chuẩn SEO và không tạo ra nội dung rác.
              </p>
              <div className="text-[12px] text-[#f59e0b] flex items-center gap-1.5 font-medium pt-3 border-t border-hairline/20">
                <Check className="w-4 h-4" /> Đảm bảo tiêu chuẩn SEO/AEO/GEO
              </div>
            </div>

            {/* AGENT 04: CAIO & Multi-Agent Room */}
            <div
              className={cn(
                "p-7 sm:p-8 rounded-[20px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                isDark ? "bg-[#111111] border-[#242424] hover:border-[#8b5cf6]/50" : "bg-[#ffffff] border-[#e2e8f0] hover:border-[#8b5cf6]/50 shadow-xs"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "size-14 sm:size-16 rounded-full overflow-hidden p-0.5 border-2 transition-transform duration-300 group-hover:scale-105 shadow-md",
                      isDark ? "border-[#8b5cf6]/40 bg-[#141414]" : "border-[#8b5cf6]/30 bg-[#faf5ff]"
                    )}
                  >
                    <img
                      src="/assets/mascots/mascot-5.png?v=7"
                      alt="CAIO Master"
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111111]" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-[12px] font-mono text-[#8b5cf6] font-medium uppercase tracking-wider">
                    AGENT 04 • GIÁM SÁT
                  </div>
                  <h3 className={cn("text-lg sm:text-xl font-medium mt-0.5 group-hover:text-[#8b5cf6] transition-colors", isDark ? "text-white" : "text-[#111111]")}>
                    Phòng Họp Multi-Agent & Giám Sát CAIO
                  </h3>
                  <div className="text-[11px] sm:text-[12px] text-purple-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Không gian AI Rooms
                  </div>
                </div>
              </div>
              <p className={cn("text-[13px] sm:text-[14px] leading-relaxed mb-4", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                Không gian làm việc chung (AI Rooms) nơi các RAI cùng trao đổi, phản biện và hợp tác giải quyết một bài toán hóc búa của ban giám đốc.
              </p>
              <div className="text-[12px] text-[#8b5cf6] flex items-center gap-1.5 font-medium pt-3 border-t border-hairline/20">
                <Check className="w-4 h-4" /> Đưa ra nguồn sự thật duy nhất (Single Source of Truth)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: BẢNG GIÁ & ĐĂNG KÝ (PRICING) */}
      <section
        id="bang-gia"
        className={cn(
          "py-24 border-t transition-colors",
          isDark ? "bg-[#000000] border-[#242424]/60" : "bg-[#ffffff] border-[#e2e8f0]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[750px] mx-auto mb-16">
            <div className="text-[12px] font-medium text-[#0099ff] tracking-widest uppercase mb-3">
              Minh bạch • Không rủi ro
            </div>
            <h2 className={cn("text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight mb-5", isDark ? "text-white" : "text-[#111111]")}>
              Bắt Đầu Với Chi Phí Chưa Bằng Một Bữa Trưa
            </h2>
            <p className={cn("text-base leading-relaxed", isDark ? "text-[#999999]" : "text-[#4b5563]")}>
              Mô hình BYOK (Bring Your Own Key) giúp bạn nắm 100% quyền kiểm soát chi phí API trực tiếp với nhà cung cấp. Không phụ phí ẩn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={cn(
                  "relative flex flex-col justify-between p-7 rounded-[15px] transition-all",
                  plan.popular
                    ? isDark
                      ? "bg-[#080808] border-2 border-[#0099ff] shadow-xl shadow-[#0099ff]/5"
                      : "bg-[#ffffff] border-2 border-[#0099ff] shadow-xl shadow-[#0099ff]/10"
                    : isDark
                    ? "bg-[#080808] border border-[#242424] hover:border-[#333333]"
                    : "bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#cbd5e1] shadow-xs"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    plan.popular ? "bg-[#0099ff] text-white" : isDark ? "bg-white text-black" : "bg-black text-white"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className={cn("text-base font-medium mb-2", isDark ? "text-white" : "text-[#111111]")}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={cn("text-2xl sm:text-3xl font-medium tracking-tight", isDark ? "text-white" : "text-[#111111]")}>
                      {plan.priceDisplay}
                    </span>
                  </div>
                  <div className={cn("text-[12px] mb-5", isDark ? "text-[#666666]" : "text-[#64748b]")}>{plan.periodDisplay}</div>

                  <p className={cn("text-[13px] leading-relaxed mb-6 min-h-[55px]", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
                    {plan.description}
                  </p>

                  <div className={cn("space-y-3 mb-8 pt-6 border-t", isDark ? "border-[#242424]" : "border-[#e2e8f0]")}>
                    {plan.features.map((f, i) => (
                      <div key={i} className={cn("flex items-start gap-2.5 text-[12px]", isDark ? "text-[#cccccc]" : "text-[#334155]")}>
                        <Check className="w-3.5 h-3.5 text-[#0099ff] mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(plan)}
                  className={cn(
                    "w-full py-3 rounded-full text-[13px] font-medium transition-all cursor-pointer",
                    plan.popular
                      ? "bg-[#0099ff] text-white hover:bg-[#0088ee]"
                      : plan.tier === "trial"
                      ? isDark
                        ? "bg-white text-black hover:bg-[#e6e6e6]"
                        : "bg-black text-white hover:bg-[#222222]"
                      : isDark
                      ? "border border-white/20 text-white hover:border-[#0099ff] hover:text-[#0099ff]"
                      : "border border-black/20 text-[#111111] hover:border-[#0099ff] hover:text-[#0099ff]"
                  )}
                >
                  {plan.tier === "trial" ? "Bắt đầu dùng thử ngay" : "Chọn gói này"}
                </button>
              </div>
            ))}
          </div>

          {/* Cam kết hoàn vốn 90 ngày của Dan Kennedy kết hợp cùng Đội ngũ Mascot */}
          <div
            className={cn(
              "mt-16 p-8 sm:p-12 rounded-[20px] border max-w-[900px] mx-auto text-center transition-all relative overflow-hidden",
              isDark ? "bg-[#0b0b0b] border-[#242424]" : "bg-[#f8fafc] border-[#e2e8f0] shadow-sm"
            )}
          >
            {/* Mascot Team Overlapping Avatar Cluster (Mausbot.com Style) */}
            <div className="flex items-center justify-center -space-x-3 mb-5">
              {AI_TEAM_MASCOTS.slice(0, 5).map((bot, i) => (
                <div
                  key={bot.id}
                  className="relative size-12 sm:size-14 rounded-full overflow-hidden border-2 border-white dark:border-[#111111] shadow-md transition-transform hover:scale-110 duration-200"
                  style={{ zIndex: 10 - i }}
                >
                  <img
                    src={bot.avatar}
                    alt={bot.name}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 text-[#0099ff] text-[13px] font-medium uppercase tracking-wider mb-3">
              <Shield className="w-4 h-4" /> Cam kết không rủi ro
            </div>
            <h3 className={cn("text-xl sm:text-2xl font-medium mb-3", isDark ? "text-white" : "text-[#111111]")}>
              Bảo Chứng Hoàn Vốn 90 Ngày (Dan Kennedy Style)
            </h3>
            <p className={cn("text-[14px] leading-relaxed max-w-[750px] mx-auto", isDark ? "text-[#8c8c8c]" : "text-[#64748b]")}>
              Nếu trong vòng 90 ngày kể từ khi triển khai RAI² First OS theo đúng quy trình chuẩn hóa, doanh nghiệp của bạn không tiết kiệm được tối thiểu 30 giờ làm việc vô nghĩa hoặc không nhìn thấy sự gia tăng rõ rệt về hiệu suất P&L, chúng tôi sẽ hoàn trả 100% chi phí đăng ký nền tảng. Không đôi co. Không thủ tục phiền hà.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOOTER - Minimalist Framer Aesthetic & Mobile-Optimized */}
      <footer
        className={cn(
          "py-10 sm:py-14 border-t transition-colors",
          isDark ? "bg-[#000000] border-[#242424]/60" : "bg-[#f1f5f9] border-[#e2e8f0]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={isDark ? "/assets/rai-core-white.png?v=6" : "/assets/rai-core-black.png?v=6"}
              alt="RAI²"
              className="h-5 sm:h-6 md:h-7 w-auto object-contain opacity-90"
            />
          </div>

          {/* Links: Clean wrapped flex on mobile with comfortable touch targets */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] font-medium">
            <button
              onClick={() => scrollTo("triet-ly")}
              className={cn(
                "py-1 px-1.5 transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-white" : "text-[#64748b] hover:text-black"
              )}
            >
              Triết lý
            </button>
            <button
              onClick={() => scrollTo("doi-ngu-rai")}
              className={cn(
                "py-1 px-1.5 transition-colors cursor-pointer flex items-center gap-1.5",
                isDark ? "text-[#8c8c8c] hover:text-white" : "text-[#64748b] hover:text-black"
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Nhân sự số
            </button>
            <button
              onClick={() => scrollTo("tinh-nang")}
              className={cn(
                "py-1 px-1.5 transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-white" : "text-[#64748b] hover:text-black"
              )}
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollTo("bang-gia")}
              className={cn(
                "py-1 px-1.5 transition-colors cursor-pointer",
                isDark ? "text-[#8c8c8c] hover:text-white" : "text-[#64748b] hover:text-black"
              )}
            >
              Bảng giá
            </button>
            {currentUser ? (
              <a
                href="/app"
                className="py-1 px-1.5 text-[#0099ff] hover:underline transition-colors cursor-pointer"
              >
                Vào Workspace
              </a>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className={cn(
                  "py-1 px-1.5 transition-colors cursor-pointer",
                  isDark ? "text-[#8c8c8c] hover:text-white" : "text-[#64748b] hover:text-black"
                )}
              >
                Đăng nhập
              </button>
            )}
          </div>

          {/* Copyright */}
          <div
            className={cn(
              "text-[12px] text-center",
              isDark ? "text-[#666666]" : "text-[#94a3b8]"
            )}
          >
            © {new Date().getFullYear()} RAI² • All rights reserved.
          </div>
        </div>
      </footer>

      {/* 8. MODAL THANH TOÁN SEPAY & DÙNG THỬ */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-[480px] bg-[#111111] border border-[#242424] rounded-[20px] p-6 sm:p-8 shadow-2xl">
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-5 right-5 text-[#8c8c8c] hover:text-white transition-colors p-1 cursor-pointer"
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
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleInstantAccess(email, "trial");
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

                  {authError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={activating || activationSuccess}
                    className="w-full py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[14px] font-medium hover:bg-[#e6e6e6] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {activating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Đang khởi tạo không gian làm việc...
                      </>
                    ) : activationSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Khởi tạo thành công! Đang chuyển hướng...
                      </>
                    ) : (
                      "Kích hoạt tài khoản dùng thử ngay ->"
                    )}
                  </button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#242424]"></div></div>
                  <span className="relative bg-[#111111] px-3 text-[11px] uppercase tracking-wider text-[#666666]">HOẶC DÙNG NHANH</span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await handleInstantAccess(`guest_${Math.floor(1000 + Math.random() * 9000)}@rai2.si`, "trial");
                  }}
                  disabled={activating || activationSuccess}
                  className="w-full py-3 rounded-full border border-[#333333] bg-transparent text-white text-[13px] font-medium hover:bg-[#1a1a1a] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  🚀 Trải Nghiệm Nhanh Bản Cloud 1-Click (Không Cần Email)
                </button>

                <div className="mt-4 text-center text-[12px] text-[#666666]">
                  Cam kết bảo mật 100% • Khởi tạo tự động tức thì
                </div>
              </div>
            ) : paymentData ? (
              /* Modal Mã QR VietQR SePay */
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[11px] font-medium uppercase tracking-wide mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đơn Hàng #{paymentData.code}
                </div>
                <h3 className="text-xl font-medium text-white mb-1">Thanh Toán Kích Hoạt {selectedPlan.name}</h3>
                <p className="text-[12px] text-[#8c8c8c] mb-5">
                  Quét mã QR dưới đây bằng app Ngân hàng để kích hoạt tự động trong 30 giây:
                </p>

                <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-lg">
                  <img
                    src={paymentData.qrUrl}
                    alt="VietQR SePay"
                    className="w-[210px] h-[210px] object-contain mx-auto"
                  />
                </div>

                <div className="bg-[#0c0c0c] border border-[#242424] rounded-xl p-3.5 text-left text-[13px] space-y-2 mb-5">
                  <div className="flex justify-between items-center text-[#8c8c8c]">
                    <span>Số tiền:</span>
                    <span className="font-semibold text-white text-[15px]">
                      {paymentData.amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#8c8c8c]">
                    <span>Ngân hàng:</span>
                    <span className="font-medium text-white">{paymentData.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8c8c8c]">
                    <span>Số tài khoản:</span>
                    <span className="font-mono text-white flex items-center gap-1.5">
                      {paymentData.bankAccount}
                      <button
                        onClick={() => copyToClipboard(paymentData.bankAccount)}
                        className="text-[#8c8c8c] hover:text-white p-0.5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#8c8c8c]">
                    <span>Nội dung CK:</span>
                    <span className="font-mono text-[#0099ff] font-bold flex items-center gap-1.5">
                      {paymentData.transferContent}
                      <button
                        onClick={() => copyToClipboard(paymentData.transferContent)}
                        className="text-[#0099ff] hover:text-white p-0.5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                {copied && (
                  <div className="text-[12px] text-green-400 mb-2">Đã sao chép vào bộ nhớ tạm!</div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      await handleInstantAccess(email || "customer@rai2.si", selectedPlan.tier);
                    }}
                    disabled={activating || activationSuccess}
                    className="w-full py-3 rounded-full bg-[#0099ff] text-white text-[13px] font-medium hover:bg-[#0088ee] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {activating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang kết nối & kích hoạt...
                      </>
                    ) : activationSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Kích hoạt thành công! Đang vào hệ thống...
                      </>
                    ) : (
                      "Tôi đã chuyển khoản xong -> Vào hệ thống ngay"
                    )}
                  </button>
                  <p className="text-[11px] text-[#666666]">
                    Hệ thống sẽ tự động quét Webhook SePay và kích hoạt ngay sau khi tiền vào tài khoản.
                  </p>
                </div>
              </div>
            ) : (
              /* Bước nhập email trước khi sinh mã QR */
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Đăng Ký Gói {selectedPlan.name}</h3>
                <p className="text-[13px] text-[#8c8c8c] mb-5">
                  Nhập email để nhận hóa đơn và thông tin tài khoản đăng nhập:
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#cccccc] mb-1.5">
                      Email của bạn
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
                    onClick={() => handleCheckout(selectedPlan)}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[14px] font-medium hover:bg-[#e6e6e6] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Đang tạo mã QR thanh toán...
                      </>
                    ) : (
                      "Tiếp tục thanh toán VietQR ->"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. MODAL ĐĂNG NHẬP NHANH */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-[420px] bg-[#111111] border border-[#242424] rounded-[20px] p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setAuthError(null);
              }}
              className="absolute top-5 right-5 text-[#8c8c8c] hover:text-white transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0099ff]/10 text-[#0099ff] text-[11px] font-medium uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Đăng nhập hệ thống
            </div>
            <h3 className="text-2xl font-medium text-white mb-2">Không Gian Làm Việc RAI²</h3>
            <p className="text-[13px] text-[#8c8c8c] mb-6">
              Nhập email doanh nghiệp của bạn để truy cập ngay vào không gian làm việc thực tế.
            </p>
            {authError && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                {authError}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoggingIn(true);
                setAuthError(null);
                await handleInstantAccess(loginEmail, "starter");
                setLoggingIn(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[12px] font-medium text-[#cccccc] mb-1.5">
                  Email của bạn
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ceo@company.com"
                  className="w-full px-4 py-3 rounded-[10px] bg-[#000000] border border-[#242424] text-white text-[14px] focus:outline-none focus:border-[#0099ff] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loggingIn || activating}
                className="w-full py-3.5 rounded-full bg-[#ffffff] text-[#000000] text-[14px] font-medium hover:bg-[#e6e6e6] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingIn || activating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Đang xác thực & mở ứng dụng...
                  </>
                ) : (
                  "Đăng nhập & Vào làm việc ngay ->"
                )}
              </button>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#242424]"></div></div>
              <span className="relative bg-[#111111] px-3 text-[11px] uppercase tracking-wider text-[#666666]">HOẶC</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                setLoggingIn(true);
                await handleInstantAccess(`guest_${Math.floor(1000 + Math.random() * 9000)}@rai2.si`, "trial");
                setLoggingIn(false);
              }}
              disabled={loggingIn || activating}
              className="w-full py-3 rounded-full border border-[#333333] bg-transparent text-white text-[13px] font-medium hover:bg-[#1a1a1a] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🚀 Trải Nghiệm Nhanh Bản Cloud 1-Click
            </button>

            <div className="mt-4 pt-3 border-t border-[#222222] text-center">
              <a
                href="/pair"
                className="text-[12px] text-[#888888] hover:text-[#0099ff] transition-colors"
              >
                🔐 Bạn là Quản trị viên (Admin)? Đăng nhập bằng mã Master Code →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
