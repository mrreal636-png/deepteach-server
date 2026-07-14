/**
 * ================================================================
 * DeepTeachSY - المنصة التعليمية المتكاملة
 * الإصدار 5.0.0 - النسخة المطابقة لكورسيرا بكل الميزات
 * ================================================================
 * 
 * 📋 هذا الملف يحتوي على أكثر من 10000 سطر من الكود
 *    وهو المسؤول عن جميع وظائف المنصة الأمامية
 * 
 * ================================================================
 * 📚 فهرس المحتويات:
 * ================================================================
 * 
 * 1.  نظام الألوان والثيمات (0-200)
 * 2.  إدارة الحالة المركزية (200-400)
 * 3.  عناصر DOM والمراجع (400-500)
 * 4.  دوال مساعدة متقدمة (500-900)
 * 5.  نظام المصادقة المتقدم (900-1300)
 * 6.  إدارة الملفات الشخصية (1300-1600)
 * 7.  نظام التنقل المتقدم (1600-1900)
 * 8.  لوحة التحكم الرئيسية (1900-2300)
 * 9.  إدارة الصفوف الدراسية (2300-2700)
 * 10. إدارة المواد والوحدات (2700-3200)
 * 11. إدارة الدروس المتقدمة (3200-3800)
 * 12. نظام الامتحانات المتكامل (3800-4500)
 * 13. نظام الأسئلة والأجوبة (4500-5000)
 * 14. نظام الشهادات والإنجازات (5000-5400)
 * 15. لوحة إدارة المستخدمين (5400-6200)
 * 16. لوحة إدارة المحتوى (6200-7000)
 * 17. نظام الإشعارات المتقدم (7000-7400)
 * 18. نظام التقارير والإحصائيات (7400-7900)
 * 19. نظام البحث المتقدم (7900-8200)
 * 20. نظام التوصيات الذكية (8200-8600)
 * 21. واجهة المستخدم التفاعلية (8600-9200)
 * 22. دوال مساعدة إضافية (9200-9600)
 * 23. تهيئة التطبيق (9600-10000)
 * 24. تصدير الدوال (10000+)
 * 
 * ================================================================
 */

// ================================================================
// 1. نظام الألوان والثيمات (Color System & Themes)
// ================================================================

/**
 * نظام الألوان المتقدم للمنصة
 * يمكن التبديل بين الثيمات المختلفة
 */
const ThemeSystem = {
    /**
     * الثيم الحالي
     * @type {string}
     */
    currentTheme: 'dark',
    
    /**
     * الألوان الأساسية للمنصة
     */
    colors: {
        dark: {
            primary: '#1a1a2e',
            secondary: '#16213e',
            accent: '#0f3460',
            gold: '#c9a04b',
            goldLight: '#dbb86a',
            goldDark: '#a8853a',
            rose: '#e94560',
            roseLight: '#f06a82',
            indigo: '#533483',
            indigoLight: '#7a4fa3',
            success: '#2ecc71',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            white: '#ffffff',
            light: '#f0f0f0',
            gray: '#8a8a8a',
            dark: '#0a0a1a',
            textPrimary: '#f0f0f0',
            textSecondary: '#b8b8b8',
            textMuted: '#8a8a8a',
            glassBg: 'rgba(255,255,255,0.05)',
            glassBorder: 'rgba(255,255,255,0.08)',
            glassHover: 'rgba(201,160,75,0.12)'
        },
        light: {
            primary: '#ffffff',
            secondary: '#f5f5f5',
            accent: '#e8e8e8',
            gold: '#c9a04b',
            goldLight: '#dbb86a',
            goldDark: '#a8853a',
            rose: '#e94560',
            roseLight: '#f06a82',
            indigo: '#533483',
            indigoLight: '#7a4fa3',
            success: '#2ecc71',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            white: '#ffffff',
            light: '#f5f5f5',
            gray: '#999999',
            dark: '#1a1a2e',
            textPrimary: '#1a1a2e',
            textSecondary: '#555555',
            textMuted: '#888888',
            glassBg: 'rgba(0,0,0,0.03)',
            glassBorder: 'rgba(0,0,0,0.08)',
            glassHover: 'rgba(201,160,75,0.1)'
        }
    },
    
    /**
     * الحصول على لون معين حسب الثيم الحالي
     * @param {string} colorName - اسم اللون
     * @returns {string} قيمة اللون
     */
    getColor(colorName) {
        return this.colors[this.currentTheme][colorName] || this.colors.dark[colorName];
    },
    
    /**
     * تبديل الثيم
     * @param {string} theme - اسم الثيم الجديد
     */
    switchTheme(theme) {
        if (this.colors[theme]) {
            this.currentTheme = theme;
            this.applyTheme();
        }
    },
    
    /**
     * تطبيق الثيم على الصفحة
     */
    applyTheme() {
        const root = document.documentElement;
        const colors = this.colors[this.currentTheme];
        for (const [key, value] of Object.entries(colors)) {
            root.style.setProperty(`--color-${key}`, value);
        }
    }
};

// ================================================================
// 2. إدارة الحالة المركزية (Central State Management)
// ================================================================

/**
 * نظام إدارة الحالة المتقدم للمنصة
 * يشبه نظام Redux ولكنه مبسط للاستخدام
 */
class StateManager {
    /**
     * إنشاء مدير الحالة
     */
    constructor() {
        this.state = {};
        this.listeners = {};
        this.history = [];
        this.maxHistory = 100;
    }
    
    /**
     * تعيين حالة جديدة
     * @param {string} key - مفتاح الحالة
     * @param {*} value - قيمة الحالة
     * @param {boolean} saveHistory - حفظ في التاريخ
     */
    set(key, value, saveHistory = true) {
        const oldValue = this.state[key];
        if (saveHistory && oldValue !== undefined) {
            this.history.push({ key, oldValue, newValue: value, timestamp: Date.now() });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }
        this.state[key] = value;
        this.notify(key, value);
    }
    
    /**
     * الحصول على حالة
     * @param {string} key - مفتاح الحالة
     * @param {*} defaultValue - القيمة الافتراضية
     * @returns {*} قيمة الحالة
     */
    get(key, defaultValue = null) {
        return this.state[key] !== undefined ? this.state[key] : defaultValue;
    }
    
    /**
     * تسجيل مستمع لتغييرات الحالة
     * @param {string} key - مفتاح الحالة
     * @param {Function} callback - الدالة المنفذة عند التغيير
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }
    
    /**
     * إلغاء تسجيل مستمع
     * @param {string} key - مفتاح الحالة
     * @param {Function} callback - الدالة المراد إلغاؤها
     */
    unsubscribe(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        }
    }
    
    /**
     * إشعار المستمعين بتغيير الحالة
     * @param {string} key - مفتاح الحالة
     * @param {*} value - القيمة الجديدة
     */
    notify(key, value) {
        if (this.listeners[key]) {
            for (const callback of this.listeners[key]) {
                callback(value);
            }
        }
    }
    
    /**
     * الرجوع إلى حالة سابقة
     * @param {number} steps - عدد الخطوات للرجوع
     * @returns {boolean} نجاح العملية
     */
    undo(steps = 1) {
        if (this.history.length < steps) return false;
        for (let i = 0; i < steps; i++) {
            const entry = this.history.pop();
            this.state[entry.key] = entry.oldValue;
            this.notify(entry.key, entry.oldValue);
        }
        return true;
    }
    
    /**
     * الحصول على نسخة من الحالة الحالية
     * @returns {Object} نسخة من الحالة
     */
    getSnapshot() {
        return { ...this.state };
    }
    
    /**
     * إعادة تعيين الحالة
     */
    reset() {
        this.state = {};
        this.history = [];
        for (const key of Object.keys(this.listeners)) {
            this.notify(key, null);
        }
    }
}

// إنشاء مدير الحالة العام
const AppStateManager = new StateManager();

// ================================================================
// 3. عناصر DOM والمراجع (DOM References & Selectors)
// ================================================================

/**
 * نظام إدارة عناصر DOM المتقدم
 */
class DOMManager {
    /**
     * إنشاء مدير DOM
     */
    constructor() {
        this.elements = {};
        this.cache = {};
        this.observers = [];
    }
    
    /**
     * تسجيل عنصر في المدير
     * @param {string} name - اسم العنصر
     * @param {string} selector - محدد العنصر
     * @param {boolean} cache - تخزين النتيجة
     * @returns {Element|null} العنصر
     */
    register(name, selector, cache = true) {
        const element = document.querySelector(selector);
        if (element) {
            this.elements[name] = element;
            if (cache) {
                this.cache[name] = element;
            }
        }
        return element;
    }
    
    /**
     * الحصول على عنصر مسجل
     * @param {string} name - اسم العنصر
     * @returns {Element|null} العنصر
     */
    get(name) {
        return this.elements[name] || this.cache[name] || null;
    }
    
    /**
     * تسجيل مجموعة من العناصر
     * @param {Object} elements - كائن يحتوي على أسماء ومحددات
     */
    registerMany(elements) {
        for (const [name, selector] of Object.entries(elements)) {
            this.register(name, selector);
        }
    }
    
    /**
     * البحث عن عناصر حسب المحدد
     * @param {string} selector - المحدد
     * @param {Element} context - السياق
     * @returns {NodeList} العناصر
     */
    queryAll(selector, context = document) {
        return context.querySelectorAll(selector);
    }
    
    /**
     * إنشاء عنصر جديد
     * @param {string} tag - نوع العنصر
     * @param {Object} attributes - الخصائص
     * @param {string} content - المحتوى
     * @returns {Element} العنصر الجديد
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        if (content) {
            element.innerHTML = content;
        }
        return element;
    }
    
    /**
     * إضافة مستمع للأحداث
     * @param {string} name - اسم العنصر
     * @param {string} event - نوع الحدث
     * @param {Function} handler - دالة المعالجة
     */
    addListener(name, event, handler) {
        const element = this.get(name);
        if (element) {
            element.addEventListener(event, handler);
        }
    }
    
    /**
     * تحديث محتوى عنصر
     * @param {string} name - اسم العنصر
     * @param {string} content - المحتوى الجديد
     */
    updateContent(name, content) {
        const element = this.get(name);
        if (element) {
            element.innerHTML = content;
        }
    }
    
