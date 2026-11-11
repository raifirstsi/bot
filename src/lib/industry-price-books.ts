export interface IndustryPriceBook {
  id: string;
  name: string;
  industry: string;
  description: string;
  defaultNetMargin: number; // e.g. 0.38
  paymentTerms: string[];
  unitPrices: Array<{
    item: string;
    unit: string;
    costPrice: number; // Giá vốn
    sellingPrice: number; // Giá bán
    notes?: string;
  }>;
  commonObjections: Array<{
    objection: string;
    suggestedReframing: string;
  }>;
  sampleContractMilestones: Array<{
    milestone: string;
    percentage: number;
    trigger: string;
  }>;
}

export const INDUSTRY_PRICE_BOOKS: IndustryPriceBook[] = [
  {
    id: "interior_fitout",
    name: "Xưởng Nội Thất & Thi Công Nhà Phố/Chung Cư",
    industry: "Nội Thất & Kiến Trúc",
    description: "Bộ đơn giá mẫu và định mức hao hụt cho xưởng mộc gỗ công nghiệp MDF/MFC An Cường và thi công trọn gói.",
    defaultNetMargin: 0.38,
    paymentTerms: [
      "Đợt 1: Tạm ứng 40% ngay khi ký hợp đồng và duyệt bản vẽ 3D/2D sản xuất.",
      "Đợt 2: Thanh toán 45% khi toàn bộ đồ gỗ xuất xưởng tập kết tại công trình.",
      "Đợt 3: Quyết toán 15% còn lại trong vòng 24h sau khi ký Biên bản nghiệm thu bàn giao."
    ],
    unitPrices: [
      { item: "Tủ bếp trên thùng MDF chống ẩm cánh phủ Acrylic bóng gương", unit: "md", costPrice: 1950000, sellingPrice: 3200000, notes: "Bao gồm bản lề giảm chấn tiêu chuẩn" },
      { item: "Tủ bếp dưới thùng MDF chống ẩm cánh Acrylic", unit: "md", costPrice: 2200000, sellingPrice: 3600000, notes: "Khung thùng chống ẩm An Cường" },
      { item: "Tủ áo kịch trần cánh lùa MDF Melamine lõi xanh", unit: "m2", costPrice: 1350000, sellingPrice: 2300000, notes: "Ray trượt bi 3 tầng chống kẹt" },
      { item: "Giường ngủ bọc nệm đầu giường 1m8x2m ngăn kéo", unit: "bộ", costPrice: 4200000, sellingPrice: 7500000, notes: "Gỗ MDF chống ẩm phủ Melamine" },
      { item: "Vách nan trang trí gỗ kết hợp tấm than tre", unit: "m2", costPrice: 650000, sellingPrice: 1250000 }
    ],
    commonObjections: [
      {
        objection: "Bên xưởng kia báo giá rẻ hơn 15-20 triệu cho cùng căn này",
        suggestedReframing: "Dạ em hiểu anh đang cân nhắc chi phí. Cùng là gỗ MDF nhưng xưởng em dùng 100% ván An Cường chính hãng có mã vạch chống ẩm mốc, phụ kiện ray trượt inox không gỉ sau 2 năm. Bên rẻ hơn thường dùng ván trôi nổi ép keo rẻ tiền nồng mùi formaldehyde cay mắt. Bên em bảo hành 3 năm thay mới tận nhà."
      }
    ],
    sampleContractMilestones: [
      { milestone: "Ký hợp đồng & chốt 3D", percentage: 40, trigger: "Ký hợp đồng" },
      { milestone: "Tập kết hàng tại công trình", percentage: 45, trigger: "Xuất xưởng" },
      { milestone: "Nghiệm thu bàn giao", percentage: 15, trigger: "Biên bản nghiệm thu" }
    ]
  },
  {
    id: "hvac_aluminum",
    name: "Cơ Khí, Nhôm Kính Xingfa & Biển Quảng Cáo",
    industry: "Cơ Khí & Nhôm Kính",
    description: "Bảng định mức gia công cửa nhôm hệ Xingfa nhập khẩu, kính cường lực và biển quảng cáo ngoài trời.",
    defaultNetMargin: 0.35,
    paymentTerms: [
      "Đợt 1: Cọc 50% ngay khi đo đạc thực tế và đặt hàng phôi nhôm/kính.",
      "Đợt 2: Thanh toán 40% khi lắp đặt xong toàn bộ khung và phụ kiện.",
      "Đợt 3: Thanh toán 10% sau khi bơm keo hoàn thiện và vệ sinh bàn giao."
    ],
    unitPrices: [
      { item: "Cửa đi mở quay 4 cánh nhôm Xingfa Quảng Đông tem đỏ hệ 55 (dày 2.0mm)", unit: "m2", costPrice: 1550000, sellingPrice: 2450000, notes: "Kính dán an toàn 8.38mm hoặc cường lực 8mm" },
      { item: "Cửa sổ mở hất nhôm Xingfa hệ 55 phụ kiện Kinlong", unit: "m2", costPrice: 1350000, sellingPrice: 2150000 },
      { item: "Vách kính cường lực 10mm nẹp nhôm sập", unit: "m2", costPrice: 480000, sellingPrice: 850000 },
      { item: "Biển hiệu Alu chữ nổi mica cắm LED phát sáng", unit: "m2", costPrice: 750000, sellingPrice: 1400000 }
    ],
    commonObjections: [
      {
        objection: "Sao nhôm Xingfa ở đâu cũng có mà giá bên em chênh lệch?",
        suggestedReframing: "Dạ thị trường hiện tại có đến 60% là Xingfa nhái tem dán mỏng chỉ 1.2-1.4mm và phụ kiện Kinlong loại 2 dùng 6 tháng là xệ cửa rỉ sét. Bên em cam kết đền tiền 200% nếu phát hiện hàng nhái, có máy quét mã QR tem đỏ chính hãng."
      }
    ],
    sampleContractMilestones: [
      { milestone: "Đặt cọc vật tư", percentage: 50, trigger: "Đo đạc & đặt phôi" },
      { milestone: "Lắp đặt khung hoàn thiện", percentage: 40, trigger: "Lắp khung kính" },
      { milestone: "Bơm keo & bàn giao", percentage: 10, trigger: "Vệ sinh bàn giao" }
    ]
  },
  {
    id: "b2b_agency",
    name: "Đại Lý Dịch Vụ Doanh Nghiệp, Marketing & Tư Vấn",
    industry: "Dịch Vụ Doanh Nghiệp (B2B)",
    description: "Gói retainer dịch vụ hàng tháng, cam kết KPI chuyển đổi và bản quyền tài sản sáng tạo.",
    defaultNetMargin: 0.45,
    paymentTerms: [
      "Thanh toán 100% phí dịch vụ vào đầu mỗi chu kỳ 30 ngày (Retainer trả trước).",
      "Thưởng hiệu suất KPI (nếu có) đối soát và thanh toán vào ngày 05 tháng kế tiếp."
    ],
    unitPrices: [
      { item: "Gói Quản Trị Fanpage & Xây Kênh TikTok Doanh Nghiệp (15 video/tháng)", unit: "tháng", costPrice: 5500000, sellingPrice: 12000000 },
      { item: "Thiết kế bộ nhận diện thương hiệu chuẩn nhận diện (Logo + Brand Guidelines)", unit: "gói", costPrice: 4000000, sellingPrice: 15000000 },
      { item: "Dịch vụ Tối Ưu Tỷ Lệ Chốt Sale & Đào Tạo Kịch Bản Zalo 1-1", unit: "dự án", costPrice: 6000000, sellingPrice: 20000000 }
    ],
    commonObjections: [
      {
        objection: "Bên em có cam kết doanh số bán ra cho anh không?",
        suggestedReframing: "Dạ bên em cam kết 100% về số lượng Lead chất lượng đúng chân dung khách hàng mục tiêu và bàn giao kịch bản chốt sale bám sát. Doanh số còn phụ thuộc vào khâu tư vấn và giá cả thực tế của anh, nhưng bên em đồng hành tối ưu cùng đội ngũ cho đến khi ra đơn."
      }
    ],
    sampleContractMilestones: [
      { milestone: "Phí dịch vụ đầu tháng", percentage: 100, trigger: "Bắt đầu chu kỳ" }
    ]
  },
  {
    id: "retail_distribution",
    name: "Bán Lẻ, Phân Phối Tiêu Dùng & Dịch Vụ Kỹ Thuật",
    industry: "Thương Mại & Bán Lẻ",
    description: "Quản lý giá sỉ theo số lượng, chiết khấu đại lý và điều khoản vận chuyển, thanh toán COD/VietQR.",
    defaultNetMargin: 0.35,
    paymentTerms: [
      "Đơn hàng giao tỉnh: Chuyển khoản 100% trước khi xuất kho.",
      "Đơn hàng nội thành: Thanh toán chuyển khoản hoặc tiền mặt khi nhận hàng (COD)."
    ],
    unitPrices: [
      { item: "Bộ lọc nước công nghiệp RO bán tự động 50L/h", unit: "máy", costPrice: 4800000, sellingPrice: 8500000 },
      { item: "Gói bảo dưỡng, thay lõi lọc định kỳ 12 tháng tận nơi", unit: "năm", costPrice: 800000, sellingPrice: 1800000 }
    ],
    commonObjections: [
      {
        objection: "Mua số lượng 5 máy có chiết khấu thêm được không?",
        suggestedReframing: "Dạ với đơn 5 máy bên em tặng thêm anh 01 năm bảo dưỡng thay lõi miễn phí trị giá 1.8 triệu/máy và miễn phí toàn bộ cước vận chuyển, giá máy bên em giữ nguyên để bảo hành chính hãng chuẩn nhất ạ."
      }
    ],
    sampleContractMilestones: [
      { milestone: "Thanh toán giao hàng", percentage: 100, trigger: "Xuất kho / Giao hàng" }
    ]
  }
];

