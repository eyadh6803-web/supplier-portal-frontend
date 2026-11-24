import {
  AuditLogEntry,
  PurchaseRequest,
  Supplier,
  SupplierOffer,
  User
} from '../types/procurement';

export const DEFAULT_PORTAL_PROFILES: User[] = [
  {
    id: 'USR-01',
    name: 'Belal Khalil',
    nameAr: 'بلال خليل',
    email: 'belal.khalil@procura.io',
    role: 'requester',
    department: 'Industrial Operations',
    departmentAr: 'العمليات الصناعية'
  },
  {
    id: 'USR-02',
    name: 'Mona Al-Mansoor',
    nameAr: 'منى المنصور',
    email: 'mona.officer@procura.io',
    role: 'officer',
    department: 'Strategic Procurement',
    departmentAr: 'المشتريات الاستراتيجية'
  },
  {
    id: 'USR-03',
    name: 'Youssef El-Masry',
    nameAr: 'يوسف المصري',
    email: 'youssef.vp@procura.io',
    role: 'manager',
    department: 'Executive Supply Chain',
    departmentAr: 'الإدارة التنفيذية لسلاسل الإمداد'
  },
  {
    id: 'USR-04',
    name: 'Tariq Hassan',
    nameAr: 'طارق حسن',
    email: 'quotes@techsupply.io',
    role: 'supplier',
    supplierId: 'SUP-01',
    companyName: 'TechSupply Ltd.',
    companyNameAr: 'شركة تك سبلاي المحدودة'
  }
];

export const REGISTERED_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-01',
    name: 'TechSupply Ltd.',
    nameAr: 'تك سبلاي المحدودة',
    category: 'Enterprise Hardware & Automation',
    categoryAr: 'الأجهزة المؤسسية والأتمتة',
    rating: 4.9,
    location: 'Dubai / Cairo'
  },
  {
    id: 'SUP-02',
    name: 'Global Traders',
    nameAr: 'التجار العالميون',
    category: 'Industrial Logistics & Components',
    categoryAr: 'المكونات الصناعية والخدمات اللوجستية',
    rating: 4.6,
    location: 'Riyadh / Amman'
  },
  {
    id: 'SUP-03',
    name: 'Prime Solutions',
    nameAr: 'برايم للحلول الهندسية',
    category: 'Precision Instrumentation & Systems',
    categoryAr: 'أنظمة القياس الدقيقة والحلول الهندسية',
    rating: 4.8,
    location: 'Abu Dhabi / Suez'
  }
];