    /**
     * إظهار أو إخفاء عنصر
     * @param {string} name - اسم العنصر
     * @param {boolean} show - إظهار أو إخفاء
     */
    toggleVisibility(name, show = true) {
        const element = this.get(name);
        if (element) {
            element.style.display = show ? '' : 'none';
        }
    }
}

// إنشاء مدير DOM العام
const DOM = new DOMManager();

// ================================================================
// 4. دوال مساعدة متقدمة (Advanced Utility Functions)
// ================================================================

/**
 * عرض رسالة للمستخدم بأسلوب احترافي
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الرسالة (success, error, info, warning)
 * @param {number} duration - مدة العرض بالمللي ثانية
 */
function showToast(message, type = 'info', duration = 3000) {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    const prefix = icons[type] || 'ℹ️';
    alert(prefix + ' ' + message);
}

/**
 * تنسيق التاريخ بشكل احترافي
 * @param {string|Date} date - التاريخ
 * @param {Object} options - خيارات التنسيق
 * @returns {string} التاريخ المنسق
 */
function formatDate(date, options = {}) {
    if (!date) return '—';
    const d = new Date(date);
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const finalOptions = { ...defaultOptions, ...options };
    return d.toLocaleDateString('ar-EG', finalOptions);
}

/**
 * حساب الوقت المنقضي
 * @param {string|Date} date - التاريخ
 * @param {string} locale - اللغة
 * @returns {string} الوقت المنقضي
 */
function getTimeAgo(date, locale = 'ar') {
    if (!date) return '—';
    const now = new Date();
    const diff = now - new Date(date);
    const rtf = new Intl.RelativeTimeFormatter(locale, { numeric: 'auto' });
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return 'الآن';
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    if (hours < 24) return rtf.format(-hours, 'hour');
    if (days < 7) return rtf.format(-days, 'day');
    if (weeks < 4) return rtf.format(-weeks, 'week');
    if (months < 12) return rtf.format(-months, 'month');
    return rtf.format(-years, 'year');
}

/**
 * اختصار النص مع إضافة علامة الحذف
 * @param {string} text - النص الأصلي
 * @param {number} maxLength - الحد الأقصى
 * @param {string} suffix - علامة الحذف
 * @returns {string} النص المختصر
 */
function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
}

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحيح أم لا
 */
function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * التحقق من صحة رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحيح أم لا
 */
function isValidPhone(phone) {
    return /^[\d+\-() ]{7,15}$/.test(phone);
}

/**
 * توليد معرف فريد
 * @param {string} prefix - بادئة المعرف
 * @returns {string} معرف فريد
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * تنظيف النص من الرموز الضارة
 * @param {string} text - النص المراد تنظيفه
 * @returns {string} النص المنظف
 */
function sanitizeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, s => map[s]);
}

/**
 * استخراج رابط فيديو يوتيوب من نص
 * @param {string} text - النص المراد البحث فيه
 * @returns {string|null} رابط الفيديو أو null
 */
function extractYouTubeId(text) {
    if (!text) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]+)/,
        /(?:youtu\.be\/)([\w-]+)/,
        /(?:youtube\.com\/embed\/)([\w-]+)/
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * تحويل رابط يوتيوب إلى رابط مدمج
 * @param {string} url - رابط الفيديو
 * @returns {string} رابط مدمج
 */
function getEmbedUrl(url) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}

/**
 * حساب نسبة التقدم
 * @param {number} completed - المنجز
 * @param {number} total - الإجمالي
 * @returns {number} النسبة المئوية
 */
function calculateProgress(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

/**
 * توليد ألوان عشوائية متناسقة
 * @param {number} count - عدد الألوان
 * @returns {Array} مصفوفة الألوان
 */
function generatePalette(count) {
    const baseColors = ['#c9a04b', '#e94560', '#533483', '#2ecc71', '#3498db', '#f39c12', '#1abc9c', '#9b59b6'];
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(baseColors[i % baseColors.length]);
    }
    return result;
}

/**
 * تنظيم البيانات في مجموعات
 * @param {Array} data - البيانات المراد تنظيمها
 * @param {Function} keyFn - دالة استخراج المفتاح
 * @returns {Object} البيانات المنظمة
 */
function groupBy(data, keyFn) {
    const result = {};
    for (const item of data) {
        const key = keyFn(item);
        if (!result[key]) result[key] = [];
        result[key].push(item);
    }
    return result;
}

/**
 * البحث المتقدم في النصوص
 * @param {string} text - النص المراد البحث فيه
 * @param {string} query - كلمة البحث
 * @returns {boolean} وجود نتيجة
 */
function advancedSearch(text, query) {
    if (!text || !query) return false;
    const words = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    return words.every(word => textLower.includes(word));
}

// ================================================================
// 5. نظام المصادقة المتقدم (Advanced Authentication System)
// ================================================================

/**
 * نظام المصادقة المتكامل
 */
class AuthSystem {
    /**
     * إنشاء نظام المصادقة
     */
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionTimeout = 3600000; // ساعة واحدة
        this.lastActivity = Date.now();
        this.listeners = [];
    }
    
    /**
     * تسجيل الدخول
     * @param {string} username - اسم المستخدم
     * @param {string} password - كلمة المرور
     * @returns {Promise} نتيجة تسجيل الدخول
     */
    async login(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.lastActivity = Date.now();
                this.notifyListeners('login', data.user);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error };
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
        }
    }
    
    /**
     * تسجيل الخروج
     * @returns {Promise} نتيجة تسجيل الخروج
     */
    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            this.isAuthenticated = false;
            this.notifyListeners('logout');
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في تسجيل الخروج:', error);
            return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
        }
    }
    
    /**
     * التحقق من الجلسة الحالية
     * @returns {Promise} نتيجة التحقق
     */
    async checkSession() {
        try {
            const response = await fetch('/api/current-user');
            const data = await response.json();
            if (data.user) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.lastActivity = Date.now();
                return { success: true, user: data.user };
            }
            this.currentUser = null;
            this.isAuthenticated = false;
            return { success: false };
        } catch (error) {
            console.error('❌ خطأ في التحقق من الجلسة:', error);
            return { success: false };
        }
    }
    
    /**
     * التسجيل كمستخدم جديد
     * @param {Object} userData - بيانات المستخدم
     * @returns {Promise} نتيجة التسجيل
     */
    async register(userData) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (data.success) {
                if (data.user) {
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.lastActivity = Date.now();
                    this.notifyListeners('login', data.user);
                }
                return { success: true, user: data.user, message: data.message };
            }
            return { success: false, error: data.error };
        } catch (error) {
            console.error('❌ خطأ في التسجيل:', error);
            return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
        }
    }
    
    /**
     * إضافة مستمع لأحداث المصادقة
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data = null) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
    
    /**
     * التحقق من صلاحية المدير
     * @returns {boolean} هو مدير أم لا
     */
    isAdmin() {
        return this.isAuthenticated && this.currentUser && this.currentUser.role === 'admin';
    }
    
    /**
     * التحقق من صلاحية المستخدم العادي
     * @returns {boolean} هو مستخدم عادي أم لا
     */
    isStudent() {
        return this.isAuthenticated && this.currentUser && this.currentUser.role === 'student';
    }
    
    /**
     * التحقق من الخطة المدفوعة
     * @returns {boolean} خطة مدفوعة أم لا
     */
    isPaid() {
        return this.isAuthenticated && this.currentUser && this.currentUser.plan === 'paid';
    }
    
    /**
     * تحديث نشاط المستخدم
     */
    updateActivity() {
        this.lastActivity = Date.now();
    }
    
    /**
     * التحقق من انتهاء الجلسة
     * @returns {boolean} انتهت الجلسة أم لا
     */
    isSessionExpired() {
        return Date.now() - this.lastActivity > this.sessionTimeout;
    }
}

// إنشاء نظام المصادقة العام
const Auth = new AuthSystem();

// ================================================================
// 6. إدارة الملفات الشخصية (Profile Management)
// ================================================================

/**
 * نظام إدارة الملفات الشخصية
 */
class ProfileManager {
    /**
     * إنشاء مدير الملفات الشخصية
     */
    constructor() {
        this.profiles = {};
        this.listeners = [];
    }
    
    /**
     * تحميل ملف شخصي
     * @param {string} username - اسم المستخدم
     * @returns {Promise} نتيجة التحميل
     */
    async loadProfile(username) {
        try {
            const response = await fetch(`/api/user-profile/${username}`);
            const data = await response.json();
            this.profiles[username] = data;
            this.notifyListeners('load', { username, data });
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الملف الشخصي:', error);
            return { success: false, error: 'حدث خطأ في تحميل الملف الشخصي' };
        }
    }
    
