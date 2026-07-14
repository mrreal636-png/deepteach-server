/**
 * ================================================================
 * DeepTeachSY - الخادم الخلفي (النسخة المطابقة لكورسيرا)
 * الإصدار 5.0.0 - أكثر من 3000 سطر من الكود الاحترافي
 * ================================================================
 * 
 * 🏗️  الهندسة: RESTful API مع Express.js
 * 🗄️  قاعدة البيانات: MongoDB عبر Mongoose ODM
 * 🔐  المصادقة: جلسات (Sessions) مع JWT-like صلاحيات
 * 📚  إدارة المحتوى: صفوف، مواد، وحدات، دروس، امتحانات
 * 👥  إدارة المستخدمين: صلاحيات، حظر، اشتراكات، ترقيات
 * ⬆️  طلبات الترقية: نظام متكامل لقبول/رفض طلبات المستخدمين
 * 📊  تتبع التقدم: نظام متكامل لتتبع تقدم الطلاب
 * 💬  الأسئلة والأجوبة: نظام متكامل للإجابة على أسئلة الطلاب
 * 🏆  الشهادات: نظام إنشاء شهادات إنجاز للمستخدمين
 * 📈  التحليلات: نظام متكامل للتقارير والإحصائيات
 * 🔔  الإشعارات: نظام إشعارات فورية للمستخدمين
 * 
 * ================================================================
 */

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

// ================================================================
// 1. الإعدادات الأساسية (Basic Configuration)
// ================================================================

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'deepteachsy_super_secret_key_2024';
const ADMIN_PASSWORD = 'waseemo123janaloveu';

// التحقق من وجود رابط قاعدة البيانات
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI غير موجود في متغيرات البيئة');
    console.error('💡 تأكد من إضافة متغير MONGODB_URI في Render أو ملف .env');
    process.exit(1);
}

// ================================================================
// 2. الاتصال بقاعدة البيانات (Database Connection)
// ================================================================

mongoose
    .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
    })
    .then(() => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        console.log(`📦 قاعدة البيانات: ${mongoose.connection.name}`);
        initDatabase();
        startServer();
    })
    .catch((err) => {
        console.error('❌ فشل الاتصال بقاعدة البيانات:');
        console.error(`   ${err.message}`);
        console.error('💡 تأكد من أن MONGODB_URI صحيح وأن عنوان IP مسموح به');
        process.exit(1);
    });

// ================================================================
// 3. إعدادات Middleware
// ================================================================

/**
 * إعداد الجلسات مع تحسينات الأمان
 */
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 أيام
            sameSite: 'lax',
            path: '/',
        },
        name: 'deepteachsy.sid',
        rolling: true,
    })
);

/**
 * معالجة البيانات المرسلة
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * تسجيل جميع الطلبات
 */
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📡 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ================================================================
// 4. مخططات قاعدة البيانات (Database Schemas)
// ================================================================

/**
 * 4.1 مخطط الامتحان (Exam Schema)
 */
const ExamSchema = new mongoose.Schema(
    {
        questions: [
            {
                question: { type: String, required: true, trim: true },
                options: { type: [String], required: true, validate: [arr => arr.length >= 2, 'يجب أن يكون هناك خياران على الأقل'] },
                correctAnswer: { 
                    type: Number, 
                    required: true,
                    validate: {
                        validator: function(v) {
                            return v >= 0 && v < this.options.length;
                        },
                        message: 'الإجابة الصحيحة غير صالحة'
                    }
                },
                explanation: { type: String, default: '' },
                points: { type: Number, default: 1 }
            },
        ],
        totalPoints: { type: Number, default: 0 },
        passingScore: { type: Number, default: 60 }
    },
    { _id: false }
);

/**
 * 4.2 مخطط السؤال (Question Schema - للأسئلة والأجوبة)
 */
const QuestionSchema = new mongoose.Schema({
    student: { type: String, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    answeredBy: { type: String, default: '' },
    answeredById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    answeredAt: { type: Date, default: null },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

/**
 * 4.3 مخطط الدرس (Lesson Schema)
 */
const LessonSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    video: { type: String, default: '', trim: true },
    videoDuration: { type: Number, default: 0 },
    content: { type: String, default: '' },
    examples: { type: String, default: '' },
    resources: [{ type: String }],
    free: { type: Boolean, default: true },
    exam: { type: ExamSchema, default: () => ({ questions: [], totalPoints: 0, passingScore: 60 }) },
    questions: { type: [QuestionSchema], default: [] },
    order: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 30 } // دقائق
});

/**
 * 4.4 مخطط الوحدة (Unit Schema)
 */
const UnitSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    lessons: { type: [LessonSchema], default: [] },
    exam: { type: ExamSchema, default: () => ({ questions: [], totalPoints: 0, passingScore: 60 }) },
    order: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 120 } // دقائق
});

/**
 * 4.5 مخطط المادة (Subject Schema)
 */
const SubjectSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fa-book' },
    color: { type: String, default: '#c9a04b' },
    units: { type: [UnitSchema], default: [] },
    order: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 360 } // دقائق
});

/**
 * 4.6 مخطط الصف (Grade Schema)
 */
const GradeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subjects: { type: [SubjectSchema], default: [] },
    order: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 720 } // دقائق
});

/**
 * 4.7 مخطط المستخدم (User Schema)
 */
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        phone: { type: String, default: '' },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        role: {
            type: String,
            enum: ['admin', 'student', 'instructor'],
            default: 'student',
        },
        plan: {
            type: String,
            enum: ['free', 'paid'],
            default: 'free',
        },
        subscriptionEnd: {
            type: Date,
            default: null,
        },
        selectedGrades: {
            type: [Number],
            default: [],
        },
        banned: {
            type: Boolean,
            default: false,
        },
        approved: {
            type: Boolean,
            default: true,
        },
        lastLogin: { type: Date, default: null },
        loginCount: { type: Number, default: 0 },
        referralCode: { type: String, default: '' },
        referredBy: { type: String, default: '' },
        settings: {
            language: { type: String, default: 'ar' },
            theme: { type: String, default: 'dark' },
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true }
        }
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    }
);

/**
 * 4.8 مخطط طلبات الترقية (Upgrade Request Schema)
 */
const UpgradeRequestSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    duration: { type: String, default: '1 شهر' },
    selectedGrades: { type: [Number], default: [] },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

/**
 * 4.9 مخطط تقدم المستخدم (User Progress Schema)
 */
const UserProgressSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedLessons: { type: [String], default: [] }, // مفتاح: gradeId_subjectId_unitId_lessonId
    completedUnits: { type: [String], default: [] },
    completedSubjects: { type: [String], default: [] },
    studyTime: { type: Number, default: 0 }, // بالدقائق
    lastActive: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null }
});

/**
 * 4.10 مخطط نتائج الامتحانات (User Scores Schema)
 */
const UserScoreSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    examKey: { type: String, required: true }, // gradeId_subjectId_unitId_lessonId أو gradeId_subjectId_unitId_unit
    examType: { type: String, enum: ['lesson', 'unit', 'subject', 'final'], default: 'lesson' },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    answers: { type: Object, default: {} },
    timeSpent: { type: Number, default: 0 },
    attempts: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

/**
 * 4.11 مخطط الشارات (Badges Schema)
 */
const BadgeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fa-medal' },
    color: { type: String, default: '#c9a04b' },
    criteria: { type: String, default: '' },
    points: { type: Number, default: 10 }
});

const UserBadgeSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    badges: { type: [String], default: [] }
});

/**
 * 4.12 مخطط الإشعارات (Notifications Schema)
 */
const NotificationSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

/**
 * 4.13 مخطط الشهادات (Certificates Schema)
 */
const CertificateSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradeId: { type: Number, required: true },
    gradeName: { type: String, required: true },
    subjectId: { type: Number, required: true },
    subjectName: { type: String, required: true },
    score: { type: Number, required: true },
    certificateNumber: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
});

// ================================================================
// 5. إنشاء النماذج (Models)
// ================================================================

const User = mongoose.model('User', UserSchema);
const Grade = mongoose.model('Grade', GradeSchema);
const UpgradeRequest = mongoose.model('UpgradeRequest', UpgradeRequestSchema);
const UserProgress = mongoose.model('UserProgress', UserProgressSchema);
const UserScore = mongoose.model('UserScore', UserScoreSchema);
const Badge = mongoose.model('Badge', BadgeSchema);
const UserBadge = mongoose.model('UserBadge', UserBadgeSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const Certificate = mongoose.model('Certificate', CertificateSchema);

// ================================================================
// 6. دوال مساعدة (Utility Functions)
// ================================================================

/**
 * الحصول على معرف فريد تلقائي
 */
function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => item.id || 0)) + 1;
}

/**
 * الحصول على المستخدم الحالي من الجلسة
 */
async function getCurrentUser(req) {
    if (!req.session.userId) return null;
    try {
        return await User.findById(req.session.userId);
    } catch {
        return null;
    }
}

/**
 * توليد مفتاح فريد للدرس
 */
function getLessonKey(gradeId, subjectId, unitId, lessonId) {
    return `${gradeId}_${subjectId}_${unitId}_${lessonId}`;
}

/**
 * توليد مفتاح فريد للوحدة
 */
function getUnitKey(gradeId, subjectId, unitId) {
    return `${gradeId}_${subjectId}_${unitId}_unit`;
}

/**
 * توليد مفتاح فريد للمادة
 */
function getSubjectKey(gradeId, subjectId) {
    return `${gradeId}_${subjectId}_subject`;
}

/**
 * توليد رقم شهادة فريد
 */
function generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DTS-${timestamp}-${random}`;
}

/**
 * التحقق من صلاحية الوصول إلى درس
 */
function canAccessLesson(user, lesson) {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'instructor') return true;
    if (lesson.free) return true;
    if (user.plan === 'paid') {
        if (user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
            return false;
        }
        return true;
    }
    return false;
}

/**
 * التحقق من اشتراك المستخدم في صف معين
 */
function isUserInGrade(user, gradeId) {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'instructor') return true;
    if (user.plan === 'free') return true;
    if (user.plan === 'paid') {
        return user.selectedGrades.includes(gradeId);
    }
    return false;
}

// ================================================================
// 7. دوال المصادقة (Auth Middleware)
// ================================================================

/**
 * وسيط التحقق من أن المستخدم مسجل الدخول
 */
async function requireAuth(req, res, next) {
    const user = await getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ 
            success: false,
            error: 'يجب تسجيل الدخول أولاً',
            code: 'UNAUTHORIZED'
        });
    }
    req.user = user;
    next();
}

/**
 * وسيط التحقق من أن المستخدم هو مدير
 */
async function requireAdmin(req, res, next) {
    const user = await getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ 
            success: false,
            error: 'يجب تسجيل الدخول أولاً',
            code: 'UNAUTHORIZED'
        });
    }
    if (user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'غير مصرح: هذه العملية تتطلب صلاحيات المدير',
            code: 'FORBIDDEN'
        });
    }
    req.user = user;
    next();
}

/**
 * وسيط التحقق من أن المستخدم هو مدرب أو مدير
 */
async function requireInstructorOrAdmin(req, res, next) {
    const user = await getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ 
            success: false,
            error: 'يجب تسجيل الدخول أولاً',
            code: 'UNAUTHORIZED'
        });
    }
    if (user.role !== 'admin' && user.role !== 'instructor') {
        return res.status(403).json({ 
            success: false,
            error: 'غير مصرح: هذه العملية تتطلب صلاحيات المدرب',
            code: 'FORBIDDEN'
        });
    }
    req.user = user;
    next();
}

// ================================================================
// 8. مسارات API - المصادقة (Auth Routes)
// ================================================================

/**
 * POST /api/login - تسجيل الدخول
 */
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'يرجى إدخال اسم المستخدم وكلمة المرور',
            });
        }

        const user = await User.findOne({
            $or: [{ username: username }, { email: username }],
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            });
        }

        if (user.banned) {
            return res.status(403).json({
                success: false,
                error: 'تم حظر هذا الحساب. يرجى التواصل مع الدعم',
            });
        }

        if (!user.approved) {
            return res.status(403).json({
                success: false,
                error: 'بانتظار موافقة المدير',
            });
        }

        // التحقق من انتهاء الاشتراك المدفوع
        if (user.plan === 'paid' && user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
            user.plan = 'free';
            user.subscriptionEnd = null;
            user.selectedGrades = [];
            await user.save();
            console.log(`🔄 تم تحويل المستخدم ${user.username} إلى مجاني (انتهى الاشتراك)`);
        }

        // تحديث آخر تسجيل دخول
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        console.log(`✅ تسجيل الدخول: ${user.username} (${user.role})`);

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                avatar: user.avatar,
                bio: user.bio,
                selectedGrades: user.selectedGrades,
                subscriptionEnd: user.subscriptionEnd,
                settings: user.settings
            },
        });
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً',
        });
    }
});

/**
 * POST /api/logout - تسجيل الخروج
 */
app.post('/api/logout', (req, res) => {
    const username = req.session.username;
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ خطأ في تسجيل الخروج:', err);
            return res.status(500).json({
                success: false,
                error: 'فشل تسجيل الخروج',
            });
        }
        console.log(`✅ تسجيل الخروج: ${username || 'مستخدم غير معروف'}`);
        res.json({ success: true });
    });
});

/**
 * GET /api/current-user - الحصول على المستخدم الحالي
 */
app.get('/api/current-user', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.json({ user: null });
        }
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                avatar: user.avatar,
                bio: user.bio,
                selectedGrades: user.selectedGrades,
                subscriptionEnd: user.subscriptionEnd,
                settings: user.settings
            },
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدم الحالي:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في الخادم',
        });
    }
});

/**
 * POST /api/register - تسجيل مستخدم جديد
 */
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, firstName, lastName, phone, selectedGrades, plan } = req.body;

        const errors = [];
        if (!username || username.length < 3) errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        if (!email || !email.includes('@')) errors.push('البريد الإلكتروني غير صحيح');
        if (!password || password.length < 6) errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        if (password !== confirmPassword) errors.push('كلمة المرور وتأكيدها غير متطابقين');

        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors.join('، ') });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل',
            });
        }

        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone?.trim() || '',
            plan: plan || 'free',
            selectedGrades: plan === 'paid' ? selectedGrades || [] : [],
            approved: plan === 'free',
            role: 'student',
            settings: {
                language: 'ar',
                theme: 'dark',
                emailNotifications: true,
                pushNotifications: true
            }
        });

        await newUser.save();

        // إنشاء تقدم للمستخدم
        await new UserProgress({
            username: newUser.username,
            userId: newUser._id,
            completedLessons: [],
            completedUnits: [],
            completedSubjects: [],
            studyTime: 0,
            streak: 0
        }).save();

        console.log(`✅ حساب جديد: ${newUser.username} (${newUser.plan})`);

        if (plan === 'free') {
            req.session.userId = newUser._id;
            req.session.username = newUser.username;
            req.session.role = newUser.role;

            return res.status(201).json({
                success: true,
                message: 'تم التسجيل وتسجيل الدخول تلقائياً',
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    role: newUser.role,
                    plan: newUser.plan,
                    phone: newUser.phone,
                    selectedGrades: newUser.selectedGrades,
                    settings: newUser.settings
                },
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم التسجيل، بانتظار موافقة المدير',
            user: null,
        });
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً',
        });
    }
});

/**
 * PUT /api/users/profile - تحديث الملف الشخصي
 */
app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, phone, bio, settings } = req.body;
        const user = req.user;

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (bio !== undefined) user.bio = bio;
        if (settings) user.settings = { ...user.settings, ...settings };

        await user.save();

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                avatar: user.avatar,
                bio: user.bio,
                selectedGrades: user.selectedGrades,
                settings: user.settings
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الملف الشخصي:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/users/change-password - تغيير كلمة المرور
 */
app.post('/api/users/change-password', requireAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;

        if (user.password !== oldPassword) {
            return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 9. مسارات API - إدارة المستخدمين (للمدير فقط)
// ================================================================

/**
 * GET /api/admin/users - جلب جميع المستخدمين
 */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).sort({ username: 1 });
        res.json(users);
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        res.status(500).json({ 
            success: false,
            error: 'حدث خطأ في الخادم' 
        });
    }
});

/**
 * GET /api/admin/users/:id - جلب مستخدم محدد
 */
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/users/:id - تحديث بيانات المستخدم
 */
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone, plan, selectedGrades, subscriptionDuration, banned, approved, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        if (username) user.username = username.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (password) user.password = password;
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone.trim();
        if (role) user.role = role;

        if (plan) {
            user.plan = plan;
            if (plan === 'free') {
                user.subscriptionEnd = null;
                user.selectedGrades = [];
            } else if (plan === 'paid' && subscriptionDuration) {
                const now = new Date();
                user.subscriptionEnd = new Date(now.setMonth(now.getMonth() + parseInt(subscriptionDuration)));
                if (selectedGrades !== undefined) {
                    user.selectedGrades = selectedGrades;
                }
            }
        }

        if (banned !== undefined) user.banned = banned;
        if (approved !== undefined) user.approved = approved;

        await user.save();

        // إضافة إشعار للمستخدم
        if (banned !== undefined) {
            await new Notification({
                username: user.username,
                userId: user._id,
                title: banned ? 'تم حظر حسابك' : 'تم إلغاء حظر حسابك',
                message: banned ? 'تم حظر حسابك من قبل الإدارة' : 'تم إلغاء حظر حسابك من قبل الإدارة',
                type: banned ? 'error' : 'success',
                read: false
            }).save();
        }

        if (plan === 'paid' && subscriptionDuration) {
            await new Notification({
                username: user.username,
                userId: user._id,
                title: 'تم ترقية حسابك',
                message: `تم ترقية حسابك إلى الخطة المدفوعة لمدة ${subscriptionDuration} شهراً`,
                type: 'success',
                read: false
            }).save();
        }

        console.log(`✅ تم تحديث المستخدم: ${user.username}`);

        res.json({
            success: true,
            message: 'تم تحديث بيانات المستخدم',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                selectedGrades: user.selectedGrades,
                subscriptionEnd: user.subscriptionEnd,
                banned: user.banned,
                approved: user.approved,
            },
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المستخدم:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/users/:id/ban - تبديل حالة الحظر
 */
app.put('/api/admin/users/:id/ban', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        user.banned = !user.banned;
        await user.save();

        await new Notification({
            username: user.username,
            userId: user._id,
            title: user.banned ? 'تم حظر حسابك' : 'تم إلغاء حظر حسابك',
            message: user.banned ? 'تم حظر حسابك من قبل الإدارة' : 'تم إلغاء حظر حسابك من قبل الإدارة',
            type: user.banned ? 'error' : 'success',
            read: false
        }).save();

        console.log(`🔄 ${user.banned ? 'حظر' : 'إلغاء حظر'} المستخدم: ${user.username}`);
        res.json({ success: true, banned: user.banned });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/admin/users/:id - حذف المستخدم
 */
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'لا يمكن حذف حساب المدير' });
        }
        await User.findByIdAndDelete(req.params.id);
        await UserProgress.deleteOne({ userId: req.params.id });
        await UserScore.deleteMany({ userId: req.params.id });
        await UserBadge.deleteOne({ userId: req.params.id });
        await Notification.deleteMany({ userId: req.params.id });
        await Certificate.deleteMany({ userId: req.params.id });

        console.log(`🗑️ تم حذف المستخدم: ${user.username}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 10. مسارات API - طلبات الترقية