export const INITIAL_REQUESTS: PurchaseRequest[] = [
  {
    id: 'PR-1048',
    title: 'Enterprise Engineering Workstations (Batch A)',
    titleAr: 'محطات عمل هندسية عالية الأداء (الدفعة الأولى)',
    description:
      '15 high-throughput CAD/BIM mobile workstations with 64GB ECC RAM, NVIDIA RTX Ada GPUs, and 3-year on-site enterprise support.',
    descriptionAr:
      'عدد 15 محطة عمل هندسية متنقلة بذاكرة 64 جيجابايت ومعالجات رسومية احترافية مع دعم فني في الموقع لمدة 3 سنوات.',
    quantity: 15,
    estimatedBudget: 28500,
    reason: 'Q4 R&D CAD simulation cluster expansion.',
    reasonAr: 'توسعة وحدة المحاكاة الهندسية والبحث والتطوير للربع الرابع.',
    deliveryDate: '2026-12-15',
    requesterId: 'USR-01',
    requesterName: 'Belal Khalil',
    requesterNameAr: 'بلال خليل',
    status: 'Compared',
    createdDate: '2026-11-10',
    invitedSupplierIds: ['SUP-01', 'SUP-02', 'SUP-03']
  },
  {
    id: 'PR-1047',
    title: 'Automated Warehouse LiDAR Scanners',
    titleAr: 'ماسحات LiDAR آلية للمستودعات الذكية',
    description:
      '8 industrial-grade 360° optical LiDAR guidance units for autonomous pallet conveyors.',
    descriptionAr:
      'عدد 8 وحدات توجيه ضوئي صناعية بزاوية 360 درجة لناقلات المنصات ذاتية الحركة.',
    quantity: 8,
    estimatedBudget: 42000,
    reason: 'Suez Logistics Hub Bay-4 automation upgrade.',
    reasonAr: 'تحديث أتمتة الرصيف الرابع في مركز السويس اللوجستي.',
    deliveryDate: '2026-12-22',
    requesterId: 'USR-01',
    requesterName: 'Belal Khalil',
    requesterNameAr: 'بلال خليل',
    status: 'PendingApproval',
    createdDate: '2026-11-08',
    invitedSupplierIds: ['SUP-01', 'SUP-02', 'SUP-03']
  },
  {
    id: 'PR-1049',
    title: 'Industrial PLC Control Cabinets',
    titleAr: 'لوحات تحكم صناعية مبرمجة PLC',
    description:
      '4 IP66-rated stainless steel PLC control enclosures with redundant power supplies.',
    descriptionAr:
      'عدد 4 خزائن تحكم صناعية مقاومة للعوامل الجوية بمعيار IP66 مع وحدات طاقة احتياطية.',
    quantity: 4,
    estimatedBudget: 34000,
    reason: 'Assembly Line 2 redundancy compliance.',
    reasonAr: 'تطبيق معايير الاعتمادية الاحتياطية لخط التجميع الثاني.',
    deliveryDate: '2027-01-10',
    requesterId: 'USR-01',
    requesterName: 'Belal Khalil',
    requesterNameAr: 'بلال خليل',
    status: 'Submitted',
    createdDate: '2026-11-14',
    invitedSupplierIds: ['SUP-01']
  },
  {
    id: 'PR-1050',
    title: 'Cleanroom HEPA Filtration Modules',
    titleAr: 'وحدات ترشيح الهواء فائقة النقاء HEPA',
    description:
      '20 modular H14 ceiling laminar flow filter units for precision assembly zone.',
    descriptionAr:
      'عدد 20 وحدة فلترة تدفق صفائحي معيار H14 لمنطقة التجميع الدقيق.',
    quantity: 20,
    estimatedBudget: 19000,
    reason: 'Annual ISO Class 5 certification renewal.',
    reasonAr: 'التجديد السنوي لشهادة الأيزو الفئة الخامسة للغرف النظيفة.',
    deliveryDate: '2027-01-25',
    requesterId: 'USR-01',
    requesterName: 'Belal Khalil',
    requesterNameAr: 'بلال خليل',
    status: 'Draft',
    createdDate: '2026-11-16',
    invitedSupplierIds: []
  },
  {
    id: 'PR-1044',
    title: 'Fiber Optic Backbone Switches (100GbE)',
    titleAr: 'مبدلات شبكة الألياف الضوئية الأساسية 100GbE',
    description:
      '6 core spine-leaf data center switches with dual hot-swappable PSUs.',
    descriptionAr:
      'عدد 6 مبدلات مراكز بيانات رئيسية مزودة بوحدات طاقة مزدوجة قابلة للتبديل السريع.',
    quantity: 6,
    estimatedBudget: 54000,
    reason: 'Core telemetry network low-latency upgrade.',
    reasonAr: 'ترقية شبكة القياس عن بُعد الأساسية لتقليل زمن الاستجابة.',
    deliveryDate: '2026-12-01',
    requesterId: 'USR-01',
    requesterName: 'Belal Khalil',
    requesterNameAr: 'بلال خليل',
    status: 'Approved',
    createdDate: '2026-11-01',
    invitedSupplierIds: ['SUP-01', 'SUP-03']
  }
];