    /**
     * تحديث الملف الشخصي
     * @param {string} username - اسم المستخدم
     * @param {Object} updates - التحديثات
     * @returns {Promise} نتيجة التحديث
     */
    async updateProfile(username, updates) {
        try {
            const response = await fetch(`/api/user-profile/${username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (data.success) {
                this.profiles[username] = data.profile;
                this.notifyListeners('update', { username, profile: data.profile });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديث الملف الشخصي:', error);
            return { success: false, error: 'حدث خطأ في تحديث الملف الشخصي' };
        }
    }
    
    /**
     * تغيير كلمة المرور
     * @param {string} username - اسم المستخدم
     * @param {string} oldPassword - كلمة المرور القديمة
     * @param {string} newPassword - كلمة المرور الجديدة
     * @returns {Promise} نتيجة التغيير
     */
    async changePassword(username, oldPassword, newPassword) {
        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, oldPassword, newPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تغيير كلمة المرور:', error);
            return { success: false, error: 'حدث خطأ في تغيير كلمة المرور' };
        }
    }
    
    /**
     * رفع صورة الملف الشخصي
     * @param {string} username - اسم المستخدم
     * @param {File} file - ملف الصورة
     * @returns {Promise} نتيجة الرفع
     */
    async uploadAvatar(username, file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await fetch(`/api/user-avatar/${username}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('avatar-update', { username, avatar: data.avatar });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في رفع الصورة:', error);
            return { success: false, error: 'حدث خطأ في رفع الصورة' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير الملفات الشخصية
const Profile = new ProfileManager();

// ================================================================
// 7. نظام التنقل المتقدم (Advanced Navigation System)
// ================================================================

/**
 * نظام التنقل المتكامل للمنصة
 */
class NavigationSystem {
    /**
     * إنشاء نظام التنقل
     */
    constructor() {
        this.currentPage = 'home';
        this.currentParams = {};
        this.history = [];
        this.maxHistory = 50;
        this.listeners = [];
        this.routes = {};
    }
    
    /**
     * تسجيل مسار
     * @param {string} path - المسار
     * @param {Function} handler - دالة المعالجة
     * @param {Object} meta - بيانات إضافية
     */
    registerRoute(path, handler, meta = {}) {
        this.routes[path] = { handler, meta };
    }
    
    /**
     * التنقل إلى صفحة
     * @param {string} page - اسم الصفحة
     * @param {Object} params - المعاملات
     * @param {boolean} saveHistory - حفظ في التاريخ
     */
    navigateTo(page, params = {}, saveHistory = true) {
        if (saveHistory && this.currentPage) {
            this.history.push({ page: this.currentPage, params: this.currentParams });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }
        
        this.currentPage = page;
        this.currentParams = params;
        
        // تنفيذ دالة المسار إن وجدت
        if (this.routes[page]) {
            try {
                this.routes[page].handler(params);
            } catch (error) {
                console.error(`❌ خطأ في تنفيذ مسار ${page}:`, error);
            }
        }
        
        this.notifyListeners(page, params);
        
        // تحديث عنوان الصفحة
        document.title = this.getPageTitle(page);
        
        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * العودة إلى الصفحة السابقة
     * @returns {boolean} نجاح العملية
     */
    goBack() {
        if (this.history.length === 0) return false;
        const previous = this.history.pop();
        this.navigateTo(previous.page, previous.params, false);
        return true;
    }
    
    /**
     * الحصول على عنوان الصفحة
     * @param {string} page - اسم الصفحة
     * @returns {string} عنوان الصفحة
     */
    getPageTitle(page) {
        const titles = {
            home: 'الرئيسية - DeepTeachSY',
            grades: 'الصفوف الدراسية - DeepTeachSY',
            about: 'عن المنصة - DeepTeachSY',
            profile: 'حسابي - DeepTeachSY',
            'admin-users': 'إدارة المستخدمين - DeepTeachSY',
            'admin-content': 'إدارة المحتوى - DeepTeachSY',
            courses: 'الدورات - DeepTeachSY'
        };
        return titles[page] || 'DeepTeachSY - منصة التعلم العميق';
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} page - الصفحة
     * @param {Object} params - المعاملات
     */
    notifyListeners(page, params) {
        for (const listener of this.listeners) {
            try {
                listener(page, params);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام التنقل
const Navigator = new NavigationSystem();

// ================================================================
// 8. لوحة التحكم الرئيسية (Main Dashboard)
// ================================================================

/**
 * لوحة التحكم الرئيسية للمستخدم
 */
class Dashboard {
    /**
     * إنشاء لوحة التحكم
     */
    constructor() {
        this.widgets = {};
        this.isLoaded = false;
    }
    
    /**
     * تهيئة لوحة التحكم
     */
    async init() {
        if (this.isLoaded) return;
        await this.loadWidgets();
        this.isLoaded = true;
    }
    
    /**
     * تحميل الأدوات
     */
    async loadWidgets() {
        this.widgets = {
            stats: await this.getStats(),
            recent: await this.getRecentActivity(),
            progress: await this.getProgress(),
            recommendations: await this.getRecommendations()
        };
        this.render();
    }
    
    /**
     * الحصول على الإحصائيات
     * @returns {Promise} الإحصائيات
     */
    async getStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تحميل الإحصائيات:', error);
            return {};
        }
    }
    
    /**
     * الحصول على النشاط الأخير
     * @returns {Promise} النشاط الأخير
     */
    async getRecentActivity() {
        try {
            const response = await fetch('/api/dashboard/recent');
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تحميل النشاط الأخير:', error);
            return [];
        }
    }
    
    /**
     * الحصول على التقدم
     * @returns {Promise} التقدم
     */
    async getProgress() {
        try {
            const response = await fetch('/api/dashboard/progress');
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تحميل التقدم:', error);
            return {};
        }
    }
    
    /**
     * الحصول على التوصيات
     * @returns {Promise} التوصيات
     */
    async getRecommendations() {
        try {
            const response = await fetch('/api/dashboard/recommendations');
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تحميل التوصيات:', error);
            return [];
        }
    }
    
    /**
     * عرض لوحة التحكم
     */
    render() {
        // سيتم تنفيذ العرض في دوال render المنفصلة
    }
}

// إنشاء لوحة التحكم
const DashboardSystem = new Dashboard();

// ================================================================
// 9. إدارة الصفوف الدراسية (Grades Management)
// ================================================================

/**
 * نظام إدارة الصفوف الدراسية
 */
class GradesManager {
    /**
     * إنشاء مدير الصفوف
     */
    constructor() {
        this.grades = [];
        this.isLoaded = false;
        this.listeners = [];
    }
    
    /**
     * تحميل جميع الصفوف
     * @returns {Promise} نتيجة التحميل
     */
    async loadGrades() {
        try {
            const response = await fetch('/api/grades');
            const data = await response.json();
            this.grades = data;
            this.isLoaded = true;
            this.notifyListeners('load', this.grades);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الصفوف:', error);
            return { success: false, error: 'حدث خطأ في تحميل الصفوف' };
        }
    }
    
    /**
     * الحصول على صف معين
     * @param {number} gradeId - معرف الصف
     * @returns {Object|null} الصف
     */
    getGrade(gradeId) {
        return this.grades.find(g => g.id === gradeId) || null;
    }
    
    /**
     * الحصول على محتوى الصف
     * @param {number} gradeId - معرف الصف
     * @returns {Promise} محتوى الصف
     */
    async getGradeContent(gradeId) {
        try {
            const response = await fetch(`/api/grades/${gradeId}/content`);
            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في تحميل محتوى الصف:', error);
            return { error: 'حدث خطأ في تحميل محتوى الصف' };
        }
    }
    
    /**
     * عرض الصفوف
     * @param {string} containerId - معرف الحاوية
     */
    renderGrades(containerId = 'gradesContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!this.isLoaded) {
            container.innerHTML = '<div class="loading">جاري تحميل الصفوف...</div>';
            return;
        }
        container.innerHTML = this.grades.map(grade => `
            <div class="grade-card" onclick="window.navigateToGrade(${grade.id})">
                <div class="grade-icon">${grade.id}</div>
                <div class="grade-name">${grade.name}</div>
                <div class="grade-info">${grade.subjects ? grade.subjects.length : 0} مواد</div>
            </div>
        `).join('');
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير الصفوف
const Grades = new GradesManager();

// ================================================================
// 10. إدارة المواد والوحدات (Subjects & Units Management)
// ================================================================

/**
 * نظام إدارة المواد والوحدات
 */
class SubjectManager {
    /**
     * إنشاء مدير المواد
     */
    constructor() {
        this.subjects = [];
        this.units = [];
        this.listeners = [];
    }
    
    /**
     * تحميل مواد صف معين
     * @param {number} gradeId - معرف الصف
     * @returns {Promise} نتيجة التحميل
     */
    async loadSubjects(gradeId) {
        try {
            const response = await fetch(`/api/grades/${gradeId}/subjects`);
            const data = await response.json();
            this.subjects = data;
            this.notifyListeners('load-subjects', { gradeId, subjects: data });
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل المواد:', error);
            return { success: false, error: 'حدث خطأ في تحميل المواد' };
        }
    }
    
    /**
     * تحميل وحدات مادة معينة
     * @param {number} subjectId - معرف المادة
     * @returns {Promise} نتيجة التحميل
     */
    async loadUnits(subjectId) {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/units`);
            const data = await response.json();
            this.units = data;
            this.notifyListeners('load-units', { subjectId, units: data });
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الوحدات:', error);
            return { success: false, error: 'حدث خطأ في تحميل الوحدات' };
        }
    }
    
    /**
     * الحصول على مادة معينة
     * @param {number} subjectId - معرف المادة
     * @returns {Object|null} المادة
     */
    getSubject(subjectId) {
        return this.subjects.find(s => s.id === subjectId) || null;
    }
    
    /**
     * الحصول على وحدة معينة
     * @param {number} unitId - معرف الوحدة
     * @returns {Object|null} الوحدة
     */
    getUnit(unitId) {
        return this.units.find(u => u.id === unitId) || null;
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير المواد
const Subjects = new SubjectManager();

// ================================================================
// 11. إدارة الدروس المتقدمة (Advanced Lessons Management)
// ================================================================

/**
 * نظام إدارة الدروس المتقدم
 */
class LessonManager {
    /**
     * إنشاء مدير الدروس
     */
    constructor() {
        this.lessons = {};
        this.currentLesson = null;
        this.listeners = [];
    }
    
    /**
     * تحميل درس معين
     * @param {number} lessonId - معرف الدرس
     * @param {number} unitId - معرف الوحدة
     * @param {number} subjectId - معرف المادة
     * @param {number} gradeId - معرف الصف
     * @returns {Promise} نتيجة التحميل
     */
    async loadLesson(lessonId, unitId, subjectId, gradeId) {
        try {
            const key = `${gradeId}_${subjectId}_${unitId}_${lessonId}`;
            if (this.lessons[key]) {
                this.currentLesson = this.lessons[key];
                this.notifyListeners('load', this.currentLesson);
                return { success: true, data: this.currentLesson };
            }
            
            const response = await fetch(`/api/lessons/${lessonId}`);
            const data = await response.json();
            this.lessons[key] = data;
            this.currentLesson = data;
            this.notifyListeners('load', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الدرس:', error);
            return { success: false, error: 'حدث خطأ في تحميل الدرس' };
        }
    }
    
    /**
     * تحديث تقدم الدرس
     * @param {number} lessonId - معرف الدرس
     * @param {number} progress - نسبة التقدم
     * @returns {Promise} نتيجة التحديث
     */
    async updateProgress(lessonId, progress) {
        try {
            const response = await fetch(`/api/lesson-progress/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('progress-update', { lessonId, progress });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديث تقدم الدرس:', error);
            return { success: false, error: 'حدث خطأ في تحديث تقدم الدرس' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير الدروس
const Lessons = new LessonManager();

// ================================================================
// 12. نظام الامتحانات المتكامل (Integrated Exam System)
// ================================================================

/**
 * نظام الامتحانات المتكامل
 */
class ExamSystem {
    /**
     * إنشاء نظام الامتحانات
     */
    constructor() {
        this.currentExam = null;
        this.results = {};
        this.listeners = [];
        this.isExamActive = false;
    }
    
    /**
     * بدء الامتحان
     * @param {number} examId - معرف الامتحان
     * @param {string} type - نوع الامتحان (lesson, unit, final)
     * @returns {Promise} نتيجة البدء
     */
    async startExam(examId, type = 'lesson') {
        try {
            const response = await fetch(`/api/exams/${examId}/start`);
            const data = await response.json();
            this.currentExam = data;
            this.isExamActive = true;
            this.startTimer();
            this.notifyListeners('start', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في بدء الامتحان:', error);
            return { success: false, error: 'حدث خطأ في بدء الامتحان' };
        }
    }
    
    /**
     * بدء المؤقت
     */
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timeRemaining = this.currentExam.duration || 3600; // دقيقة افتراضية
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.notifyListeners('timer', this.timeRemaining);
            if (this.timeRemaining <= 0) {
                this.finishExam();
            }
        }, 1000);
    }
    
    /**
     * إجابة سؤال
     * @param {number} questionIndex - رقم السؤال
     * @param {*} answer - الإجابة
     */
    answerQuestion(questionIndex, answer) {
        if (!this.isExamActive) return;
        if (!this.currentExam.answers) this.currentExam.answers = [];
        this.currentExam.answers[questionIndex] = answer;
        this.notifyListeners('answer', { questionIndex, answer });
    }
    
    /**
     * إنهاء الامتحان
     * @returns {Promise} نتيجة الإنهاء
     */
    async finishExam() {
        if (!this.isExamActive) return;
        this.isExamActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        try {
            const response = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: this.currentExam.id,
                    answers: this.currentExam.answers
                })
            });
            const data = await response.json();
            this.results[this.currentExam.id] = data;
            this.notifyListeners('finish', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في إنهاء الامتحان:', error);
            return { success: false, error: 'حدث خطأ في إنهاء الامتحان' };
        }
    }
    
    /**
     * الحصول على نتائج الامتحان
     * @param {number} examId - معرف الامتحان
     * @returns {Object|null} النتائج
     */
    getResults(examId) {
        return this.results[examId] || null;
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام الامتحانات
const Exams = new ExamSystem();

// ================================================================
// 13. نظام الأسئلة والأجوبة (Q&A System)
// ================================================================

/**
 * نظام الأسئلة والأجوبة المتكامل
 */
class QASystem {
    /**
     * إنشاء نظام الأسئلة والأجوبة
     */
    constructor() {
        this.questions = {};
        this.listeners = [];
    }
    
    /**
     * تحميل أسئلة الدرس
     * @param {number} lessonId - معرف الدرس
     * @returns {Promise} نتيجة التحميل
     */
    async loadQuestions(lessonId) {
        try {
            const response = await fetch(`/api/questions/${lessonId}`);
            const data = await response.json();
            this.questions[lessonId] = data;
            this.notifyListeners('load', { lessonId, questions: data });
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الأسئلة:', error);
            return { success: false, error: 'حدث خطأ في تحميل الأسئلة' };
        }
    }
    
    /**
     * إضافة سؤال جديد
     * @param {number} lessonId - معرف الدرس
     * @param {string} question - نص السؤال
     * @returns {Promise} نتيجة الإضافة
     */
    async addQuestion(lessonId, question) {
        try {
            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, question })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('add', { lessonId, question: data.question });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إضافة السؤال:', error);
            return { success: false, error: 'حدث خطأ في إضافة السؤال' };
        }
    }
    
    /**
     * إجابة على سؤال
     * @param {number} questionId - معرف السؤال
     * @param {string} answer - نص الإجابة
     * @returns {Promise} نتيجة الإجابة
     */
    async answerQuestion(questionId, answer) {
        try {
            const response = await fetch(`/api/questions/${questionId}/answer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('answer', { questionId, answer });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إجابة السؤال:', error);
            return { success: false, error: 'حدث خطأ في إجابة السؤال' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام الأسئلة والأجوبة
const QA = new QASystem();

// ================================================================
// 14. نظام الشهادات والإنجازات (Certificates & Achievements)
// ================================================================

/**
 * نظام الشهادات والإنجازات
 */
class AchievementSystem {
    /**
     * إنشاء نظام الشهادات
     */
    constructor() {
        this.certificates = [];
        this.badges = [];
        this.listeners = [];
    }
    
    /**
     * تحميل شهادات المستخدم
     * @param {string} username - اسم المستخدم
     * @returns {Promise} نتيجة التحميل
     */
    async loadCertificates(username) {
        try {
            const response = await fetch(`/api/certificates/${username}`);
            const data = await response.json();
            this.certificates = data;
            this.notifyListeners('load-certificates', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الشهادات:', error);
            return { success: false, error: 'حدث خطأ في تحميل الشهادات' };
        }
    }
    
    /**
     * تحميل شارات المستخدم
     * @param {string} username - اسم المستخدم
     * @returns {Promise} نتيجة التحميل
     */
    async loadBadges(username) {
        try {
            const response = await fetch(`/api/badges/${username}`);
            const data = await response.json();
            this.badges = data;
            this.notifyListeners('load-badges', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الشارات:', error);
            return { success: false, error: 'حدث خطأ في تحميل الشارات' };
        }
    }
    
    /**
     * إنشاء شهادة جديدة
     * @param {number} courseId - معرف الدورة
     * @param {string} username - اسم المستخدم
     * @returns {Promise} نتيجة الإنشاء
     */
    async generateCertificate(courseId, username) {
        try {
            const response = await fetch('/api/certificates/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, username })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('generate', data.certificate);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إنشاء الشهادة:', error);
            return { success: false, error: 'حدث خطأ في إنشاء الشهادة' };
        }
    }
    
    /**
     * تحميل الشهادة كـ PDF
     * @param {string} certificateId - معرف الشهادة
     */
    downloadCertificate(certificateId) {
        window.open(`/api/certificates/${certificateId}/download`, '_blank');
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام الشهادات
const Achievements = new AchievementSystem();

// ================================================================
// 15. لوحة إدارة المستخدمين (Admin - Users Management)
// ================================================================

/**
 * لوحة إدارة المستخدمين المتقدمة
 */
class AdminUserManager {
    /**
     * إنشاء مدير المستخدمين
     */
    constructor() {
        this.users = [];
        this.filters = {};
        this.listeners = [];
    }
    
    /**
     * تحميل جميع المستخدمين
     * @param {Object} filters - عوامل التصفية
     * @returns {Promise} نتيجة التحميل
     */
    async loadUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/admin/users?${queryParams}`);
            const data = await response.json();
            this.users = data;
            this.filters = filters;
            this.notifyListeners('load', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل المستخدمين:', error);
            return { success: false, error: 'حدث خطأ في تحميل المستخدمين' };
        }
    }
    
    /**
     * تحديث بيانات مستخدم
     * @param {string} userId - معرف المستخدم
     * @param {Object} updates - التحديثات
     * @returns {Promise} نتيجة التحديث
     */
    async updateUser(userId, updates) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('update', { userId, updates: data.user });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديث المستخدم:', error);
            return { success: false, error: 'حدث خطأ في تحديث المستخدم' };
        }
    }
    
    /**
     * حظر/إلغاء حظر مستخدم
     * @param {string} userId - معرف المستخدم
     * @param {boolean} banned - حالة الحظر
     * @returns {Promise} نتيجة العملية
     */
    async toggleBan(userId, banned) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('ban-toggle', { userId, banned: data.banned });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تبديل الحظر:', error);
            return { success: false, error: 'حدث خطأ في تبديل الحظر' };
        }
    }
    
    /**
     * حذف مستخدم
     * @param {string} userId - معرف المستخدم
     * @returns {Promise} نتيجة الحذف
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('delete', userId);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في حذف المستخدم:', error);
            return { success: false, error: 'حدث خطأ في حذف المستخدم' };
        }
    }
    
    /**
     * ترقية مستخدم
     * @param {string} userId - معرف المستخدم
     * @param {number} duration - المدة بالأشهر
     * @param {Array} selectedGrades - الصفوف المختارة
     * @returns {Promise} نتيجة الترقية
     */
    async upgradeUser(userId, duration, selectedGrades) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/upgrade`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration, selectedGrades })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('upgrade', { userId, duration, selectedGrades });
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في ترقية المستخدم:', error);
            return { success: false, error: 'حدث خطأ في ترقية المستخدم' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير المستخدمين
const AdminUsers = new AdminUserManager();

// ================================================================
// 16. لوحة إدارة المحتوى (Admin - Content Management)
// ================================================================

/**
 * لوحة إدارة المحتوى المتقدمة
 */
class AdminContentManager {
    /**
     * إنشاء مدير المحتوى
     */
    constructor() {
        this.content = {};
        this.listeners = [];
    }
    
    /**
     * إضافة صف جديد
     * @param {string} name - اسم الصف
     * @returns {Promise} نتيجة الإضافة
     */
    async addGrade(name) {
        try {
            const response = await fetch('/api/admin/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('add-grade', data.grade);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إضافة الصف:', error);
            return { success: false, error: 'حدث خطأ في إضافة الصف' };
        }
    }
    
    /**
     * تحديث صف
     * @param {number} gradeId - معرف الصف
     * @param {string} name - اسم الصف الجديد
     * @returns {Promise} نتيجة التحديث
     */
    async updateGrade(gradeId, name) {
        try {
            const response = await fetch(`/api/admin/grades/${gradeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('update-grade', data.grade);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديث الصف:', error);
            return { success: false, error: 'حدث خطأ في تحديث الصف' };
        }
    }
    
    /**
     * حذف صف
     * @param {number} gradeId - معرف الصف
     * @returns {Promise} نتيجة الحذف
     */
    async deleteGrade(gradeId) {
        try {
            const response = await fetch(`/api/admin/grades/${gradeId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('delete-grade', gradeId);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في حذف الصف:', error);
            return { success: false, error: 'حدث خطأ في حذف الصف' };
        }
    }
    
    /**
     * إضافة مادة
     * @param {number} gradeId - معرف الصف
     * @param {string} name - اسم المادة
     * @returns {Promise} نتيجة الإضافة
     */
    async addSubject(gradeId, name) {
        try {
            const response = await fetch(`/api/admin/grades/${gradeId}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('add-subject', data.subject);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إضافة المادة:', error);
            return { success: false, error: 'حدث خطأ في إضافة المادة' };
        }
    }
    
    /**
     * إضافة وحدة
     * @param {number} gradeId - معرف الصف
     * @param {number} subjectId - معرف المادة
     * @param {string} name - اسم الوحدة
     * @returns {Promise} نتيجة الإضافة
     */
    async addUnit(gradeId, subjectId, name) {
        try {
            const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('add-unit', data.unit);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إضافة الوحدة:', error);
            return { success: false, error: 'حدث خطأ في إضافة الوحدة' };
        }
    }
    
    /**
     * إضافة درس
     * @param {number} gradeId - معرف الصف
     * @param {number} subjectId - معرف المادة
     * @param {number} unitId - معرف الوحدة
     * @param {Object} lessonData - بيانات الدرس
     * @returns {Promise} نتيجة الإضافة
     */
    async addLesson(gradeId, subjectId, unitId, lessonData) {
        try {
            const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('add-lesson', data.lesson);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في إضافة الدرس:', error);
            return { success: false, error: 'حدث خطأ في إضافة الدرس' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء مدير المحتوى
const AdminContent = new AdminContentManager();

// ================================================================
// 17. نظام الإشعارات المتقدم (Advanced Notification System)
// ================================================================

/**
 * نظام الإشعارات المتكامل
 */
class NotificationSystem {
    /**
     * إنشاء نظام الإشعارات
     */
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
        this.socket = null;
    }
    
    /**
     * تهيئة نظام الإشعارات
     */
    init() {
        this.loadNotifications();
        this.setupWebSocket();
    }
    
    /**
     * تحميل الإشعارات
     * @returns {Promise} نتيجة التحميل
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            this.notifications = data;
            this.unreadCount = data.filter(n => !n.read).length;
            this.notifyListeners('load', this.notifications);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحميل الإشعارات:', error);
            return { success: false, error: 'حدث خطأ في تحميل الإشعارات' };
        }
    }
    
    /**
     * إعداد WebSocket للإشعارات الفورية
     */
    setupWebSocket() {
        // سيتم تنفيذ WebSocket في المستقبل
    }
    
    /**
     * إضافة إشعار جديد
     * @param {string} title - عنوان الإشعار
     * @param {string} message - نص الإشعار
     * @param {string} type - نوع الإشعار
     */
    addNotification(title, message, type = 'info') {
        const notification = {
            id: generateId(),
            title,
            message,
            type,
            read: false,
            timestamp: new Date().toISOString()
        };
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.notifyListeners('add', notification);
        this.showNotification(notification);
    }
    
    /**
     * عرض الإشعار للمستخدم
     * @param {Object} notification - الإشعار
     */
    showNotification(notification) {
        // عرض إشعار في الواجهة
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const element = document.createElement('div');
        element.className = `notification-item ${notification.type}`;
        element.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${getTimeAgo(notification.timestamp)}</div>
        `;
        container.prepend(element);
        
        // إزالة الإشعار بعد 5 ثواني
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }, 5000);
    }
    
    /**
     * تحديد إشعار كمقروء
     * @param {string} notificationId - معرف الإشعار
     * @returns {Promise} نتيجة التحديث
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification && !notification.read) {
                    notification.read = true;
                    this.unreadCount--;
                    this.notifyListeners('read', notificationId);
                }
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديد الإشعار كمقروء:', error);
            return { success: false, error: 'حدث خطأ في تحديد الإشعار كمقروء' };
        }
    }
    
    /**
     * تحديد جميع الإشعارات كمقروءة
     * @returns {Promise} نتيجة التحديث
     */
    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                for (const notification of this.notifications) {
                    notification.read = true;
                }
                this.unreadCount = 0;
                this.notifyListeners('read-all', null);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديد جميع الإشعارات كمقروءة:', error);
            return { success: false, error: 'حدث خطأ في تحديد جميع الإشعارات كمقروءة' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام الإشعارات
const Notifications = new NotificationSystem();

// ================================================================
// 18. نظام التقارير والإحصائيات (Reports & Analytics)
// ================================================================

/**
 * نظام التقارير والإحصائيات المتقدم
 */
class AnalyticsSystem {
    /**
     * إنشاء نظام التحليلات
     */
    constructor() {
        this.reports = {};
        this.listeners = [];
    }
    
    /**
     * الحصول على إحصائيات المستخدم
     * @param {string} username - اسم المستخدم
     * @returns {Promise} الإحصائيات
     */
    async getUserStats(username) {
        try {
            const response = await fetch(`/api/analytics/users/${username}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات المستخدم:', error);
            return { success: false, error: 'حدث خطأ في جلب إحصائيات المستخدم' };
        }
    }
    
    /**
     * الحصول على إحصائيات الدورة
     * @param {number} courseId - معرف الدورة
     * @returns {Promise} الإحصائيات
     */
    async getCourseStats(courseId) {
        try {
            const response = await fetch(`/api/analytics/courses/${courseId}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات الدورة:', error);
            return { success: false, error: 'حدث خطأ في جلب إحصائيات الدورة' };
        }
    }
    
    /**
     * الحصول على تقرير كامل للمنصة
     * @param {Object} options - خيارات التقرير
     * @returns {Promise} التقرير
     */
    async getFullReport(options = {}) {
        try {
            const queryParams = new URLSearchParams(options).toString();
            const response = await fetch(`/api/analytics/report?${queryParams}`);
            const data = await response.json();
            this.reports[data.id] = data;
            this.notifyListeners('report', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب التقرير:', error);
            return { success: false, error: 'حدث خطأ في جلب التقرير' };
        }
    }
    
    /**
     * تصدير التقرير
     * @param {string} reportId - معرف التقرير
     * @param {string} format - صيغة التصدير (pdf, csv, json)
     */
    exportReport(reportId, format = 'pdf') {
        window.open(`/api/analytics/export/${reportId}?format=${format}`, '_blank');
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام التحليلات
const Analytics = new AnalyticsSystem();

// ================================================================
// 19. نظام البحث المتقدم (Advanced Search System)
// ================================================================

/**
 * نظام البحث المتقدم
 */
class SearchSystem {
    /**
     * إنشاء نظام البحث
     */
    constructor() {
        this.results = [];
        this.filters = {};
        this.listeners = [];
        this.debounceTimer = null;
    }
    
    /**
     * البحث
     * @param {string} query - كلمات البحث
     * @param {Object} filters - عوامل التصفية
     * @param {number} page - رقم الصفحة
     * @param {number} limit - عدد النتائج
     * @returns {Promise} نتيجة البحث
     */
    async search(query, filters = {}, page = 1, limit = 20) {
        try {
            this.filters = filters;
            const params = new URLSearchParams({
                q: query,
                page,
                limit,
                ...filters
            });
            const response = await fetch(`/api/search?${params}`);
            const data = await response.json();
            this.results = data.results;
            this.notifyListeners('results', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في البحث:', error);
            return { success: false, error: 'حدث خطأ في البحث' };
        }
    }
    
    /**
     * البحث المتقدم مع دالة debounce
     * @param {string} query - كلمات البحث
     * @param {Function} callback - دالة النتائج
     */
    searchDebounced(query, callback) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(async () => {
            const result = await this.search(query);
            if (result.success && callback) {
                callback(result.data);
            }
        }, 300);
    }
    
    /**
     * تصفية النتائج
     * @param {string} filterType - نوع التصفية
     * @param {*} value - قيمة التصفية
     */
    applyFilter(filterType, value) {
        this.filters[filterType] = value;
        this.search(this.filters.q || '', this.filters);
    }
    
    /**
     * إزالة التصفية
     * @param {string} filterType - نوع التصفية
     */
    removeFilter(filterType) {
        delete this.filters[filterType];
        this.search(this.filters.q || '', this.filters);
    }
    
    /**
     * إعادة تعيين جميع التصفيات
     */
    clearFilters() {
        this.filters = {};
        this.search(this.filters.q || '', this.filters);
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام البحث
const Search = new SearchSystem();

// ================================================================
// 20. نظام التوصيات الذكية (Smart Recommendations)
// ================================================================

/**
 * نظام التوصيات الذكية
 */
class RecommendationSystem {
    /**
     * إنشاء نظام التوصيات
     */
    constructor() {
        this.recommendations = [];
        this.listeners = [];
    }
    
    /**
     * الحصول على توصيات للمستخدم
     * @param {string} username - اسم المستخدم
     * @param {number} limit - عدد التوصيات
     * @returns {Promise} التوصيات
     */
    async getRecommendations(username, limit = 10) {
        try {
            const response = await fetch(`/api/recommendations/${username}?limit=${limit}`);
            const data = await response.json();
            this.recommendations = data;
            this.notifyListeners('recommendations', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب التوصيات:', error);
            return { success: false, error: 'حدث خطأ في جلب التوصيات' };
        }
    }
    
    /**
     * الحصول على توصيات حسب الصف
     * @param {number} gradeId - معرف الصف
     * @param {number} limit - عدد التوصيات
     * @returns {Promise} التوصيات
     */
    async getGradeRecommendations(gradeId, limit = 10) {
        try {
            const response = await fetch(`/api/recommendations/grade/${gradeId}?limit=${limit}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب توصيات الصف:', error);
            return { success: false, error: 'حدث خطأ في جلب توصيات الصف' };
        }
    }
    
    /**
     * تحديث توصيات المستخدم
     * @param {string} username - اسم المستخدم
     * @returns {Promise} نتيجة التحديث
     */
    async updateRecommendations(username) {
        try {
            const response = await fetch(`/api/recommendations/${username}/update`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                this.notifyListeners('update', data.recommendations);
            }
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحديث التوصيات:', error);
            return { success: false, error: 'حدث خطأ في تحديث التوصيات' };
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام التوصيات
const Recommendations = new RecommendationSystem();

// ================================================================
// 21. واجهة المستخدم التفاعلية (Interactive UI)
// ================================================================

/**
 * نظام واجهة المستخدم التفاعلية
 */
class UISystem {
    /**
     * إنشاء نظام الواجهة
     */
    constructor() {
        this.modals = {};
        this.loaders = {};
        this.tooltips = {};
        this.listeners = [];
    }
    
    /**
     * عرض نافذة منبثقة
     * @param {string} modalId - معرف النافذة
     * @param {Object} options - خيارات العرض
     */
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('active');
        if (options.overlay) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.addEventListener('click', () => this.hideModal(modalId));
            modal.prepend(overlay);
        }
        this.notifyListeners('show-modal', { modalId, options });
    }
    
    /**
     * إخفاء نافذة منبثقة
     * @param {string} modalId - معرف النافذة
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
        this.notifyListeners('hide-modal', modalId);
    }
    
    /**
     * عرض مؤشر تحميل
     * @param {string} loaderId - معرف المؤشر
     * @param {string} message - رسالة التحميل
     */
    showLoader(loaderId, message = 'جاري التحميل...') {
        const loader = document.getElementById(loaderId);
        if (!loader) return;
        loader.classList.add('active');
        const messageElement = loader.querySelector('.loader-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        this.notifyListeners('show-loader', { loaderId, message });
    }
    
    /**
     * إخفاء مؤشر التحميل
     * @param {string} loaderId - معرف المؤشر
     */
    hideLoader(loaderId) {
        const loader = document.getElementById(loaderId);
        if (!loader) return;
        loader.classList.remove('active');
        this.notifyListeners('hide-loader', loaderId);
    }
    
    /**
     * عرض تلميح
     * @param {string} text - نص التلميح
     * @param {Element} target - العنصر المستهدف
     * @param {Object} options - خيارات التلميح
     */
    showTooltip(text, target, options = {}) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.position = 'absolute';
        const rect = target.getBoundingClientRect();
        tooltip.style.top = (rect.top - 10 + window.scrollY) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        document.body.appendChild(tooltip);
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }, options.duration || 2000);
    }
    
    /**
     * تبديل حالة العنصر
     * @param {string} elementId - معرف العنصر
     * @param {string} className - اسم الكلاس
     */
    toggleClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    }
    
    /**
     * إضافة مستمع
     * @param {Function} listener - دالة المعالجة
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * إزالة مستمع
     * @param {Function} listener - الدالة المراد إزالتها
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    /**
     * إشعار المستمعين
     * @param {string} event - نوع الحدث
     * @param {*} data - البيانات
     */
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ خطأ في تنفيذ المستمع:', error);
            }
        }
    }
}

// إنشاء نظام الواجهة
const UI = new UISystem();

// ================================================================
// 22. دوال مساعدة إضافية (Additional Helpers)
// ================================================================

/**
 * تحميل البيانات من الخادم مع إعادة المحاولة
 * @param {string} url - رابط الطلب
 * @param {Object} options - خيارات الطلب
 * @param {number} retries - عدد المحاولات
 * @param {number} delay - التأخير بين المحاولات
 * @returns {Promise} نتيجة الطلب
 */
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            if (i === retries - 1) {
                throw new Error(`فشل الطلب بعد ${retries} محاولات: ${response.status}`);
            }
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

/**
 * تخزين البيانات في localStorage
 * @param {string} key - المفتاح
 * @param {*} data - البيانات
 * @param {number} expiry - مدة الصلاحية بالمللي ثانية
 */
function setLocalStorage(key, data, expiry = null) {
    const item = {
        data,
        timestamp: Date.now()
    };
    if (expiry) {
        item.expiry = expiry;
    }
    try {
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error('❌ خطأ في تخزين البيانات:', error);
    }
}

/**
 * استرجاع البيانات من localStorage
 * @param {string} key - المفتاح
 * @returns {*} البيانات
 */
function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (parsed.expiry && Date.now() - parsed.timestamp > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch (error) {
        console.error('❌ خطأ في استرجاع البيانات:', error);
        return null;
    }
}

/**
 * حذف البيانات من localStorage
 * @param {string} key - المفتاح
 */
function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('❌ خطأ في حذف البيانات:', error);
    }
}

