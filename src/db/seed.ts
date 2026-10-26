import { randomBytes, scryptSync } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  contactMessages,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  questions,
  quizAttempts,
  quizzes,
  settings,
  stages,
  subjects,
  users,
} from "@/db/schema";

const SEED_VERSION = "nebras-seed-v1";

function hash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password.normalize("NFKC"), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

type SeedCourse = {
  title: string;
  slug: string;
  stageKey: string;
  subjectKey: string;
  teacherEmail: string;
  summary: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  featured?: boolean;
  outcomes: string[];
  requirements: string[];
  lessons: Array<{
    title: string;
    type: "video" | "article" | "attachment";
    minutes: number;
    free?: boolean;
    body: string[];
    video?: string;
  }>;
  quiz?: {
    title: string;
    minutes: number;
    passing: number;
    questions: Array<{ type: "single" | "multiple" | "truefalse"; text: string; options: string[]; correct: number[]; explanation?: string; points?: number }>;
  };
};

const STAGES = [
  { key: "primary", name: "المرحلة الابتدائية", nameEn: "Primary", slug: "primary", iconKey: "seedling", accent: "#2E7D5B", description: "أساسيات القراءة والحساب والاكتشاف العلمي للصفوف من الأول إلى السادس.", order: 1 },
  { key: "middle", name: "المرحلة الإعدادية", nameEn: "Middle", slug: "middle", iconKey: "compass", accent: "#1B6FA8", description: "بناء المهارات التحليلية واللغوية والعلمية لطلاب المرحلة المتوسطة.", order: 2 },
  { key: "high", name: "المرحلة الثانوية", nameEn: "High School", slug: "high", iconKey: "flask", accent: "#7A3E9D", description: "تعمّق في الفيزياء والكيمياء والأحياء والرياضيات استعدادًا للجامعة.", order: 3 },
  { key: "university", name: "التعليم الجامعي", nameEn: "University", slug: "university", iconKey: "graduation", accent: "#1B3A6B", description: "مقررات تخصصية في الحاسوب والهندسة والعلوم الإدارية.", order: 4 },
  { key: "skills", name: "المهارات والتطوير المهني", nameEn: "Skills", slug: "skills", iconKey: "spark", accent: "#C9A227", description: "مهارات الحياة والعمل: التفكير، التواصل، الإنتاجية، والقيادة.", order: 5 },
];

const SUBJECTS = [
  { key: "math-primary", stage: "primary", name: "الرياضيات", slug: "math-primary", accent: "#2E7D5B", order: 1 },
  { key: "arabic-primary", stage: "primary", name: "اللغة العربية", slug: "arabic-primary", accent: "#C9A227", order: 2 },
  { key: "science-primary", stage: "primary", name: "العلوم", slug: "science-primary", accent: "#1B6FA8", order: 3 },
  { key: "science-middle", stage: "middle", name: "العلوم العامة", slug: "science-middle", accent: "#1B6FA8", order: 1 },
  { key: "english-middle", stage: "middle", name: "اللغة الإنجليزية", slug: "english-middle", accent: "#7A3E9D", order: 2 },
  { key: "math-middle", stage: "middle", name: "الرياضيات", slug: "math-middle", accent: "#2E7D5B", order: 3 },
  { key: "physics-high", stage: "high", name: "الفيزياء", slug: "physics-high", accent: "#1B3A6B", order: 1 },
  { key: "chemistry-high", stage: "high", name: "الكيمياء", slug: "chemistry-high", accent: "#B4472E", order: 2 },
  { key: "math-high", stage: "high", name: "الرياضيات", slug: "math-high", accent: "#2E7D5B", order: 3 },
  { key: "cs-uni", stage: "university", name: "علوم الحاسوب", slug: "cs-uni", accent: "#1B6FA8", order: 1 },
  { key: "business-uni", stage: "university", name: "إدارة الأعمال", slug: "business-uni", accent: "#C9A227", order: 2 },
  { key: "soft-skills", stage: "skills", name: "مهارات حياتية", slug: "soft-skills", accent: "#7A3E9D", order: 1 },
];

const TEACHERS = [
  { name: "د. سلمى العتيبي", email: "salma@nebras.app", bio: "أستاذة مناهج الرياضيات، خبرة 14 عامًا في التعليم الأساسي.", city: "الرياض", country: "SA" },
  { name: "أ. يوسف الحربي", email: "yousef@nebras.app", bio: "مهندس برمجيات ومحاضر في علوم الحاسوب والذكاء الاصطناعي.", city: "جدة", country: "SA" },
  { name: "د. ليلى قاسم", email: "laila@nebras.app", bio: "دكتوراه في الفيزياء التطبيقية، مهتمة بتبسيط العلوم للطلاب.", city: "القاهرة", country: "EG" },
  { name: "أ. مريم الفاسي", email: "mariam@nebras.app", bio: "معلمة لغة عربية ولغويات، ومدربة مهارات كتابية.", city: "عمان", country: "JO" },
  { name: "د. عمر الشمري", email: "omar@nebras.app", bio: "خبير تطوير مهني وتدريب على مهارات التفكير والإنتاجية.", city: "دبي", country: "AE" },
];

