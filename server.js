const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'deepteach_secret_key_2024';

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI غير موجود في متغيرات البيئة');
    process.exit(1);
}

// ========== الاتصال بقاعدة البيانات ==========
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
})
.then(() => {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    initDatabase();
    startServer();
})
.catch(err => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
});

// ========== إعداد الجلسات ==========
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7 // أسبوع
    }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== تعريف المخططات (Schemas) ==========

// مخطط الامتحان (مضمن في الدرس والوحدة)
const ExamSchema = new mongoose.Schema({
    questions: [{
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: Number, required: true }
    }]
});

// مخطط الدرس
const LessonSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    video: { type: String, default: '' },
    content: { type: String, default: '' },
    examples: { type: String, default: '' },
    free: { type: Boolean, default: true },
    exam: { type: ExamSchema, default: { questions: [] } }
});

// مخطط الوحدة
const UnitSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    lessons: { type: [LessonSchema], default: [] },
    exam: { type: ExamSchema, default: { questions: [] } }
});

// مخطط المادة
const SubjectSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    units: { type: [UnitSchema], default: [] }
});

// مخطط الصف
const GradeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    subjects: { type: [SubjectSchema], default: [] }
});

// مخطط المستخدم
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    subscriptionEnd: { type: Date, default: null },
    selectedGrades: { type: [Number], default: [] },
    banned: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Grade = mongoose.model('Grade', GradeSchema);

// ========== دوال مساعدة ==========

// التحقق من صلاحية الوصول للدرس
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

// التحقق من أن المستخدم مشترك في صف معين (للمدفوع)
function isUserInGrade(user, gradeId) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.plan === 'free') return true;
    if (user.plan === 'paid') {
        return user.selectedGrades.includes(gradeId);
    }
    return false;
}

// ========== مسارات API ==========

// ----- المصادقة (Auth) -----

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
        }
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }],
            password: password
        });
        if (!user) {
            return res.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        if (user.banned) {
            return res.json({ error: 'تم حظر هذا الحساب' });
        }
        if (!user.approved) {
            return res.json({ error: 'بانتظار موافقة الأدمن' });
        }
        // التحقق من انتهاء الاشتراك المدفوع
        if (user.plan === 'paid' && user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
            user.plan = 'free';
            user.subscriptionEnd = null;
            user.selectedGrades = [];
            await user.save();
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

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
                subscriptionEnd: user.subscriptionEnd
            }
        });
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'فشل تسجيل الخروج' });
        }
        res.json({ success: true });
    });
});

// الحصول على المستخدم الحالي (للتحقق من الجلسة)
app.get('/api/current-user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ user: null });
        }
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
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
                subscriptionEnd: user.subscriptionEnd
            }
        });
    } catch (error) {
        console.error('خطأ في جلب المستخدم الحالي:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// التسجيل (حساب جديد)
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, phone, selectedGrades, plan } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
        }
        if (password !== confirmPassword) {
            return res.json({ error: 'كلمة المرور وتأكيدها غير متطابقين' });
        }
        if (password.length < 6) {
            return res.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }

        const newUser = new User({
            username,
            email,
            password,
            phone: phone || '',
            plan: plan || 'free',
            selectedGrades: plan === 'paid' ? (selectedGrades || []) : [],
            approved: plan === 'free',
            role: 'student'
        });

        await newUser.save();

        // تسجيل الدخول تلقائياً (للمجاني)
        if (plan === 'free') {
            req.session.userId = newUser._id;
            req.session.username = newUser.username;
            req.session.role = newUser.role;
            res.json({
                success: true,
                message: 'تم التسجيل وتسجيل الدخول تلقائياً',
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    plan: newUser.plan,
                    phone: newUser.phone,
                    selectedGrades: newUser.selectedGrades
                }
            });
        } else {
            res.json({
                success: true,
                message: 'تم التسجيل، بانتظار موافقة الأدمن',
                user: null
            });
        }
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة المستخدمين (للمشرف فقط) -----