export function getPriceBookById(id: string): IndustryPriceBook | undefined {
  return INDUSTRY_PRICE_BOOKS.find((p) => p.id === id);
}

export function formatPriceBookAsPromptRules(book: IndustryPriceBook): string {
  const lines: string[] = [
    `# BẢNG GIÁ & QUY TẮC KINH DOANH CHUẨN (${book.name.toUpperCase()})`,
    `- Ngành nghề: ${book.industry}`,
    `- Biên lợi nhuận ròng tối thiểu cam kết: ${(book.defaultNetMargin * 100).toFixed(0)}%`,
    "",
    "## BẢNG GIÁ DỊCH VỤ / SẢN PHẨM THAM CHIẾU:",
  ];

  for (const item of book.unitPrices) {
    lines.push(`- ${item.item}: Giá bán tham chiếu ${item.sellingPrice.toLocaleString("vi-VN")} đ/${item.unit} (Giá vốn: ${item.costPrice.toLocaleString("vi-VN")} đ) ${item.notes ? `[${item.notes}]` : ""}`);
  }

  lines.push("", "## QUY TRÌNH THANH TOÁN TIÊU CHUẨN:");
  for (const term of book.paymentTerms) {
    lines.push(`- ${term}`);
  }

  lines.push("", "## KỊCH BẢN BẺ TỪ CHỐI GIÁ CAO:");
  for (const obj of book.commonObjections) {
    lines.push(`- Lời từ chối: "${obj.objection}"`);
    lines.push(`  -> Phản hồi chuẩn: "${obj.suggestedReframing}"`);
  }

  return lines.join("\n");
}
