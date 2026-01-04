import { Head, Link, useForm } from '@inertiajs/inertia-react';
import { FiArrowRight, FiCheckCircle, FiMenu, FiX, FiMoon, FiSun, FiLock, FiMail, FiUser, FiEye, FiEyeOff, FiLogIn, FiBriefcase } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';

const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'About', href: '#about' },
];

const features = [
    {
        title: 'Employee Management',
        description: 'Easily manage your team with our intuitive interface.',
        icon: '👥',
    },
    {
        title: 'Time Tracking',
        description: 'Track work hours and manage attendance seamlessly.',
        icon: '⏱️',
    },
    {
        title: 'Payroll Processing',
        description: 'Automate your payroll with just a few clicks.',
        icon: '💰',
    },
];

const pricingPlans = [
    {
        name: 'Starter',
        price: '$29',
        period: '/month',
        features: ['Up to 10 employees', 'Basic HR features', 'Email support'],
        cta: 'Get Started',
    },
    {
        name: 'Professional',
        price: '$99',
        period: '/month',
        features: ['Up to 50 employees', 'Advanced analytics', 'Priority support'],
        cta: 'Get Started',
        featured: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Unlimited employees', 'Custom features', '24/7 support'],
        cta: 'Contact Sales',
    },
];

const testimonials = [
    {
        quote: "This platform transformed how we manage our team!",
        author: "Sarah Johnson",
        role: "HR Manager at TechCorp"
    },
    {
        quote: "The best HR solution we've ever used.",
        author: "Michael Chen",
        role: "CEO at StartupX"
    },
    {
        quote: "Intuitive and powerful. Highly recommended!",
        author: "Emily Rodriguez",
        role: "Operations Director"
    }
];