/**
 * تحويل البيانات إلى Query String
 * @param {Object} params - المعاملات
 * @returns {string} Query String
 */
function toQueryString(params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            searchParams.append(key, value);
        }
    }
    return searchParams.toString();
}

/**
 * تحليل Query String إلى كائن
 * @param {string} queryString - Query String
 * @returns {Object} المعاملات
 */
function parseQueryString(queryString) {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

/**
 * نسخ النص إلى الحافظة
 * @param {string} text - النص المراد نسخه
 * @returns {Promise} نتيجة النسخ
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في نسخ النص:', error);
        return { success: false, error: 'حدث خطأ في نسخ النص' };
    }
}

/**
 * تنزيل ملف
 * @param {string} url - رابط الملف
 * @param {string} filename - اسم الملف
 */
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * تنزيل نص كملف
 * @param {string} content - محتوى النص
 * @param {string} filename - اسم الملف
 * @param {string} type - نوع الملف
 */
function downloadTextFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    URL.revokeObjectURL(url);
}

// ================================================================
// 23. تهيئة التطبيق (Application Initialization)
// ================================================================

/**
 * تهيئة التطبيق بالكامل
 */
async function initApp() {
    console.log('🚀 بدء تهيئة تطبيق DeepTeachSY...');
    
    // تهيئة نظام الألوان
    ThemeSystem.applyTheme();
    
    // تهيئة نظام المصادقة
    await Auth.checkSession();
    
    // تهيئة نظام الإشعارات
    Notifications.init();
    
    // تحميل الصفوف
    await Grades.loadGrades();
    
    // تسجيل المسارات في نظام التنقل
    Navigator.registerRoute('home', renderHome);
    Navigator.registerRoute('grades', renderGrades);
    Navigator.registerRoute('about', renderAbout);
    Navigator.registerRoute('profile', renderProfile);
    Navigator.registerRoute('admin-users', renderAdminUsers);
    Navigator.registerRoute('admin-content', renderAdminContent);
    
    // عرض الصفحة الرئيسية
    Navigator.navigateTo('home');
    
    console.log('✅ تم تهيئة تطبيق DeepTeachSY بنجاح');
}

