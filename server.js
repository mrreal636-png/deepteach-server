/**
 * ================================================================
 * DeepTeach - الخادم الخلفي (Backend Server)
 * الإصدار 3.0.0 (النهائي المتكامل)
 * ================================================================
 * 
 * 🏗️  الهندسة: RESTful API مع Express.js
 * 🗄️  قاعدة البيانات: MongoDB عبر Mongoose ODM
 * 🔐  المصادقة: جلسات (Sessions) مع إدارة مستخدمين متكاملة
 * 📚  إدارة المحتوى: صفوف، مواد، وحدات، دروس، امتحانات
 * 👥  إدارة المستخدمين: صلاحيات، حظر، اشتراكات، ترقيات
 * 
 * ================================================================
 */

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

// ================================================================
// 1. الإعدادات الأساسية
// ================================================================

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'deepteach_super_secret_key_2024';

// التحقق من وجود رابط قاعدة البيانات
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI غير موجود في متغيرات البيئة');
    console.error('💡 تأكد من إضافة متغير MONGODB_URI في Render أو ملف .env');
    process.exit(1);
}

// ================================================================
// 2. الاتصال بقاعدة البيانات
// ================================================================

/**
 * الاتصال بـ MongoDB مع إعدادات مهلة مناسبة
 */
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
 * إعداد الجلسات (Sessions)
 * - تستخدم لتخزين حالة المستخدم بين الطلبات
 * - تنتهي الجلسة بعد 7 أيام
 */
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 أيام
            sameSite: 'lax',
        },
        name: 'deepteach.sid',
        rolling: true,
    })
);

/**
 * معالجة JSON و URL-encoded data
 * - حد أقصى 10 ميجابايت للطلبات الكبيرة (مثل المحتوى الغني)
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * تقديم الملفات الثابتة من مجلد public
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * سجل جميع الطلبات (للتتبع)
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
 * 4.1 مخطط الامتحان
 * - يُستخدم داخل الدروس والوحدات
 * - يحتوي على مصفوفة من الأسئلة مع الخيارات والإجابة الصحيحة
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
            },
        ],
    },
    { _id: false }
);

/**
 * 4.2 مخطط الدرس
 * - يمثل وحدة تعليمية واحدة
 * - يحتوي على: عنوان، فيديو، شرح نصي، أمثلة، امتحان
 * - خاصية `free` تحدد إذا كان الدرس متاحاً للمستخدمين المجانيين
 */
const LessonSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    video: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    examples: { type: String, default: '' },
    free: { type: Boolean, default: true },
    exam: { type: ExamSchema, default: () => ({ questions: [] }) },
});

/**
 * 4.3 مخطط الوحدة
 * - مجموعة من الدروس مرتبطة بموضوع واحد
 * - تحتوي على امتحان خاص بالوحدة كاملة
 */
const UnitSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    lessons: { type: [LessonSchema], default: [] },
    exam: { type: ExamSchema, default: () => ({ questions: [] }) },
});

/**
 * 4.4 مخطط المادة
 * - مادة دراسية ضمن صف معين
 * - تحتوي على وحدات متعددة
 */
const SubjectSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    units: { type: [UnitSchema], default: [] },
});

/**
 * 4.5 مخطط الصف
 * - مستوى دراسي (الصف الأول إلى الثاني عشر)
 * - يحتوي على مواد متعددة
 */
const GradeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    subjects: { type: [SubjectSchema], default: [] },
});

/**
 * 4.6 مخطط المستخدم
 * - يمثل جميع المستخدمين: الطلاب والأدمن
 * - يحتوي على: بيانات الحساب، الخطة، الصفوف المشترك بها، الحالة
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
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'student'],
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
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    }
);

// إنشاء النماذج (Models)
const User = mongoose.model('User', UserSchema);
const Grade = mongoose.model('Grade', GradeSchema);

// ================================================================
// 5. دوال مساعدة (Utility Functions)
// ================================================================

/**
 * الحصول على معرف فريد تلقائي
 * @param {Array} items - المصفوفة المراد البحث فيها
 * @returns {number} - المعرف الجديد
 */