export const INITIAL_OFFERS: SupplierOffer[] = [
  {
    id: 'OFF-201',
    requestId: 'PR-1048',
    supplierId: 'SUP-01',
    supplierName: 'TechSupply Ltd.',
    fileName: 'TechSupply_Quotation_PR1048.pdf',
    uploadedAt: '2026-11-12 10:14',
    extractionStatus: 'Completed',
    reviewed: true,
    totalPrice: 25800,
    currency: 'USD',
    deliveryDays: 7,
    paymentTerms: 'Net 30',
    warrantyMonths: 36,
    notes: 'Includes priority air freight and pre-imaged enterprise OS.'
  },
  {
    id: 'OFF-202',
    requestId: 'PR-1048',
    supplierId: 'SUP-02',
    supplierName: 'Global Traders',
    fileName: 'GlobalTraders_Offer_PR1048.pdf',
    uploadedAt: '2026-11-12 14:40',
    extractionStatus: 'Completed',
    reviewed: true,
    totalPrice: 24900,
    currency: 'USD',
    deliveryDays: 12,
    paymentTerms: 'Net 30',
    warrantyMonths: 24,
    notes: 'Standard sea/air consolidated shipping.'
  },
  {
    id: 'OFF-203',
    requestId: 'PR-1048',
    supplierId: 'SUP-03',
    supplierName: 'Prime Solutions',
    fileName: 'PrimeSolutions_Bid_PR1048.pdf',
    uploadedAt: '2026-11-13 09:05',
    extractionStatus: 'Completed',
    reviewed: false,
    totalPrice: 26700,
    currency: 'USD',
    deliveryDays: 5,
    paymentTerms: '',
    warrantyMonths: 36,
    notes: 'Express courier dispatch from regional hub.'
  },
  {
    id: 'OFF-204',
    requestId: 'PR-1047',
    supplierId: 'SUP-01',
    supplierName: 'TechSupply Ltd.',
    fileName: 'TechSupply_LiDAR_PR1047.pdf',
    uploadedAt: '2026-11-11 11:20',
    extractionStatus: 'Completed',
    reviewed: true,
    totalPrice: 38900,
    currency: 'USD',
    deliveryDays: 9,
    paymentTerms: 'Net 45',
    warrantyMonths: 24,
    notes: 'Includes factory calibration certificates.'
  },
  {
    id: 'OFF-205',
    requestId: 'PR-1047',
    supplierId: 'SUP-03',
    supplierName: 'Prime Solutions',
    fileName: 'Prime_LiDAR_Proposal_1047.pdf',
    uploadedAt: '2026-11-11 16:45',
    extractionStatus: 'Completed',
    reviewed: true,
    totalPrice: 37400,
    currency: 'USD',
    deliveryDays: 11,
    paymentTerms: 'Net 30',
    warrantyMonths: 36,
    notes: 'Recommended lowest TCO with 3-year coverage.'
  }
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'AUD-9006',
    timestamp: '2026-11-14 09:30:12',
    user: 'Belal Khalil',
    userAr: 'بلال خليل',
    action: 'Submitted Request',
    actionAr: 'إرسال طلب شراء',
    requestId: 'PR-1049',
    details: 'Status changed from Draft -> Submitted',
    detailsAr: 'تم تغيير الحالة من مسودة -> تم الإرسال'
  },
  {
    id: 'AUD-9005',
    timestamp: '2026-11-13 15:18:44',
    user: 'Mona Al-Mansoor',
    userAr: 'منى المنصور',
    action: 'Verified AI Extraction',
    actionAr: 'اعتماد استخراج البيانات',
    requestId: 'PR-1048',
    details: 'Verified TechSupply Ltd. offer ($25,800, 7 days)',
    detailsAr: 'تمت مراجعة واعتماد عرض تك سبلاي ($25,800، 7 أيام)'
  },
  {
    id: 'AUD-9004',
    timestamp: '2026-11-12 16:02:19',
    user: 'Mona Al-Mansoor',
    userAr: 'منى المنصور',
    action: 'Sent for Approval',
    actionAr: 'إرسال للاعتماد',
    requestId: 'PR-1047',
    details: 'Status changed from Compared -> Pending Approval',
    detailsAr: 'تم تغيير الحالة من تمت المقارنة -> بانتظار الموافقة'
  },
  {
    id: 'AUD-9003',
    timestamp: '2026-11-11 10:05:00',
    user: 'Mona Al-Mansoor',
    userAr: 'منى المنصور',
    action: 'Invited Suppliers',
    actionAr: 'دعوة موردين',
    requestId: 'PR-1048',
    details: 'Invited 3 suppliers: TechSupply Ltd., Global Traders, Prime Solutions',
    detailsAr: 'تمت دعوة 3 موردين: تك سبلاي، التجار العالميون، برايم للحلول'
  },
  {
    id: 'AUD-9002',
    timestamp: '2026-11-05 14:22:10',
    user: 'Youssef El-Masry',
    userAr: 'يوسف المصري',
    action: 'Approved Request',
    actionAr: 'اعتماد الطلب',
    requestId: 'PR-1044',
    details: 'Approved award to TechSupply Ltd. ($51,200)',
    detailsAr: 'تمت الموافقة على الترسية لصالح شركة تك سبلاي ($51,200)'
  }
];