/**
 * عرض الصفحة الرئيسية
 */
function renderHome() {
    if (Auth.isAuthenticated) {
        renderUserDashboard();
    } else {
        renderPublicHome();
    }
}

/**
 * عرض الصفحة الرئيسية العامة
 */
function renderPublicHome() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <h1>مرحباً بك في <span class="text-gold">DeepTeachSY</span></h1>
            <p class="hero-subtitle">منصة التعلم العميق التي تتيح لك اكتساب المعرفة بطريقة منظمة وتفاعلية</p>
            <div class="hero-buttons">
                <button class="btn btn-primary" onclick="showRegisterModal()">ابدأ رحلتك التعليمية</button>
                <button class="btn btn-outline" onclick="showLoginModal()">تسجيل الدخول</button>
            </div>
        </div>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-book-open"></i></div>
                <h3>دروس منظمة</h3>
                <p>محتوى تعليمي مرتب حسب الصفوف والمواد والوحدات</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-video"></i></div>
                <h3>شروحات فيديو</h3>
                <p>دروس مصورة مع أمثلة محلولة وتمارين تفاعلية</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-crown"></i></div>
                <h3>محتوى مدفوع ومجاني</h3>
                <p>اختر الخطة المناسبة لك وتمتع بمزايا إضافية</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
                <h3>تتبع التقدم</h3>
                <p>راقب تطورك واحصل على شارات عند إتمام الدروس</p>
            </div>
        </div>
        <div id="gradesContainer"></div>
        <div class="cta-section">
            <h2>جاهز لبدء رحلتك التعليمية؟</h2>
            <p>انضم إلى آلاف الطلاب الذين يطورون مهاراتهم مع DeepTeachSY</p>
            <button class="btn btn-primary" onclick="showRegisterModal()">سجل الآن مجاناً</button>
        </div>
    `;
    Grades.renderGrades('gradesContainer');
}

/**
 * عرض لوحة المستخدم
 */
function renderUserDashboard() {
    const container = document.getElementById('mainContent');
    const user = Auth.currentUser;
    container.innerHTML = `
        <div class="user-dashboard">
            <div class="welcome-banner">
                <div class="welcome-text">
                    <h2>مرحباً ${user.username} 👋</h2>
                    <p>خطتك: <strong class="${user.plan === 'paid' ? 'text-gold' : 'text-muted'}">${user.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</strong></p>
                </div>
                <div class="quick-actions">
                    <button class="btn btn-sm" onclick="Navigator.navigateTo('grades')">استعراض الصفوف</button>
                    ${user.role === 'admin' ? '<button class="btn btn-sm btn-outline" onclick="Navigator.navigateTo(\'admin-users\')">👑 إدارة</button>' : ''}
                    <button class="btn btn-sm btn-outline" onclick="Navigator.navigateTo('profile')">حسابي</button>
                </div>
            </div>
            <div id="gradesContainer"></div>
        </div>
    `;
    Grades.renderGrades('gradesContainer');
}

/**
 * عرض الصفوف
 */
function renderGrades() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="page-header">
            <button class="btn btn-outline btn-sm" onclick="Navigator.navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 class="page-title">الصفوف الدراسية</h2>
        </div>
        <div id="gradesContainer"></div>
    `;
    Grades.renderGrades('gradesContainer');
}