function LoginForm({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({

        tenant_id: localStorage.getItem('login_tenant') || '',
        email: localStorage.getItem('login_email') || '',
        password: '',
        role: localStorage.getItem('login_role') || 'employee',
        remember: localStorage.getItem('login_remember') === 'true' || false,

    });

    // Save form data to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('login_tenant', data.tenant_id);
        localStorage.setItem('login_email', data.email);
        localStorage.setItem('login_role', data.role);
        localStorage.setItem('login_remember', data.remember);
    }, [data]);

    const submit = (e) => {
        e.preventDefault();

        post('login', {
            preserveScroll: true,
            onSuccess: () => {
                // Clear saved login data on successful login
                localStorage.removeItem('login_tenant');
                localStorage.removeItem('login_email');
                localStorage.removeItem('login_role');
                localStorage.removeItem('login_remember');
                onClose?.();
            },
            onError: (errors) => {
                // Keep the modal open on validation errors
                window.history.pushState({}, '', window.location.pathname + '?modal=login');
            },
            onFinish: () => reset('password'),
        });
    };

}
export default function Welcome({ auth, errors: serverErrors = {} }) {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Check URL for modal state on initial load
    const [activeModal, setActiveModal] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('modal') || '';
    });

    // Update URL when modal state changes
    const setModal = (modalName) => {
        const url = new URL(window.location);
        if (modalName) {
            url.searchParams.set('modal', modalName);
        } else {
            url.searchParams.delete('modal');
        }
        window.history.pushState({}, '', url.toString());
        setActiveModal(modalName);
    };

    // Handle browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setActiveModal(params.get('modal') || '');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openLoginModal = (e) => {
        if (e) e.preventDefault();
        setModal('login');

    };

    const closeLoginModal = () => {
        setModal('');
    };

    // Login form state
    const { data, setData, post, processing, errors, reset } = useForm({
        tenant_id: '',
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('login', {
            onFinish: () => reset('password'),

            onSuccess: () => closeLoginModal()

        });
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const loginHref = () => {
        try {
            if (typeof route === 'function') {
                return route('login');
            }
        } catch {
        }
        return 'login';
    };

    return (
        <div className={`min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300 ${activeModal === 'login' ? 'overflow-hidden' : ''} relative`}>
            {/* Blur overlay for main content */}
            {activeModal === 'login' && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300"
                    onClick={closeLoginModal}
                />
            )}


            {/* Login Modal */}
            {activeModal === 'login' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeLoginModal();
                        }
                    }}
                >
                    <div
                        className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside modal
                    >


                        <button onClick={closeLoginModal} className="absolute right-3 top-3 z-10 rounded-full bg-white dark:bg-gray-700 p-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors duration-200">
                            <FiX className="h-6 w-6" />
                        </button>



                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ">
                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
                                    <p className="mt-2 text-gray-600 dark:text-gray-300 text-base md:text-lg">Sign in to your account</p>
                                </div>

                                <form onSubmit={submit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column */}
                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor="tenant_id"
                                                    value="Tenant ID (Optional for Super Admin)"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 ml-2 h-6 w-6 text-gray-400 ">
                                                        <FiBriefcase />
                                                    </span>
                                                    <TextInput
                                                        id="tenant_id"
                                                        type="number"
                                                        name="tenant_id"
                                                        value={data.tenant_id}
                                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-12"
                                                        placeholder="e.g., 1 (leave empty for Super Admin)"
                                                        autoComplete="off"
                                                        onChange={(e) => setData('tenant_id', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.tenant_id} className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Super Admin users can leave this field empty
                                                </p>
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="email"
                                                    value="Email"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 ml-2 h-6 w-6 text-gray-400 ">
                                                        <FiUser />
                                                    </span>
                                                    <TextInput
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-12"
                                                        placeholder="your@email.com"
                                                        autoComplete="username"
                                                        onChange={(e) => setData('email', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.email} className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor="password"
                                                    value="Password"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 ml-2 h-6 w-6 text-gray-400 ">
                                                        <FiLock />
                                                    </span>
                                                    <TextInput
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={data.password}
                                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-12"
                                                        placeholder="••••••••"
                                                        autoComplete="current-password"
                                                        onChange={(e) => setData('password', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.password} className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor="role"
                                                    value="Role"
                                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                />
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={data.role}
                                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    onChange={(e) => setData('role', e.target.value)}
                                                >
                                                    <option value="company_admin">Company Admin</option>
                                                    <option value="hr_manager">HR Manager</option>
                                                    <option value="finance_manager">Finance Manager</option>
                                                    <option value="department_manager">Department Manager</option>
                                                    <option value="employee">Employee</option>
                                                    <option value="Super_admin">Super Admin</option>
                                                </select>
                                                <InputError message={errors.role} className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remember me and Forgot Password */}
                                    <div className="flex items-center justify-between mt-4">
                                        <label className="flex items-center">
                                            <Checkbox
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <span className="ms-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
                                        </label>

                                        <Link
                                            href={route('password.request')}
                                            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    {/* Buttons */}
                                    <div className="pt-2 flex space-x-4">

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            <FiLogIn className="w-4 h-4 mr-2" />
                                            {processing ? 'Signing in...' : 'Sign in'}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6 text-center text-sm">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Don't have an account?{' '}
                                        <Link
                                            href={route('tenant.apply')}
                                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Navigation */}
            <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                                A
                            </div>
                            <span className="text-2xl font-bold dark:text-white">Alpha-HRMS</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={openLoginModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center justify-center"
                            >
                                <FiLogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </button>

                        </div>

                        {/* Mobile menu button */}
                        <div className="sm:hidden flex items-center">
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden mt-4 space-y-2 overflow-hidden"
                        >
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="block py-2 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsMenuOpen(false);
                                    openLoginModal();
                                }}
                                className="block py-2 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition w-full"
                            >

                                Sign In
                            </button>
                        </motion.div>
                    )}
                </nav>
            </header>
            {/* Background with Gradient */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"></div>
                <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{
                    backgroundImage: 'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Add padding to account for fixed header */}
            <div className="pt-24"></div>

            {/* Hero Section with Background Image */}
            <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 z-10">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6"
                        >
                            Welcome to the future of HR
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto"
                        >
                            Modern HR Management for <span className="text-blue-600 dark:text-blue-400">Growing Teams</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
                        >
                            Empower your team with intelligent workforce management, automated onboarding, and data-driven insights. Transform the way you manage people.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
                        >
                            <Link
                                href={route('tenant.apply')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition transform hover:scale-105 cursor-pointer flex items-center justify-center"
                            >
                                <FiLogIn className="w-5 h-5 mr-2" />
                                Get Started Free
                            </Link>
                            <a
                                href="#features"
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition"
                            >
                                Learn More
                            </a>
                        </motion.div>
                    </div>
                    <section>
                        {/* Dashboard Section with Curved Background */}
                        <div className="relative mt-20">
                            {/* Curved Background */}
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-800 rounded-lg">
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-white dark:bg-gray-900 rounded-t-[100%] transform translate-y-1/2"></div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-bold text-white mb-2">HRMS Dashboard</h2>
                                    <p className="text-blue-200">Key metrics and insights at your fingertips</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Card 1 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">124</div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Employees</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Currently active in the organization across all
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-gray-700 px-6 py-3 text-sm text-blue-600 dark:text-blue-400">
                                            +12 new hires this month
                                        </div>
                                    </motion.div>

                                    {/* Card 2 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">87%</div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Attendance Rate</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Average daily attendance rate across all departments
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-gray-700 px-6 py-3 text-sm text-green-600 dark:text-green-400">
                                            +5% from last month
                                        </div>
                                    </motion.div>

                                    {/* Card 3 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">24</div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Open Positions</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Current job openings across various departments
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-gray-700 px-6 py-3 text-sm text-purple-600 dark:text-purple-400">
                                            8 in Engineering, 5 in Marketing
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold mb-4"
                        >
                            Everything You Need in One Place
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Streamline your HR processes with our comprehensive suite of tools designed for modern businesses.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                            >
                                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl mb-6 text-blue-600 dark:text-blue-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold mb-4"
                        >
                            Simple, Transparent Pricing
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Choose the perfect plan for your business needs. No hidden fees, cancel anytime.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`relative rounded-2xl p-8 ${plan.featured
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                {plan.featured && (
                                    <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                )}
                                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                                <div className="flex items-baseline mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="ml-1 text-gray-500 dark:text-gray-400">{plan.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center">
                                            <svg className={`w-5 h-5 mr-2 ${plan.featured ? 'text-blue-200' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className={plan.featured ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={`w-full py-3 px-6 rounded-lg font-medium transition ${plan.featured
                                            ? 'bg-white text-blue-700 hover:bg-blue-50'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {plan.cta}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold mb-4"
                        >
                            Trusted by Leading Companies
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Join thousands of businesses that trust our platform to manage their HR needs.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="text-yellow-400 text-4xl mb-4">"</div>
                                <p className="text-gray-700 dark:text-gray-300 italic mb-6">{testimonial.quote}</p>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {testimonial.author.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="font-semibold">{testimonial.author}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold mb-6"
                    >
                        Ready to transform your HR management?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
                    >
                        Join thousands of businesses that trust our platform to manage their HR needs.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href={route('tenant.apply')}
                            className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-medium transition transform hover:scale-105"
                        >
                            Get Started Free <FiArrowRight className="ml-2" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer id="about" className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">A</div>
                                <span className="text-xl font-bold text-white">Alpha-HRMS</span>
                            </div>
                            <p className="text-gray-400 mb-6">Empowering businesses with modern HR solutions.</p>
                            <div className="flex space-x-4">
                                {['twitter', 'facebook', 'linkedin', 'github'].map((social) => (
                                    <a
                                        key={social}
                                        href={`#`}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        aria-label={social}
                                    >
                                        <span className="sr-only">{social}</span>
                                        <i className={`fab fa-${social} text-xl`}></i>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Product</h3>
                            <ul className="space-y-2">
                                {['Features', 'Pricing', 'Testimonials', 'Updates'].map((item) => (
                                    <li key={item}>
                                        <a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                {['About Us', 'Careers', 'Contact', 'Blog'].map((item) => (
                                    <li key={item}>
                                        <a href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-white transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm">&copy; {new Date().getFullYear()} Alpha-HRMS. All rights reserved.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="text-sm hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="text-sm hover:text-white transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