// ================================================================

/**
 * GET /api/upgrade-requests - جلب جميع طلبات الترقية (للمدير)
 */
app.get('/api/upgrade-requests', requireAdmin, async (req, res) => {
    try {
        const requests = await UpgradeRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('❌ خطأ في جلب طلبات الترقية:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/upgrade-request - تقديم طلب ترقية (للمستخدم)
 */
app.post('/api/upgrade-request', requireAuth, async (req, res) => {
    try {
        const { fullName, phone, duration, selectedGrades, notes } = req.body;
        const user = req.user;

        if (user.plan === 'paid') {
            return res.status(400).json({ error: 'أنت مشترك بالفعل في الخطة المدفوعة' });
        }

        const existing = await UpgradeRequest.findOne({ username: user.username, status: 'pending' });
        if (existing) {
            return res.status(400).json({ error: 'لديك طلب ترقية قيد الانتظار' });
        }

        const request = new UpgradeRequest({
            username: user.username,
            userId: user._id,
            fullName: fullName || user.username,
            phone: phone || user.phone || '',
            duration: duration || '1 شهر',
            selectedGrades: selectedGrades || [],
            notes: notes || '',
            status: 'pending'
        });
        await request.save();

        // إضافة إشعار للمدير
        await new Notification({
            username: 'admin',
            title: '📨 طلب ترقية جديد',
            message: `طلب ترقية جديد من المستخدم ${user.username}`,
            type: 'info',
            read: false,
            link: '/admin-users'
        }).save();

        console.log(`📨 طلب ترقية جديد من ${user.username}`);
        res.json({ message: 'تم إرسال طلب الترقية بنجاح، بانتظار موافقة المدير' });
    } catch (error) {
        console.error('❌ خطأ في تقديم طلب الترقية:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/upgrade-request/approve - الموافقة على طلب ترقية (للمدير)
 */
app.put('/api/upgrade-request/approve', requireAdmin, async (req, res) => {
    try {
        const { username, duration } = req.body;
        const request = await UpgradeRequest.findOne({ username, status: 'pending' });
        if (!request) {
            return res.status(404).json({ error: 'لا يوجد طلب معلق لهذا المستخدم' });
        }

        request.status = 'approved';
        request.approvedAt = new Date();
        await request.save();

        const user = await User.findOne({ username });
        if (user) {
            const months = parseInt(duration) || 1;
            user.plan = 'paid';
            const now = new Date();
            user.subscriptionEnd = new Date(now.setMonth(now.getMonth() + months));
            if (request.selectedGrades && request.selectedGrades.length > 0) {
                user.selectedGrades = request.selectedGrades;
            }
            await user.save();

            // إضافة إشعار للمستخدم
            await new Notification({
                username: user.username,
                userId: user._id,
                title: '✅ تمت الموافقة على طلب الترقية',
                message: `تمت الموافقة على طلب الترقية لمدة ${months} شهراً. يمكنك الآن الوصول إلى الدروس المدفوعة.`,
                type: 'success',
                read: false
            }).save();

            console.log(`✅ تمت الموافقة على ترقية المستخدم ${username}`);
        }

        res.json({ message: `تمت الموافقة على ترقية المستخدم ${username} بنجاح` });
    } catch (error) {
        console.error('❌ خطأ في الموافقة على الترقية:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/upgrade-request/:username - رفض طلب ترقية (للمدير)
 */
app.delete('/api/upgrade-request/:username', requireAdmin, async (req, res) => {
    try {
        const result = await UpgradeRequest.deleteOne({ 
            username: req.params.username, 
            status: 'pending' 
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'لا يوجد طلب معلق لهذا المستخدم' });
        }

        // إضافة إشعار للمستخدم
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            await new Notification({
                username: user.username,
                userId: user._id,
                title: '❌ تم رفض طلب الترقية',
                message: 'تم رفض طلب الترقية من قبل الإدارة',
                type: 'error',
                read: false
            }).save();
        }

        console.log(`❌ تم رفض طلب ترقية المستخدم ${req.params.username}`);
        res.json({ success: true, message: 'تم رفض طلب الترقية' });
    } catch (error) {
        console.error('❌ خطأ في رفض طلب الترقية:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 11. مسارات API - إدارة المحتوى (العام)
// ================================================================

/**
 * GET /api/grades - جلب جميع الصفوف (للجميع)
 */
app.get('/api/grades', async (req, res) => {
    try {
        const grades = await Grade.find().sort({ order: 1, id: 1 });
        res.json(grades);
    } catch (error) {
        console.error('❌ خطأ في جلب الصفوف:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/grades/:id - جلب صف محدد
 */
app.get('/api/grades/:id', async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: parseInt(req.params.id) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }
        res.json(grade);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/grades/:id/content - جلب محتوى الصف (مع صلاحيات)
 */
app.get('/api/grades/:id/content', async (req, res) => {
    try {
        const gradeId = parseInt(req.params.id);
        const grade = await Grade.findOne({ id: gradeId });

        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const user = await getCurrentUser(req);

        // إذا لم يكن المستخدم مسجلاً
        if (!user) {
            const publicData = {
                id: grade.id,
                name: grade.name,
                description: grade.description,
                subjects: grade.subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    icon: s.icon,
                    color: s.color,
                    units: s.units.map((u) => ({
                        id: u.id,
                        name: u.name,
                        description: u.description,
                        lessons: u.lessons.map((l) => ({
                            id: l.id,
                            title: l.title,
                            subtitle: l.subtitle,
                            free: l.free,
                            locked: true,
                            estimatedTime: l.estimatedTime
                        })),
                    })),
                })),
            };
            return res.json(publicData);
        }

        // المستخدم مسجل
        const isAdmin = user.role === 'admin';
        const isInstructor = user.role === 'instructor';
        const isPaid = user.plan === 'paid' && (!user.subscriptionEnd || new Date() <= new Date(user.subscriptionEnd));
        const userInGrade = isAdmin || isInstructor || user.selectedGrades.includes(grade.id) || user.plan === 'free';

        const contentData = {
            id: grade.id,
            name: grade.name,
            description: grade.description,
            subjects: grade.subjects.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                icon: s.icon,
                color: s.color,
                units: s.units.map((u) => ({
                    id: u.id,
                    name: u.name,
                    description: u.description,
                    lessons: u.lessons.map((l) => {
                        const canAccess = isAdmin || isInstructor || l.free || (isPaid && userInGrade);
                        return {
                            id: l.id,
                            title: l.title,
                            subtitle: l.subtitle,
                            free: l.free,
                            locked: !canAccess,
                            estimatedTime: l.estimatedTime,
                            content: canAccess
                                ? {
                                      video: l.video,
                                      videoDuration: l.videoDuration,
                                      content: l.content,
                                      examples: l.examples,
                                      resources: l.resources,
                                      exam: l.exam,
                                  }
                                : null,
                        };
                    }),
                    exam: isAdmin || isInstructor || (isPaid && userInGrade) ? u.exam : null,
                })),
            })),
        };

        res.json(contentData);
    } catch (error) {
        console.error('❌ خطأ في جلب محتوى الصف:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 12. مسارات API - إدارة الصفوف (للمدير فقط)
// ================================================================

app.post('/api/admin/grades', requireAdmin, async (req, res) => {
    try {
        const { name, description, order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'اسم الصف مطلوب' });
        }

        const last = await Grade.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;
        const grade = new Grade({ 
            id: newId, 
            name: name.trim(), 
            description: description || '',
            subjects: [],
            order: order || 0
        });
        await grade.save();

        console.log(`✅ تم إضافة الصف: ${grade.name} (ID: ${grade.id})`);
        res.status(201).json({ success: true, grade });
    } catch (error) {
        console.error('❌ خطأ في إضافة الصف:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.put('/api/admin/grades/:id', requireAdmin, async (req, res) => {
    try {
        const { name, description, order } = req.body;
        const grade = await Grade.findOne({ id: parseInt(req.params.id) });

        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        if (name && name.trim()) {
            grade.name = name.trim();
        }
        if (description !== undefined) grade.description = description;
        if (order !== undefined) grade.order = order;

        await grade.save();
        console.log(`✅ تم تعديل الصف: ${grade.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.delete('/api/admin/grades/:id', requireAdmin, async (req, res) => {
    try {
        const result = await Grade.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }
        console.log(`🗑️ تم حذف الصف ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 13. مسارات API - إدارة المواد (للمدير فقط)
// ================================================================

app.post('/api/admin/grades/:gradeId/subjects', requireAdmin, async (req, res) => {
    try {
        const { name, description, icon, color, order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'اسم المادة مطلوب' });
        }

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const newId = getNextId(grade.subjects);
        grade.subjects.push({ 
            id: newId, 
            name: name.trim(), 
            description: description || '',
            icon: icon || 'fa-book',
            color: color || '#c9a04b',
            units: [],
            order: order || 0
        });
        await grade.save();

        const subject = grade.subjects.find(s => s.id === newId);

        console.log(`✅ تم إضافة المادة: ${name} (الصف ${grade.name})`);
        res.status(201).json({ success: true, grade, subject });
    } catch (error) {
        console.error('❌ خطأ في إضافة المادة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.put('/api/admin/grades/:gradeId/subjects/:subjectId', requireAdmin, async (req, res) => {
    try {
        const { name, description, icon, color, order } = req.body;
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        if (name && name.trim()) subject.name = name.trim();
        if (description !== undefined) subject.description = description;
        if (icon !== undefined) subject.icon = icon;
        if (color !== undefined) subject.color = color;
        if (order !== undefined) subject.order = order;

        await grade.save();
        console.log(`✅ تم تعديل المادة: ${subject.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.delete('/api/admin/grades/:gradeId/subjects/:subjectId', requireAdmin, async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subjectId = parseInt(req.params.subjectId);
        const subject = grade.subjects.find((s) => s.id === subjectId);
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        grade.subjects = grade.subjects.filter((s) => s.id !== subjectId);
        await grade.save();

        console.log(`🗑️ تم حذف المادة: ${subject.name}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 14. مسارات API - إدارة الوحدات (للمدير فقط)
// ================================================================

app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units', requireAdmin, async (req, res) => {
    try {
        const { name, description, order } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'اسم الوحدة مطلوب' });
        }

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const newId = getNextId(subject.units);
        subject.units.push({ 
            id: newId, 
            name: name.trim(), 
            description: description || '',
            lessons: [], 
            exam: { questions: [], totalPoints: 0, passingScore: 60 },
            order: order || 0
        });
        await grade.save();

        const unit = subject.units.find(u => u.id === newId);

        console.log(`✅ تم إضافة الوحدة: ${name} (المادة ${subject.name})`);
        res.status(201).json({ success: true, grade, unit });
    } catch (error) {
        console.error('❌ خطأ في إضافة الوحدة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId', requireAdmin, async (req, res) => {
    try {
        const { name, description, order } = req.body;
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unit = subject.units.find((u) => u.id === parseInt(req.params.unitId));
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        if (name && name.trim()) unit.name = name.trim();
        if (description !== undefined) unit.description = description;
        if (order !== undefined) unit.order = order;

        await grade.save();
        console.log(`✅ تم تعديل الوحدة: ${unit.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.delete('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId', requireAdmin, async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unitId = parseInt(req.params.unitId);
        const unit = subject.units.find((u) => u.id === unitId);
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        subject.units = subject.units.filter((u) => u.id !== unitId);
        await grade.save();

        console.log(`🗑️ تم حذف الوحدة: ${unit.name}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 15. مسارات API - إدارة الدروس (للمدير فقط)
// ================================================================

app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons', requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, video, videoDuration, content, examples, resources, free, exam, order, estimatedTime } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'عنوان الدرس مطلوب' });
        }

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unit = subject.units.find((u) => u.id === parseInt(req.params.unitId));
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const newId = getNextId(unit.lessons);
        unit.lessons.push({
            id: newId,
            title: title.trim(),
            subtitle: subtitle || '',
            video: video || '',
            videoDuration: videoDuration || 0,
            content: content || '',
            examples: examples || '',
            resources: resources || [],
            free: free !== undefined ? free : true,
            exam: exam || { questions: [], totalPoints: 0, passingScore: 60 },
            questions: [],
            order: order || 0,
            estimatedTime: estimatedTime || 30
        });

        await grade.save();

        const lesson = unit.lessons.find(l => l.id === newId);

        console.log(`✅ تم إضافة الدرس: ${title.trim()} (الوحدة ${unit.name})`);
        res.status(201).json({ success: true, grade, lesson });
    } catch (error) {
        console.error('❌ خطأ في إضافة الدرس:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId', requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, video, videoDuration, content, examples, resources, free, exam, order, estimatedTime } = req.body;

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unit = subject.units.find((u) => u.id === parseInt(req.params.unitId));
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const lesson = unit.lessons.find((l) => l.id === parseInt(req.params.lessonId));
        if (!lesson) {
            return res.status(404).json({ error: 'الدرس غير موجود' });
        }

        if (title !== undefined) lesson.title = title.trim();
        if (subtitle !== undefined) lesson.subtitle = subtitle;
        if (video !== undefined) lesson.video = video;
        if (videoDuration !== undefined) lesson.videoDuration = videoDuration;
        if (content !== undefined) lesson.content = content;
        if (examples !== undefined) lesson.examples = examples;
        if (resources !== undefined) lesson.resources = resources;
        if (free !== undefined) lesson.free = free;
        if (exam !== undefined) lesson.exam = exam;
        if (order !== undefined) lesson.order = order;
        if (estimatedTime !== undefined) lesson.estimatedTime = estimatedTime;

        await grade.save();

        console.log(`✅ تم تعديل الدرس: ${lesson.title}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

app.delete('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId', requireAdmin, async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unit = subject.units.find((u) => u.id === parseInt(req.params.unitId));
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const lessonId = parseInt(req.params.lessonId);
        const lesson = unit.lessons.find((l) => l.id === lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'الدرس غير موجود' });
        }

        unit.lessons = unit.lessons.filter((l) => l.id !== lessonId);
        await grade.save();

        console.log(`🗑️ تم حذف الدرس: ${lesson.title}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 16. مسارات API - امتحان الوحدة (للمدير فقط)
// ================================================================

app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/exam', requireAdmin, async (req, res) => {
    try {
        const { exam } = req.body;

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        const unit = subject.units.find((u) => u.id === parseInt(req.params.unitId));
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        unit.exam = exam || { questions: [], totalPoints: 0, passingScore: 60 };
        await grade.save();

        console.log(`✅ تم تحديث امتحان الوحدة: ${unit.name}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 17. مسارات API - الأسئلة والأجوبة
// ================================================================

/**
 * GET /api/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions
 * جلب أسئلة درس معين
 */
app.get('/api/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions', async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        const subject = grade.subjects.find(s => s.id === parseInt(req.params.subjectId));
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });
        const unit = subject.units.find(u => u.id === parseInt(req.params.unitId));
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });
        const lesson = unit.lessons.find(l => l.id === parseInt(req.params.lessonId));
        if (!lesson) return res.status(404).json({ error: 'الدرس غير موجود' });
        res.json(lesson.questions || []);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions
 * إضافة سؤال جديد
 */
app.post('/api/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions', requireAuth, async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'نص السؤال مطلوب' });
        }

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        const subject = grade.subjects.find(s => s.id === parseInt(req.params.subjectId));
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });
        const unit = subject.units.find(u => u.id === parseInt(req.params.unitId));
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });
        const lesson = unit.lessons.find(l => l.id === parseInt(req.params.lessonId));
        if (!lesson) return res.status(404).json({ error: 'الدرس غير موجود' });

        if (!lesson.questions) lesson.questions = [];
        lesson.questions.push({
            student: req.user.username,
            studentId: req.user._id,
            question: question.trim(),
            answer: '',
            answeredBy: '',
            answeredById: null,
            answeredAt: null,
            upvotes: 0,
            downvotes: 0,
            isAnswered: false,
            createdAt: new Date()
        });
        await grade.save();

        const newQuestion = lesson.questions[lesson.questions.length - 1];

        // إضافة إشعار للمدير
        await new Notification({
            username: 'admin',
            title: '💬 سؤال جديد',
            message: `سؤال جديد من ${req.user.username} في الدرس "${lesson.title}"`,
            type: 'info',
            read: false,
            link: `/grades/${req.params.gradeId}/subjects/${req.params.subjectId}/units/${req.params.unitId}/lessons/${req.params.lessonId}`
        }).save();

        res.status(201).json({ success: true, question: newQuestion });
    } catch (error) {
        console.error('❌ خطأ في إضافة السؤال:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions/:questionIndex
 * إجابة سؤال (للمدير فقط)
 */
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId/questions/:questionIndex', requireAdmin, async (req, res) => {
    try {
        const { answer } = req.body;
        if (!answer || !answer.trim()) {
            return res.status(400).json({ error: 'نص الإجابة مطلوب' });
        }

        const index = parseInt(req.params.questionIndex);
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        const subject = grade.subjects.find(s => s.id === parseInt(req.params.subjectId));
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });
        const unit = subject.units.find(u => u.id === parseInt(req.params.unitId));
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });
        const lesson = unit.lessons.find(l => l.id === parseInt(req.params.lessonId));
        if (!lesson) return res.status(404).json({ error: 'الدرس غير موجود' });
        if (!lesson.questions || index >= lesson.questions.length) {
            return res.status(404).json({ error: 'السؤال غير موجود' });
        }

        lesson.questions[index].answer = answer.trim();
        lesson.questions[index].answeredBy = req.user.username;
        lesson.questions[index].answeredById = req.user._id;
        lesson.questions[index].answeredAt = new Date();
        lesson.questions[index].isAnswered = true;
        await grade.save();

        // إضافة إشعار للطالب
        const student = lesson.questions[index].student;
        if (student) {
            await new Notification({
                username: student,
                title: '✅ تمت الإجابة على سؤالك',
                message: `تمت الإجابة على سؤالك في الدرس "${lesson.title}"`,
                type: 'success',
                read: false,
                link: `/grades/${req.params.gradeId}/subjects/${req.params.subjectId}/units/${req.params.unitId}/lessons/${req.params.lessonId}`
            }).save();
        }

        console.log(`✅ تمت الإجابة على سؤال في الدرس ${lesson.title}`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ خطأ في الإجابة على السؤال:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 18. مسارات API - تقدم المستخدم ونتائجه
// ================================================================

/**
 * GET /api/user-progress/:username - جلب تقدم المستخدم
 */
app.get('/api/user-progress/:username', async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ username: req.params.username });
        res.json(progress || { completedLessons: [], completedUnits: [], completedSubjects: [], studyTime: 0, streak: 0 });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/user-progress - تحديث تقدم المستخدم
 */
app.post('/api/user-progress', requireAuth, async (req, res) => {
    try {
        const { lessonKey, unitKey, subjectKey, timeSpent } = req.body;
        
        let progress = await UserProgress.findOne({ username: req.user.username });
        if (!progress) {
            progress = new UserProgress({ 
                username: req.user.username, 
                userId: req.user._id,
                completedLessons: [], 
                completedUnits: [], 
                completedSubjects: [],
                studyTime: 0,
                streak: 0
            });
        }

        // تحديث وقت الدراسة
        if (timeSpent) {
            progress.studyTime = (progress.studyTime || 0) + timeSpent;
        }

        // تحديث الدروس المكتملة
        if (lessonKey && !progress.completedLessons.includes(lessonKey)) {
            progress.completedLessons.push(lessonKey);
        }

        // تحديث الوحدات المكتملة
        if (unitKey && !progress.completedUnits.includes(unitKey)) {
            progress.completedUnits.push(unitKey);
        }

        // تحديث المواد المكتملة
        if (subjectKey && !progress.completedSubjects.includes(subjectKey)) {
            progress.completedSubjects.push(subjectKey);
        }

        // تحديث آخر نشاط
        const today = new Date().toDateString();
        const lastActive = progress.lastActivityDate ? new Date(progress.lastActivityDate).toDateString() : null;
        
        if (lastActive === today) {
            // نفس اليوم
        } else if (lastActive && new Date(lastActive).getTime() === new Date(today).getTime() - 86400000) {
            // يوم متتالي
            progress.streak = (progress.streak || 0) + 1;
        } else {
            progress.streak = 0;
        }
        
        progress.lastActivityDate = new Date();
        progress.lastActive = new Date();

        await progress.save();

        // منح شارات تلقائياً
        await checkAndAwardBadges(req.user.username, progress);

        res.json({ 
            success: true, 
            progress: {
                completedLessons: progress.completedLessons,
                completedUnits: progress.completedUnits,
                completedSubjects: progress.completedSubjects,
                studyTime: progress.studyTime,
                streak: progress.streak
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث تقدم المستخدم:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/user-score - تسجيل نتيجة امتحان
 */
app.post('/api/user-score', requireAuth, async (req, res) => {
    try {
        const { examKey, examType, score, totalPoints, passed, answers, timeSpent } = req.body;
        if (!examKey || score === undefined) {
            return res.status(400).json({ error: 'بيانات غير كاملة' });
        }

        // حساب عدد المحاولات
        const existingScores = await UserScore.find({ 
            username: req.user.username, 
            examKey: examKey 
        });
        const attempts = existingScores.length + 1;

        await new UserScore({
            username: req.user.username,
            userId: req.user._id,
            examKey,
            examType: examType || 'lesson',
            score,
            totalPoints,
            passed,
            answers: answers || {},
            timeSpent: timeSpent || 0,
            attempts
        }).save();

        // تحديث التقدم إذا نجح
        if (passed) {
            const parts = examKey.split('_');
            let progress = await UserProgress.findOne({ username: req.user.username });
            if (!progress) {
                progress = new UserProgress({ 
                    username: req.user.username, 
                    userId: req.user._id,
                    completedLessons: [], 
                    completedUnits: [], 
                    completedSubjects: [],
                    studyTime: 0,
                    streak: 0
                });
            }

            if (examType === 'lesson' && parts.length === 4) {
                const lessonKey = examKey;
                if (!progress.completedLessons.includes(lessonKey)) {
                    progress.completedLessons.push(lessonKey);
                }
            } else if (examType === 'unit' && parts.length === 3) {
                const unitKey = examKey;
                if (!progress.completedUnits.includes(unitKey)) {
                    progress.completedUnits.push(unitKey);
                }
            }

            await progress.save();
            await checkAndAwardBadges(req.user.username, progress);
        }

        // إضافة إشعار عند تحقيق إنجاز
        if (passed && score >= 90) {
            await new Notification({
                username: req.user.username,
                userId: req.user._id,
                title: '🏆 إنجاز ممتاز!',
                message: `حصلت على ${score}% في الامتحان! أداء رائع!`,
                type: 'success',
                read: false
            }).save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ خطأ في تسجيل نتيجة الامتحان:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/scores/:username - جلب نتائج المستخدم
 */
app.get('/api/scores/:username', async (req, res) => {
    try {
        const scores = await UserScore.find({ username: req.params.username }).sort({ createdAt: -1 });
        const result = {};
        scores.forEach(s => {
            if (!result[s.examKey]) result[s.examKey] = [];
            result[s.examKey].push(s.score);
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 19. مسارات API - الشارات
// ================================================================

/**
 * التحقق ومنح الشارات
 */
async function checkAndAwardBadges(username, progress) {
    const userBadge = await UserBadge.findOne({ username });
    let badges = userBadge ? userBadge.badges : [];
    
    // شارات الدروس
    const completedCount = progress.completedLessons.length;
    const badgeMap = {
        5: '5_lessons',
        10: '10_lessons',
        25: '25_lessons',
        50: '50_lessons',
        100: '100_lessons'
    };

    let awarded = false;
    for (const [count, badgeName] of Object.entries(badgeMap)) {
        if (completedCount >= parseInt(count) && !badges.includes(badgeName)) {
            badges.push(badgeName);
            awarded = true;
            
            await new Notification({
                username,
                title: '🏆 شارة جديدة!',
                message: `تهانينا! حصلت على شارة "${badgeName}" لإتمام ${count} دروس`,
                type: 'success',
                read: false
            }).save();
        }
    }

    // شارة المثابرة (7 أيام متتالية)
    if (progress.streak >= 7 && !badges.includes('7_day_streak')) {
        badges.push('7_day_streak');
        awarded = true;
        await new Notification({
            username,
            title: '🏆 شارة جديدة!',
            message: 'تهانينا! حصلت على شارة "المثابرة" لمواصلتك التعلم 7 أيام متتالية',
            type: 'success',
            read: false
        }).save();
    }

    if (awarded) {
        if (!userBadge) {
            await new UserBadge({ username, userId: progress.userId, badges }).save();
        } else {
            userBadge.badges = badges;
            await userBadge.save();
        }
    }
}

/**
 * GET /api/badges/:username - جلب شارات المستخدم
 */
app.get('/api/badges/:username', async (req, res) => {
    try {
        const badge = await UserBadge.findOne({ username: req.params.username });
        res.json(badge ? badge.badges : []);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/badges/all - جلب جميع الشارات المتاحة
 */
app.get('/api/badges/all', async (req, res) => {
    try {
        const badges = await Badge.find();
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 20. مسارات API - الشهادات
// ================================================================

/**
 * GET /api/certificates/:username - جلب شهادات المستخدم
 */
app.get('/api/certificates/:username', async (req, res) => {
    try {
        const certificates = await Certificate.find({ username: req.params.username }).sort({ issuedAt: -1 });
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * POST /api/certificates/generate - إنشاء شهادة جديدة
 */
app.post('/api/certificates/generate', requireAuth, async (req, res) => {
    try {
        const { gradeId, subjectId } = req.body;
        
        const grade = await Grade.findOne({ id: gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        
        const subject = grade.subjects.find(s => s.id === subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        // التحقق من إتمام المادة
        const progress = await UserProgress.findOne({ username: req.user.username });
        const subjectKey = `${gradeId}_${subjectId}_subject`;
        if (!progress || !progress.completedSubjects.includes(subjectKey)) {
            return res.status(400).json({ error: 'لم تقم بإكمال جميع دروس هذه المادة بعد' });
        }

        // التحقق من عدم وجود شهادة مسبقة
        const existing = await Certificate.findOne({
            username: req.user.username,
            gradeId,
            subjectId
        });

        if (existing) {
            return res.status(400).json({ error: 'لديك بالفعل شهادة لهذه المادة' });
        }

        // حساب متوسط الدرجات
        const scores = await UserScore.find({
            username: req.user.username,
            examKey: { $regex: `^${gradeId}_${subjectId}` }
        });
        const avgScore = scores.length > 0 
            ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length 
            : 0;

        const certificate = new Certificate({
            username: req.user.username,
            userId: req.user._id,
            gradeId,
            gradeName: grade.name,
            subjectId,
            subjectName: subject.name,
            score: Math.round(avgScore),
            certificateNumber: generateCertificateNumber(),
            issuedAt: new Date()
        });

        await certificate.save();

        await new Notification({
            username: req.user.username,
            userId: req.user._id,
            title: '🎓 شهادة جديدة!',
            message: `تهانينا! حصلت على شهادة إتمام مادة "${subject.name}"`,
            type: 'success',
            read: false
        }).save();

        res.json({ 
            success: true, 
            certificate,
            message: 'تم إنشاء الشهادة بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء الشهادة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/certificates/:id/download - تحميل الشهادة
 */
app.get('/api/certificates/:id/download', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ certificateNumber: req.params.id });
        if (!certificate) {
            return res.status(404).json({ error: 'الشهادة غير موجودة' });
        }

        // في النسخة الكاملة، سيتم إنشاء PDF
        res.json({
            success: true,
            certificate,
            message: 'سيتم إضافة تحميل PDF قريباً'
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل الشهادة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 21. مسارات API - الإشعارات
// ================================================================

/**
 * GET /api/notifications - جلب إشعارات المستخدم
 */
app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            $or: [
                { username: req.user.username },
                { username: 'admin' }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(50);
        
        // تحديث عدد الإشعارات غير المقروءة
        const unreadCount = notifications.filter(n => !n.read).length;
        
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('❌ خطأ في جلب الإشعارات:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/notifications/:id/read - تحديد إشعار كمقروء
 */
app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'الإشعار غير موجود' });
        }
        if (notification.username !== req.user.username && notification.username !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        notification.read = true;
        await notification.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/notifications/read-all - تحديد جميع الإشعارات كمقروءة
 */
app.put('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
        await Notification.updateMany(
            { username: req.user.username, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 22. مسارات API - التحليلات والتقارير
// ================================================================

/**
 * GET /api/analytics/users/:username - إحصائيات المستخدم
 */
app.get('/api/analytics/users/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const progress = await UserProgress.findOne({ username });
        const scores = await UserScore.find({ username });
        const certificates = await Certificate.find({ username });
        const badges = await UserBadge.findOne({ username });

        const totalExams = scores.length;
        const passedExams = scores.filter(s => s.passed).length;
        const avgScore = totalExams > 0 
            ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalExams)
            : 0;

        res.json({
            username,
            progress: progress || { completedLessons: 0, studyTime: 0, streak: 0 },
            stats: {
                totalExams,
                passedExams,
                avgScore,
                certificates: certificates.length,
                badges: badges ? badges.badges.length : 0
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات المستخدم:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * GET /api/analytics/report - تقرير شامل للمنصة
 */
app.get('/api/analytics/report', requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'student' });
        const paidUsers = await User.countDocuments({ plan: 'paid' });
        const totalGrades = await Grade.countDocuments();
        const totalLessons = await Grade.aggregate([
            { $unwind: '$subjects' },
            { $unwind: '$subjects.units' },
            { $unwind: '$subjects.units.lessons' },
            { $count: 'total' }
        ]);

        const report = {
            totalUsers,
            paidUsers,
            freeUsers: totalUsers - paidUsers,
            totalGrades,
            totalLessons: totalLessons.length > 0 ? totalLessons[0].total : 0,
            generatedAt: new Date()
        };

        res.json(report);
    } catch (error) {
        console.error('❌ خطأ في جلب التقرير:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 23. مسارات API - البحث
// ================================================================

/**
 * GET /api/search - البحث في المحتوى
 */
app.get('/api/search', async (req, res) => {
    try {
        const { q, type, page = 1, limit = 20 } = req.query;
        if (!q || q.length < 2) {
            return res.json({ results: [], total: 0 });
        }

        const searchRegex = new RegExp(q, 'i');
        const results = [];
        const grades = await Grade.find();

        for (const grade of grades) {
            // البحث في الصفوف
            if (grade.name.match(searchRegex)) {
                results.push({
                    id: grade.id,
                    title: grade.name,
                    subtitle: 'صف دراسي',
                    type: 'grade',
                    icon: 'fa-layer-group'
                });
            }

            // البحث في المواد
            for (const subject of grade.subjects || []) {
                if (subject.name.match(searchRegex)) {
                    results.push({
                        id: subject.id,
                        title: subject.name,
                        subtitle: `${grade.name} - مادة`,
                        type: 'subject',
                        icon: 'fa-book',
                        gradeId: grade.id
                    });
                }

                // البحث في الوحدات
                for (const unit of subject.units || []) {
                    if (unit.name.match(searchRegex)) {
                        results.push({
                            id: unit.id,
                            title: unit.name,
                            subtitle: `${grade.name} - ${subject.name}`,
                            type: 'unit',
                            icon: 'fa-layer-group',
                            gradeId: grade.id,
                            subjectId: subject.id
                        });
                    }

                    // البحث في الدروس
                    for (const lesson of unit.lessons || []) {
                        if (lesson.title.match(searchRegex)) {
                            results.push({
                                id: lesson.id,
                                title: lesson.title,
                                subtitle: `${grade.name} - ${subject.name} - ${unit.name}`,
                                type: 'lesson',
                                icon: 'fa-video',
                                gradeId: grade.id,
                                subjectId: subject.id,
                                unitId: unit.id,
                                free: lesson.free
                            });
                        }
                    }
                }
            }
        }

        // تطبيق التصفية حسب النوع
        let filteredResults = results;
        if (type && type !== 'all') {
            filteredResults = results.filter(r => r.type === type);
        }

        // تطبيق التقسيم إلى صفحات
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedResults = filteredResults.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            results: paginatedResults,
            total: filteredResults.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(filteredResults.length / parseInt(limit))
        });
    } catch (error) {
        console.error('❌ خطأ في البحث:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 24. مسارات API - التوصيات
// ================================================================

/**
 * GET /api/recommendations/:username - توصيات للمستخدم
 */
app.get('/api/recommendations/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const progress = await UserProgress.findOne({ username });
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        const recommendations = [];
        const grades = await Grade.find();

        for (const grade of grades) {
            // إذا كان المستخدم مدفوع، يرى جميع الصفوف
            // إذا كان مجاني، يرى الصفوف المختارة فقط
            if (user.plan === 'free' && !user.selectedGrades.includes(grade.id)) continue;

            for (const subject of grade.subjects || []) {
                for (const unit of subject.units || []) {
                    for (const lesson of unit.lessons || []) {
                        const lessonKey = `${grade.id}_${subject.id}_${unit.id}_${lesson.id}`;
                        const isCompleted = progress && progress.completedLessons.includes(lessonKey);
                        
                        // فقط الدروس غير المكتملة والمتاحة
                        if (!isCompleted && (lesson.free || user.plan === 'paid')) {
                            recommendations.push({
                                gradeId: grade.id,
                                gradeName: grade.name,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                unitId: unit.id,
                                unitName: unit.name,
                                lessonId: lesson.id,
                                title: lesson.title,
                                free: lesson.free,
                                estimatedTime: lesson.estimatedTime || 30
                            });
                        }
                    }
                }
            }
        }

        // ترتيب حسب الأولوية (دروس قصيرة أولاً)
        recommendations.sort((a, b) => (a.estimatedTime || 30) - (b.estimatedTime || 30));

        res.json(recommendations.slice(0, 20));
    } catch (error) {
        console.error('❌ خطأ في جلب التوصيات:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 25. تهيئة قاعدة البيانات
// ================================================================

async function initDatabase() {
    try {
        // ===== حساب admin =====
        let admin = await User.findOne({ username: 'admin' });

        if (!admin) {
            admin = new User({
                username: 'admin',
                email: 'admin@deepteachsy.com',
                password: ADMIN_PASSWORD,
                firstName: 'مدير',
                lastName: 'المنصة',
                role: 'admin',
                plan: 'paid',
                approved: true,
                banned: false,
                selectedGrades: [],
                settings: {
                    language: 'ar',
                    theme: 'dark',
                    emailNotifications: true,
                    pushNotifications: true
                }
            });
            await admin.save();
            
            await new UserProgress({
                username: admin.username,
                userId: admin._id,
                completedLessons: [],
                completedUnits: [],
                completedSubjects: [],
                studyTime: 0,
                streak: 0
            }).save();

            console.log(`✅ تم إنشاء حساب admin بكلمة مرور: ${ADMIN_PASSWORD}`);
        } else {
            let needsUpdate = false;
            if (!admin.email || admin.email.trim() === '') {
                admin.email = 'admin@deepteachsy.com';
                needsUpdate = true;
            }
            if (admin.password !== ADMIN_PASSWORD) {
                admin.password = ADMIN_PASSWORD;
                needsUpdate = true;
                console.log(`🔄 تم تحديث كلمة مرور admin إلى: ${ADMIN_PASSWORD}`);
            }
            if (needsUpdate) {
                await admin.save();
                console.log('✅ تم تحديث بيانات حساب admin');
            } else {
                console.log('✅ كلمة مرور admin صحيحة');
            }
        }

        // ===== إنشاء الشارات الافتراضية =====
        const defaultBadges = [
            { id: '5_lessons', name: 'المتعلم الناشط', description: 'إتمام 5 دروس', icon: 'fa-star', color: '#c9a04b', points: 10 },
            { id: '10_lessons', name: 'المتعلم المثابر', description: 'إتمام 10 دروس', icon: 'fa-star-half-alt', color: '#e94560', points: 20 },
            { id: '25_lessons', name: 'المتعلم الملهم', description: 'إتمام 25 درساً', icon: 'fa-medal', color: '#533483', points: 30 },
            { id: '50_lessons', name: 'المتعلم الخبير', description: 'إتمام 50 درساً', icon: 'fa-trophy', color: '#c9a04b', points: 50 },
            { id: '100_lessons', name: 'المتعلم الأسطوري', description: 'إتمام 100 درس', icon: 'fa-crown', color: '#e94560', points: 100 },
            { id: '7_day_streak', name: 'المثابرة', description: 'التعلم 7 أيام متتالية', icon: 'fa-fire', color: '#f39c12', points: 25 }
        ];

        for (const badgeData of defaultBadges) {
            const existing = await Badge.findOne({ id: badgeData.id });
            if (!existing) {
                await new Badge(badgeData).save();
                console.log(`✅ تم إنشاء شارة: ${badgeData.name}`);
            }
        }

        // ===== إنشاء 12 صفاً دراسياً =====
        const gradesCount = await Grade.countDocuments();
        if (gradesCount === 0) {
            const gradeNames = [
                'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع',
                'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن',
                'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'
            ];

            for (let i = 0; i < gradeNames.length; i++) {
                await new Grade({ 
                    id: i + 1, 
                    name: gradeNames[i], 
                    subjects: [],
                    order: i + 1
                }).save();
            }
            console.log('✅ تم إنشاء 12 صفاً دراسياً افتراضياً');
        } else {
            console.log(`✅ يوجد ${gradesCount} صفاً دراسياً في قاعدة البيانات`);
        }
    } catch (err) {
        console.error('❌ خطأ في تهيئة البيانات:', err.message);
        if (err.errors) {
            console.error('تفاصيل الأخطاء:');
            Object.keys(err.errors).forEach(key => {
                console.error(`   - ${key}: ${err.errors[key].message}`);
            });
        }
    }
}

// ================================================================
// 26. بدء تشغيل الخادم
// ================================================================

function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(60));
        console.log(`🚀 DeepTeachSY Server v5.0.0`);
        console.log(`📡 يعمل على: http://localhost:${PORT}`);
        console.log(`🔑 حساب admin: admin / ${ADMIN_PASSWORD}`);
        console.log(`📦 قاعدة البيانات: ${mongoose.connection.name || 'MongoDB'}`);
        console.log('='.repeat(60));
    });
}

// ================================================================
// 27. معالجة المسارات غير الموجودة (404)
// ================================================================

app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            error: 'المسار غير موجود',
            path: req.path,
        });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================================================================
// 28. معالجة الأخطاء العامة
// ================================================================

app.use((err, req, res, next) => {
    console.error('❌ خطأ غير متوقع:');
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'حدث خطأ داخلي في الخادم',
    });
});

// ================================================================
// 29. تصدير التطبيق
// ================================================================

module.exports = app;

console.log('📚 تم تحميل جميع مسارات DeepTeachSY بنجاح!');
console.log(`📊 إجمالي الأسطر: ${require('fs').readFileSync(__filename, 'utf8').split('\n').length}`);