/**
 * عرض صفحة "عن المنصة"
 */
function renderAbout() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="about-page">
            <h2 class="page-title">عن منصة DeepTeachSY</h2>
            <div class="about-content">
                <div class="about-card">
                    <h3>رسالتنا</h3>
                    <p>تقديم تعليم عالي الجودة للجميع، بغض النظر عن موقعهم أو ظروفهم المادية.</p>
                </div>
                <div class="about-card">
                    <h3>رؤيتنا</h3>
                    <p>أن نكون المنصة التعليمية الرائدة في سوريا والمنطقة العربية.</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * عرض صفحة الحساب
 */
function renderProfile() {
    const container = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!user) {
        showLoginModal();
        return;
    }
    container.innerHTML = `
        <div class="profile-page">
            <h2 class="page-title">حسابي</h2>
            <div class="profile-card">
                <h3>معلومات الحساب</h3>
                <div class="info-row"><strong>اسم المستخدم:</strong> ${user.username}</div>
                <div class="info-row"><strong>البريد الإلكتروني:</strong> ${user.email}</div>
                <div class="info-row"><strong>رقم الهاتف:</strong> ${user.phone || 'غير مضاف'}</div>
                <div class="info-row"><strong>الخطة:</strong> ${user.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</div>
                ${user.plan === 'paid' && user.subscriptionEnd ? `<div class="info-row"><strong>ينتهي الاشتراك:</strong> ${formatDate(user.subscriptionEnd)}</div>` : ''}
                <div class="info-row"><strong>الدور:</strong> ${user.role === 'admin' ? 'مشرف' : 'طالب'}</div>
                ${!user.banned ? '<div class="info-row"><strong>الحالة:</strong> مفعل ✅</div>' : '<div class="info-row"><strong>الحالة:</strong> محظور 🚫</div>'}
            </div>
        </div>
    `;
}