// جلب جميع المستخدمين
app.get('/api/admin/users', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const users = await User.find({ role: 'student' });
        res.json(users);
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// جلب مستخدم محدد
app.get('/api/admin/users/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تحديث معلومات المستخدم (للأدمن)
app.put('/api/admin/users/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { username, email, password, phone, plan, selectedGrades, subscriptionDuration, banned, approved } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = password;
        if (phone !== undefined) user.phone = phone;
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
                approved: user.approved
            }
        });
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حظر/إلغاء حظر المستخدم
app.put('/api/admin/users/:id/ban', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        user.banned = !user.banned;
        await user.save();
        res.json({ success: true, banned: user.banned });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف المستخدم
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة المحتوى (الصفوف، المواد، الوحدات، الدروس) -----

// جلب جميع الصفوف (للعرض العام)
app.get('/api/grades', async (req, res) => {
    try {
        const grades = await Grade.find().sort({ id: 1 });
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// جلب صف محدد
app.get('/api/grades/:id', async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: req.params.id });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        res.json(grade);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// جلب محتوى الصف (مع التحقق من الصلاحيات)
app.get('/api/grades/:id/content', async (req, res) => {
    try {
        const grade = await Grade.findOne({ id: req.params.id });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }

        // إذا لم يكن المستخدم مسجلاً، أعد فقط أسماء الصفوف والمواد (بدون محتوى الدروس)
        if (!user) {
            const publicData = {
                id: grade.id,
                name: grade.name,
                subjects: grade.subjects.map(s => ({
                    id: s.id,
                    name: s.name,
                    units: s.units.map(u => ({
                        id: u.id,
                        name: u.name,
                        lessons: u.lessons.map(l => ({
                            id: l.id,
                            title: l.title,
                            free: l.free,
                            locked: true
                        }))
                    }))
                }))
            };
            return res.json(publicData);
        }

        // إذا كان المستخدم مسجلاً
        const isAdmin = user.role === 'admin';
        const isPaid = user.plan === 'paid' && (!user.subscriptionEnd || new Date() <= new Date(user.subscriptionEnd));
        const userInGrade = isAdmin || user.selectedGrades.includes(grade.id) || user.plan === 'free';

        const contentData = {
            id: grade.id,
            name: grade.name,
            subjects: grade.subjects.map(s => ({
                id: s.id,
                name: s.name,
                units: s.units.map(u => ({
                    id: u.id,
                    name: u.name,
                    lessons: u.lessons.map(l => {
                        const canAccess = isAdmin || l.free || (isPaid && userInGrade);
                        return {
                            id: l.id,
                            title: l.title,
                            free: l.free,
                            locked: !canAccess,
                            content: canAccess ? {
                                video: l.video,
                                content: l.content,
                                examples: l.examples,
                                exam: l.exam
                            } : null
                        };
                    }),
                    exam: (isAdmin || (isPaid && userInGrade)) ? u.exam : null
                }))
            }))
        };

        res.json(contentData);
    } catch (error) {
        console.error('خطأ في جلب محتوى الصف:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة الصفوف (للمشرف فقط) -----

// إضافة صف جديد
app.post('/api/admin/grades', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        if (!name) return res.json({ error: 'اسم الصف مطلوب' });

        const last = await Grade.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;
        const grade = new Grade({ id: newId, name, subjects: [] });
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تعديل صف
app.put('/api/admin/grades/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        const grade = await Grade.findOne({ id: req.params.id });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });
        if (name) grade.name = name;
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف صف
app.delete('/api/admin/grades/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        await Grade.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة المواد داخل الصف -----

// إضافة مادة
app.post('/api/admin/grades/:gradeId/subjects', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        if (!name) return res.json({ error: 'اسم المادة مطلوب' });

        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const last = grade.subjects.length > 0 ? Math.max(...grade.subjects.map(s => s.id || 0)) : 0;
        const newId = last + 1;
        grade.subjects.push({ id: newId, name, units: [] });
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تعديل مادة
app.put('/api/admin/grades/:gradeId/subjects/:subjectId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        if (name) subject.name = name;
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف مادة
app.delete('/api/admin/grades/:gradeId/subjects/:subjectId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        grade.subjects = grade.subjects.filter(s => s.id != req.params.subjectId);
        await grade.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة الوحدات داخل المادة -----

// إضافة وحدة
app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        if (!name) return res.json({ error: 'اسم الوحدة مطلوب' });

        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const last = subject.units.length > 0 ? Math.max(...subject.units.map(u => u.id || 0)) : 0;
        const newId = last + 1;
        subject.units.push({ id: newId, name, lessons: [], exam: { questions: [] } });
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تعديل وحدة
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { name } = req.body;
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const unit = subject.units.find(u => u.id == req.params.unitId);
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

        if (name) unit.name = name;
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف وحدة
app.delete('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        subject.units = subject.units.filter(u => u.id != req.params.unitId);
        await grade.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- إدارة الدروس داخل الوحدة -----

// إضافة درس
app.post('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { title, video, content, examples, free, exam } = req.body;
        if (!title) return res.json({ error: 'عنوان الدرس مطلوب' });

        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const unit = subject.units.find(u => u.id == req.params.unitId);
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

        const last = unit.lessons.length > 0 ? Math.max(...unit.lessons.map(l => l.id || 0)) : 0;
        const newId = last + 1;
        unit.lessons.push({
            id: newId,
            title,
            video: video || '',
            content: content || '',
            examples: examples || '',
            free: free !== undefined ? free : true,
            exam: exam || { questions: [] }
        });
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        console.error('خطأ في إضافة الدرس:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تعديل درس
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { title, video, content, examples, free, exam } = req.body;
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const unit = subject.units.find(u => u.id == req.params.unitId);
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

        const lesson = unit.lessons.find(l => l.id == req.params.lessonId);
        if (!lesson) return res.status(404).json({ error: 'الدرس غير موجود' });

        if (title !== undefined) lesson.title = title;
        if (video !== undefined) lesson.video = video;
        if (content !== undefined) lesson.content = content;
        if (examples !== undefined) lesson.examples = examples;
        if (free !== undefined) lesson.free = free;
        if (exam !== undefined) lesson.exam = exam;

        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف درس
app.delete('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/lessons/:lessonId', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const unit = subject.units.find(u => u.id == req.params.unitId);
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

        unit.lessons = unit.lessons.filter(l => l.id != req.params.lessonId);
        await grade.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ----- امتحان الوحدة -----

// تحديث امتحان الوحدة
app.put('/api/admin/grades/:gradeId/subjects/:subjectId/units/:unitId/exam', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح' });
        }
        const { exam } = req.body;
        const grade = await Grade.findOne({ id: req.params.gradeId });
        if (!grade) return res.status(404).json({ error: 'الصف غير موجود' });

        const subject = grade.subjects.find(s => s.id == req.params.subjectId);
        if (!subject) return res.status(404).json({ error: 'المادة غير موجودة' });

        const unit = subject.units.find(u => u.id == req.params.unitId);
        if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

        unit.exam = exam || { questions: [] };
        await grade.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ========== تهيئة البيانات الأولية ==========
async function initDatabase() {
    try {
        // إنشاء حساب admin
        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            await new User({
                username: 'admin',
                email: 'admin@deepteach.com',
                password: 'admin',
                phone: '',
                role: 'admin',
                plan: 'paid',
                approved: true,
                banned: false,
                selectedGrades: []
            }).save();
            console.log('✅ تم إنشاء حساب admin');
        }

        // إنشاء 12 صفاً دراسياً إذا لم تكن موجودة
        const gradesCount = await Grade.countDocuments();
        if (gradesCount === 0) {
            for (let i = 1; i <= 12; i++) {
                await new Grade({ id: i, name: `الصف ${i}`, subjects: [] }).save();
            }
            console.log('✅ تم إنشاء 12 صفاً دراسياً افتراضياً');
        }
    } catch (err) {
        console.error('❌ خطأ في تهيئة البيانات:', err.message);
    }
}

// ========== بدء تشغيل السيرفر ==========
function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    });
}

// ========== الصفحة الرئيسية ==========
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});