function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => item.id || 0)) + 1;
}

/**
 * التحقق من صلاحية الوصول إلى درس
 * @param {Object|null} user - المستخدم الحالي
 * @param {Object} lesson - الدرس المطلوب
 * @returns {boolean}
 */
function canAccessLesson(user, lesson) {
    if (!user) return false;
    if (user.role === 'admin') return true;
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
 * @param {Object|null} user - المستخدم الحالي
 * @param {number} gradeId - معرف الصف
 * @returns {boolean}
 */
function isUserInGrade(user, gradeId) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.plan === 'free') return true;
    if (user.plan === 'paid') {
        return user.selectedGrades.includes(gradeId);
    }
    return false;
}

/**
 * التحقق من أن المستخدم هو مدير
 * @param {Object} user - المستخدم
 * @returns {boolean}
 */
function isAdmin(user) {
    return user && user.role === 'admin';
}

/**
 * التحقق من أن المستخدم مسجل الدخول
 * @param {Object} req - كائن الطلب
 * @returns {boolean}
 */
function isAuthenticated(req) {
    return !!req.session.userId;
}

/**
 * الحصول على المستخدم الحالي من الجلسة
 * @param {Object} req - كائن الطلب
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser(req) {
    if (!req.session.userId) return null;
    try {
        return await User.findById(req.session.userId);
    } catch {
        return null;
    }
}

// ================================================================
// 6. دوال المصادقة (Auth Middleware)
// ================================================================

/**
 * وسيط التحقق من أن المستخدم مسجل الدخول
 */
async function requireAuth(req, res, next) {
    const user = await getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
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
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    }
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'غير مصرح: هذه العملية تتطلب صلاحيات المدير' });
    }
    req.user = user;
    next();
}

// ================================================================
// 7. مسارات API - المصادقة (Auth Routes)
// ================================================================

/**
 * POST /api/login - تسجيل الدخول
 * @body {string} username - اسم المستخدم أو البريد الإلكتروني
 * @body {string} password - كلمة المرور
 * @returns {Object} - بيانات المستخدم مع جلسة نشطة
 */
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // التحقق من صحة الإدخال
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'يرجى إدخال اسم المستخدم وكلمة المرور',
            });
        }

        // البحث عن المستخدم
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }],
            password: password,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            });
        }

        // التحقق من الحظر
        if (user.banned) {
            return res.status(403).json({
                success: false,
                error: 'تم حظر هذا الحساب. يرجى التواصل مع الدعم',
            });
        }

        // التحقق من الموافقة
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

        // إنشاء الجلسة
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        // تسجيل الدخول
        console.log(`✅ تسجيل الدخول: ${user.username} (${user.role})`);

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                selectedGrades: user.selectedGrades,
                subscriptionEnd: user.subscriptionEnd,
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
 * @returns {Object} - تأكيد تسجيل الخروج
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
 * @returns {Object} - بيانات المستخدم أو null
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
                role: user.role,
                plan: user.plan,
                phone: user.phone,
                selectedGrades: user.selectedGrades,
                subscriptionEnd: user.subscriptionEnd,
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
 * @body {string} username - اسم المستخدم
 * @body {string} email - البريد الإلكتروني
 * @body {string} password - كلمة المرور
 * @body {string} confirmPassword - تأكيد كلمة المرور
 * @body {string} phone - رقم الهاتف (اختياري)
 * @body {string} plan - الخطة (free/paid)
 * @body {Array} selectedGrades - الصفوف المختارة (للمدفوع)
 * @returns {Object} - بيانات المستخدم الجديد
 */
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, phone, selectedGrades, plan } = req.body;

        // ===== التحقق من صحة الإدخال =====
        const errors = [];
        if (!username || username.length < 3) errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        if (!email || !email.includes('@')) errors.push('البريد الإلكتروني غير صحيح');
        if (!password || password.length < 6) errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        if (password !== confirmPassword) errors.push('كلمة المرور وتأكيدها غير متطابقين');

        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors.join('، ') });
        }

        // ===== التحقق من عدم وجود المستخدم =====
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل',
            });
        }

        // ===== إنشاء المستخدم الجديد =====
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone?.trim() || '',
            plan: plan || 'free',
            selectedGrades: plan === 'paid' ? selectedGrades || [] : [],
            approved: plan === 'free',
            role: 'student',
        });

        await newUser.save();
        console.log(`✅ حساب جديد: ${newUser.username} (${newUser.plan})`);

        // ===== تسجيل الدخول تلقائياً (للمجاني) =====
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
                    role: newUser.role,
                    plan: newUser.plan,
                    phone: newUser.phone,
                    selectedGrades: newUser.selectedGrades,
                },
            });
        }

        // للمدفوع: ينتظر موافقة المدير
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