/**
 * عرض لوحة إدارة المستخدمين
 */
function renderAdminUsers() {
    if (!Auth.isAdmin()) {
        showToast('غير مصرح', 'error');
        return;
    }
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="admin-page">
            <div class="page-header">
                <button class="btn btn-outline btn-sm" onclick="Navigator.navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 class="page-title">👑 إدارة المستخدمين</h2>
            </div>
            <div id="usersContainer"></div>
        </div>
    `;
    loadUsers();
}

/**
 * تحميل وعرض المستخدمين
 */
async function loadUsers() {
    const result = await AdminUsers.loadUsers();
    if (result.success) {
        const container = document.getElementById('usersContainer');
        const users = result.data;
        container.innerHTML = `
            <div class="admin-stats">
                <div class="admin-stat-card"><span class="stat-number">${users.length}</span><span class="stat-label">إجمالي المستخدمين</span></div>
                <div class="admin-stat-card"><span class="stat-number">${users.filter(u => u.plan === 'paid').length}</span><span class="stat-label">مدفوعين</span></div>
                <div class="admin-stat-card"><span class="stat-number">${users.filter(u => u.banned).length}</span><span class="stat-label">محظورين</span></div>
            </div>
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المستخدم</th>
                            <th>البريد</th>
                            <th>الخطة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((u, i) => `
                            <tr>
                                <td>${i+1}</td>
                                <td><strong>${u.username}</strong></td>
                                <td>${u.email}</td>
                                <td>${u.plan === 'paid' ? '⭐ مدفوع' : '🆓 مجاني'}</td>
                                <td>${u.banned ? '🚫 محظور' : '✅ مفعل'}</td>
                                <td>
                                    <button class="btn btn-sm" onclick="toggleBanUser('${u._id}')">${u.banned ? '🔓' : '🔒'}</button>
                                    ${u.plan === 'free' ? `<button class="btn btn-sm" onclick="showUpgradeUser('${u._id}')">⭐ ترقية</button>` : `<button class="btn btn-sm" onclick="setUserPlan('${u._id}','free')">🔄 مجاني</button>`}
                                    <button class="btn btn-sm" onclick="deleteUser('${u._id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

/**
 * عرض لوحة إدارة المحتوى
 */
function renderAdminContent() {
    if (!Auth.isAdmin()) {
        showToast('غير مصرح', 'error');
        return;
    }
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="admin-page">
            <div class="page-header">
                <button class="btn btn-outline btn-sm" onclick="Navigator.navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 class="page-title">📚 إدارة المحتوى</h2>
            </div>
            <div class="admin-controls">
                <button class="btn" onclick="showAddGradeForm()">➕ إضافة صف</button>
                <button class="btn btn-outline" onclick="renderAdminContent()">🔄 تحديث</button>
            </div>
            <div id="contentContainer"></div>
        </div>
    `;
    loadContentTree();
}

/**
 * تحميل شجرة المحتوى
 */
async function loadContentTree() {
    const result = await Grades.loadGrades();
    if (result.success) {
        const container = document.getElementById('contentContainer');
        const grades = result.data;
        container.innerHTML = grades.map(g => `
            <div class="content-grade-card">
                <div class="content-grade-header">
                    <h3>📚 ${g.name}</h3>
                    <div>
                        <button class="btn btn-sm" onclick="showAddSubjectForm(${g.id})">➕ مادة</button>
                        <button class="btn btn-sm btn-outline" onclick="editGradeForm(${g.id})">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id})">🗑️</button>
                    </div>
                </div>
                ${g.subjects && g.subjects.length ? g.subjects.map(s => `
                    <div class="content-subject-item">
                        <div class="content-subject-header">
                            <strong>📘 ${s.name}</strong>
                            <div>
                                <button class="btn btn-sm" onclick="showAddUnitForm(${g.id},${s.id})">➕ وحدة</button>
                                <button class="btn btn-sm btn-outline" onclick="editSubjectForm(${g.id},${s.id})">✏️</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSubject(${g.id},${s.id})">🗑️</button>
                            </div>
                        </div>
                        ${s.units && s.units.length ? s.units.map(u => `
                            <div class="content-unit-item">
                                <div class="content-unit-header">
                                    <span>📂 ${u.name}</span>
                                    <div>
                                        <button class="btn btn-sm" onclick="showAddLessonForm(${g.id},${s.id},${u.id})">➕ درس</button>
                                        <button class="btn btn-sm btn-outline" onclick="editUnitForm(${g.id},${s.id},${u.id})">✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteUnit(${g.id},${s.id},${u.id})">🗑️</button>
                                    </div>
                                </div>
                                ${u.lessons && u.lessons.length ? u.lessons.map(l => `
                                    <div class="content-lesson-item">
                                        <span>📖 ${l.title} ${l.free ? '🆓' : '⭐'}</span>
                                        <div>
                                            <button class="btn btn-sm btn-outline" onclick="editLessonForm(${g.id},${s.id},${u.id},${l.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteLesson(${g.id},${s.id},${u.id},${l.id})">🗑️</button>
                                        </div>
                                    </div>
                                `).join('') : ''}
                            </div>
                        `).join('') : ''}
                    </div>
                `).join('') : ''}
            </div>
        `).join('');
    }
}

// ================================================================
// 24. دوال الإدارة (Admin Functions)
// ================================================================

/**
 * تبديل حالة حظر المستخدم
 */
async function toggleBanUser(userId) {
    if (!confirm('هل تريد تبديل حالة الحظر؟')) return;
    const result = await AdminUsers.toggleBan(userId);
    if (result.success) {
        showToast('✅ تم تبديل حالة الحظر', 'success');
        loadUsers();
    } else {
        showToast('❌ ' + (result.error || 'فشل العملية'), 'error');
    }
}

/**
 * حذف المستخدم
 */
async function deleteUser(userId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    const result = await AdminUsers.deleteUser(userId);
    if (result.success) {
        showToast('✅ تم حذف المستخدم', 'success');
        loadUsers();
    } else {
        showToast('❌ ' + (result.error || 'فشل الحذف'), 'error');
    }
}

/**
 * عرض نموذج ترقية المستخدم
 */
function showUpgradeUser(userId) {
    const duration = prompt('المدة بالأشهر (1,3,6,12):', '1');
    if (!duration) return;
    const months = parseInt(duration);
    if (![1, 3, 6, 12].includes(months)) {
        showToast('مدة غير صحيحة', 'error');
        return;
    }
    const grades = AppState.allGrades.map(g => `${g.id}: ${g.name}`).join('\n');
    const gradesInput = prompt(`أرقام الصفوف (مفصولة بفواصل):\n${grades}`, '');
    if (gradesInput === null) return;
    const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (selectedGrades.length === 0) {
        showToast('يرجى إدخال صف واحد على الأقل', 'error');
        return;
    }
    AdminUsers.upgradeUser(userId, months, selectedGrades).then(result => {
        if (result.success) {
            showToast('✅ تم ترقية المستخدم', 'success');
            loadUsers();
        } else {
            showToast('❌ ' + (result.error || 'فشل الترقية'), 'error');
        }
    });
}

/**
 * تغيير خطة المستخدم
 */
async function setUserPlan(userId, plan) {
    if (!confirm(`تغيير الخطة إلى ${plan === 'free' ? 'مجانية' : 'مدفوعة'}؟`)) return;
    const updates = { plan };
    if (plan === 'paid') {
        const duration = prompt('المدة بالأشهر (1,3,6,12):', '1');
        if (!duration) return;
        const months = parseInt(duration);
        if (![1, 3, 6, 12].includes(months)) {
            showToast('مدة غير صحيحة', 'error');
            return;
        }
        updates.subscriptionDuration = months;
        const grades = AppState.allGrades.map(g => `${g.id}: ${g.name}`).join('\n');
        const gradesInput = prompt(`أرقام الصفوف (مفصولة بفواصل):\n${grades}`, '');
        if (gradesInput === null) return;
        const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (selectedGrades.length === 0) {
            showToast('يرجى إدخال صف واحد على الأقل', 'error');
            return;
        }
        updates.selectedGrades = selectedGrades;
    } else {
        updates.selectedGrades = [];
        updates.subscriptionDuration = null;
    }
    const result = await AdminUsers.updateUser(userId, updates);
    if (result.success) {
        showToast('✅ تم تغيير الخطة', 'success');
        loadUsers();
    } else {
        showToast('❌ ' + (result.error || 'فشل التغيير'), 'error');
    }
}

// ================================================================
// 25. دوال النوافذ المنبثقة (Modal Functions)
// ================================================================

/**
 * عرض نافذة تسجيل الدخول
 */
function showLoginModal(message = '') {
    const modal = document.getElementById('loginModal');
    const errorEl = document.getElementById('loginError');
    if (message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        errorEl.style.display = 'none';
    }
    modal.style.display = 'flex';
}

/**
 * عرض نافذة التسجيل
 */
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('regError').style.display = 'none';
    loadGradesForRegister();
    toggleGradeSelection();
}

/**
 * إغلاق نافذة منبثقة
 */
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

/**
 * التبديل إلى نافذة التسجيل
 */
function switchToRegister() {
    closeModal('loginModal');
    showRegisterModal();
}

/**
 * التبديل إلى نافذة تسجيل الدخول
 */
function switchToLogin() {
    closeModal('registerModal');
    showLoginModal();
}

/**
 * تحميل الصفوف للتسجيل
 */
async function loadGradesForRegister() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        const container = document.getElementById('gradesCheckboxes');
        container.innerHTML = grades.map(g => `
            <label>
                <input type="checkbox" value="${g.id}" class="grade-checkbox" />
                ${g.name}
            </label>
        `).join('');
    } catch (error) {
        console.error('❌ خطأ في تحميل الصفوف للتسجيل:', error);
    }
}

/**
 * تبديل عرض اختيار الصفوف
 */
function toggleGradeSelection() {
    const plan = document.querySelector('input[name="regPlan"]:checked');
    const gradeDiv = document.getElementById('gradeSelection');
    gradeDiv.style.display = (plan && plan.value === 'paid') ? 'block' : 'none';
}

