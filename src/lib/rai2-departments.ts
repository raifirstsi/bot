export interface RaiAgentDefinition {
  key: string;
  name: string;
  title: string;
  zone: number;
  departmentName: string;
  departmentCode: string;
  tagline: string;
  description: string;
  painPoint: string;
  prebakedDna: string[];
  kpiCommitment: string;
  color: string;
  recommendedConstraint?: string;
}

export interface RaiDepartment {
  zone: number;
  code: string;
  name: string;
  englishZone: string;
  description: string;
  iconName: string;
  agents: RaiAgentDefinition[];
}

export const RAI2_DEPARTMENTS: RaiDepartment[] = [
  {
    zone: 2,
    code: "ZONE_2_MARKETING",
    name: "Phòng Marketing & Thu Hút Khách Hàng",
    englishZone: "Zone 2: Marketing & Lead Gen",
    description: "Tiếp nhận lead tức thì trong 30 giây và sản xuất nội dung bán hàng thực chiến đều đặn.",
    iconName: "Megaphone",
    agents: [
      {
        key: "rai-lead",
        name: "RAI Lead",
        title: "Chuyên Viên Trực Lead & Tư Vấn 24/7",
        zone: 2,
        departmentName: "Phòng Marketing & Thu Hút",
        departmentCode: "ZONE_2_MARKETING",
        tagline: "Phản hồi lead trong 30 giây, phân loại nhu cầu và chốt lịch tư vấn",
        description: "Túc trực 24/7/365 trên Zalo/Fanpage, loại bỏ 100% tình trạng mất khách do rep chậm.",
        painPoint: "Khách nhắn tin lúc đêm muộn hoặc lúc bận họp, 1-2 tiếng sau mới rep thì khách đã mua bên khác.",
        prebakedDna: [
          "Phản hồi siêu tốc trong 30 giây với giọng văn lễ phép, thân mật.",
          "Bộ 3 câu hỏi vàng phân loại nhu cầu, ngân sách và thời hạn.",
          "Chốt số điện thoại và tự động xếp lịch hẹn khảo sát thực tế."
        ],
        kpiCommitment: "100% tin nhắn được phản hồi dưới 30s; tăng 35-50% tỷ lệ chốt lịch hẹn tư vấn.",
        color: "blue",
        recommendedConstraint: "Kích hoạt khi tỷ lệ bỏ lỡ tin nhắn khách hàng > 30%."
      },
      {
        key: "rai-copy",
        name: "RAI Copy",
        title: "Chuyên Viên Sáng Tạo Nội Dung Bán Hàng",
        zone: 2,
        departmentName: "Phòng Marketing & Thu Hút",
        departmentCode: "ZONE_2_MARKETING",
        tagline: "Sản xuất bài viết PAS và kịch bản video ngắn 60s từ ca thi công thực tế",
        description: "Biến các hình ảnh và công trình thực tế của xưởng thành bài viết bán hàng hấp dẫn.",
        painPoint: "Chủ không có thời gian viết bài; Fanpage và Zalo OA bỏ hoang hàng tháng, không có bài mới.",
        prebakedDna: [
          "Kho 10 mẫu Hook Direct-Response kinh điển chuẩn RAI² FIRST OS.",
          "Viết bài thực chiến theo công thức PAS (Problem - Agitate - Solution).",
          "Soạn kịch bản video ngắn 60 giây giữ chân người xem trong 3 giây đầu."
        ],
        kpiCommitment: "Sản xuất đều đặn 15-20 bài viết/kịch bản chất lượng mỗi tháng.",
        color: "purple"
      }
    ]
  },
  {
    zone: 3,
    code: "ZONE_3_SALES",
    name: "Phòng Kinh Doanh & Chốt Hợp Đồng",
    englishZone: "Zone 3: Sales & Conversion",
    description: "Soạn báo giá dự toán 7 phần trong 3 phút và bám đuổi deal không để khách nguội lạnh.",
    iconName: "TrendingUp",
    agents: [
      {
        key: "rai-quote",
        name: "RAI Quote",
        title: "Chuyên Viên Báo Giá Dự Toán & Soạn Thảo Đề Xuất",
        zone: 3,
        departmentName: "Phòng Kinh Doanh & Bán Hàng",
        departmentCode: "ZONE_3_SALES",
        tagline: "Tính dự toán trong 3 phút, xuất Bản Đề Xuất 7 Phần bảo vệ lãi ròng >= 35%",
        description: "Chấm dứt việc hẹn khách 3 ngày gửi báo giá; nâng tầm từ bảng Excel sơ sài lên bản đề xuất thuyết phục.",
        painPoint: "Khách hỏi giá phải hẹn tối về tính; bảng giá gửi trần trụi khiến khách so đo từng đồng hoặc ép giá.",
        prebakedDna: [
          "Bản Đề Xuất 7 Phần: Chi phí trì hoãn, Căn nguyên cốt lõi, Ranh giới phạm vi, Bảng giá 3 bậc neo tâm lý, Cam kết xóa rủi ro, Mốc nghiệm thu, CTA 24h.",
          "Cầu dao bảo vệ biên lợi nhuận ròng >= 35%."
        ],
        kpiCommitment: "Rút ngắn thời gian ra báo giá từ 3 ngày xuống 3 phút; tăng 20-30% tỷ lệ thắng thầu.",
        color: "green",
        recommendedConstraint: "Kích hoạt khi khâu gửi báo giá bị tồn đọng và tỷ lệ chốt thấp."
      },
      {
        key: "rai-close",
        name: "RAI Close",
        title: "Chuyên Viên Đàm Phán & Phá Rào Cản Chốt Sale",
        zone: 3,
        departmentName: "Phòng Kinh Doanh & Bán Hàng",
        departmentCode: "ZONE_3_SALES",
        tagline: "Bám đuổi deal 3 nhịp tâm lý và sở hữu 5 kịch bản bẻ từ chối giá đắt",
        description: "Theo sát các deal đã gửi báo giá, kéo khách hàng quay trở lại chốt cọc hợp đồng.",
        painPoint: "Gửi báo giá xong là im thin thít; ngại gọi điện bám đuổi vì sợ làm phiền khiến khách biến mất.",
        prebakedDna: [
          "Chu trình bám đuổi 3 nhịp: 24h (hỏi kỹ thuật), 72h (gửi case study), 7 ngày (cảnh báo kín lịch xưởng).",
          "5 Playbook xử lý từ chối: Giá cao, Để suy nghĩ, Kẹt tiền, Hài lòng bên cũ, Hỏi ý kiến người khác."
        ],
        kpiCommitment: "Cứu vãn 15-25% số hợp đồng tưởng chừng đã mất sau khi gửi báo giá.",
        color: "teal"
      }
    ]
  },
  {
    zone: 4,
    code: "ZONE_4_OPERATIONS",
    name: "Phòng Thực Thi & Giám Sát Vận Hành",
    englishZone: "Zone 4: Delivery & Operations",
    description: "Bóc tách việc cho thợ, giao ban 8h sáng và kiểm soát chất lượng bàn giao.",
    iconName: "Wrench",
    agents: [
      {
        key: "rai-task",
        name: "RAI Task",
        title: "Điều Phối Viên Tiến Độ & Giám Sát Quy Trình",
        zone: 4,
        departmentName: "Phòng Vận Hành & Thi Công",
        departmentCode: "ZONE_4_OPERATIONS",
        tagline: "Bóc tách hợp đồng thành Checklist, giao ban 8h sáng & đối soát 17h30 chiều",
        description: "Thay người chủ làm bảo mẫu nhắc việc; đảm bảo thợ làm đúng quy trình và đúng tiến độ cam kết.",
        painPoint: "Sáng nào chủ cũng phải họp nhắc việc; thợ quên việc, làm sai quy trình, công trình trễ tiến độ.",
        prebakedDna: [
          "Tự động bóc tách hợp đồng thành danh sách công việc chi tiết cho từng thợ.",
          "8h00 sáng gửi tin nhắn giao việc qua Zalo; 17h30 đối soát báo cáo hoàn thành.",
          "Báo động đỏ cho Giám đốc nếu có hạng mục trễ quá 24h."
        ],
        kpiCommitment: "Giải phóng 10-15 giờ/tuần họp giao ban và nhắc việc cho người chủ.",
        color: "orange"
      },
      {
        key: "rai-qc",
        name: "RAI QC",
        title: "Kiểm Soát Viên Chất Lượng Bàn Giao & Nghiệm Thu",
        zone: 4,
        departmentName: "Phòng Vận Hành & Thi Công",
        departmentCode: "ZONE_4_OPERATIONS",
        tagline: "Kiểm định chất lượng xuất xưởng, lập Biên bản nghiệm thu điện tử gửi khách",
        description: "Triệt tiêu lỗi vặt khi bàn giao, thu hồi tiền đợt cuối nhanh chóng nhờ biên bản nghiệm thu chuẩn.",
        painPoint: "Bàn giao công trình bị lỗi vặt, khách phàn nàn, thanh toán đợt cuối bị giữ lại vô thời hạn.",
        prebakedDna: [
          "Đối chiếu 100% hình ảnh thực tế tại hiện trường với cam kết trong hợp đồng.",
          "Tự động tạo Biên bản nghiệm thu điện tử chuẩn pháp lý gửi khách xác nhận qua Zalo."
        ],
        kpiCommitment: "Giảm 70% lỗi vặt bàn giao; rút ngắn thời gian ký nghiệm thu từ 10 ngày xuống 24h.",
        color: "cyan"
      }
    ]
  },
  {
    zone: 5,
    code: "ZONE_5_RETENTION",
    name: "Phòng Chăm Sóc Khách Hàng & Giữ Chân",
    englishZone: "Zone 5: Retention & Success",
    description: "Khảo sát hài lòng sau bàn giao, kích hoạt lời giới thiệu và xoa dịu khiếu nại trong 5 phút.",
    iconName: "HeartHandshake",
    agents: [
      {
        key: "rai-care",
        name: "RAI Care",
        title: "Chuyên Viên Chăm Sóc Khách Cũ & Tái Mua",
        zone: 5,
        departmentName: "Phòng Chăm Sóc Khách Hàng",
        departmentCode: "ZONE_5_RETENTION",
        tagline: "Khảo sát hài lòng sau 3 ngày, chúc mừng sinh nhật & kích hoạt lời giới thiệu",
        description: "Khai thác mỏ vàng doanh thu chi phí 0 đồng từ tệp khách hàng cũ đã từng sử dụng dịch vụ.",
        painPoint: "Bán xong là xong! Khách mua 1 lần rồi biến mất; không ai hỏi thăm, bỏ quên nguồn khách tái mua.",
        prebakedDna: [
          "Tự động gửi tin nhắn khảo sát độ hài lòng sau 3 ngày và 14 ngày kể từ khi bàn giao.",
          "Lịch chăm sóc tự động: Chúc mừng sinh nhật, kỷ niệm hợp tác, nhắc lịch bảo dưỡng.",
          "Kịch bản xin lời giới thiệu (Referral Playbook) kèm quà tặng tri ân."
        ],
        kpiCommitment: "Tăng 25-35% tỷ lệ khách quay lại mua tiếp; tạo dòng khách giới thiệu đều đặn.",
        color: "pink"
      },
      {
        key: "rai-rescue",
        name: "RAI Rescue",
        title: "Chuyên Viên Xử Lý Khiếu Nại & Xoa Dịu",
        zone: 5,
        departmentName: "Phòng Chăm Sóc Khách Hàng",
        departmentCode: "ZONE_5_RETENTION",
        tagline: "Cảm biến cảm xúc nhận diện giận dữ trong 5 phút, xoa dịu và cam kết khắc phục",
        description: "Ngăn chặn khủng hoảng truyền thông và bảo vệ an toàn 100% cho danh tiếng thương hiệu.",
        painPoint: "Khách bức xúc mắng vốn, nhân viên sợ hãi trốn tránh hoặc cãi tay đôi làm khách bóc phốt.",
        prebakedDna: [
          "Cảm biến cảm xúc bắt trọn dấu hiệu giận dữ trong tin nhắn trong 5 phút.",
          "Áp dụng kịch bản nhận trách nhiệm lịch thiệp, cam kết phương án khắc phục trong 12h, không bao biện."
        ],
        kpiCommitment: "Xoa dịu 90% khiếu nại trong vòng 2 giờ đầu tiên.",
        color: "coral"
      }
    ]
  },
  {
    zone: 6,
    code: "ZONE_6_FINANCE",
    name: "Phòng Tài Chính & Bảo Vệ Dòng Tiền",
    englishZone: "Zone 6: Finance & Cash Flow",
    description: "Nhắc nợ 3 cấp độ lịch thiệp kèm mã VietQR và kiểm soát biên lợi nhuận ròng P&L.",
    iconName: "Wallet",
    agents: [
      {
        key: "rai-cash",
        name: "RAI Cash",
        title: "Trợ Lý Thu Hồi Công Nợ Khéo Léo",
        zone: 6,
        departmentName: "Phòng Tài Chính & Kế Toán",
        departmentCode: "ZONE_6_FINANCE",
        tagline: "Nhắc nợ 3 cấp độ lịch thiệp kèm VietQR, giảm ngày nợ đọng từ 45 xuống 15 ngày",
        description: "Thu hồi tiền về tài khoản ngân hàng đúng hạn mà không làm rạn nứt mối quan hệ với khách.",
        painPoint: "Ngại mở miệng đòi tiền khách quen; doanh thu trên giấy cao nhưng tài khoản ngân hàng cạn tiền.",
        prebakedDna: [
          "Theo dõi hạn thanh toán từng đợt theo mốc nghiệm thu hợp đồng.",
          "Chu trình nhắc nợ 3 cấp độ: Nhắc đối soát trước 2 ngày, đúng hạn thanh toán, quá hạn 5 ngày.",
          "Gửi kèm bảng đối soát chi tiết và mã VietQR thanh toán 1-chạm."
        ],
        kpiCommitment: "Rút ngắn số ngày nợ đọng bình quân (DSO) từ 45 ngày xuống 15 ngày.",
        color: "yellow",
        recommendedConstraint: "Kích hoạt khi công nợ tồn đọng lớn và dòng tiền bị nghẽn."
      },
      {
        key: "rai-margin",
        name: "RAI Margin",
        title: "Kiểm Soát Viên Biên Lợi Nhuận & Dòng Tiền",
        zone: 6,
        departmentName: "Phòng Tài Chính & Kế Toán",
        departmentCode: "ZONE_6_FINANCE",
        tagline: "Kiểm soát biên lãi gộp từng đơn, gửi Báo cáo nhịp đập dòng tiền chiều Thứ Sáu",
        description: "Bảo vệ túi tiền của doanh nghiệp, chặn đứng hoàn toàn tình trạng làm nhiều nhưng cuối tháng lỗ vốn.",
        painPoint: "Doanh số thấy nhiều nhưng cuối tháng không thấy tiền đâu; chi phí lặt vặt đội lên không kiểm soát.",
        prebakedDna: [
          "Tự động tính toán và đối soát biên lợi nhuận gộp từng hợp đồng (cảnh báo nếu < 35%).",
          "Báo cáo nhịp đập dòng tiền 1 trang vào 17h00 chiều Thứ Sáu: Tiền vào, tiền ra, số dư an toàn."
        ],
        kpiCommitment: "100% đơn hàng xuất xưởng có lãi; chặn đứng thất thoát chi phí ngầm.",
        color: "silver"
      }
    ]
  },
  {
    zone: 7,
    code: "ZONE_7_HR",
    name: "Phòng Nhân Sự, Đào Tạo & Văn Hóa",
    englishZone: "Zone 7: People & HR",
    description: "Tuyển dụng sơ loại qua Zalo và gia sư ảo giải đáp quy trình SOP nội bộ 24/7.",
    iconName: "Users",
    agents: [
      {
        key: "rai-talent",
        name: "RAI Talent",
        title: "Chuyên Viên Tuyển Dụng & Sàng Lọc Ứng Viên",
        zone: 7,
        departmentName: "Phòng Nhân Sự & Đào Tạo",
        departmentCode: "ZONE_7_HR",
        tagline: "Viết JD Role Redesign, quét CV và gửi 3 câu hỏi tình huống sơ loại qua Zalo",
        description: "Rút ngắn thời gian tuyển dụng từ 30 ngày xuống 7 ngày, chọn Top 3 ứng viên sáng giá nhất cho chủ.",
        painPoint: "Đăng tin tuyển dụng mất cả tháng; đọc hàng trăm CV mỏi mắt; phỏng vấn thì ứng viên bùng kèo.",
        prebakedDna: [
          "Tạo JD chuẩn theo phương pháp Role Redesign tập trung vào kết quả đầu ra thực tế.",
          "Sơ loại tự động qua 3 câu hỏi trắc nghiệm/tình huống trên Zalo trước khi mời phỏng vấn."
        ],
        kpiCommitment: "Rút ngắn thời gian tuyển dụng từ 30 ngày xuống 7 ngày.",
        color: "chrome"
      },
      {
        key: "rai-coach",
        name: "RAI Coach",
        title: "Trợ Lý Đào Tạo & Phổ Biến SOP Nội Bộ",
        zone: 7,
        departmentName: "Phòng Nhân Sự & Đào Tạo",
        departmentCode: "ZONE_7_HR",
        tagline: "Gia sư ảo 24/7 cho nhân viên mới, số hóa bí quyết kinh doanh thành tài sản",
        description: "Rút ngắn thời gian hòa nhập của nhân viên mới từ 3 tuần xuống 3 ngày.",
        painPoint: "Có người mới chủ lại phải chỉ tay dạy việc từ đầu; nhân viên cũ giấu nghề, nghỉ mang hết bí quyết.",
        prebakedDna: [
          "Gia sư ảo 24/7 giải đáp mọi thắc mắc về biểu mẫu, quy trình, cách tính giá cho người mới.",
          "Tự động sát hạch trắc nghiệm sau 7 ngày thử việc để đánh giá mức độ hiểu việc."
        ],
        kpiCommitment: "Rút ngắn thời gian thử việc từ 3 tuần xuống 3 ngày; số hóa 100% bí quyết công ty.",
        color: "blue"
      }
    ]
  },
  {
    zone: 1,
    code: "ZONE_1_EXECUTIVE",
    name: "Văn Phòng Điều Hành & Chiến Lược Của Chủ",
    englishZone: "Zone 1: Executive Cockpit",
    description: "Định vị điểm nghẽn ràng buộc TOC và đo lường Thước đo vắng mặt 14 ngày của chủ.",
    iconName: "Compass",
    agents: [
      {
        key: "rai-strategy",
        name: "RAI Strategy",
        title: "Cố Vấn Chiến Lược & Định Vị Điểm Nghẽn TOC",
        zone: 1,
        departmentName: "Văn Phòng Điều Hành",
        departmentCode: "ZONE_1_EXECUTIVE",
        tagline: "Định kỳ quét 7 Vùng tìm Điểm Nghẽn Duy Nhất và tính toán Thước Đo Vắng Mặt 14 Ngày",
        description: "Giữ người chủ luôn tập trung 100% vào mắt xích sinh tiền nhiều nhất, chống căn bệnh phân tán.",
        painPoint: "Chủ quá bận rộn sự vụ, thử nghiệm lung tung, không biết tập trung giải quyết cái gì trước.",
        prebakedDna: [
          "Định kỳ 14 ngày quét 7 Vùng để phát hiện Điểm Nghẽn Ràng Buộc Duy Nhất (TOC).",
          "Tính toán Thước Đo Sẵn Sàng Vắng Mặt 14 Ngày (ARI Index) gửi báo cáo chiều Chủ Nhật."
        ],
        kpiCommitment: "Giữ người chủ tập trung 100% vào mắt xích sinh tiền; hỗ trợ giải phóng bản thân.",
        color: "purple",
        recommendedConstraint: "Kích hoạt để chẩn đoán toàn diện sức khỏe 7 Vùng của doanh nghiệp."
      }
    ]
  }
];

export function getAgentByKey(key: string): RaiAgentDefinition | undefined {
  for (const dept of RAI2_DEPARTMENTS) {
    const found = dept.agents.find((a) => a.key === key);
    if (found) return found;
  }
  return undefined;
}