// ================================================================
// 8. مسارات API - إدارة المستخدمين (User Management)
// ================================================================

/**
 * GET /api/admin/users - جلب جميع المستخدمين (للمدير فقط)
 */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).sort({ username: 1 });
        res.json(users);
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
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
        const { username, email, password, phone, plan, selectedGrades, subscriptionDuration, banned, approved } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // تحديث الحقول
        if (username) user.username = username.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (password) user.password = password;
        if (phone !== undefined) user.phone = phone.trim();

        // تحديث الخطة
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
        console.log(`🗑️ تم حذف المستخدم: ${user.username}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 9. مسارات API - إدارة المحتوى (Content Management)
// ================================================================

/**
 * GET /api/grades - جلب جميع الصفوف (للجميع)
 */
app.get('/api/grades', async (req, res) => {
    try {
        const grades = await Grade.find().sort({ id: 1 });
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
 * - للزوار: يعرض الأسماء فقط مع `locked: true`
 * - للمستخدمين: يعرض حسب الخطة والصلاحيات
 * - للمدفوعين: يعرض المحتوى الكامل للصفوف المشترك بها
 * - للمدير: يعرض كل شيء
 */
app.get('/api/grades/:id/content', async (req, res) => {
    try {
        const gradeId = parseInt(req.params.id);
        const grade = await Grade.findOne({ id: gradeId });

        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        // الحصول على المستخدم الحالي (إن وجد)
        const user = await getCurrentUser(req);

        // ===== الزوار (غير مسجلين) =====
        if (!user) {
            const publicData = {
                id: grade.id,
                name: grade.name,
                subjects: grade.subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    units: s.units.map((u) => ({
                        id: u.id,
                        name: u.name,
                        lessons: u.lessons.map((l) => ({
                            id: l.id,
                            title: l.title,
                            free: l.free,
                            locked: true,
                        })),
                    })),
                })),
            };
            return res.json(publicData);
        }

        // ===== مستخدم مسجل =====
        const isAdminUser = user.role === 'admin';
        const isPaidUser = user.plan === 'paid' && (!user.subscriptionEnd || new Date() <= new Date(user.subscriptionEnd));
        const userInGrade = isAdminUser || user.selectedGrades.includes(grade.id) || user.plan === 'free';

        const contentData = {
            id: grade.id,
            name: grade.name,
            subjects: grade.subjects.map((s) => ({
                id: s.id,
                name: s.name,
                units: s.units.map((u) => ({
                    id: u.id,
                    name: u.name,
                    lessons: u.lessons.map((l) => {
                        const canAccess = isAdminUser || l.free || (isPaidUser && userInGrade);
                        return {
                            id: l.id,
                            title: l.title,
                            free: l.free,
                            locked: !canAccess,
                            content: canAccess
                                ? {
                                      video: l.video,
                                      content: l.content,
                                      examples: l.examples,
                                      exam: l.exam,
                                  }
                                : null,
                        };
                    }),
                    exam: isAdminUser || (isPaidUser && userInGrade) ? u.exam : null,
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
// 10. مسارات API - إدارة الصفوف (Admin Only)
// ================================================================

/**
 * POST /api/admin/grades - إضافة صف جديد
 */
app.post('/api/admin/grades', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'اسم الصف مطلوب' });
        }

        const last = await Grade.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;
        const grade = new Grade({ id: newId, name: name.trim(), subjects: [] });
        await grade.save();

        console.log(`✅ تم إضافة الصف: ${grade.name} (ID: ${grade.id})`);
        res.status(201).json({ success: true, grade });
    } catch (error) {
        console.error('❌ خطأ في إضافة الصف:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/grades/:id - تعديل صف
 */
app.put('/api/admin/grades/:id', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const grade = await Grade.findOne({ id: parseInt(req.params.id) });

        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        if (name && name.trim()) {
            grade.name = name.trim();
        }

        await grade.save();
        console.log(`✅ تم تعديل الصف: ${grade.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/admin/grades/:id - حذف صف
 */
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
// 11. مسارات API - إدارة المواد (Admin Only)
// ================================================================

/**
 * POST /api/admin/grades/:gradeId/subjects - إضافة مادة
 */
app.post('/api/admin/grades/:gradeId/subjects', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'اسم المادة مطلوب' });
        }

        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const newId = getNextId(grade.subjects);
        grade.subjects.push({ id: newId, name: name.trim(), units: [] });
        await grade.save();

        console.log(`✅ تم إضافة المادة: ${name} (الصف ${grade.name})`);
        res.status(201).json({ success: true, grade });
    } catch (error) {
        console.error('❌ خطأ في إضافة المادة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/grades/:gradeId/subjects/:subjectId - تعديل مادة
 */
app.put('/api/admin/grades/:gradeId/subjects/:subjectId', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const grade = await Grade.findOne({ id: parseInt(req.params.gradeId) });
        if (!grade) {
            return res.status(404).json({ error: 'الصف غير موجود' });
        }

        const subject = grade.subjects.find((s) => s.id === parseInt(req.params.subjectId));
        if (!subject) {
            return res.status(404).json({ error: 'المادة غير موجودة' });
        }

        if (name && name.trim()) {
            subject.name = name.trim();
        }

        await grade.save();
        console.log(`✅ تم تعديل المادة: ${subject.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/admin/grades/:gradeId/subjects/:subjectId - حذف مادة
 */
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
// 12. مسارات API - إدارة الوحدات (Admin Only)
// ================================================================

/**
 * POST /api/admin/grades/:gradeId/subjects/:subjectId/units - إضافة وحدة
 */
app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
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
        subject.units.push({ id: newId, name: name.trim(), lessons: [], exam: { questions: [] } });
        await grade.save();

        console.log(`✅ تم إضافة الوحدة: ${name} (المادة ${subject.name})`);
        res.status(201).json({ success: true, grade });
    } catch (error) {
        console.error('❌ خطأ في إضافة الوحدة:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId - تعديل وحدة
 */
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
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

        if (name && name.trim()) {
            unit.name = name.trim();
        }

        await grade.save();
        console.log(`✅ تم تعديل الوحدة: ${unit.name}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId - حذف وحدة
 */
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
// 13. مسارات API - إدارة الدروس (Admin Only)
// ================================================================

/**
 * POST /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons - إضافة درس
 */
app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons', requireAdmin, async (req, res) => {
    try {
        const { title, video, content, examples, free, exam } = req.body;

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
            video: video || '',
            content: content || '',
            examples: examples || '',
            free: free !== undefined ? free : true,
            exam: exam || { questions: [] },
        });

        await grade.save();

        console.log(`✅ تم إضافة الدرس: ${title.trim()} (الوحدة ${unit.name})`);
        res.status(201).json({ success: true, grade });
    } catch (error) {
        console.error('❌ خطأ في إضافة الدرس:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * PUT /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId - تعديل درس
 */
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId', requireAdmin, async (req, res) => {
    try {
        const { title, video, content, examples, free, exam } = req.body;

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
        if (video !== undefined) lesson.video = video;
        if (content !== undefined) lesson.content = content;
        if (examples !== undefined) lesson.examples = examples;
        if (free !== undefined) lesson.free = free;
        if (exam !== undefined) lesson.exam = exam;

        await grade.save();

        console.log(`✅ تم تعديل الدرس: ${lesson.title}`);
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * DELETE /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId - حذف درس
 */
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
// 14. مسارات API - امتحان الوحدة (Admin Only)
// ================================================================

/**
 * PUT /api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/exam - تحديث امتحان الوحدة
 */
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

        unit.exam = exam || { questions: [] };
        await grade.save();

        console.log(`✅ تم تحديث امتحان الوحدة: ${unit.name}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ================================================================
// 15. تهيئة قاعدة البيانات (Database Initialization)
// ================================================================

/**
 * تهيئة البيانات الأولية عند التشغيل الأول
 * - إنشاء حساب admin (اسم: admin، كلمة سر: admin)
 * - إنشاء 12 صفاً دراسياً
 */
async function initDatabase() {
    try {
        // ===== إنشاء حساب admin =====
        let admin = await User.findOne({ username: 'admin' });

        if (!admin) {
            admin = new User({
                username: 'admin',
                email: 'admin@deepteach.com',
                password: 'waseemo123janaloveu',
                phone: '',
                role: 'admin',
                plan: 'paid',
                approved: true,
                banned: false,
                selectedGrades: [],
            });
            await admin.save();
            console.log('✅ تم إنشاء حساب admin (اسم: admin، كلمة سر: admin)');
        } else {
            // التأكد من أن كلمة المرور هي "admin"
            if (admin.password !== 'admin') {
                admin.password = 'admin';
                await admin.save();
                console.log('✅ تم إعادة تعيين كلمة مرور admin إلى "admin"');
            }
            console.log('✅ حساب admin موجود (اسم: admin، كلمة سر: admin)');
        }

        // ===== إنشاء 12 صفاً دراسياً =====
        const gradesCount = await Grade.countDocuments();
        if (gradesCount === 0) {
            const gradeNames = [
                'الصف الأول',
                'الصف الثاني',
                'الصف الثالث',
                'الصف الرابع',
                'الصف الخامس',
                'الصف السادس',
                'الصف السابع',
                'الصف الثامن',
                'الصف التاسع',
                'الصف العاشر',
                'الصف الحادي عشر',
                'الصف الثاني عشر',
            ];

            for (let i = 0; i < gradeNames.length; i++) {
                await new Grade({ id: i + 1, name: gradeNames[i], subjects: [] }).save();
            }
            console.log('✅ تم إنشاء 12 صفاً دراسياً افتراضياً');
        } else {
            console.log(`✅ يوجد ${gradesCount} صفاً دراسياً في قاعدة البيانات`);
        }
    } catch (err) {
        console.error('❌ خطأ في تهيئة البيانات:', err.message);
    }
}

// ================================================================
// 16. بدء تشغيل الخادم
// ================================================================

function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(60));
        console.log(`🚀 DeepTeach Server`);
        console.log(`📡 يعمل على: http://localhost:${PORT}`);
        console.log(`🔑 حساب admin: admin / admin`);
        console.log(`📦 قاعدة البيانات: ${mongoose.connection.name || 'MongoDB'}`);
        console.log('='.repeat(60));
    });
}

// ================================================================
// 17. معالجة المسارات غير الموجودة (404)
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
// 18. معالجة الأخطاء العامة (Error Handler)
// ================================================================

app.use((err, req, res, next) => {
    console.error('❌ خطأ غير متوقع:');
    console.error(err.stack);

    // لا تكشف تفاصيل الأخطاء في الإنتاج
    const message = process.env.NODE_ENV === 'production'
        ? 'حدث خطأ داخلي في الخادم'
        : err.message;

    res.status(500).json({
        success: false,
        error: message,
    });
});

// ================================================================
// 19. تصدير التطبيق (للاختبار)
// ================================================================

module.exports = app;