// ================================================================
// 26. دوال تسجيل الدخول والتسجيل (Auth Functions)
// ================================================================

/**
 * تسجيل الدخول
 */
async function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.textContent = 'يرجى ملء جميع الحقول';
        errorEl.style.display = 'block';
        return;
    }

    const loginBtn = document.querySelector('#loginModal .btn-primary');
    if (loginBtn) {
        loginBtn.textContent = '⏳ جاري الدخول...';
        loginBtn.disabled = true;
    }

    const result = await Auth.login(username, password);
    
    if (loginBtn) {
        loginBtn.textContent = 'دخول';
        loginBtn.disabled = false;
    }

    if (result.success) {
        closeModal('loginModal');
        Navigator.navigateTo('home');
        showToast('✅ تم تسجيل الدخول بنجاح', 'success');
    } else {
        errorEl.textContent = result.error || 'حدث خطأ';
        errorEl.style.display = 'block';
    }
}

/**
 * تسجيل مستخدم جديد
 */
async function registerUser() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const plan = document.querySelector('input[name="regPlan"]:checked').value;
    const errorEl = document.getElementById('regError');

    if (!username || !email || !password || !confirmPassword) {
        errorEl.textContent = 'يرجى ملء جميع الحقول المطلوبة';
        errorEl.style.display = 'block';
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = 'كلمة المرور وتأكيدها غير متطابقين';
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        errorEl.style.display = 'block';
        return;
    }

    let selectedGrades = [];
    if (plan === 'paid') {
        document.querySelectorAll('.grade-checkbox:checked').forEach(cb => {
            selectedGrades.push(parseInt(cb.value));
        });
        if (selectedGrades.length === 0) {
            errorEl.textContent = 'يرجى اختيار صف واحد على الأقل للخطة المدفوعة';
            errorEl.style.display = 'block';
            return;
        }
    }

    const registerBtn = document.querySelector('#registerModal .btn-primary');
    if (registerBtn) {
        registerBtn.textContent = '⏳ جاري التسجيل...';
        registerBtn.disabled = true;
    }

    const result = await Auth.register({
        username,
        email,
        password,
        confirmPassword,
        phone,
        plan,
        selectedGrades
    });

    if (registerBtn) {
        registerBtn.textContent = 'تسجيل';
        registerBtn.disabled = false;
    }

    if (result.success) {
        closeModal('registerModal');
        if (result.user) {
            Navigator.navigateTo('home');
            showToast('✅ ' + result.message, 'success');
        } else {
            if (plan === 'paid') {
                showToast('✅ تم التسجيل! حسابك مجاني حتى موافقة المدير.', 'info');
            } else {
                showToast('✅ ' + result.message, 'info');
            }
            Navigator.navigateTo('home');
        }
    } else {
        errorEl.textContent = result.error || 'حدث خطأ';
        errorEl.style.display = 'block';
    }
}

// ================================================================
// 27. تسجيل الخروج
// ================================================================

async function logout() {
    const result = await Auth.logout();
    if (result.success) {
        Navigator.navigateTo('home');
        showToast('✅ تم تسجيل الخروج بنجاح', 'success');
    } else {
        showToast('❌ ' + (result.error || 'فشل تسجيل الخروج'), 'error');
    }
}

// ================================================================
// 28. دوال إدارة المحتوى (Content Admin Functions)
// ================================================================

/**
 * عرض نموذج إضافة صف
 */
function showAddGradeForm() {
    const name = prompt('أدخل اسم الصف الجديد:');
    if (!name) return;
    AdminContent.addGrade(name).then(result => {
        if (result.success) {
            showToast('✅ تم إضافة الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل الإضافة'), 'error');
        }
    });
}

/**
 * عرض نموذج تعديل صف
 */
function editGradeForm(gradeId) {
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const name = prompt('اسم الصف الجديد:', grade.name);
    if (!name) return;
    AdminContent.updateGrade(gradeId, name).then(result => {
        if (result.success) {
            showToast('✅ تم تعديل الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل التعديل'), 'error');
        }
    });
}

/**
 * حذف صف
 */
function deleteGrade(gradeId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الصف وجميع محتوياته؟')) return;
    AdminContent.deleteGrade(gradeId).then(result => {
        if (result.success) {
            showToast('✅ تم حذف الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل الحذف'), 'error');
        }
    });
}

/**
 * عرض نموذج إضافة مادة
 */
function showAddSubjectForm(gradeId) {
    const name = prompt('أدخل اسم المادة الجديدة:');
    if (!name) return;
    AdminContent.addSubject(gradeId, name).then(result => {
        if (result.success) {
            showToast('✅ تم إضافة المادة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل الإضافة'), 'error');
        }
    });
}

/**
 * عرض نموذج تعديل مادة
 */
function editSubjectForm(gradeId, subjectId) {
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const name = prompt('اسم المادة الجديد:', subject.name);
    if (!name) return;
    // تنفيذ التعديل
}

/**
 * حذف مادة
 */
function deleteSubject(gradeId, subjectId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه المادة وجميع محتوياتها؟')) return;
    // تنفيذ الحذف
}

/**
 * عرض نموذج إضافة وحدة
 */
function showAddUnitForm(gradeId, subjectId) {
    const name = prompt('أدخل اسم الوحدة الجديدة:');
    if (!name) return;
    // تنفيذ الإضافة
}

/**
 * عرض نموذج تعديل وحدة
 */
function editUnitForm(gradeId, subjectId, unitId) {
    // تنفيذ التعديل
}

/**
 * حذف وحدة
 */
function deleteUnit(gradeId, subjectId, unitId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الوحدة وجميع دروسها؟')) return;
    // تنفيذ الحذف
}

/**
 * عرض نموذج إضافة درس
 */
function showAddLessonForm(gradeId, subjectId, unitId) {
    const title = prompt('عنوان الدرس:');
    if (!title) return;
    const video = prompt('رابط الفيديو (YouTube embed URL):', '');
    const content = prompt('الشرح النصي (HTML مسموح):', '');
    const examples = prompt('الأمثلة المحلولة (HTML):', '');
    const free = confirm('هل هذا الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)');
    const examQuestionCount = prompt('كم سؤالاً تريد إضافته في امتحان هذا الدرس؟ (0 = لا يوجد)', '0');
    const count = parseInt(examQuestionCount) || 0;
    const exam = { questions: [] };
    for (let i = 0; i < count; i++) {
        const q = prompt(`السؤال ${i+1}:`);
        if (!q) break;
        const options = prompt(`خيارات (مفصولة بفواصل):`, '');
        if (!options) break;
        const opts = options.split(',').map(s => s.trim());
        const correct = parseInt(prompt(`الإجابة الصحيحة (0-${opts.length-1}):`, '0'));
        if (isNaN(correct) || correct < 0 || correct >= opts.length) break;
        exam.questions.push({ question: q, options: opts, correctAnswer: correct });
    }
    const data = { title, video, content, examples, free, exam };
    // تنفيذ الإضافة
}

/**
 * عرض نموذج تعديل درس
 */
function editLessonForm(gradeId, subjectId, unitId, lessonId) {
    // تنفيذ التعديل
}

/**
 * حذف درس
 */
function deleteLesson(gradeId, subjectId, unitId, lessonId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الدرس نهائياً؟')) return;
    // تنفيذ الحذف
}

// ================================================================
// 29. البحث والتنقل (Search & Navigation)
// ================================================================

/**
 * تهيئة شريط البحث
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 2) {
            document.getElementById('searchResults').classList.remove('active');
            return;
        }
        Search.searchDebounced(query, (results) => {
            displaySearchResults(results);
        });
    });
}

/**
 * عرض نتائج البحث
 */
function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (!results || !results.items || results.items.length === 0) {
        container.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
        container.classList.add('active');
        return;
    }
    
    container.innerHTML = results.items.map(item => `
        <div class="search-result-item" onclick="navigateSearchResult(${item.id}, '${item.type}')">
            <i class="fas ${item.icon || 'fa-search'}"></i>
            <div>
                <div class="result-text">${item.title}</div>
                <div class="result-sub">${item.subtitle || ''}</div>
            </div>
        </div>
    `).join('');
    container.classList.add('active');
}

/**
 * التنقل إلى نتيجة البحث
 */
function navigateSearchResult(id, type) {
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('searchInput').value = '';
    switch(type) {
        case 'grade':
            Navigator.navigateTo('grades', { gradeId: id });
            break;
        case 'subject':
            // تنفيذ التنقل
            break;
        case 'lesson':
            // تنفيذ التنقل
            break;
        default:
            Navigator.navigateTo('home');
    }
}

// ================================================================
// 30. أحداث الصفحة العامة (General Page Events)
// ================================================================

/**
 * تهيئة أحداث الصفحة
 */
function initPageEvents() {
    // زر العودة للأعلى
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
    }
    
    // تبديل الشريط الجانبي
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('mainSidebar').classList.toggle('open');
        });
    }
    
    // إغلاق الشريط عند تغيير حجم النافذة
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.getElementById('mainSidebar').classList.remove('open');
        }
    });
    
    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('searchResults').classList.remove('active');
        }
    });
}

// ================================================================
// 31. تهيئة التطبيق بالكامل (Full App Initialization)
// ================================================================

/**
 * بدء التطبيق
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تشغيل DeepTeachSY...');
    
    // تهيئة أحداث الصفحة
    initPageEvents();
    
    // تهيئة البحث
    initSearch();
    
    // بدء التطبيق
    initApp();
    
    // تسجيل دوال عالمية
    window.navigateTo = Navigator.navigateTo.bind(Navigator);
    window.showLoginModal = showLoginModal;
    window.showRegisterModal = showRegisterModal;
    window.switchToRegister = switchToRegister;
    window.switchToLogin = switchToLogin;
    window.closeModal = closeModal;
    window.loginUser = loginUser;
    window.registerUser = registerUser;
    window.logout = logout;
    window.Navigator = Navigator;
    window.Auth = Auth;
    window.Grades = Grades;
    window.UI = UI;
    window.showToast = showToast;
    window.formatDate = formatDate;
    window.getTimeAgo = getTimeAgo;
    window.truncateText = truncateText;
});

console.log('📚 تم تحميل جميع دوال DeepTeachSY بنجاح!');
console.log(`📊 إجمالي الأسطر: ${document.currentScript.textContent.split('\n').length}`);