const COURSES: SeedCourse[] = [
  {
    title: "الرياضيات للصف السادس: الكسور والنسب",
    slug: "math-grade6-fractions",
    stageKey: "primary", subjectKey: "math-primary", teacherEmail: "salma@nebras.app",
    summary: "رحلة مبسّطة لفهم الكسور والنسب المئوية وحلّ المسائل الحياتية عليها.",
    description: "كورس تفاعلي يشرح الكسور بأنواعها، والعمليات عليها، وعلاقتها بالنسب والتناسب، مع تمارين محلولة واختبارات قصيرة بعد كل وحدة. صُمم الدرس ليكون قصيرًا ومباشرًا ومناسبًا لطلاب الصف السادس.",
    level: "beginner", featured: true,
    outcomes: ["تمييز الكسر الاعتيادي والعشري", "جمع وطرح الكسور بمقامات مختلفة", "تحويل النسبة المئوية إلى كسر والعكس", "حل مسائل حياتية على التناسب"],
    requirements: ["إتقان عمليات الضرب والقسمة الأساسية", "دفتر تمارين وقلم"],
    lessons: [
      { title: "ما هو الكسر؟ ولماذا نستخدمه؟", type: "video", minutes: 8, free: true, video: "https://cdn.nebras.app/lessons/fractions-intro.mp4",
        body: ["الكسر هو طريقة للتعبير عن جزء من كل. حين نقسم تفاحة إلى أربعة أجزاء متساوية ونأخذ جزءًا واحدًا، فإننا أخذنا «ربع» التفاحة، ونكتبها ١/٤.", "يتكوّن أي كسر من بسط (العدد الأعلى) يعبّر عن الأجزاء المأخوذة، ومقام (العدد الأسفل) يعبّر عن مجموع الأجزاء المتساوية.", "تمرين سريع: لو كان لديك شوكولاتة مقسّمة إلى ٨ قطع وأكلت ٣ قطع، فما الكسر المتبقي؟ الإجابة: ٥/٨."] },
      { title: "الكسور المتشابهة وغير المتشابهة", type: "article", minutes: 10,
        body: ["الكسور المتشابهة هي التي لها المقام نفسه مثل ٢/٧ و٥/٧، ويمكن جمعها مباشرة بجمع البسط فقط.", "أما الكسور غير المتشابهة مثل ١/٣ و١/٤ فتحتاج إلى توحيد المقامات أولًا بإيجاد المضاعف المشترك الأصغر، وهو هنا ١٢.", "بعد التوحيد تصبح ٤/١٢ و٣/١٢ ومجموعهما ٧/١٢. تذكّر دائمًا تبسيط الناتج بقسمة البسط والمقام على القاسم المشترك الأكبر."] },
      { title: "النسبة المئوية في حياتنا اليومية", type: "article", minutes: 12,
        body: ["النسبة المئوية كسر مقامه ١٠٠، فنقول ٢٥٪ أي ٢٥/١٠٠ أي ٠٫٢٥.", "نستخدمها في الخصومات بالمتاجر، وفي درجات الاختبارات، وفي حساب الزيادة والنقصان.", "مثال: قميص سعره ٨٠ ريالًا عليه خصم ١٥٪. قيمة الخصم = ٨٠ × ٠٫١٥ = ١٢، فيصبح السعر ٦٨ ريالًا."] },
      { title: "التناسب وحل المسائل", type: "article", minutes: 14,
        body: ["التناسب هو تساوي نسبتين، مثل ٢/٣ = ٤/٦. ونستخدم الضرب التبادلي للتحقق: ٢×٦ = ٣×٤ = ١٢.", "إذا قطعت سيارة ١٥٠ كم في ساعتين، فكم تقطع في ٥ ساعات بنفس السرعة؟ نكتب ١٥٠/٢ = س/٥ ومنها س = ٣٧٥ كم.", "نصيحة: ارسم جدولًا صغيرًا (مسافة / زمن) قبل الحلّ لتجنّب الخلط بين الأطراف."] },
      { title: "ورقة تدريب شاملة + الحلول", type: "attachment", minutes: 20,
        body: ["ورقة عمل من ٢٠ سؤالًا تغطي كل الوحدة، مقسّمة إلى ثلاثة مستويات: أساسي، متوسط، وتحدٍّ.", "احسب وقتك: ٤٠ دقيقة للأسئلة العشرين، ثم صحّح بنفسك وسجّل الأخطاء في «دفتر الأخطاء» لمراجعتها قبل الاختبار."] },
    ],
    quiz: {
      title: "اختبار وحدة الكسور والنسب", minutes: 10, passing: 60,
      questions: [
        { type: "single", text: "ما ناتج جمع ١/٣ + ١/٦؟", options: ["١/٢", "٢/٩", "١/٩", "٢/٦"], correct: [0], explanation: "نوحّد المقامات إلى ٦: تصبح ٢/٦ + ١/٦ = ٣/٦ وبتبسيطها ١/٢.", points: 2 },
        { type: "single", text: "النسبة المئوية ٤٠٪ تكافئ الكسر:", options: ["٤/١٠٠", "٢/٥", "١/٤", "٤/٥"], correct: [1], explanation: "٤٠/١٠٠ وبقسمة البسط والمقام على ٢٠ نحصل على ٢/٥.", points: 2 },
        { type: "truefalse", text: "الكسران ٣/٤ و٦/٨ متكافئان.", options: ["صح", "خطأ"], correct: [0], explanation: "نعم، لأن ٣×٨ = ٤×٦ = ٢٤ (الضرب التبادلي متساوٍ).", points: 1 },
        { type: "multiple", text: "أيٌّ من التالي يساوي ٠٫٧٥؟", options: ["٣/٤", "٧٥٪", "٧/١٠", "١٥/٢٠"], correct: [0, 1, 3], explanation: "٠٫٧٥ = ٣/٤ = ٧٥٪ = ١٥/٢٠.", points: 3 },
        { type: "single", text: "سيارة تستهلك ٨ لترات لكل ١٠٠ كم. كم تستهلك في ٢٥٠ كم؟", options: ["١٦ لترًا", "٢٠ لترًا", "٢٥ لترًا", "١٢ لترًا"], correct: [1], explanation: "٨/١٠٠ = س/٢٥٠ ومنها س = ٢٠ لترًا.", points: 2 },
      ],
    },
  },
  {
    title: "قواعد الإملاء وعلامات الترقيم",
    slug: "arabic-spelling-punctuation",
    stageKey: "primary", subjectKey: "arabic-primary", teacherEmail: "mariam@nebras.app",
    summary: "أتقن الهمزة بأنواعها، والتاء المربوطة، وعلامات الترقيم لتكتب نصًا نظيفًا.",
    description: "يبدأ الكورس من الهمزة الابتدائية والمتوسطة والمتطرفة، ثم ينتقل إلى الأخطاء الشائعة في الكتابة، وينتهي بوحدة كاملة عن علامات الترقيم ودورها في وضوح المعنى.",
    level: "beginner",
    outcomes: ["كتابة الهمزة في مواضعها الصحيحة", "التمييز بين التاء المربوطة والمبسوطة", "استخدام علامات الترقيم بدقة", "مراجعة نصّ ذاتيًا واكتشاف الأخطاء"],
    requirements: ["معرفة أساسية بالحروف والحركات"],
    lessons: [
      { title: "الهمزة المتوسطة: قواعد ومواضع", type: "article", minutes: 11, free: true,
        body: ["تُكتب الهمزة المتوسطة على حرف يناسب أقوى الحركتين: حركة الهمزة وحركة ما قبلها.", "ترتيب القوة: الكسرة ثم الضمة ثم الفتحة ثم السكون. فـ «سُئِل» كُتبت على نبرة لأن الكسرة أقوى.", "أمثلة: مؤمن (ضمة + فتحة → واو)، بيئة (كسرة + كسرة → نبرة)، رأس (فتحة + سكون → على السطر)."] },
      { title: "الهمزة المتطرفة والتاء المربوطة", type: "article", minutes: 9,
        body: ["الهمزة المتطرفة تتبع حركة ما قبلها: قرَأ (فتحة → ألف)، شاطِئ (كسرة → نبرة)، جُرُؤ (ضمة → واو)، شيء (سكون → على السطر).", "التاء المربوطة (ة) تُنطق تاءً عند الوصل وهاءً عند الوقف، وتُكتب في الأسماء مثل «مدرسة».", "اختبار سريع: إذا استطعت نطقها «هاء» عند الوقف فهي مربوطة، وإلا فهي تاء مبسوطة مثل «بيت»."] },
      { title: "علامات الترقيم ودلالتها", type: "article", minutes: 8,
        body: ["النقطة (.) لنهاية الجملة التامة، والفاصلة (،) للفصل بين أجزاء الجملة الواحدة.", "علامة الاستفهام (؟) للسؤال، وعلامتا التعجب (!) للدهشة أو الانفعال.", "النقطتان الرأسيتان (:) قبل التفصيل أو القول، وعلامتا التنصيص («») للكلام المنقول حرفيًا."] },
    ],
    quiz: {
      title: "اختبار الإملاء السريع", minutes: 8, passing: 60,
      questions: [
        { type: "single", text: "أي كتابة صحيحة؟", options: ["مسئول", "مسؤول", "مسؤل", "مسوول"], correct: [1], explanation: "الضمة قبل الهمزة فتُكتب على واو: مسؤول." },
        { type: "single", text: "الهمزة في كلمة «بيئة» كُتبت على نبرة لأن:", options: ["ما قبلها مكسور", "ما قبلها مضموم", "ساكنة", "في أول الكلمة"], correct: [0], explanation: "الكسرة أقوى الحركات فتُرسم الهمزة على نبرة." },
        { type: "truefalse", text: "تُستخدم النقطتان الرأسيتان (:) قبل التفصيل أو القول.", options: ["صح", "خطأ"], correct: [0] },
        { type: "multiple", text: "أي الكلمات تنتهي بتاء مربوطة؟", options: ["مدرسة", "بيت", "حديقة", "صوت"], correct: [0, 2], points: 2 },
      ],
    },
  },
  {
    title: "العلوم: عالم الخلية والأحياء الدقيقة",
    slug: "middle-science-cells",
    stageKey: "middle", subjectKey: "science-middle", teacherEmail: "laila@nebras.app",
    summary: "اكتشف وحدة بناء الكائن الحي، من الخلية إلى الأنسجة والأعضاء.",
    description: "كورس مبسّط يشرح بنية الخلية الحيوانية والنباتية، والفرق بينهما، ووظائف العضيات، مع تجارب افتراضية وأسئلة تفكير عليا.",
    level: "beginner", featured: true,
    outcomes: ["وصف بنية الخلية ووظائف عضياتها", "المقارنة بين الخلية النباتية والحيوانية", "شرح عملية الانقسام الخلوي ببساطة", "ربط بنية العضيات بوظيفتها"],
    requirements: ["معرفة أساسية بمفهوم الكائن الحي"],
    lessons: [
      { title: "الخلية: وحدة البناء والحياة", type: "video", minutes: 10, free: true, video: "https://cdn.nebras.app/lessons/cell-intro.mp4",
        body: ["كل كائن حي يتكوّن من خلية واحدة أو أكثر؛ فهي أصغر وحدة قادرة على القيام بعمليات الحياة.", "تنقسم الخلايا إلى بدائية النواة (مثل البكتيريا) وحقيقية النواة (مثل خلايا الإنسان والنبات).", "الفرق الجوهري هو وجود غلاف نووي يحيط بالمادة الوراثية في حقيقية النواة."] },
      { title: "العضيات ووظائفها", type: "article", minutes: 13,
        body: ["النواة: مركز التحكم وتحوي DNA. الميتوكندريا: مصنع الطاقة (التنفس الخلوي).", "الغشاء البلازمي: ينظّم دخول المواد وخروجها. الرايبوسومات: تصنع البروتين.", "في الخلية النباتية نجد إضافتين: الجدار الخلوي للدعم، والبلاستيدات الخضراء للبناء الضوئي."] },
      { title: "الانقسام الخلوي ونمو الكائن", type: "article", minutes: 15,
        body: ["الانقسام المتساوي ينتج خليتين متماثلتين للنمو وتعويض التالف.", "يمرّ بأربع مراحل: تمهيدي، استوائي، انفصالي، نهائي.", "أما الانقسام المنصف فينتج أربع خلايا جنسية بنصف عدد الكروموسومات."] },
      { title: "تجربة افتراضية: مشاهدة الخلية تحت المجهر", type: "article", minutes: 12,
        body: ["الخطوات: تحضير شريحة من قشرة البصل، إضافة قطرة ماء، ثم صبغة اليود لإظهار النواة.", "الملاحظة المتوقعة: جدران خلوية واضحة ونواة بنية اللون وفجوة كبيرة.", "سجّل ملاحظاتك في جدول: العضية / الشكل / الوظيفة."] },
    ],
    quiz: {
      title: "اختبار وحدة الخلية", minutes: 12, passing: 60,
      questions: [
        { type: "single", text: "أي عضية تُعدّ «مصنع الطاقة» في الخلية؟", options: ["النواة", "الميتوكندريا", "الرايبوسوم", "الفجوة"], correct: [1], points: 2 },
        { type: "single", text: "ما الذي يوجد في الخلية النباتية ولا يوجد في الحيوانية؟", options: ["الغشاء البلازمي", "الجدار الخلوي", "النواة", "الميتوكندريا"], correct: [1] },
        { type: "truefalse", text: "الانقسام المنصف ينتج خلايا جنسية بنصف عدد الكروموسومات.", options: ["صح", "خطأ"], correct: [0] },
        { type: "multiple", text: "أيٌّ مما يلي من وظائف النواة؟", options: ["التحكم في نشاط الخلية", "خزن المادة الوراثية", "البناء الضوئي", "إنتاج ATP"], correct: [0, 1], points: 2 },
        { type: "single", text: "الخلية البدائية النواة لا تحتوي على:", options: ["غشاء بلازمي", "غلاف نووي", "مادة وراثية", "رايبوسومات"], correct: [1], explanation: "لا يوجد غلاف نووي يحيط بالـ DNA في بدائيات النواة." },
      ],
    },
  },
  {
    title: "اللغة الإنجليزية: بناء الجملة والمحادثة",
    slug: "english-sentence-building",
    stageKey: "middle", subjectKey: "english-middle", teacherEmail: "mariam@nebras.app",
    summary: "من الكلمة إلى الجملة إلى الحوار: منهج عملي لإتقان الإنجليزية اليومية.",
    description: "يركّز الكورس على الأزمنة الأساسية، ترتيب عناصر الجملة، ومفردات المواقف اليومية، مع تدريبات محادثة ومقاطع استماع مقترحة.",
    level: "intermediate",
    outcomes: ["تكوين جملة صحيحة بالأزمنة الثلاثة", "استخدام المفردات اليومية بثقة", "فهم حوار قصير والإجابة عنه", "كتابة فقرة من ٦ أسطر بلا أخطاء شائعة"],
    requirements: ["حصيلة ٣٠٠ كلمة إنجليزية على الأقل"],
    lessons: [
      { title: "ترتيب عناصر الجملة الإنجليزية (SVO)", type: "article", minutes: 9, free: true,
        body: ["الجملة الإنجليزية الأساسية تبدأ بالفاعل ثم الفعل ثم المفعول: Sara reads a book.", "ظروف الزمان تأتي غالبًا في نهاية الجملة، وظروف المكان قبلها: I study at home every day.", "الخطأ الشائع لدى المتحدثين بالعربية هو تقديم الظرف، فتذكّر القاعدة: فاعل ← فعل ← مفعول ← مكان ← زمان."] },
      { title: "الأزمنة: مضارع بسيط وماضٍ ومستقبل", type: "article", minutes: 14,
        body: ["المضارع البسيط للعادات والحقائق: He works in a bank. نضيف s مع he/she/it.", "الماضي البسيط للأحداث المنتهية: She visited Cairo last year.", "المستقبل بـ will للقرارات الفورية والتنبؤات، وبـ going to للخطط المسبقة."] },
      { title: "مفردات المواقف اليومية", type: "article", minutes: 11,
        body: ["في المطعم: order, menu, bill, tip. في المطار: check-in, boarding pass, gate, luggage.", "في المدرسة: assignment, deadline, grade, feedback.", "احفظ المفردات في مجموعات سياقية لا في قوائم منعزلة؛ فالدماغ يتذكّر المعنى المرتبط بموقف."] },
    ],
    quiz: {
      title: "Grammar Check — اختبار القواعد", minutes: 10, passing: 60,
      questions: [
        { type: "single", text: "Choose the correct sentence:", options: ["She go to school every day.", "She goes to school every day.", "She going to school every day.", "She gone to school every day."], correct: [1] },
        { type: "single", text: "Yesterday I ______ my homework.", options: ["finish", "finishes", "finished", "will finish"], correct: [2] },
        { type: "truefalse", text: "In English, time adverbs usually come before the verb.", options: ["True", "False"], correct: [1] },
        { type: "multiple", text: "Which words belong to the airport context?", options: ["boarding pass", "gate", "stethoscope", "luggage"], correct: [0, 1, 3], points: 2 },
      ],
    },
  },
  {
    title: "الفيزياء: الحركة والقوى وقوانين نيوتن",
    slug: "physics-motion-forces",
    stageKey: "high", subjectKey: "physics-high", teacherEmail: "laila@nebras.app",
    summary: "افهم كيف يتحرك العالم من حولك عبر قوانين نيوتن الثلاثة وتطبيقاتها العددية.",
    description: "يتناول الكورس السرعة والتسارع والاحتكاك وقوانين نيوتن، مع مسائل محلولة خطوة بخطوة ورسوم بيانية للحركة، وينتهي باختبار شامل يحاكي أسئلة الامتحانات النهائية.",
    level: "intermediate", featured: true,
    outcomes: ["حساب السرعة والتسارع بدقة", "تطبيق قانون نيوتن الثاني في مسائل عددية", "قراءة الرسم البياني للمسافة والزمن", "تحليل القوى المؤثرة على جسم"],
    requirements: ["إتقان الجبر الأساسي", "معرفة بوحدات القياس"],
    lessons: [
      { title: "السرعة والتسارع والوحدات", type: "video", minutes: 12, free: true, video: "https://cdn.nebras.app/lessons/motion-intro.mp4",
        body: ["السرعة المتوسطة = الإزاحة ÷ الزمن، ووحدتها m/s.", "التسارع = التغيّر في السرعة ÷ الزمن، ووحدته m/s².", "مثال: سيارة زادت سرعتها من ١٠ إلى ٣٠ m/s خلال ٥ ثوانٍ، فيكون التسارع = (٣٠−١٠)/٥ = ٤ m/s²."] },
      { title: "قانون نيوتن الأول والثاني", type: "article", minutes: 15,
        body: ["القانون الأول (القصور الذاتي): يبقى الجسم في حالته ما لم تؤثر عليه قوة محصلة خارجية.", "القانون الثاني: F = m × a، أي أن القوة المحصلة تساوي كتلة الجسم مضروبة في تسارعه.", "إذا أثرت قوة ٢٠ نيوتن على جسم كتلته ٥ كجم فإن تسارعه = ٤ m/s² (بإهمال الاحتكاك)."] },
      { title: "قانون نيوتن الثالث والاحتكاك", type: "article", minutes: 13,
        body: ["لكل فعل رد فعل مساوٍ له في المقدار ومعاكس في الاتجاه، ويقعان على جسمين مختلفين.", "قوة الاحتكاك تعاكس الحركة وتعتمد على طبيعة السطحين والقوة العمودية: f = μN.", "بدون احتكاك لا نستطيع المشي؛ فهو ليس دائمًا قوة «معطّلة» بل ضرورية للحركة المتحكم بها."] },
      { title: "الرسوم البيانية للحركة", type: "article", minutes: 10,
        body: ["ميل خط المسافة-الزمن يعطي السرعة، وميل خط السرعة-الزمن يعطي التسارع.", "المساحة تحت منحنى السرعة-الزمن تمثّل الإزاحة.", "الخط الأفقي في منحنى السرعة يعني حركة بسرعة ثابتة أي تسارع صفر."] },
      { title: "مسائل محلولة على الوحدة كاملة", type: "article", minutes: 18,
        body: ["مسألة ١: جسم كتلته ١٠ كجم يتحرك بتسارع ٣ m/s²، احسب القوة المحصلة. الحل: F = ١٠×٣ = ٣٠ N.", "مسألة ٢: سقط جسم سقوطًا حرًا من ارتفاع ٢٠ م (g = ١٠). الزمن = √(٢h/g) = √٤ = ٢ ثانية.", "مسألة ٣: سيارة كتلتها ١٢٠٠ كجم تسير بسرعة ٢٠ m/a وتوقفت في ٥ ثوانٍ، قوة الكبح = ١٢٠٠ × (٢٠/٥) = ٤٨٠٠ N."] },
    ],
    quiz: {
      title: "اختبار الحركة والقوى", minutes: 15, passing: 60,
      questions: [
        { type: "single", text: "جسم كتلته ٤ كجم تؤثر عليه قوة ١٢ نيوتن. ما تسارعه؟", options: ["٣ m/s²", "٤٨ m/s²", "٨ m/s²", "٠٫٣٣ m/s²"], correct: [0], explanation: "a = F/m = ١٢/٤ = ٣ m/s².", points: 2 },
        { type: "single", text: "ميل منحنى السرعة-الزمن يمثّل:", options: ["الإزاحة", "التسارع", "القوة", "الكتلة"], correct: [1] },
        { type: "truefalse", text: "قوتا الفعل ورد الفعل تؤثران على الجسم نفسه.", options: ["صح", "خطأ"], correct: [1], explanation: "بل على جسمين مختلفين، لذلك لا تلغي إحداهما الأخرى." },
        { type: "multiple", text: "أي العوامل التالية تزيد قوة الاحتكاك؟", options: ["خشونة السطح", "زيادة القوة العمودية", "زيادة السرعة فقط", "زيادة المساحة فقط"], correct: [0, 1], points: 2 },
        { type: "single", text: "وحدة قياس التسارع هي:", options: ["m/s", "m/s²", "N", "kg·m"], correct: [1] },
        { type: "single", text: "جسم سقط سقوطًا حرًا من ارتفاع ٤٥ م (g = ١٠). زمن الوصول للأرض:", options: ["٢ ثانية", "٣ ثوانٍ", "٤٫٥ ثانية", "٩ ثوانٍ"], correct: [1], explanation: "t = √(٢h/g) = √٩ = ٣ ثوانٍ.", points: 2 },
      ],
    },
  },
  {
    title: "الكيمياء: الروابط الكيميائية والمركبات",
    slug: "chemistry-bonds",
    stageKey: "high", subjectKey: "chemistry-high", teacherEmail: "laila@nebras.app",
    summary: "لماذا ترتبط الذرات؟ من الرابطة الأيونية إلى التساهمية والفلزية.",
    description: "شرح مبسّط لقاعدة الثمانية، وأنواع الروابط، وخصائص المركبات الناتجة، مع تمارين على كتابة الصيغ الكيميائية وموازنة المعادلات البسيطة.",
    level: "intermediate",
    outcomes: ["تفسير سبب ارتباط الذرات", "التمييز بين الرابطة الأيونية والتساهمية", "كتابة الصيغة الكيميائية لمركب بسيط", "ربط نوع الرابطة بخصائص المادة"],
    requirements: ["معرفة ببنية الذرة والجدول الدوري"],
    lessons: [
      { title: "قاعدة الثمانية واستقرار الذرة", type: "article", minutes: 10, free: true,
        body: ["تميل الذرات للوصول إلى ٨ إلكترونات في مستوى الطاقة الأخير لتصبح مستقرة كالغازات النبيلة.", "يتحقق ذلك بفقد أو كسب أو مشاركة الإلكترونات، وهذا هو أصل كل الروابط الكيميائية.", "الفلزات تفقد إلكترونات لتصبح أيونات موجبة، واللافلزات تكسب لتصبح سالبة."] },
      { title: "الرابطة الأيونية والتساهمية", type: "article", minutes: 14,
        body: ["الأيونية: انتقال إلكترونات بين فلز ولافلز، مثل NaCl، ومركباتها صلبة ذات درجة انصهار عالية وتوصل الكهرباء محلولًا.", "التساهمية: مشاركة أزواج إلكترونات بين لافلزين، مثل H₂O وCO₂، وقد تكون قطبية أو غير قطبية.", "الفلزية: بحر من الإلكترونات الحرة بين أيونات موجبة، ولهذا توصل الفلزات الكهرباء والحرارة."] },
      { title: "كتابة الصيغ وموازنة المعادلات", type: "article", minutes: 16,
        body: ["نعتمد على التكافؤ: Al³⁺ مع O²⁻ يعطي Al₂O₃ (بتبديل الأعداد).", "الموازنة تعتمد على حفظ عدد ذرات كل عنصر في الطرفين.", "مثال: ٢H₂ + O₂ → ٢H₂O. تذكّر عدم تغيير الأرقام السفلية أبدًا أثناء الموازنة."] },
    ],
    quiz: {
      title: "اختبار الروابط الكيميائية", minutes: 12, passing: 60,
      questions: [
        { type: "single", text: "رابطة NaCl هي:", options: ["تساهمية قطبية", "أيونية", "فلزية", "هيدروجينية"], correct: [1] },
        { type: "single", text: "الصيغة الصحيحة لأكسيد الألومنيوم:", options: ["AlO", "Al₂O₃", "Al₃O₂", "AlO₂"], correct: [1], points: 2 },
        { type: "truefalse", text: "المركبات التساهمية عادةً درجة انصهارها عالية جدًا.", options: ["صح", "خطأ"], correct: [1] },
        { type: "multiple", text: "أي الخصائص تنطبق على الفلزات؟", options: ["توصيل الكهرباء", "قابلية السحب والطرق", "هشة جدًا", "بريق فلزي"], correct: [0, 1, 3], points: 2 },
      ],
    },
  },
  {
    title: "مقدمة في برمجة الويب الحديثة",
    slug: "intro-web-development",
    stageKey: "university", subjectKey: "cs-uni", teacherEmail: "yousef@nebras.app",
    summary: "من HTML وCSS إلى JavaScript ثم بناء تطبيق كامل مع قاعدة بيانات.",
    description: "مسار عملي يبدأ بأساسيات الويب وينتهي بمشروع تطبيقي. كل درس يحتوي على شيفرة قابلة للنسخ وتحدي برمجي صغير.",
    level: "beginner", featured: true,
    outcomes: ["بناء صفحة ويب متجاوبة", "فهم DOM والأحداث في JavaScript", "استهلاك واجهة API من المتصفح", "تنظيم مشروع كامل بمجلدات واضحة"],
    requirements: ["حاسوب ومتصفح حديث", "لا خبرة سابقة مطلوبة"],
    lessons: [
      { title: "كيف يعمل الويب؟ طلب واستجابة", type: "article", minutes: 9, free: true,
        body: ["المتصفح يرسل طلب HTTP إلى الخادم، والخادم يعيد استجابة تحمل الحالة (200/404/500) والمحتوى.", "HTML للهيكل، CSS للشكل، JavaScript للسلوك — ثلاث طبقات يجب فصلها قدر الإمكان.", "عند كتابة عنوان في المتصفح تمر العملية بـ DNS ثم TCP ثم TLS ثم HTTP."] },
      { title: "HTML الدلالي وإمكانية الوصول", type: "article", minutes: 12,
        body: ["استخدم header/nav/main/section/footer بدلًا من div لكل شيء؛ فالدلالات تساعد محركات البحث وقارئات الشاشة.", "كل صورة تحتاج alt وصفية، وكل حقل إدخال يحتاج label مرتبطًا به عبر for/id.", "الترتيب الصحيح للعناوين h1 ثم h2 ثم h3 دون قفزات."] },
      { title: "CSS: التخطيط المتجاوب", type: "article", minutes: 15,
        body: ["Flexbox للمحور الواحد، وGrid للمحورين. استخدم gap بدلًا من margins المتكررة.", "وحدات نسبية: rem للخطوط، % وfr للتخطيط، وclamp() للقيم السائلة.", "نقاط التوقف: صمّم للهاتف أولًا ثم وسّع للشاشات الأكبر عبر min-width."] },
      { title: "JavaScript في المتصفح", type: "article", minutes: 18,
        body: ["المتغيرات: const افتراضيًا، وlet عند الحاجة لإعادة الإسناد، وتجنّب var.", "الدوال والأسهم، ثم fetch للتعامل مع الـ API باستخدام async/await.", "مثال: const res = await fetch('/api/courses'); const data = await res.json();"] },
      { title: "مشروع تطبيقي: لوحة تقدم طالب", type: "article", minutes: 25,
        body: ["ابنِ صفحة تعرض قائمة كورسات مع شريط تقدم لكل كورس.", "اجلب البيانات من /api/courses وارسمها ديناميكيًا في DOM.", "أضف حالة تحميل (skeleton) وحالة فارغة ومعالجة أخطاء — هذه تفاصيل تفصل المحترف عن المبتدئ."] },
    ],
    quiz: {
      title: "اختبار أساسيات الويب", minutes: 15, passing: 60,
      questions: [
        { type: "single", text: "أي وسمة في HTML تُستخدم لوصف الصورة لقارئات الشاشة؟", options: ["title", "alt", "src", "aria-hidden"], correct: [1] },
        { type: "single", text: "لتخطيط ثنائي الأبعاد (صفوف وأعمدة) الأفضل استخدام:", options: ["float", "CSS Grid", "position: absolute", "inline-block"], correct: [1] },
        { type: "truefalse", text: "fetch ترجع Promise.", options: ["صح", "خطأ"], correct: [0] },
        { type: "multiple", text: "أيها من أكواد حالة HTTP الصحيحة؟", options: ["200", "404", "500", "777"], correct: [0, 1, 2], points: 2 },
        { type: "single", text: "ما الإعلان الصحيح عن ثابت في JavaScript؟", options: ["var x = 1", "let x = 1", "const x = 1", "int x = 1"], correct: [2] },
      ],
    },
  },
  {
    title: "أساسيات الذكاء الاصطناعي وتعلّم الآلة",
    slug: "ai-ml-foundations",
    stageKey: "university", subjectKey: "cs-uni", teacherEmail: "yousef@nebras.app",
    summary: "مفاهيم الذكاء الاصطناعي وتعلم الآلة بلغة واضحة مع أمثلة تطبيقية.",
    description: "يشرح الكورس الفرق بين الذكاء الاصطناعي وتعلم الآلة والتعلم العميق، وأنواع التعلم، وكيف تُقيَّم النماذج، مع مناقشة أخلاقيات الاستخدام في التعليم.",
    level: "advanced",
    outcomes: ["التمييز بين أنواع التعلم الآلي", "فهم مفاهيم التدريب والاختبار والتقييم", "قراءة منحنى الدقة والاستدعاء", "تطبيق مبادئ أخلاقيات الذكاء الاصطناعي"],
    requirements: ["إلمام بالبرمجة", "أساسيات الإحصاء"],
    lessons: [
      { title: "ما الذكاء الاصطناعي؟ خريطة المفاهيم", type: "article", minutes: 10, free: true,
        body: ["الذكاء الاصطناعي المجال الأوسع، وتعلم الآلة فرع منه، والتعلم العميق فرع من تعلم الآلة.", "النماذج الحديثة اللغوية الكبيرة (LLMs) تُدرَّب على كميات هائلة من النص وتتنبأ بالكلمة التالية.", "ليس كل ذكاء اصطناعي «يعي»؛ أغلبه إحصاء متقدّم على أنماط البيانات."] },
      { title: "أنواع التعلم: مُوجَّه وغير مُوجَّه", type: "article", minutes: 14,
        body: ["التعلم الموجّه (Supervised): بيانات موسومة، مثل تصنيف بريد كرسالة مزعجة أو لا.", "غير الموجّه (Unsupervised): اكتشاف مجموعات دون وسوم، مثل تقسيم العملاء إلى شرائح.", "التعلم المعزّز (Reinforcement): وكيل يتعلم بالمكافأة والعقاب عبر التفاعل مع بيئة."] },
      { title: "تقييم النماذج: الدقة والاستدعاء وF1", type: "article", minutes: 16,
        body: ["الدقة Accuracy = (TP+TN)/الكل، لكنها مضللة عند اختلال التوزيع.", "الاستدعاء Recall = TP/(TP+FN) مهم في الكشف عن الأمراض.", "F1 هو الوسط التوافقي بين Precision وRecall ويوازن بينهما."] },
    ],
    quiz: {
      title: "اختبار مفاهيم الذكاء الاصطناعي", minutes: 12, passing: 70,
      questions: [
        { type: "single", text: "تصنيف الصور إلى فئات باستخدام بيانات موسومة هو:", options: ["تعلم غير موجّه", "تعلم موجّه", "تعلم معزّز", "قواعد خبيرة"], correct: [1] },
        { type: "single", text: "مقياس مناسب عند وجود خلل شديد في توزيع الفئات:", options: ["Accuracy", "F1-score", "عدد المعاملات", "سرعة التدريب"], correct: [1], points: 2 },
        { type: "truefalse", text: "التعلم العميق مجموعة فرعية من تعلم الآلة.", options: ["صح", "خطأ"], correct: [0] },
        { type: "multiple", text: "أي الممارسات التالية أخلاقية في نشر نموذج تعليمي؟", options: ["الإفصاح عن استخدام النموذج", "مراجعة الانحياز في البيانات", "جمع بيانات الطلاب دون موافقة", "إتاحة آلية للطعن في القرار"], correct: [0, 1, 3], points: 3 },
      ],
    },
  },
  {
    title: "مهارات التفكير النقدي وحل المشكلات",
    slug: "critical-thinking",
    stageKey: "skills", subjectKey: "soft-skills", teacherEmail: "omar@nebras.app",
    summary: "تعلّم كيف تسأل، وكيف تقيّم الدليل، وكيف تتخذ قرارًا مدروسًا.",
    description: "مسار مهاري قصير ومكثّف يبني عادة التساؤل المنهجي، ويكشف المغالطات الشائعة، ويقدّم أطرًا عملية لتحليل المشكلات واتخاذ القرار.",
    level: "beginner",
    outcomes: ["صياغة أسئلة نقدية فعّالة", "كشف المغالطات المنطقية الشائعة", "تحليل مشكلة بمنهج ٥ لماذا", "اتخاذ قرار بمصفوفة أولويات"],
    requirements: ["لا توجد متطلبات سابقة"],
    lessons: [
      { title: "ما التفكير النقدي؟", type: "article", minutes: 8, free: true,
        body: ["هو تقييم منهجي للمعلومات والحجج قبل قبولها، وليس الشك الدائم ولا النقد السلبي.", "خطواته: حدد السؤال ← اجمع الأدلة ← قيّم مصادرها ← ابحث عن بدائل ← اتخذ موقفًا قابلًا للمراجعة."] },
      { title: "المغالطات المنطقية الأكثر شيوعًا", type: "article", minutes: 12,
        body: ["مغالطة رجل القش: تحريف رأي الخصم ثم مهاجمته.", "الاحتكام للسلطة: قبول الرأي لمكانة قائله لا لدليله.", "التعميم المتسرع: استنتاج قاعدة من حالات قليلة، والسبب الزائف: افتراض أن التعاقب يعني السببية."] },
      { title: "أطر عملية: ٥ لماذا ومصفوفة القرار", type: "article", minutes: 14,
        body: ["اسأل «لماذا؟» خمس مرات للوصول إلى الجذر لا إلى العرض.", "مصفوفة القرار: رتّب الخيارات وفق أثرها وسهولة تنفيذها، وابدأ بما أثره عالٍ وسهولته عالية.", "وثّق قرارك: المعطيات، البدائل، السبب، وما الذي سيجعلك تغيّره."] },
    ],
    quiz: {
      title: "اختبار التفكير النقدي", minutes: 8, passing: 60,
      questions: [
        { type: "single", text: "«كل من خالفني فهو جاهل» مثال على:", options: ["حجة منطقية سليمة", "مغالطة الهجوم الشخصي", "استقراء تام", "قياس تمثيلي"], correct: [1] },
        { type: "single", text: "منهج «٥ لماذا» يُستخدم لـ:", options: ["تحديد جذر المشكلة", "تسريع الإنتاج", "زيادة المبيعات", "تنظيم الملفات"], correct: [0] },
        { type: "truefalse", text: "التفكير النقدي يعني رفض كل معلومة تصلك.", options: ["صح", "خطأ"], correct: [1] },
        { type: "multiple", text: "أيها يعدّ دليلًا قويًا؟", options: ["دراسة محكمة بمنهجية واضحة", "رأي مؤثر على منصة اجتماعية", "بيانات قابلة للتحقق", "خبر دون مصدر"], correct: [0, 2], points: 2 },
      ],
    },
  },
  {
    title: "إدارة الوقت والإنتاجية للطلاب",
    slug: "time-management-students",
    stageKey: "skills", subjectKey: "soft-skills", teacherEmail: "omar@nebras.app",
    summary: "نظام عملي لتنظيم أسبوعك الدراسي وإنجاز مهامك دون إرهاق.",
    description: "الكورس مبني على تجارب طلاب حقيقية: من التقويم الأسبوعي إلى تقنية بومودورو إلى إدارة الطاقة لا الوقت فقط.",
    level: "beginner", featured: true,
    outcomes: ["بناء تقويم أسبوعي واقعي", "تطبيق تقنية بومودورو", "ترتيب المهام بمصفوفة أيزنهاور", "قياس التقدم ومراجعته أسبوعيًا"],
    requirements: ["دفتر أو تطبيق ملاحظات"],
    lessons: [
      { title: "لماذا يفشل التخطيط الدراسي؟", type: "article", minutes: 9, free: true,
        body: ["أشهر ثلاثة أسباب: مهام غامضة بلا تعريف للإنجاز، وتقدير مفرط في التفاؤل للوقت، وغياب المراجعة الأسبوعية.", "الحل: حوّل «ذاكر رياضيات» إلى «حل ١٠ مسائل من وحدة الكسور في ٤٥ دقيقة»."] },
      { title: "مصفوفة أيزنهاور وترتيب الأولويات", type: "article", minutes: 11,
        body: ["قسّم مهامك إلى: مهم وعاجل (افعله الآن)، مهم وغير عاجل (خطط له)، عاجل وغير مهم (فوّضه)، لا هذا ولا ذاك (احذفه).", "الطلاب المتفوقون يقضون معظم وقتهم في الربع الثاني: الاستعداد قبل الامتحان لا ليلة الامتحان."] },
      { title: "بومودورو وإدارة الطاقة", type: "article", minutes: 10,
        body: ["٢٥ دقيقة تركيز كامل ثم ٥ دقائق راحة، وبعد أربع جلسات راحة أطول ٢٠ دقيقة.", "ضع جلساتك الصعبة في وقت ذروة طاقتك (صباحًا لدى أغلب الطلاب).", "احذف المشتتات فعليًا: الهاتف في غرفة أخرى أفضل من وضعه صامتًا بجانبك."] },
    ],
    quiz: {
      title: "اختبار إدارة الوقت", minutes: 7, passing: 60,
      questions: [
        { type: "single", text: "مدة جلسة التركيز في تقنية بومودورو:", options: ["١٠ دقائق", "٢٥ دقيقة", "٦٠ دقيقة", "٩٠ دقيقة"], correct: [1] },
        { type: "single", text: "مهمة «مهمة وغير عاجلة» يُفضّل أن:", options: ["تُحذف", "تُخطط في التقويم", "تُفوّض دائمًا", "تُؤجل بلا تحديد"], correct: [1] },
        { type: "truefalse", text: "المهمة الجيدة تُصاغ بحيث يمكن قياس إنجازها.", options: ["صح", "خطأ"], correct: [0] },
        { type: "multiple", text: "أي الممارسات تحسّن التركيز؟", options: ["إبعاد الهاتف عن الغرفة", "تحديد هدف واحد للجلسة", "فتح ٥ تبويبات للمراجعة", "أخذ راحة قصيرة منتظمة"], correct: [0, 1, 3], points: 2 },
      ],
    },
  },
];

let seedPromise: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seedPromise) seedPromise = runSeed().catch((err) => {
    console.error("[seed] failed", err);
    seedPromise = null;
  });
  return seedPromise;
}

async function runSeed() {
  const existing = await db.select().from(settings).where(eq(settings.key, "seed.version")).limit(1);
  if (existing[0]?.value?.toString() === SEED_VERSION) return;

  // قفل استشاري يمنع البذر المتزامن — يُتجاهل بأمان إن لم تدعمه بيئة الاتصال (مثل بعض أوضاع الـ Pooler)
  let gotLock = false;
  let lockSupported = true;
  try {
    const locked = await db.execute(sql`select pg_try_advisory_lock(90210)`);
    gotLock = Boolean((locked as unknown as { rows?: Array<{ pg_try_advisory_lock: boolean }> }).rows?.[0]?.pg_try_advisory_lock);
  } catch {
    lockSupported = false;
    gotLock = true; // متابعة بلا قفل؛ الفهارس الفريدة تمنع التكرار
  }
  if (!gotLock) return;

  try {
    const alreadySeeded = await db.select().from(settings).where(eq(settings.key, "seed.version")).limit(1);
    if (alreadySeeded[0]) return;

    const userCount = await db.execute(sql`select count(*)::int as c from users`);
    const hasUsers = Number((userCount as unknown as { rows: Array<{ c: number }> }).rows[0].c) > 0;
    if (hasUsers) {
      await db.insert(settings).values({ key: "seed.version", value: SEED_VERSION });
      return;
    }

    /* ------------------------------- المراحل ------------------------------- */
    const stageMap = new Map<string, string>();
    for (const s of STAGES) {
      const [row] = await db
        .insert(stages)
        .values({ name: s.name, nameEn: s.nameEn, slug: s.slug, description: s.description, iconKey: s.iconKey, accent: s.accent, sortOrder: s.order })
        .returning({ id: stages.id });
      stageMap.set(s.key, row.id);
    }

    /* -------------------------------- المواد -------------------------------- */
    const subjectMap = new Map<string, string>();
    for (const s of SUBJECTS) {
      const [row] = await db
        .insert(subjects)
        .values({ stageId: stageMap.get(s.stage)!, name: s.name, slug: s.slug, accent: s.accent, sortOrder: s.order })
        .returning({ id: subjects.id });
      subjectMap.set(s.key, row.id);
    }

    /* ------------------------------ المستخدمون ------------------------------ */
    const [admin] = await db
      .insert(users)
      .values({
        fullName: "مدير منصة نبراس",
        email: "admin@nebras.app",
        passwordHash: hash("Admin@12345"),
        role: "admin",
        city: "الرياض",
        country: "SA",
        bio: "الحساب الإداري الرئيسي للمنصة: إدارة المحتوى والمستخدمين والتقارير.",
        avatarUrl: null,
      })
      .returning({ id: users.id });

    const teacherMap = new Map<string, string>();
    for (const t of TEACHERS) {
      const [row] = await db
        .insert(users)
        .values({
          fullName: t.name, email: t.email, passwordHash: hash("Teacher@12345"),
          role: "teacher", bio: t.bio, city: t.city, country: t.country,
        })
        .returning({ id: users.id });
      teacherMap.set(t.email, row.id);
    }

    const demoStudents = [
      { fullName: "نورة السالم", email: "student@nebras.app", password: "Student@12345", city: "الرياض", country: "SA" as const, stageId: stageMap.get("high")!, bio: "طالبة في المرحلة الثانوية، مهتمة بالفيزياء والبرمجة." },
      { fullName: "خالد بن منصور", email: "khaled@nebras.app", password: "Student@12345", city: "دبي", country: "AE" as const, stageId: stageMap.get("university")!, bio: "طالب جامعي في تخصص الحاسوب." },
      { fullName: "رِيم العنزي", email: "reem@nebras.app", password: "Student@12345", city: "القاهرة", country: "EG" as const, stageId: stageMap.get("middle")!, bio: "طالبة في المرحلة الإعدادية." },
      { fullName: "أحمد زهران", email: "ahmed@nebras.app", password: "Student@12345", city: "عمان", country: "JO" as const, stageId: stageMap.get("primary")! },
    ];
    const studentIds: string[] = [];
    for (const s of demoStudents) {
      const [row] = await db
        .insert(users)
        .values({ fullName: s.fullName, email: s.email, passwordHash: hash(s.password), role: "student", city: s.city, country: s.country, stageId: s.stageId, bio: s.bio ?? null })
        .returning({ id: users.id });
      studentIds.push(row.id);
    }

    /* ------------------------------- الكورسات ------------------------------- */
    let order = 0;
    for (const c of COURSES) {
      const teacherId = teacherMap.get(c.teacherEmail) ?? admin.id;
      const totalMinutes = c.lessons.reduce((sum, l) => sum + l.minutes, 0);
      const [course] = await db
        .insert(courses)
        .values({
          stageId: stageMap.get(c.stageKey)!,
          subjectId: subjectMap.get(c.subjectKey) ?? null,
          teacherId,
          title: c.title,
          slug: c.slug,
          summary: c.summary,
          description: c.description,
          level: c.level,
          status: "published",
          isFeatured: Boolean(c.featured),
          isFree: true,
          price: 0,
          durationMinutes: totalMinutes,
          learningOutcomes: c.outcomes,
          requirements: c.requirements,
          ratingSum: 0,
          ratingCount: 0,
        })
        .returning({ id: courses.id, createdAt: courses.createdAt });

      let idx = 1;
      const lessonIds: string[] = [];
      for (const l of c.lessons) {
        const [lesson] = await db
          .insert(lessons)
          .values({
            courseId: course.id,
            title: l.title,
            slug: `${c.slug}-lesson-${idx}`,
            type: l.type,
            summary: l.body[0]?.slice(0, 160) ?? null,
            content: l.body.map((p) => `<p>${p}</p>`).join("\n"),
            videoUrl: l.video ?? null,
            durationMinutes: l.minutes,
            sortOrder: idx,
            isFreePreview: Boolean(l.free),
            isPublished: true,
          })
          .returning({ id: lessons.id });
        lessonIds.push(lesson.id);
        idx += 1;
      }
      order += 1;

      if (c.quiz) {
        const [quiz] = await db
          .insert(quizzes)
          .values({
            courseId: course.id,
            title: c.quiz.title,
            description: c.quiz.minutes > 12 ? "اختبار شامل يغطي كل دروس الكورس." : "اختبار قصير لقياس فهم الوحدة.",
            timeLimitMinutes: c.quiz.minutes,
            passingPercent: c.quiz.passing,
            attemptsAllowed: 3,
            showExplanations: true,
            isPublished: true,
            sortOrder: order,
          })
          .returning({ id: quizzes.id });

        let qIdx = 1;
        for (const q of c.quiz.questions) {
          await db.insert(questions).values({
            quizId: quiz.id,
            type: q.type,
            text: q.text,
            options: q.options,
            correctIndexes: q.correct,
            explanation: q.explanation ?? null,
            points: q.points ?? 1,
            sortOrder: qIdx,
          });
          qIdx += 1;
        }

        /* محاولات نموذجية لبعض الطلاب */
        const sampleStudents = studentIds.slice(0, 3);
        for (let i = 0; i < sampleStudents.length; i += 1) {
          const percent = [82, 64, 91][i] ?? 70;
          const totalPoints = c.quiz.questions.reduce((s2, q2) => s2 + (q2.points ?? 1), 0);
          const score = Math.round((totalPoints * percent) / 100);
          const answers: Record<string, number[]> = {};
          const qs = await db.select({ id: questions.id, correctIndexes: questions.correctIndexes }).from(questions).where(eq(questions.quizId, quiz.id));
          qs.forEach((qq, k) => {
            answers[qq.id] = k % 4 === 3 && percent < 80 ? [0] : qq.correctIndexes;
          });
          await db.insert(quizAttempts).values({
            quizId: quiz.id,
            userId: sampleStudents[i],
            score,
            totalPoints,
            percent,
            passed: percent >= c.quiz.passing,
            answers,
            durationSeconds: c.quiz.minutes * 40,
            submittedAt: new Date(Date.now() - (i + 1) * 86_400_000),
          });
        }
      }

      /* تسجيل الطلاب + تقدم نموذجي */
      for (let i = 0; i < studentIds.length; i += 1) {
        const shouldEnroll = i === 0 || (i === 1 && c.stageKey === "university") || (i === 2 && c.stageKey === "middle");
        if (!shouldEnroll) continue;
        const doneCount = i === 0 ? Math.max(1, Math.floor(lessonIds.length * 0.6)) : Math.max(1, Math.floor(lessonIds.length * 0.3));
        const [enr] = await db
          .insert(enrollments)
          .values({
            userId: studentIds[i],
            courseId: course.id,
            progressPercent: Math.round((doneCount / lessonIds.length) * 100),
            status: doneCount >= lessonIds.length ? "completed" : "in_progress",
            lastLessonId: lessonIds[Math.min(doneCount, lessonIds.length - 1)],
            enrolledAt: new Date(Date.now() - (order + i) * 3_600_000),
          })
          .returning({ id: enrollments.id });

        for (let d = 0; d < doneCount; d += 1) {
          await db.insert(lessonProgress).values({
            userId: studentIds[i],
            lessonId: lessonIds[d],
            courseId: course.id,
            completed: true,
            secondsSpent: (c.lessons[d]?.minutes ?? 10) * 60,
            completedAt: new Date(Date.now() - (order + d) * 3_600_000),
          });
        }
        void enr;
      }
    }

    /* ------------------------------- الإعلانات ------------------------------- */
    const anns = [
      { title: "انطلاق الفصل الدراسي الجديد", body: "نرحّب بكم في فصل دراسي جديد على منصة نبراس. أُضيفت ١٠ كورسات جديدة في المراحل كافة، ويمكنكم التسجيل فيها مجانًا من صفحة الكورسات.", audience: "all" },
      { title: "مسابقة نبراس للرياضيات", body: "تبدأ المسابقة الأسبوعية يوم الخميس الساعة ٧ مساءً بتوقيت الرياض، والجوائز شهادات معتمدة وعضوية مميزة لأول ثلاثة فائزين.", audience: "students" },
      { title: "تحديث سياسة الاختبارات", body: "أصبح عدد المحاولات المسموح لكل اختبار ٣ محاولات، وتُحتسب الدرجة الأعلى. يرجى مراجعة الطلاب قبل أداء الاختبارات النهائية.", audience: "all" },
    ];
    for (const a of anns) {
      await db.insert(announcements).values({ title: a.title, body: a.body, audience: a.audience, authorId: admin.id, isPublished: true });
    }

    /* ------------------------------ رسائل التواصل ------------------------------ */
    await db.insert(contactMessages).values([
      { name: "هند المالكي", email: "hind@example.com", subject: "استفسار عن كورس الفيزياء", message: "هل كورس الفيزياء مناسب لطالبة في الصف الثاني الثانوي لم تدرس الحركة من قبل؟", country: "SA", status: "new" },
      { name: "مدرسة النور الأهلية", email: "info@alnoor-school.example", subject: "شراكة مؤسسية", message: "نرغب في تسجيل ١٢٠ طالبًا على المنصة ضمن اتفاقية مؤسسية، ما الخيارات المتاحة؟", country: "EG", status: "new" },
      { name: "سعود الدوسري", email: "saud@example.com", subject: "شهادة الكورس", message: "أنهيت كورس إدارة الوقت ولم تظهر لي الشهادة، أرجو المساعدة.", country: "AE", status: "read" },
    ]);

    await db.insert(settings).values([
      { key: "seed.version", value: SEED_VERSION },
      { key: "site", value: { name: "NEBRAS", nameAr: "نبراس", tagline: "نور المعرفة، طريق المستقبل", supportEmail: "support@nebras.app", supportPhone: "+966 55 000 0000" } },
    ]);

    console.log("[seed] platform data created");
  } finally {
    if (lockSupported) {
      try {
        await db.execute(sql`select pg_advisory_unlock(90210)`);
      } catch {
        /* تجاهل: تحرير القفل غير حرج */
      }
    }
  }
}
