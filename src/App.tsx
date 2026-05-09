import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Target, 
  Eye, 
  Calendar, 
  ChevronRight, 
  Search, 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  Filter,
  ExternalLink,
  Menu,
  Monitor,
  X,
  Clock,
  Download,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  MessageCircle,
  Maximize2,
  Stethoscope,
  Cpu,
  BookOpen,
  UserPlus,
  Sparkles,
  ArrowRight,
  FileText,
  LogIn,
  LogOut,
  Save,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  Info,
  Star,
  Tag,
  PieChart,
  ArrowLeft,
  Upload,
  Loader2,
  Activity,
  Check,
  CreditCard,
  Briefcase,
  Building2,
  GraduationCap,
  Receipt,
  Play,
  Pause,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  serverTimestamp,
  getDocFromServer,
  query,
  orderBy,
  where,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Types
interface Program {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  details: string;
  featured?: boolean;
  gallery?: string[];
  budget?: {
    income: { item: string; amount: number }[];
    expense: { item: string; amount: number }[];
  };
  highlights?: string[];
  category?: string;
  location?: string;
  status?: 'upcoming' | 'completed';
}

interface AssociationConfig {
  mission: string;
  vision: string;
  about: string;
  categories: string[];
  heroImages: string[];
  memberCountMode?: 'realtime' | 'manual';
  manualMemberCount?: number;
  logoUrl?: string;
  footerDescription?: string;
  officeAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

interface Notice {
  id: string;
  title: string;
  date: string;
  description: string;
  category: 'General' | 'Event' | 'Committee' | 'Financial';
  pdfUrl?: string; // Optional now
  fbLink?: string; // New: Facebook post link
  image?: string; // New: Image URL from Cloudinary
}

interface Member {
  id: string;
  name: string;
  designation: string;
  institution: string;
  session: string;
  image?: string;
  email: string;
  phone: string;
}

interface SpecializedAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'finance' | 'admin' | 'secretary';
  createdAt: any;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  memberCode?: string;
  photoURL?: string;
  profilePicture?: string;
  membershipStatus: string;
  membershipLevel?: 'association' | 'executive';
  paymentAmount?: number;
  paymentMethod?: string;
  paymentSubmittedAt?: any;
  session?: string;
  designation?: string;
  workplace?: string;
  companyName?: string;
  institution?: string;
  bloodGroup?: string;
  paymentHistory?: {
    type: string;
    amount: number;
    date: string;
    method: string;
    transactionId: string;
    status: string;
  }[];
}

interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  recordedBy: string;
}

interface FeeTerm {
  timeline: string;
  lastDate: {
    day: number;
    month: number;
  };
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  type: 'yearly' | 'one-time';
  targetMemberType: 'all' | 'association' | 'executive';
  isActive: boolean;
  pausedAt?: any;
  frequency: number;
  terms: FeeTerm[];
  createdAt: any;
  updatedAt: any;
  updatedBy: string;
}

interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  feeId: string;
  feeName: string;
  termIndex: number;
  year: number;
  amount: number;
  transactionDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  approvedAt?: any;
  approvedBy?: string;
}

// Mock Data
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1576091160550-217359f41f48?auto=format&fit=crop&q=80&w=2000'
];

const PROGRAMS: Program[] = [];

const NOTICES: Notice[] = [];

const MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Engr. Md. Abdur Rahman',
    designation: 'Senior Service Engineer',
    institution: 'Rangpur Medical College Hospital',
    session: '2008-09',
    email: 'rahman.biomed@example.com',
    phone: '+880 1711-000001',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    name: 'Engr. Suman Chandra',
    designation: 'Technical Manager',
    institution: 'Prime Medical College',
    session: '2005-06',
    email: 'suman.tech@example.com',
    phone: '+880 1711-000002',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    name: 'Engr. Mostafa Kamal',
    designation: 'Medical Technician',
    institution: 'Doctor\'s Community Hospital',
    session: '2013-14',
    email: 'kamal.med@example.com',
    phone: '+880 1711-000003',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    name: 'Engr. Farzana Akter',
    designation: 'Assistant Engineer',
    institution: 'TMSS Hospital',
    session: '2016-17',
    email: 'farzana.bio@example.com',
    phone: '+880 1711-000004',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    name: 'Engr. Kamal Uddin',
    designation: 'Service Specialist',
    institution: 'Rangpur Hospital',
    session: '2011-12',
    email: 'kamal.specialist@example.com',
    phone: '+880 1711-000005',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '6',
    name: 'Engr. Sabina Yasmin',
    designation: 'Project Lead',
    institution: 'Unity Health Care',
    session: '2009-10',
    email: 'sabina.lead@example.com',
    phone: '+880 1711-000006',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400'
  }
];

const EXECUTIVE_COMMITTEE = [
  {
    id: 'exec-1',
    name: 'Engr. Md. Abdur Rahman',
    role: 'President',
    designation: 'Senior Service Engineer',
    institution: 'Rangpur Medical College Hospital',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1711-000000',
    session: '2008-09'
  },
  {
    id: 'exec-2',
    name: 'Engr. Suman Chandra',
    role: 'General Secretary',
    designation: 'Technical Manager',
    institution: 'Prime Medical College',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1712-000000',
    session: '2005-06'
  },
  {
    id: 'exec-3',
    name: 'Engr. Mostafa Kamal',
    role: 'Vice President',
    designation: 'Medical Technician',
    institution: "Doctor's Community Hospital",
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1713-000000',
    session: '2013-14'
  },
  {
    id: 'exec-4',
    name: 'Engr. Farzana Akter',
    role: 'Treasurer',
    designation: 'Assistant Engineer',
    institution: 'TMSS Hospital',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1714-000000',
    session: '2016-17'
  },
  {
    id: 'exec-5',
    name: 'Engr. Md. Zahidul Islam',
    role: 'Joint Secretary',
    designation: 'Clinical Engineer',
    institution: 'Rangpur Community Hospital',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1715-000000',
    session: '2014-15'
  },
  {
    id: 'exec-6',
    name: 'Engr. Nazmul Haque',
    role: 'Organizing Secretary',
    designation: 'Bio-Medical Engineer',
    institution: 'Islamic Bank Hospital',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1716-000000',
    session: '2015-16'
  },
  {
    id: 'exec-7',
    name: 'Engr. Sharmin Jahan',
    role: 'Cultural Secretary',
    designation: 'Service Engineer',
    institution: 'Hope Hospital',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1717-000000',
    session: '2012-13'
  },
  {
    id: 'exec-8',
    name: 'Engr. Md. Rafiqul Islam',
    role: 'Executive Member',
    designation: 'Assistant Engineer',
    institution: 'Govt. Health Complex',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
    phone: '+880 1718-000000',
    session: '2010-11'
  }
];


export default function App() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentProgramIndex, setCurrentProgramIndex] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFullCommittee, setShowFullCommittee] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSpecializedRole(null);
      sessionStorage.removeItem('specializedRole');
      sessionStorage.removeItem('specializedEmail');
      setShowAdminDashboard(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };
  const [showAllProgramsView, setShowAllProgramsView] = useState(false);
  const [showNoticesView, setShowNoticesView] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showMemberDashboard, setShowMemberDashboard] = useState(false);
  const [financialTransparencySearch, setFinancialTransparencySearch] = useState('');
  const [financialTransparencyFilter, setFinancialTransparencyFilter] = useState('all'); // all, due, paid
  const [selectedFeeFilter, setSelectedFeeFilter] = useState('all');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [memberAnalysisSearch, setMemberAnalysisSearch] = useState('');
  const [memberAnalysisPaymentFilter, setMemberAnalysisPaymentFilter] = useState('all');
  const [selectedAnalysisUser, setSelectedAnalysisUser] = useState<UserProfile | null>(null);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('All');
  const [selectedNoticeImage, setSelectedNoticeImage] = useState<string | null>(null);

  // Firebase Auth & Config States
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [membershipSettings, setMembershipSettings] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [savingMembershipSettings, setSavingMembershipSettings] = useState(false);
  const [specializedRole, setSpecializedRole] = useState<'finance' | 'admin' | 'secretary' | null>(() => {
    const saved = sessionStorage.getItem('specializedRole');
    return (saved === 'finance' || saved === 'admin' || saved === 'secretary') ? saved : null;
  });
  const [associationConfig, setAssociationConfig] = useState<AssociationConfig>({
    mission: 'To unite electromedical engineers in Rangpur, providing them with technical resources, networking opportunities, and a unified voice to advance the standard of medical equipment maintenance and healthcare delivery in our region.',
    vision: 'We envision a future where every medical facility in Rangpur is supported by skilled, empowered, and innovative electromedical professionals, ensuring world-class healthcare technology is accessible to all citizens of Bangladesh.',
    about: 'The premier professional body supporting clinical engineering professionals across Northern Bangladesh. Dedicated to medical excellence, technological innovation, and protecting the interests of the engineers who backbone modern healthcare.',
    categories: ['Technical Workshop', 'Medical Seminar', 'Committee Meeting', 'Social Event', 'Training Program'],
    heroImages: [],
    logoUrl: '',
    privacyPolicy: '',
    termsOfService: ''
  });

  // Auto-slide effect for hero images
  useEffect(() => {
    const images = (associationConfig.heroImages && associationConfig.heroImages.length > 0) ? associationConfig.heroImages : HERO_IMAGES;
    if (images.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % images.length);
      }, 7000);
      return () => clearInterval(timer);
    }
    if (currentHeroIndex >= images.length) {
      setCurrentHeroIndex(0);
    }
  }, [associationConfig.heroImages, HERO_IMAGES.length]);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editMission, setEditMission] = useState('');
  const [editVision, setEditVision] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editMemberCountMode, setEditMemberCountMode] = useState<'realtime' | 'manual'>('realtime');
  const [editManualMemberCount, setEditManualMemberCount] = useState<number>(0);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editHeroImages, setEditHeroImages] = useState<string[]>([]);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editFooterDescription, setEditFooterDescription] = useState('');
  const [editOfficeAddress, setEditOfficeAddress] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editPrivacyPolicy, setEditPrivacyPolicy] = useState('');
  const [editTermsOfService, setEditTermsOfService] = useState('');
  const [editSocialLinks, setEditSocialLinks] = useState({
    facebook: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    instagram: '',
    whatsapp: ''
  });
  const [newCategory, setNewCategory] = useState('');

  // Portal Settings State
  const [portalConfig, setPortalConfig] = useState({
    title: 'ICT Division & Portal',
    secretaryName: 'To be assigned',
    secretaryRole: 'ICT Secretary',
    secretaryInstitution: '',
    secretaryPhone: '',
    secretaryEmail: '',
    secretaryImage: '',
    ecCoverPhoto: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2000',
    description: 'Encountered a bug or have suggestions for our digital portal? Reach out directly to our ICT Secretary.'
  });
  const [editPortal, setEditPortal] = useState(portalConfig);
  const [saveStatus, setSaveStatus] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null); // 'main', 'gallery', 'portal'

  const uploadImage = async (file: File): Promise<string> => {
    // Fallback to user provided values if ENV is missing
    const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'dcf9qdpeu';
    const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'EDEA Rangpur';

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary Cloud Name or Upload Preset is missing in configuration.');
    }

    // Check file size (Cloudinary free tier limit is usually ~10MB per image, let's cap at 5MB for stability)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size too large. Please upload an image under 5MB.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset.trim());

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary Error Detail:', errorData);
        // Common error: "Upload preset must be unsigned"
        throw new Error(errorData.error?.message || 'Upload failed. Check if your preset is "Unsigned" in Cloudinary settings.');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Upload Process Error:', err);
      throw err;
    }
  };

  // Local Programs State
  const [programs, setPrograms] = useState<Program[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [executiveMembers, setExecutiveMembers] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'general' | 'programs' | 'portal' | 'accounts' | 'finance' | 'fees' | 'approvals' | 'profile' | 'notices' | 'executive' | 'branding'>('general');
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [ecMemberForm, setEcMemberForm] = useState({ role: '', userId: '' });
  const [ecMemberSearch, setEcMemberSearch] = useState('');
  const [isAddingECMember, setIsAddingECMember] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'General' as Notice['category'],
    description: '',
    fbLink: '',
    image: ''
  });
  
  // Specialized Accounts State
  const [specializedAccounts, setSpecializedAccounts] = useState<SpecializedAccount[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);

  const safeToDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const memberAnalysisProfileHistory = useMemo(() => {
    if (!selectedAnalysisUser) return [];
    
    const userSubmissions = paymentSubmissions.filter(p => p.userId === selectedAnalysisUser.id);
    
    const history: any[] = [
      ...(selectedAnalysisUser.paymentHistory || []),
    ];

    userSubmissions.forEach(s => {
      const dateStr = safeToDate(s.submittedAt).toLocaleDateString('en-GB');
      history.push({
        type: s.feeName || 'Fee',
        amount: s.amount,
        date: dateStr,
        method: 'Gateway',
        transactionId: s.id,
        status: s.status
      });
    });

    if (selectedAnalysisUser.paymentAmount) {
      const dateStr = safeToDate(selectedAnalysisUser.paymentSubmittedAt).toLocaleDateString('en-GB');
      history.push({
        type: 'Registration',
        amount: selectedAnalysisUser.paymentAmount,
        date: dateStr,
        method: selectedAnalysisUser.paymentMethod || 'N/A',
        transactionId: 'REG-' + (selectedAnalysisUser.memberCode || selectedAnalysisUser.id.substring(0, 5)),
        status: selectedAnalysisUser.membershipStatus === 'approved' ? 'confirmed' : 'pending'
      });
    }

    // Sort by date (descending)
    return history.sort((a, b) => {
      const dateAStr = a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date;
      const dateBStr = b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date;
      const dateA = new Date(dateAStr).getTime();
      const dateB = new Date(dateBStr).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
  }, [selectedAnalysisUser, paymentSubmissions]);

  const memberFinancialReports = useMemo(() => {
    const eligibleMembers = allUsers.filter(u => u.email !== 'edea.rangpur@gmail.com');
    
    return eligibleMembers.map(member => {
      let totalPaid = 0;
      let totalDue = 0;
      let totalPending = 0;
      
      const memberSubmissions = paymentSubmissions.filter(s => s.userId === member.id);
      const approvedSubmissions = memberSubmissions.filter(s => s.status === 'approved');
      const pendingSubmissions = memberSubmissions.filter(s => s.status === 'pending');

      // Check member type for fee targeting
      const isExecutive = executiveMembers.some(em => em.userId === member.id);
      const memberTypeCategory = isExecutive ? 'executive' : 'association';

      // 1. Registration Fee (Historical/Base)
      const regAmount = Number(membershipSettings?.membershipAmount) || 100;
      if (selectedFeeFilter === 'all' || selectedFeeFilter === 'reg-fee') {
        const isPaidInLedger = member.membershipStatus === 'approved' || member.membershipStatus === 'pending_secretary';
        const isPendingInLedger = member.membershipStatus === 'pending_finance' || 
                        (member.transactionId && member.membershipStatus === 'member_candidate');
        
        if (isPaidInLedger) {
          totalPaid += (Number(member.paymentAmount) || regAmount);
        } else if (isPendingInLedger) {
          totalPending += regAmount;
        } else if (member.membershipStatus !== 'rejected' && member.role !== 'admin') {
          totalDue += regAmount;
        }
      }

      // 2. One-time fees from Fee Management
      feeStructures.filter(f => {
        const matchesType = !f.targetMemberType || f.targetMemberType === 'all' || f.targetMemberType === memberTypeCategory;
        return f.type === 'one-time' && (selectedFeeFilter === 'all' || selectedFeeFilter === f.id) && matchesType;
      }).forEach(fee => {
        const isPaid = approvedSubmissions.some(s => s.feeId === fee.id);
        const isPending = pendingSubmissions.some(s => s.feeId === fee.id);

        if (isPaid) {
          totalPaid += (Number(fee.amount) || 0);
        } else if (isPending) {
          totalPending += (Number(fee.amount) || 0);
        } else {
          // If the fee is inactive, it's only "due" if the member joined before it was paused
          const feePausedDate = fee.isActive === false && fee.pausedAt ? safeToDate(fee.pausedAt) : null;
          const memberJoinDate = safeToDate(member.createdAt);
          
          if (fee.isActive !== false || (feePausedDate && memberJoinDate < feePausedDate)) {
            totalDue += (Number(fee.amount) || 0);
          }
        }
      });

      // 3. Yearly fees from Fee Management
      feeStructures.filter(f => {
        const matchesType = !f.targetMemberType || f.targetMemberType === 'all' || f.targetMemberType === memberTypeCategory;
        return f.type === 'yearly' && (selectedFeeFilter === 'all' || selectedFeeFilter === f.id) && matchesType;
      }).forEach(fee => {
        const feeDate = safeToDate(fee.createdAt);
        const startYear = feeDate.getFullYear();
        
        let endYear = new Date().getFullYear();
        if (fee.isActive === false && fee.pausedAt) {
          const pausedDate = safeToDate(fee.pausedAt);
          endYear = pausedDate.getFullYear();
        }
        
        for (let year = startYear; year <= endYear; year++) {
          (fee.terms || []).forEach((term, termIdx) => {
            const isPaid = approvedSubmissions.some(s => s.feeId === fee.id && s.year === year && s.termIndex === termIdx);
            const isPending = pendingSubmissions.some(s => s.feeId === fee.id && s.year === year && s.termIndex === termIdx);
            
            if (isPaid) {
              totalPaid += (Number(term.amount || fee.amount) || 0);
            } else if (isPending) {
              totalPending += (Number(term.amount || fee.amount) || 0);
            } else {
              totalDue += (Number(term.amount || fee.amount) || 0);
            }
          });
        }
      });
      
      return {
        ...member,
        totalPaid,
        totalDue,
        totalPending,
      };
    }).filter(member => {
      // Don't show members with 0 paid and 0 due if filtering by a specific fee
      if (selectedFeeFilter !== 'all' && member.totalPaid === 0 && member.totalDue === 0) return false;

      // Search filter
      const searchLower = financialTransparencySearch.toLowerCase();
      const matchesSearch = (member.name || '').toLowerCase().includes(searchLower) || 
                           (member.memberCode || '').toLowerCase().includes(searchLower) ||
                           (member.email || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Type filter (Dues/Paid)
      if (financialTransparencyFilter === 'due') return member.totalDue > 0 || member.totalPending > 0;
      if (financialTransparencyFilter === 'paid') return member.totalDue === 0 && member.totalPending === 0 && member.totalPaid > 0;
      
      return true;
    });
  }, [allUsers, feeStructures, paymentSubmissions, financialTransparencySearch, financialTransparencyFilter, selectedFeeFilter, membershipSettings, executiveMembers]);

  const downloadFinancialReport = () => {
    const headers = ['Member Name', 'Member ID', 'Email', 'Total Paid (BDT)', 'Total Due (BDT)', 'Pending (BDT)'];
    const csvContent = [
      headers.join(','),
      ...memberFinancialReports.map(m => [
        `"${m.name}"`,
        `"${m.memberCode || 'N/A'}"`,
        `"${m.email}"`,
        m.totalPaid,
        m.totalDue,
        m.totalPending
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Member_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isAddingFee, setIsAddingFee] = useState(false);
  const [feeForm, setFeeForm] = useState<{
    name: string;
    amount: number;
    type: 'yearly' | 'one-time';
    targetMemberType: 'all' | 'association' | 'executive';
    isActive: boolean;
    frequency: number;
    terms: FeeTerm[];
  }>({
    name: '',
    amount: 0,
    type: 'yearly',
    targetMemberType: 'all',
    isActive: true,
    frequency: 1,
    terms: [{ timeline: '', lastDate: { day: 31, month: 12 } }]
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeStructure | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    transactionDetails: '',
    selectedTerms: [] as { termIndex: number; year: number }[]
  });
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'finance' as 'finance' | 'admin'
  });

  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const generateMemberId = async (): Promise<string> => {
    try {
      const counterRef = doc(db, 'memberIds', 'counter');
      const newMemberCode = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextSerial = 1;
        if (counterDoc.exists()) {
          nextSerial = (counterDoc.data()?.current || 0) + 1;
          transaction.update(counterRef, { current: nextSerial });
        } else {
          transaction.set(counterRef, { current: 1 });
        }
        return `EDEA-${nextSerial}`;
      });
      return newMemberCode;
    } catch (err) {
      console.error("Error generating member ID:", err);
      throw err;
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      setRegisterStep('otp');
    } catch (err: any) {
      setRegisterError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerForm.email, otp: otpCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');
      
      // Step 2: Create account on client side as backend admin API is disabled
      const userCredential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);
      const newUser = userCredential.user;

      // Step 3: Initialize profile in Firestore with sequential ID
      const memberCode = await generateMemberId();
      await setDoc(doc(db, 'users', newUser.uid), {
        name: registerForm.name,
        email: registerForm.email,
        memberCode: memberCode,
        role: 'member_candidate',
        isVerified: true,
        createdAt: new Date().toISOString()
      });

      setShowStaffLogin(false);
      setAuthMode('login');
      setRegisterStep('form');
      setRegisterForm({ name: '', email: '', password: '' });
      setOtpCode('');
    } catch (err: any) {
      console.error(err);
      setRegisterError(err.message || 'Verification or registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingInStaff(true);
    setStaffLoginError(null);
    try {
      // 1. Try specialized accounts first (to get the role)
      const docRef = doc(db, 'specializedAccounts', staffLoginForm.email.toLowerCase());
      const snapshot = await getDocFromServer(docRef);
      
      let foundSpecialized = false;
      if (snapshot.exists()) {
        const data = snapshot.data() as SpecializedAccount;
        if (data.password === staffLoginForm.password) {
          setSpecializedRole(data.role);
          sessionStorage.setItem('specializedRole', data.role);
          sessionStorage.setItem('specializedEmail', data.email);
          foundSpecialized = true;
          // Don't return! We want to attempt real Auth login too if the user exists there
        }
      }
      
      // 2. Try standard Firebase Auth for everyone
      try {
        const userCred = await signInWithEmailAndPassword(auth, staffLoginForm.email, staffLoginForm.password);
        setUser(userCred.user);
        setShowStaffLogin(false);
        if (foundSpecialized) setShowAdminDashboard(true);
      } catch (authErr: any) {
        // If Auth login fails but specialized check succeeded, we still proceed but with null request.auth (risky)
        // This handles cases where specialized profiles exist only in Firestore
        if (foundSpecialized) {
          console.warn("Specialized profile found but standard Auth login failed. Access might be limited by rules.");
          setShowStaffLogin(false);
          setShowAdminDashboard(true);
          return;
        }
        throw authErr;
      }
    } catch (err: any) {
      console.error(err);
      setStaffLoginError('Invalid credentials or account does not exist.');
    } finally {
      setIsLoggingInStaff(false);
    }
  };

  const [staffLoginForm, setStaffLoginForm] = useState({ email: '', password: '' });
  const [staffLoginError, setStaffLoginError] = useState<string | null>(null);
  const [isLoggingInStaff, setIsLoggingInStaff] = useState(false);

  // Finance Ledger State
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: 0,
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const consolidatedFinanceLedger = useMemo(() => {
    const entries: any[] = [...financeEntries.map(e => ({ ...e, isAuto: false }))];
    
    // 1. Add registration fees from allUsers
    allUsers.forEach(u => {
      // Show if they have a payment amount and are in a status that suggests money was received/pending
      if (u.paymentAmount && (u.membershipStatus === 'approved' || u.membershipStatus === 'pending_finance' || u.membershipStatus === 'pending_secretary')) {
        const date = (u.paymentSubmittedAt && typeof u.paymentSubmittedAt === 'string') 
          ? u.paymentSubmittedAt.split('T')[0] 
          : safeToDate(u.paymentSubmittedAt || u.createdAt).toISOString().split('T')[0];
        
        entries.push({
          id: `reg-${u.id}`,
          type: 'income',
          amount: Number(u.paymentAmount),
          description: `Registration: ${u.name || 'Member'} ${u.memberCode ? `(${u.memberCode})` : ''}`,
          category: 'Registration',
          date: date,
          recordedBy: 'System',
          isAuto: true
        });
      }
    });

    // 2. Add approved payment submissions (Monthly/Other fees)
    paymentSubmissions.forEach(s => {
      if (s.status === 'approved') {
        const member = allUsers.find(u => u.id === s.userId);
        const date = s.paymentDate || safeToDate(s.submittedAt).toISOString().split('T')[0];
        
        entries.push({
          id: `sub-${s.id}`,
          type: 'income',
          amount: Number(s.amount),
          description: `${s.feeType || 'Fee'}: ${member?.name || 'Member'} ${member?.memberCode ? `(${member.memberCode})` : ''}`,
          category: s.feeType || 'Membership',
          date: date,
          recordedBy: 'System',
          isAuto: true
        });
      }
    });

    // Sort by date desc
    return entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [financeEntries, allUsers, paymentSubmissions]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [membershipPaymentForm, setMembershipPaymentForm] = useState({ transactionId: '', method: 'bkash' });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !membershipPaymentForm.transactionId) return;
    setSubmittingPayment(true);
    try {
      await updateUserStatus(user.uid, 'pending_finance', {
        transactionId: membershipPaymentForm.transactionId,
        paymentMethod: membershipPaymentForm.method,
        paymentAmount: membershipSettings?.membershipAmount || 100,
        paymentSubmittedAt: new Date().toISOString()
      });
      setMembershipPaymentForm({ transactionId: '', method: 'bkash' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleFeePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFeeForPayment || !paymentForm.transactionDetails || paymentForm.selectedTerms.length === 0) {
      alert('Please select terms and enter transaction details.');
      return;
    }

    setSubmittingPayment(true);
    try {
      // Create separate submissions for each term to track independently
      for (const term of paymentForm.selectedTerms) {
        const submission: Partial<PaymentSubmission> = {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || 'Member',
          feeId: selectedFeeForPayment.id,
          feeName: selectedFeeForPayment.name,
          termIndex: term.termIndex,
          year: term.year,
          amount: selectedFeeForPayment.amount,
          transactionDetails: paymentForm.transactionDetails,
          status: 'pending',
          submittedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'paymentSubmissions'), submission);
      }

      setShowPaymentModal(false);
      setPaymentForm({ transactionDetails: '', selectedTerms: [] });
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Payment submission received for review.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'paymentSubmissions');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userProfile,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setSavingProfile(false);
    }
  };

  const [fullScreenImage, setFullScreenImage] = useState<number | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programForm, setProgramForm] = useState({
    title: '',
    category: '',
    date: '',
    location: '',
    description: '',
    image: '',
    status: 'upcoming' as 'upcoming' | 'completed',
    details: '',
    featured: false,
    highlights: [] as string[],
    gallery: [] as string[],
    budget: {
      income: [] as { item: string; amount: number }[],
      expense: [] as { item: string; amount: number }[]
    }
  });

  // Auto-slide logic for Programs
  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(false);
      setUserProfile(null);
      
      if (currentUser) {
        // Fetch profile
        const userRef = doc(db, 'users', currentUser.uid);
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          } else {
            // Create profile if doesn't exist
            (async () => {
              try {
                const memberCode = await generateMemberId();
                const data = {
                  name: currentUser.displayName || '',
                  email: currentUser.email || '',
                  memberCode: memberCode,
                  role: 'member_candidate',
                  membershipStatus: 'unpaid',
                  isVerified: true,
                  createdAt: new Date().toISOString()
                };
                await setDoc(userRef, data);
                setUserProfile(data);
              } catch (err) {
                console.error("Failed to auto-create profile with ID:", err);
              }
            })();
          }
        }, (error) => {
          console.warn("Profile fetch issue:", error);
        });

        // 1. Check Super Admin via email (Matches rules)
        const adminEmails = ['edea.rangpur@gmail.com'];
        if (adminEmails.includes(currentUser.email?.toLowerCase() || '')) {
          setIsAdmin(true);
        } else {
          try {
            const adminSnap = await getDocFromServer(doc(db, 'admins', currentUser.uid));
            if (adminSnap.exists()) setIsAdmin(true);
          } catch (e) {}
        }

        // 2. Check Specialized Role (from specializedAccounts via Google Email)
        // Only if not already set by staff login
        if (!sessionStorage.getItem('specializedRole')) {
          try {
            const q = query(collection(db, 'specializedAccounts'), where('email', '==', currentUser.email.toLowerCase()));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data() as SpecializedAccount;
              setSpecializedRole(data.role);
              if (data.role === 'finance') {
                setAdminTab('finance');
              } else if (data.role === 'secretary') {
                setAdminTab('profile');
              }
            }
          } catch (e) {}
        }
      } else {
        // If not logged in to Google, check if specialized session exists
        if (!sessionStorage.getItem('specializedRole')) {
          setSpecializedRole(null);
        }
      }
    });

    // Test Connection to verify Firestore set up as per instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'config', 'association'));
        console.log("Firestore connection verified");
      } catch (error: any) {
        if (error.message?.includes('offline')) {
          console.error("Please check your Firebase configuration or network.");
        }
      }
    };
    testConnection();

    // Config Listener
    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'association'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAssociationConfig({
          mission: data.mission || associationConfig.mission,
          vision: data.vision || associationConfig.vision,
          about: data.about || associationConfig.about,
          categories: data.categories || ['Technical Workshop', 'Medical Seminar', 'Committee Meeting', 'Social Event', 'Training Program'],
          heroImages: data.heroImages || [],
          memberCountMode: data.memberCountMode || 'realtime',
          manualMemberCount: data.manualMemberCount || 0,
          logoUrl: data.logoUrl || '',
          footerDescription: data.footerDescription || 'The leading association for electromedical diploma engineers in the Rangpur region. Dedicated to professional growth and technical excellence.',
          officeAddress: data.officeAddress || 'Rangpur Medical College Road, Rangpur, Bangladesh',
          contactEmail: data.contactEmail || 'info@edea-rangpur.org',
          contactPhone: data.contactPhone || '+880 1234 567890',
          privacyPolicy: data.privacyPolicy || '',
          termsOfService: data.termsOfService || '',
          socialLinks: data.socialLinks || { facebook: '', twitter: '', linkedin: '', youtube: '', instagram: '', whatsapp: '' }
        });
        setEditMission(data.mission || '');
        setEditVision(data.vision || '');
        setEditAbout(data.about || '');
        setEditCategories(data.categories || ['Technical Workshop', 'Medical Seminar', 'Committee Meeting', 'Social Event', 'Training Program']);
        setEditHeroImages(data.heroImages || []);
        setEditMemberCountMode(data.memberCountMode || 'realtime');
        setEditManualMemberCount(data.manualMemberCount || 0);
        setEditLogoUrl(data.logoUrl || '');
        setEditFooterDescription(data.footerDescription || '');
        setEditOfficeAddress(data.officeAddress || '');
        setEditContactEmail(data.contactEmail || '');
        setEditContactPhone(data.contactPhone || '');
        setEditPrivacyPolicy(data.privacyPolicy || '');
        setEditTermsOfService(data.termsOfService || '');
        setEditSocialLinks(data.socialLinks || { facebook: '', twitter: '', linkedin: '', youtube: '', instagram: '', whatsapp: '' });
      }
    }, (error) => {
      console.warn("Config fetch issue:", error);
    });

    // Portal Config Listener
    const unsubscribePortal = onSnapshot(doc(db, 'config', 'portal'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const updatedPortal = {
          title: data.title || portalConfig.title,
          secretaryName: data.secretaryName || portalConfig.secretaryName,
          secretaryRole: data.secretaryRole || portalConfig.secretaryRole,
          secretaryInstitution: data.secretaryInstitution || portalConfig.secretaryInstitution,
          secretaryPhone: data.secretaryPhone || portalConfig.secretaryPhone,
          secretaryEmail: data.secretaryEmail || portalConfig.secretaryEmail,
          secretaryImage: data.secretaryImage || portalConfig.secretaryImage,
          ecCoverPhoto: data.ecCoverPhoto || portalConfig.ecCoverPhoto,
          description: data.description || portalConfig.description
        };
        setPortalConfig(updatedPortal);
        setEditPortal(updatedPortal);
      }
    }, (error) => {
      console.warn("Portal config fetch issue:", error);
    });

    // Programs Listener
    const unsubscribePrograms = onSnapshot(collection(db, 'programs'), (snapshot) => {
      const programsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Program[];
      setPrograms(programsData);
    }, (error) => {
      console.error("Programs fetch issue:", error);
    });

    // Specialized Accounts Listener (Super Admin only)
    let unsubscribeAccounts: (() => void) | null = null;
    if (isAdmin) {
      unsubscribeAccounts = onSnapshot(collection(db, 'specializedAccounts'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SpecializedAccount[];
        setSpecializedAccounts(data);
      }, (error) => {
        // Silently handle if permissions changed
        if (!error.message.includes('permission')) {
          handleFirestoreError(error, OperationType.GET, 'specializedAccounts');
        }
      });
    }

    // Finance Listener (Finance Officer only)
    let unsubscribeFinances: (() => void) | null = null;
    if (specializedRole === 'finance' || isAdmin) {
      unsubscribeFinances = onSnapshot(query(collection(db, 'finances'), orderBy('date', 'desc')), (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceEntry[];
        setFinanceEntries(data);
      }, (error) => {
        if (!error.message.includes('permission')) {
          handleFirestoreError(error, OperationType.GET, 'finances');
        }
      });
    }

    // Notices Listener
    const unsubscribeNotices = onSnapshot(query(collection(db, 'notices'), orderBy('date', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(data);
    }, (error) => {
      console.error("Notices fetch issue:", error);
    });

    // Executive Committee Listener
    const unsubscribeEC = onSnapshot(query(collection(db, 'executiveCommittee'), orderBy('order', 'asc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExecutiveMembers(data);
    }, (error) => {
      console.error("Executive Committee fetch issue:", error);
    });

    // Membership Settings Listener
    const unsubscribeMembership = onSnapshot(doc(db, 'config', 'membership'), (doc) => {
      if (doc.exists()) {
        setMembershipSettings(doc.data());
      }
    }, (error) => {
      if (error?.message && !error.message.includes('permission') && !error.message.includes('Unexpected state')) {
        handleFirestoreError(error, OperationType.GET, 'config/membership');
      }
    });

    // All Users Listener (for management/approvals and directory)
    let unsubscribeAllUsers: (() => void) | null = null;
    const usersCollection = collection(db, 'users');
    // If Admin/Staff, get everything. Else get only approved for Directory.
    const usersQuery = (isAdmin || specializedRole === 'finance' || specializedRole === 'secretary')
      ? query(usersCollection)
      : query(usersCollection, where('membershipStatus', '==', 'approved'));

    unsubscribeAllUsers = onSnapshot(usersQuery, (snapshot) => {
      setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[]);
    }, (error) => {
      if (error?.message && !error.message.includes('Unexpected state')) {
        // Silently handle if permissions changed
        if (!error.message.includes('permission')) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      }
    });
    const unsubscribeFees = onSnapshot(collection(db, 'fees'), (snapshot) => {
      setFeeStructures(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FeeStructure[]);
    }, (error) => {
      if (!error.message.includes('permission')) {
        console.error("Fees fetch issue:", error);
      }
    });

    const isStaff = isAdmin || specializedRole === 'finance' || specializedRole === 'secretary';
    const paymentsCollection = collection(db, 'paymentSubmissions');
    const paymentsQuery = isStaff
      ? query(paymentsCollection)
      : (user ? query(paymentsCollection, where('userId', '==', user.uid)) : null);

    let unsubscribePayments = () => {};
    if (paymentsQuery) {
      unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
        setPaymentSubmissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PaymentSubmission[]);
      }, (error) => {
        if (!error.message.includes('permission')) {
          console.error("Payments fetch issue:", error);
        }
      });
    }

    const programTimer = setInterval(() => {
      setCurrentProgramIndex((prev) => (prev + 1) % Math.max(1, programs.length));
    }, 5000);

    return () => {
      clearInterval(programTimer);
      unsubscribeAuth();
      unsubscribeConfig();
      unsubscribePortal();
      unsubscribePrograms();
      unsubscribeNotices();
      unsubscribeEC();
      unsubscribeAccounts?.();
      unsubscribeFinances?.();
      unsubscribeMembership();
      unsubscribeAllUsers?.();
      unsubscribeFees();
      unsubscribePayments();
    };
  }, [programs.length, isAdmin, specializedRole, user?.uid]);

  const handleUpdateMembershipSettings = async (data: any) => {
    setSavingMembershipSettings(true);
    try {
      await setDoc(doc(db, 'config', 'membership'), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Membership settings updated!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/membership');
    } finally {
      setSavingMembershipSettings(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = { 
        membershipStatus: status,
        updatedAt: new Date().toISOString(),
        ...additionalData 
      };
      if (status === 'approved') {
        updateData.role = 'member';
      }
      await updateDoc(userRef, updateData);
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: `Status updated to ${status}` });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const featuredProgram = programs.find(p => p.featured) || programs[0];
  
  const effectiveHeroImages = (associationConfig.heroImages && associationConfig.heroImages.length > 0) ? associationConfig.heroImages : HERO_IMAGES;

  const allSessions = Array.from(new Set(allUsers.filter(u => u.membershipStatus === 'approved').map(u => u.session || 'Unknown'))).sort().reverse();

  const filteredMembers = allUsers.filter(m => m.membershipStatus === 'approved').filter(m => {
    const matchesSearch = (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                         (m.companyName || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                         (m.memberCode || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                         (m.phone || '').includes(memberSearch);
    const matchesSession = sessionFilter === 'All' || m.session === sessionFilter;
    return matchesSearch && matchesSession;
  });

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(noticeSearch.toLowerCase());
    const matchesCategory = noticeCategoryFilter === 'All' || n.category === noticeCategoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    const path = 'notices';
    try {
      const data = {
        ...noticeForm,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };

      if (editingNotice) {
        await setDoc(doc(db, 'notices', editingNotice.id), data);
      } else {
        await addDoc(collection(db, 'notices'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: editingNotice ? 'Notice updated successfully!' : 'Notice published successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
      setIsAddingNotice(false);
      setEditingNotice(null);
      setNoticeForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: 'General',
        description: '',
        fbLink: '',
        image: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!isAdmin || !confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notices');
    }
  };

  const openEditNotice = (n: Notice) => {
    setEditingNotice(n);
    setNoticeForm({
      title: n.title,
      category: n.category,
      date: n.date,
      description: n.description,
      fbLink: n.fbLink || '',
      image: n.image || ''
    });
    setIsAddingNotice(true);
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'notice-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleSaveConfig = async () => {
    if (!user || !isAdmin) return;
    
    const path = 'config/association';
    try {
      await setDoc(doc(db, 'config', 'association'), {
        mission: editMission,
        vision: editVision,
        about: editAbout,
        categories: editCategories,
        heroImages: editHeroImages,
        memberCountMode: editMemberCountMode,
        manualMemberCount: editManualMemberCount,
        logoUrl: editLogoUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      setIsEditingConfig(false);
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Association settings updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const feeData: Partial<FeeStructure> = {
        ...feeForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'Unknown'
      };
      await addDoc(collection(db, 'fees'), feeData);
      setIsAddingFee(false);
      setFeeForm({ name: '', amount: 0, type: 'yearly', targetMemberType: 'all', frequency: 1, terms: [{ timeline: '', lastDate: { day: 31, month: 12 } }] });
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Fee structure added successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fees');
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Are you sure? This will delete the fee structure.')) return;
    try {
      await deleteDoc(doc(db, 'fees', id));
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Fee deleted.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fees');
    }
  };

  const toggleFeeStatus = async (fee: FeeStructure) => {
    try {
      const newStatus = !fee.isActive;
      await updateDoc(doc(db, 'fees', fee.id), {
        isActive: newStatus,
        pausedAt: newStatus ? null : serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'Unknown'
      });
      setSaveStatus({ 
        id: Date.now().toString(), 
        type: 'success', 
        message: `Fee ${newStatus ? 'activated' : 'paused'} successfully!` 
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'fees');
    }
  };

  const handleApprovePayment = async (payment: PaymentSubmission) => {
    try {
      await updateDoc(doc(db, 'paymentSubmissions', payment.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid || 'Unknown'
      });
      
      // Also add to finance ledger
      await addDoc(collection(db, 'finances'), {
        type: 'income',
        amount: payment.amount,
        description: `Fee Payment: ${payment.userName} (${payment.feeName} - Term ${payment.termIndex + 1}, ${payment.year})`,
        date: new Date().toISOString().split('T')[0],
        category: 'Member Fees',
        recordedBy: user?.uid || 'System'
      });

      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Payment approved!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'paymentSubmissions');
    }
  };

  const handleRejectPayment = async (id: string) => {
    if (!confirm('Reject this payment?')) return;
    try {
      await updateDoc(doc(db, 'paymentSubmissions', id), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      setSaveStatus({ id: Date.now().toString(), type: 'error', message: 'Payment rejected.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'paymentSubmissions');
    }
  };

  const handleSaveBranding = async () => {
    if (!user || !isAdmin) return;
    const path = 'config/association';
    try {
      await setDoc(doc(db, 'config', 'association'), {
        ...associationConfig,
        logoUrl: editLogoUrl,
        footerDescription: editFooterDescription,
        officeAddress: editOfficeAddress,
        contactEmail: editContactEmail,
        contactPhone: editContactPhone,
        privacyPolicy: editPrivacyPolicy,
        termsOfService: editTermsOfService,
        socialLinks: editSocialLinks,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Branding & Footer updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleSavePortal = async () => {
    if (!user || !isAdmin) return;
    
    const path = 'config/portal';
    try {
      // Save Portal Config
      await setDoc(doc(db, 'config', 'portal'), {
        ...editPortal,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      // Save Member Count to Association Config
      await setDoc(doc(db, 'config', 'association'), {
        ...associationConfig,
        memberCountMode: editMemberCountMode,
        manualMemberCount: editManualMemberCount,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });

      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Committee and membership settings updated!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleAddECMember = async () => {
    if (!user || !isAdmin) return;
    if (!ecMemberForm.role || !ecMemberForm.userId) {
      alert('Please fill in both designation and member fields.');
      return;
    }

    const selectedUser = allUsers.find(u => u.id === ecMemberForm.userId);
    if (!selectedUser) return;

    // Check if member already exists in committee
    if (executiveMembers.some(m => m.userId === selectedUser.id)) {
      alert('This member is already in the Executive Committee. Each person can only hold one position.');
      return;
    }

    const path = `executiveCommittee/${selectedUser.id}`;
    try {
      await setDoc(doc(db, 'executiveCommittee', selectedUser.id), {
        name: selectedUser.name,
        role: ecMemberForm.role, // This is the designation (President, Secretary etc)
        designation: selectedUser.designation || 'Member', // Their professional job title
        institution: selectedUser.companyName || selectedUser.institution || 'N/A',
        session: selectedUser.session || 'N/A',
        image: selectedUser.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`,
        phone: selectedUser.phone || '',
        userId: selectedUser.id,
        order: executiveMembers.length + 1,
        addedAt: serverTimestamp(),
        addedBy: user.uid
      });
      // Sync isExecutive flag to users collection
      await updateDoc(doc(db, 'users', selectedUser.id), { isExecutive: true });
      
      setEcMemberForm({ role: '', userId: '' });
      setEcMemberSearch('');
      setIsAddingECMember(false);
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Member added to committee!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleRemoveECMember = async (memberId: string) => {
    if (!user || !isAdmin) return;
    if (!confirm('Are you sure you want to remove this member from the committee?')) return;

    const path = `executiveCommittee/${memberId}`;
    try {
      await deleteDoc(doc(db, 'executiveCommittee', memberId));
      // Sync isExecutive flag to users collection
      await updateDoc(doc(db, 'users', memberId), { isExecutive: false });
      
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: 'Member removed from committee.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    const path = 'programs';
    try {
      const pData = {
        ...programForm,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };

      if (editingProgram) {
        await setDoc(doc(db, 'programs', editingProgram.id), pData);
      } else {
        await addDoc(collection(db, 'programs'), {
          ...pData,
          createdAt: serverTimestamp()
        });
      }
      setSaveStatus({ id: Date.now().toString(), type: 'success', message: editingProgram ? 'Program updated successfully!' : 'New program created successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
      setIsAddingProgram(false);
      setEditingProgram(null);
      setProgramForm({ 
        title: '', 
        category: '', 
        date: '', 
        location: '', 
        description: '', 
        image: '', 
        status: 'upcoming' as 'upcoming' | 'completed', 
        details: '', 
        featured: false,
        highlights: [],
        gallery: [],
        budget: { income: [], expense: [] }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!user || !isAdmin || !confirm('Are you sure you want to delete this program?')) return;
    try {
      await deleteDoc(doc(db, 'programs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'programs');
    }
  };

  const openEditProgram = (p: Program) => {
    setEditingProgram(p);
    setProgramForm({
      title: p.title,
      category: p.category || '',
      date: p.date,
      location: p.location || '',
      description: p.description,
      image: p.image,
      status: p.status || 'upcoming',
      details: p.details,
      featured: p.featured || false,
      highlights: p.highlights || [],
      gallery: p.gallery || [],
      budget: p.budget || { income: [], expense: [] }
    });
    setIsAddingProgram(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setShowAllProgramsView(false); 
                setShowFullCommittee(false); 
                setSelectedProgram(null);
                setShowAllMembers(false);
                setShowNoticesView(false);
                setShowAdminDashboard(false);
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            >
              {associationConfig.logoUrl ? (
                <img src={associationConfig.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="bg-brand-primary p-2 rounded-lg">
                  <Cpu className="text-white w-6 h-6" />
                </div>
              )}
              <span className="font-display font-bold text-xl text-brand-primary hidden sm:block">
                EDEA RANGPUR
              </span>
              <span className="font-display font-bold text-lg text-brand-primary sm:hidden">
                EDEA
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <button 
                onClick={() => { 
                  setShowAllProgramsView(false); 
                  setShowFullCommittee(false); 
                  setSelectedProgram(null);
                  setShowAllMembers(false);
                  setShowNoticesView(false);
                  setShowAdminDashboard(false);
                  setShowMemberDashboard(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }} 
                className="hover:text-brand-primary transition-colors font-medium text-slate-600"
              >
                Home
              </button>
              <button 
                onClick={() => {
                  setShowAllProgramsView(true);
                  setShowFullCommittee(false);
                  setShowAllMembers(false);
                  setShowNoticesView(false);
                  setShowAdminDashboard(false);
                  setShowMemberDashboard(false);
                  setSelectedProgram(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-brand-primary transition-colors font-medium text-slate-600"
              >
                Programs
              </button>
              <button 
                onClick={() => {
                  setShowNoticesView(true);
                  setShowAllProgramsView(false);
                  setShowFullCommittee(false);
                  setShowAllMembers(false);
                  setShowAdminDashboard(false);
                  setShowMemberDashboard(false);
                  setSelectedProgram(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-brand-primary transition-colors font-medium text-slate-600"
              >
                Notice
              </button>
              <button 
                onClick={() => {
                  setShowAllMembers(true);
                  setShowAllProgramsView(false);
                  setShowFullCommittee(false);
                  setShowNoticesView(false);
                  setShowAdminDashboard(false);
                  setShowMemberDashboard(false);
                  setSelectedProgram(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-brand-primary transition-colors font-medium text-slate-600"
              >
                Member
              </button>
              <a href="#mission" className="hover:text-brand-primary transition-colors font-medium text-slate-600">Mission & Vision</a>
              <button 
                onClick={() => {
                  setShowFullCommittee(true);
                  setShowAllProgramsView(false);
                  setShowAllMembers(false);
                  setShowNoticesView(false);
                  setShowAdminDashboard(false);
                  setShowMemberDashboard(false);
                  setSelectedProgram(null);
                }}
                className="hover:text-brand-primary transition-colors font-medium text-slate-600"
              >
                Executive Committee
              </button>
              {user && !isAdmin && (
                <button 
                  onClick={() => {
                    setShowMemberDashboard(true);
                    setShowAdminDashboard(false);
                    setShowNoticesView(false);
                    setShowAllProgramsView(false);
                    setShowFullCommittee(false);
                    setShowAllMembers(false);
                    setSelectedProgram(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${showMemberDashboard ? 'bg-brand-primary text-white' : 'text-brand-primary hover:bg-brand-primary/5'}`}
                >
                  <Users size={14} className="inline mr-2" />
                  My Dashboard
                </button>
              )}

            </div>

              {isAdmin && (
                <button 
                  onClick={() => {
                    setShowAdminDashboard(true);
                    setShowMemberDashboard(false);
                    setShowNoticesView(false);
                    setShowAllProgramsView(false);
                    setShowFullCommittee(false);
                    setShowAllMembers(false);
                    setSelectedProgram(null);
                    setAdminTab('general');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${showAdminDashboard && !specializedRole ? 'bg-brand-primary text-white' : 'text-brand-primary hover:bg-brand-primary/5'}`}
                >
                  <ShieldCheck size={14} />
                  Dashboard
                </button>
              )}

              {specializedRole === 'finance' && (
                <button 
                  onClick={() => {
                    setShowAdminDashboard(true);
                    setShowNoticesView(false);
                    setShowAllProgramsView(false);
                    setShowFullCommittee(false);
                    setShowAllMembers(false);
                    setSelectedProgram(null);
                    setAdminTab('finance');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${showAdminDashboard && specializedRole === 'finance' ? 'bg-brand-primary text-white' : 'text-brand-primary hover:bg-brand-primary/5'}`}
                >
                  <PieChart size={14} />
                  Finance Dashboard
                </button>
              )}


              {specializedRole === 'secretary' && (
                <button 
                  onClick={() => {
                    setShowAdminDashboard(true);
                    setShowNoticesView(false);
                    setShowAllProgramsView(false);
                    setShowFullCommittee(false);
                    setShowAllMembers(false);
                    setSelectedProgram(null);
                    setAdminTab('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${showAdminDashboard && specializedRole === 'secretary' ? 'bg-brand-primary text-white' : 'text-brand-primary hover:bg-brand-primary/5'}`}
                >
                  <ShieldCheck size={14} />
                  Secretary Portal
                </button>
              )}

              <div className="flex items-center gap-4">
                {user || specializedRole ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-900 leading-none">
                        {user?.displayName || sessionStorage.getItem('specializedEmail')?.split('@')[0] || 'Staff Member'}
                      </span>
                      {isAdmin && (
                        <span className="text-[8px] font-bold text-brand-primary uppercase tracking-widest mt-0.5">Super Admin</span>
                      )}
                      {specializedRole && (
                        <span className="text-[8px] font-bold text-brand-secondary uppercase tracking-widest mt-0.5">{specializedRole} Officer</span>
                      )}
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-all active:scale-95 group"
                      title="Logout"
                    >
                      <LogOut size={16} className="group-hover:text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowStaffLogin(true)}
                    className="hidden md:flex bg-brand-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 items-center gap-2"
                  >
                    <LogIn size={14} />
                    Login / Register
                  </button>
                )}
              
              <button 
                className="md:hidden p-2 text-slate-600"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <button 
                  onClick={() => { 
                    setShowAllProgramsView(false); 
                    setShowFullCommittee(false); 
                    setSelectedProgram(null);
                    setShowAllMembers(false);
                    setShowNoticesView(false);
                    setShowAdminDashboard(false);
                    setIsMenuOpen(false); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  }} 
                  className="block w-full text-left text-slate-600 font-medium"
                >
                  Home
                </button>
                <button 
                  onClick={() => { 
                    setShowAllProgramsView(true); 
                    setShowFullCommittee(false); 
                    setShowAllMembers(false); 
                    setShowNoticesView(false);
                    setShowAdminDashboard(false);
                    setSelectedProgram(null); 
                    setIsMenuOpen(false); 
                  }} 
                  className="block w-full text-left text-slate-600 font-medium"
                >
                  Programs
                </button>
                <button 
                  onClick={() => { 
                    setShowNoticesView(true);
                    setShowAllProgramsView(false); 
                    setShowFullCommittee(false); 
                    setShowAllMembers(false); 
                    setShowAdminDashboard(false);
                    setSelectedProgram(null); 
                    setIsMenuOpen(false); 
                  }} 
                  className="block w-full text-left text-slate-600 font-medium"
                >
                  Notice
                </button>
                <button 
                  onClick={() => { 
                    setShowAllMembers(true); 
                    setShowAllProgramsView(false); 
                    setShowFullCommittee(false); 
                    setShowNoticesView(false);
                    setShowAdminDashboard(false);
                    setSelectedProgram(null); 
                    setIsMenuOpen(false); 
                  }} 
                  className="block w-full text-left text-slate-600 font-medium"
                >
                  Member
                </button>
                
                {user && !isAdmin && (
                  <button 
                    onClick={() => { 
                      setShowMemberDashboard(true);
                      setShowAdminDashboard(false);
                      setShowNoticesView(false);
                      setShowAllProgramsView(false); 
                      setShowFullCommittee(false); 
                      setShowAllMembers(false); 
                      setSelectedProgram(null); 
                      setIsMenuOpen(false); 
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="block w-full text-left text-brand-primary font-medium"
                  >
                    My Dashboard
                  </button>
                )}

                <a href="#mission" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-medium">Mission & Vision</a>
                <button 
                  onClick={() => { 
                    setShowFullCommittee(true); 
                    setShowNoticesView(false);
                    setShowAllProgramsView(false); 
                    setShowAllMembers(false); 
                    setShowAdminDashboard(false);
                    setSelectedProgram(null); 
                    setIsMenuOpen(false); 
                  }} 
                  className="block w-full text-left text-slate-600 font-medium"
                >
                  Executive Committee
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => { 
                      setShowAdminDashboard(true);
                      setShowNoticesView(false);
                      setShowAllProgramsView(false); 
                      setShowFullCommittee(false); 
                      setShowAllMembers(false); 
                      setSelectedProgram(null); 
                      setAdminTab('general');
                      setIsMenuOpen(false); 
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-2 w-full text-left text-brand-primary font-bold uppercase text-xs tracking-widest pt-4 border-t border-slate-100"
                  >
                    <ShieldCheck size={14} />
                    Admin Dashboard
                  </button>
                )}

                {specializedRole === 'finance' && (
                  <button 
                    onClick={() => { 
                      setShowAdminDashboard(true);
                      setShowNoticesView(false);
                      setShowAllProgramsView(false); 
                      setShowFullCommittee(false); 
                      setShowAllMembers(false); 
                      setSelectedProgram(null); 
                      setAdminTab('finance');
                      setIsMenuOpen(false); 
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-2 w-full text-left text-brand-primary font-bold uppercase text-xs tracking-widest pt-4 border-t border-slate-100"
                  >
                    <PieChart size={14} />
                    Finance Dashboard
                  </button>
                )}

                {specializedRole === 'secretary' && (
                  <button 
                    onClick={() => { 
                      setShowAdminDashboard(true);
                      setShowNoticesView(false);
                      setShowAllProgramsView(false); 
                      setShowFullCommittee(false); 
                      setShowAllMembers(false); 
                      setSelectedProgram(null); 
                      setAdminTab('profile');
                      setIsMenuOpen(false); 
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-2 w-full text-left text-brand-primary font-bold uppercase text-xs tracking-widest pt-4 border-t border-slate-100"
                  >
                    <ShieldCheck size={14} />
                    Secretary Portal
                  </button>
                )}
                
                <div className="pt-4 border-t border-slate-100">
                  {user || specializedRole ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-brand-primary" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white">
                            <ShieldCheck size={20} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user?.displayName || specializedRole + ' Officer'}</div>
                          <div className="text-[10px] text-slate-500">{user?.email || sessionStorage.getItem('specializedEmail')}</div>
                        </div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowStaffLogin(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-brand-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
                    >
                      <LogIn size={16} />
                      Login / Register
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero / Featured Program (Only show on Home) */}
      {!showAllProgramsView && !showFullCommittee && !selectedProgram && !showAllMembers && !showNoticesView && !showAdminDashboard && !showMemberDashboard && (
        <header className="relative min-h-[90vh] flex flex-col overflow-hidden px-4">
          {/* Full Background Image Slider */}
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentHeroIndex}
                src={effectiveHeroImages[currentHeroIndex]} 
                alt="Hero Background" 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full pt-6 sm:pt-8 flex flex-col h-full grow">
            {/* Top Header Label */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex justify-center mb-8 sm:mb-16 px-4"
            >
              <h1 className="text-[clamp(0.8rem,4vw,3.5rem)] md:text-4xl lg:text-5xl text-white font-display font-bold tracking-tight text-center whitespace-nowrap leading-tight transition-all">
                Electromedical Diploma Engineers Association, <span className="text-brand-accent ml-[0.3em]">Rangpur</span>
              </h1>
            </motion.div>
            
            <div className="grid lg:grid-cols-[1.8fr_1fr] gap-12 lg:gap-16 items-start my-auto pb-12">
              {/* Left side: Feature Image Card (65% width area) */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="flex justify-center lg:justify-start -mt-8 sm:-mt-12"
              >
                <div className="relative group cursor-pointer w-full" onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % effectiveHeroImages.length)}>
                  <div className="absolute -inset-10 bg-brand-accent/20 rounded-[4rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <motion.div 
                    key={currentHeroIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-[3/2] w-full rounded-[2.5rem] sm:rounded-[4.5rem] overflow-hidden border-[8px] sm:border-[20px] border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-sm"
                  >
                    <img 
                      src={effectiveHeroImages[currentHeroIndex]} 
                      alt="Featured View" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    
                    {/* Click indicator */}
                    <div className="absolute top-8 sm:top-14 right-8 sm:right-14 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles size={28} className="text-brand-accent animate-pulse" />
                    </div>
                  </motion.div>

                  {/* Decorative border elements */}
                  <div className="absolute -top-8 -left-8 w-16 sm:w-32 h-16 sm:h-32 border-t-[12px] border-l-[12px] border-brand-accent/40 rounded-tl-[4rem] hidden sm:block" />
                  <div className="absolute -bottom-8 -right-8 w-16 sm:w-32 h-16 sm:h-32 border-b-[12px] border-r-[12px] border-brand-accent/40 rounded-br-[4rem] hidden sm:block" />
                </div>
              </motion.div>

              {/* Right side: Information & Stats (35% width area) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col h-full justify-between lg:pt-4"
              >
                <div className="space-y-6">
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-accent/60 mb-2">About Association</div>
                  <div className="space-y-6 text-base sm:text-lg lg:text-xl text-slate-200 leading-relaxed font-medium">
                    <p>
                      {associationConfig.about}
                    </p>
                  </div>
              </div>

              {/* Hero Social Icons - Brand Colored */}
              {associationConfig.socialLinks && Object.values(associationConfig.socialLinks).some(link => typeof link === 'string' && link.trim() !== '') && (
                <div className="mt-16 sm:mt-24 flex flex-wrap gap-4 px-2">
                  {associationConfig.socialLinks.facebook && typeof associationConfig.socialLinks.facebook === 'string' && associationConfig.socialLinks.facebook.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#1877F2]/20 border border-white/10 transition-all duration-300"
                    >
                      <Facebook size={24} />
                    </motion.a>
                  )}
                  {associationConfig.socialLinks.linkedin && typeof associationConfig.socialLinks.linkedin === 'string' && associationConfig.socialLinks.linkedin.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-[#0A66C2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0A66C2]/20 border border-white/10 transition-all duration-300"
                    >
                      <Linkedin size={24} />
                    </motion.a>
                  )}
                  {associationConfig.socialLinks.twitter && typeof associationConfig.socialLinks.twitter === 'string' && associationConfig.socialLinks.twitter.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: 12 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 border border-white/10 transition-all duration-300"
                    >
                      <Twitter size={24} />
                    </motion.a>
                  )}
                  {associationConfig.socialLinks.instagram && typeof associationConfig.socialLinks.instagram === 'string' && associationConfig.socialLinks.instagram.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: -12 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 border border-white/10 transition-all duration-300"
                    >
                      <Instagram size={24} />
                    </motion.a>
                  )}
                  {associationConfig.socialLinks.whatsapp && associationConfig.socialLinks.whatsapp.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.whatsapp} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 border border-white/10 transition-all duration-300"
                    >
                      <MessageCircle size={24} />
                    </motion.a>
                  )}
                  {associationConfig.socialLinks.youtube && typeof associationConfig.socialLinks.youtube === 'string' && associationConfig.socialLinks.youtube.trim() !== '' && (
                    <motion.a 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                      href={associationConfig.socialLinks.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 bg-[#FF0000] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF0000]/20 border border-white/10 transition-all duration-300"
                    >
                      <Youtube size={24} />
                    </motion.a>
                  )}
                </div>
              )}

              {/* Stats Card - Pushed down for better visual rhythm */}
              <div className="mt-8 lg:mt-12">
                  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="bg-brand-accent/10 p-5 rounded-[2rem] text-brand-accent border border-brand-accent/20">
                        <Users size={36} />
                      </div>
                      <div className="flex-1">
                        <div className="text-4xl sm:text-5xl font-black text-white font-display tracking-tight">
                          {associationConfig.memberCountMode === 'manual' 
                            ? `${associationConfig.manualMemberCount}${associationConfig.manualMemberCount > 0 ? '+' : ''}`
                            : `${allUsers.filter(u => u.membershipStatus === 'approved').length}`
                          }
                        </div>
                        <div className="text-[10px] sm:text-xs text-brand-accent font-bold uppercase tracking-[0.2em] mb-3">Active Members</div>
                        <button 
                          onClick={() => {
                            setAuthMode('register');
                            setRegisterStep('form');
                            setShowStaffLogin(true);
                          }}
                          className="bg-brand-accent hover:bg-white text-brand-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-[0_8px_20px_rgba(255,215,0,0.2)]"
                        >
                          <UserPlus size={12} />
                          Join Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Slider Navigation Dots */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
              {effectiveHeroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`transition-all duration-500 rounded-full ${
                    idx === currentHeroIndex ? "w-12 h-2 bg-brand-accent shadow-[0_0_15px_rgba(255,215,0,0.5)]" : "w-2 h-2 bg-white/30 hover:bg-white/50"
                  }`}
                  title={`View Scene ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {!showAllProgramsView && !showFullCommittee && !selectedProgram && !showAllMembers && !showNoticesView && !showAdminDashboard && !showMemberDashboard && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-24">
            {/* Landing Page Content Sections */}
        
        {/* Feature Program (Carousel) */}
        <section id="programs" className="scroll-mt-24">
          <div className="flex flex-col mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[1px] w-12 bg-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand-primary/60">Featured Initiatives</span>
            </div>
            <h2 className="text-4xl font-display font-medium text-slate-900 mb-2">Our association programs</h2>
            <p className="text-slate-500 text-lg">Stay updated with our ongoing and upcoming initiatives across the division.</p>
          </div>
          
          {programs.length > 0 ? (
            <div className="relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl lg:h-[550px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentProgramIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="grid lg:grid-cols-[1.5fr_1fr] h-full"
                >
                  {/* Carousel Image */}
                  <div className="relative aspect-[3/2] lg:aspect-auto lg:h-full overflow-hidden shrink-0 group">
                    <img 
                      src={programs[currentProgramIndex]?.image} 
                      alt={programs[currentProgramIndex]?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                  </div>

                  {/* Carousel Content */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center bg-white relative h-full">
                    <div className="flex items-center gap-2 text-brand-secondary text-sm font-bold mb-4">
                      <Calendar size={18} />
                      {programs[currentProgramIndex]?.date}
                    </div>
                    
                    <h3 className="text-3xl font-display font-bold text-slate-900 mb-6 italic">
                      {programs[currentProgramIndex]?.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-8 leading-relaxed line-clamp-4 lg:line-clamp-none whitespace-pre-wrap">
                      {programs[currentProgramIndex]?.description}
                    </p>

                    <div className="space-y-4 mb-10">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                        Interactive Technical Sessions
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                        Professional Networking
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                        Expert Guidance
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedProgram(programs[currentProgramIndex])}
                      className="w-fit bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
                    >
                      View Full Details <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Indicators */}
              <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                {programs.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentProgramIndex(idx);
                    }}
                    className={`h-1.5 transition-all rounded-full ${
                      idx === currentProgramIndex ? "w-8 bg-brand-primary" : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl lg:h-[400px] flex items-center justify-center text-slate-400 font-medium italic p-12 text-center">
              No programs to display at the moment.
            </div>
          )}
        </section>

        {/* All Programs List (Horizontal Scroll) */}
        <section className="scroll-mt-24">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-8 bg-brand-primary/30" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">History & Timeline</span>
              </div>
              <h2 className="text-3xl font-display font-medium text-slate-900">Discover all programs</h2>
              <p className="text-slate-500 text-lg">Browse our full history of impactful events and workshops.</p>
            </div>
            <div className="flex gap-3 pb-2">
              <button 
                onClick={() => {
                  const el = document.getElementById('programs-scroll');
                  if (el) el.scrollBy({ left: -el.offsetWidth / 2, behavior: 'smooth' });
                }}
                className="p-4 border border-slate-200 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                title="Previous"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('programs-scroll');
                  if (el) el.scrollBy({ left: el.offsetWidth / 2, behavior: 'smooth' });
                }}
                className="p-4 border border-slate-200 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                title="Next"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div 
            id="programs-scroll"
            className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-10 scrollbar-hide snap-x no-scrollbar"
            style={{ 
              msOverflowStyle: 'none', 
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {[...programs].map((program, idx) => (
              <motion.button
                key={`${program.id}-${idx}`}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedProgram(program)}
                className="flex flex-col shrink-0 w-[280px] sm:w-[320px] bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden group snap-start transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/10"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {program.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-3 rounded-full text-brand-primary shadow-xl scale-0 group-hover:scale-100 transition-transform duration-500">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 text-left space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar size={12} className="text-brand-primary/50" />
                    {program.date}
                  </div>
                  <h4 className="text-lg font-display font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-brand-primary transition-colors">
                    {program.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {program.description}
                  </p>
                  
                  <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{program.location}</span>
                    </div>
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1">
                      Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Member Directory (Horizontal Cards) */}
        <section id="members" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl text-slate-900 mb-1">Our Association Members</h2>
              <p className="text-slate-500 text-sm">Recognizing the engineers driving healthcare excellence in Rangpur.</p>
            </div>
            <button 
              onClick={() => {
                setShowAllMembers(true);
                setShowAllProgramsView(false);
                setShowFullCommittee(false);
                setSelectedProgram(null);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="text-brand-primary font-bold text-sm hover:underline flex items-center gap-1"
            >
              See All Members <ChevronRight size={16} />
            </button>
          </div>

          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
          >
            {allUsers.filter(u => u.membershipStatus === 'approved').slice(0, 10).map((member) => (
              <motion.div
                key={member.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl border-b-4 border-brand-primary/10 hover:border-brand-primary p-2 shadow-sm group transition-all"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-50">
                  <img 
                    src={member.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                    alt={member.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {member.bloodGroup && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg">
                      {member.bloodGroup}
                    </div>
                  )}
                </div>
                <div className="px-1 pb-2 flex flex-col items-center text-center">
                  <h3 className="font-display font-bold text-[13px] text-slate-900 mb-0.5 group-hover:text-brand-primary transition-colors line-clamp-1 leading-tight w-full">{member.name}</h3>
                  <div className="text-slate-500 text-[10px] mb-2 line-clamp-1 font-medium w-full">
                    {member.designation && <span className="block italic opacity-80 truncate">{member.designation}</span>}
                    {member.companyName || (member.shift ? `${member.shift} Shift` : 'Member')}
                  </div>
                  <div className="inline-flex items-center justify-center px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-tighter">Session: {member.session || 'N/A'}</div>
                </div>
              </motion.div>
            ))}
            
            {allUsers.filter(u => u.membershipStatus === 'approved').length === 0 && (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-2 animate-pulse border border-slate-100">
                  <div className="aspect-[3/4] bg-slate-200 rounded-xl mb-3" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded mx-auto mb-2" />
                  <div className="h-2 w-1/2 bg-slate-200 rounded mx-auto" />
                </div>
              ))
            )}
            
            {/* See More Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => {
                setShowAllMembers(true);
                setShowAllProgramsView(false);
                setShowFullCommittee(false);
                setSelectedProgram(null);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center p-4 gap-3 border-b-4 border-slate-800 shadow-sm group transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-brand-accent group-hover:bg-brand-primary group-hover:text-white transition-all">
                <Users size={20} />
              </div>
              <div className="w-full">
                <div className="text-white font-bold text-sm mb-0.5">See More</div>
                <p className="text-slate-500 text-[10px] line-clamp-1">Join our network</p>
              </div>
            </motion.button>
          </div>
        </section>

        {/* Mission & Vision */}
        <section id="mission" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-8 bg-brand-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Core Values</span>
              </div>
              <h2 className="text-3xl font-display font-medium text-slate-900 italic">Vision & Purpose</h2>
            </div>
            {isAdmin && !isEditingConfig && (
              <button 
                onClick={() => {
                  setEditMission(associationConfig.mission);
                  setEditVision(associationConfig.vision);
                  setEditAbout(associationConfig.about);
                  setIsEditingConfig(true);
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition-all"
              >
                <Settings size={14} />
                Edit Mission/Vision
              </button>
            )}
          </div>

          {isEditingConfig ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2rem] border border-brand-primary/20 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Admin Section: Update Content</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">About Association</label>
                  <textarea 
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    className="w-full h-48 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm leading-relaxed"
                    placeholder="Enter homepage summary..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Statement</label>
                  <textarea 
                    value={editMission}
                    onChange={(e) => setEditMission(e.target.value)}
                    className="w-full h-48 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm leading-relaxed"
                    placeholder="Enter mission statement..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vision Statement</label>
                  <textarea 
                    value={editVision}
                    onChange={(e) => setEditVision(e.target.value)}
                    className="w-full h-48 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm leading-relaxed"
                    placeholder="Enter vision statement..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setIsEditingConfig(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveConfig}
                  className="flex items-center gap-2 bg-brand-primary text-white px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-10 bg-white rounded-3xl border border-slate-200 overflow-hidden group shadow-sm"
              >
                <div className="absolute top-0 right-0 p-8 text-brand-secondary/10 group-hover:scale-110 transition-transform">
                  <Target size={120} />
                </div>
                <div className="relative">
                  <div className="bg-brand-secondary/10 p-3 rounded-2xl w-fit mb-6">
                    <Target className="text-brand-secondary" />
                  </div>
                  <h2 className="text-3xl text-slate-900 mb-6 font-display font-bold italic">Our Mission</h2>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {associationConfig.mission}
                  </p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-10 bg-brand-primary rounded-3xl overflow-hidden group shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-110 transition-transform">
                  <Eye size={120} />
                </div>
                <div className="relative text-white">
                  <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6">
                    <Eye className="text-white" />
                  </div>
                  <h2 className="text-3xl mb-6 font-display font-bold italic">Our Vision</h2>
                  <p className="text-white/80 leading-relaxed text-lg">
                    {associationConfig.vision}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </section>

        {/* Executive Committee Section */}
        <section id="executive" className="scroll-mt-24">
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[1px] w-12 bg-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/60">Leadership Council</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">Executive Committee</h2>
            <p className="text-slate-500 text-sm font-medium italic">The dedicated leaders guiding our association towards excellence.</p>
          </div>

          {/* Large Group Photo Area - Reduced spacing */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-8 relative group"
          >
            <div className="absolute -inset-4 bg-brand-primary/5 rounded-[3rem] blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="relative aspect-[21/9] w-full rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden border-[8px] border-white shadow-xl">
              <img 
                src={portalConfig.ecCoverPhoto} 
                alt="Executive Committee Group" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40" />
            </div>
          </motion.div>

          {/* Individual Members - Rows of 5, optimized design */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {executiveMembers.slice(0, 10).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-1 bg-brand-primary/90 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm">
                      {member.role}
                    </span>
                  </div>
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Users size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="flex gap-2 w-full">
                       <a href={`tel:${member.phone}`} className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-lg flex items-center justify-center">
                         <Phone size={14} />
                       </a>
                       <div className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-lg flex items-center justify-center">
                         <Mail size={14} />
                       </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1 group-hover:text-brand-primary transition-colors">{member.name}</h3>
                  <div className="text-[9px] text-brand-primary font-black uppercase tracking-tight mb-2">
                    {member.designation}
                  </div>
                  <div className="pt-2 border-t border-slate-50 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="text-[9px] text-slate-500 font-medium truncate mb-0.5">
                      {member.institution}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                      Session: {member.session}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => {
                setShowFullCommittee(true);
                window.scrollTo(0, 0);
              }}
              className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand-primary hover:scale-[1.05] active:scale-95 transition-all"
            >
              See full Executive Council <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* ICT Secretary Section - Compact Card */}
        <section id="ict" className="scroll-mt-24 border-t border-slate-200 pt-8 mb-10">
          <div className="flex justify-center">
            <div className="max-w-2xl w-full bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
                {/* Photo with status badge */}
                <div className="relative shrink-0">
                  <div className="w-24 h-32 sm:w-32 sm:h-44 rounded-3xl overflow-hidden border-2 border-brand-primary/10 group-hover:border-brand-primary/30 transition-colors shadow-inner flex items-center justify-center bg-slate-50">
                    {portalConfig.secretaryImage ? (
                      <img 
                        src={portalConfig.secretaryImage} 
                        alt={portalConfig.secretaryName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <ImageIcon className="text-slate-200" size={40} />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-brand-accent p-2 rounded-xl shadow-lg border-2 border-white">
                    <Settings size={16} className="animate-spin-slow text-slate-900" />
                  </div>
                </div>
                
                {/* Info & Action */}
                <div className="flex-grow text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/5 rounded-full text-[9px] font-bold text-brand-primary uppercase tracking-widest mb-3">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                    {portalConfig.title}
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-1">{portalConfig.secretaryName}</h3>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                    {portalConfig.secretaryRole} • {portalConfig.secretaryInstitution}
                  </div>
                  
                  <p className="text-slate-500 text-xs mb-6 leading-relaxed max-w-sm">
                    {portalConfig.description}
                  </p>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <a 
                      href={`tel:${portalConfig.secretaryPhone}`} 
                      className="flex items-center gap-2 bg-slate-50 hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-600 shadow-sm"
                    >
                      <Phone size={14} /> {portalConfig.secretaryPhone}
                    </a>
                    <a 
                      href={`mailto:${portalConfig.secretaryEmail}`} 
                      className="flex items-center gap-2 bg-slate-50 hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-600 shadow-sm"
                    >
                      <Mail size={14} /> Email Report
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )}

        {/* Full Committee Page View (Integrated) */}
        {showFullCommittee && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-2 pb-12 scroll-mt-20">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-6">
              <div className="space-y-4 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <div className="h-[2px] w-8 bg-brand-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Leadership Council</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-medium text-slate-900 leading-tight">Executive Committee</h2>
              </div>
              <button 
                onClick={() => { setShowFullCommittee(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-slate-900 px-4 py-2 rounded-lg text-white hover:bg-brand-primary transition-all shadow-sm flex items-center gap-2 font-bold active:scale-95 text-[9px] uppercase tracking-widest"
              >
                <ArrowRight className="rotate-180" size={12} /> Home
              </button>
            </div>

            {/* Group Photo */}
            <div className="mb-10 relative rounded-[3rem] sm:rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl">
              <img 
                src={portalConfig.ecCoverPhoto} 
                alt="Group Photo" 
                className="w-full h-[300px] sm:h-[500px] object-cover"
              />
            </div>

            {/* All Members Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {executiveMembers.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-2 shadow-sm border-b-4 border-brand-primary/20 hover:border-brand-primary hover:shadow-xl transition-all group"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-50 flex items-center justify-center">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    ) : (
                      <Users size={32} className="text-slate-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                      <div className="text-white font-bold text-[10px] text-center leading-tight">
                        {member.institution}
                      </div>
                    </div>
                  </div>
                  <div className="px-2 pb-3 text-center">
                    <div className="bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit mx-auto mb-2">
                      {member.role}
                    </div>
                    <h4 className="text-[13px] font-display font-bold text-slate-900 mb-0.5 line-clamp-1">{member.name}</h4>
                    <div className="inline-block px-3 py-0.5 bg-brand-primary/5 text-slate-400 rounded-full text-[8px] font-bold uppercase tracking-tight">Session: {member.session}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Full Programs Page View (Integrated) */}
        {showAllProgramsView && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
              <div className="space-y-4 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <div className="h-[2px] w-8 bg-brand-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Association Timeline</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-medium text-slate-900 leading-tight">All association programs</h2>
                <p className="text-slate-500 text-lg max-w-2xl">A complete record of our workshops, seminars, and social initiatives across the Rangpur division.</p>
              </div>
              <button 
                onClick={() => { setShowAllProgramsView(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-white p-4 rounded-[2rem] border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-lg flex items-center gap-2 font-bold px-8 active:scale-95 whitespace-nowrap"
              >
                <ArrowRight className="rotate-180" size={24} /> Back to Home
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-8">
              {programs.map((program, idx) => (
                <motion.button
                  key={`${program.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -10 }}
                  onClick={() => setSelectedProgram(program)}
                  className="flex flex-col items-center gap-6 text-center group"
                >
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 xl:w-48 xl:h-48 rounded-full overflow-hidden border-8 border-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] group-hover:border-brand-primary/10 flex items-center justify-center bg-slate-50">
                    {program.image ? (
                      <img 
                        src={program.image} 
                        alt={program.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                      />
                    ) : (
                      <Calendar size={48} className="text-slate-200" />
                    )}
                    <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/20 transition-all duration-500 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100">
                      <div className="bg-white p-3 rounded-full text-brand-primary shadow-xl scale-0 group-hover:scale-100 transition-transform duration-500">
                        <ExternalLink size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 px-2">
                    <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest opacity-60">
                      {program.date}
                    </div>
                    <h4 className="text-sm sm:text-base font-display font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
                      {program.title}
                    </h4>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Program Detail View (Integrated Update) */}
        {selectedProgram && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12">
            {/* Minimal Header: Title Left, Date Right */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-brand-primary transition-all text-[10px] font-black uppercase tracking-[0.3em] group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                  Back to Programs
                </button>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-slate-900 leading-[1.1]">
                  {selectedProgram.title}
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-brand-primary/5 px-5 py-2.5 rounded-2xl border border-brand-primary/10 shrink-0">
                <Calendar size={18} className="text-brand-primary" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled On</span>
                  <span className="text-sm font-bold text-slate-700">{selectedProgram.date}</span>
                </div>
              </div>
            </div>

            {/* Full Width Featured Image */}
            <div className="relative rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white mb-6 aspect-[21/9] sm:aspect-[21/8] bg-slate-100 group flex items-center justify-center">
              {selectedProgram.image ? (
                <img 
                  src={selectedProgram.image} 
                  alt={selectedProgram.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                />
              ) : (
                <ImageIcon size={64} className="text-slate-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Meta Information Line (Venue, Category, Status) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-12 py-6 px-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm mb-12">
              <div className="flex items-center gap-3">
                <MapPin className="text-brand-primary" size={20} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Venue</span>
                  <span className="text-sm font-bold text-slate-700">{selectedProgram.location}</span>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-slate-100" />
              <div className="flex items-center gap-3">
                <Tag className="text-brand-primary" size={20} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                  <span className="text-sm font-bold text-slate-700">{selectedProgram.category}</span>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedProgram.status === 'upcoming' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">{selectedProgram.status}</span>
                </div>
              </div>
            </div>

            {/* Single Column Flow */}
            <div className="space-y-12">
              {/* About & Highlights Section */}
              <section className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                
                <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                  <div className="lg:w-2/3 space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                        <Info size={20} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight italic">Program Story & History</h3>
                    </div>
                    <p className="text-xl text-slate-700 leading-relaxed font-bold italic whitespace-pre-line border-l-4 border-brand-primary/20 pl-6">
                      "{selectedProgram.description}"
                    </p>
                    {selectedProgram.details && (
                      <div 
                        className="details-content prose prose-slate max-w-none prose-sm text-slate-500 prose-headings:text-slate-800 prose-p:leading-loose border-t border-slate-50 pt-10"
                        dangerouslySetInnerHTML={{ __html: selectedProgram.details }} 
                      />
                    )}
                  </div>

                  <div className="lg:w-1/3">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <Star size={16} className="text-brand-primary" /> Key Highlights
                      </h4>
                      <div className="space-y-3">
                        {selectedProgram.highlights?.map((h, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:translate-x-1 transition-transform">
                            <Sparkles size={14} className="text-brand-primary" />
                            <span className="text-sm font-bold text-slate-700">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Financial Statement */}
              {selectedProgram.budget && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <PieChart size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight italic font-display">Financial Statement Breakdown</h3>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="grid md:grid-cols-2">
                      {/* Income Breakdown */}
                      <div className="p-7 border-b md:border-b-0 md:border-r border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" /> Income Sources
                          </h4>
                          <span className="text-[10px] font-black text-slate-400">CREDIT</span>
                        </div>
                        <div className="space-y-2">
                          {selectedProgram.budget.income.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-4 rounded-xl bg-green-50/50 border border-green-100/30 group hover:bg-green-50 transition-colors">
                              <span className="text-sm font-bold text-slate-600">{item.item || "Unspecified Source"}</span>
                              <span className="text-sm font-black text-slate-900">৳{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-4 border-t border-slate-100 flex justify-between items-center px-2">
                            <span className="text-xs font-black uppercase text-slate-400">Total Income</span>
                            <span className="text-lg font-black text-green-600">৳{selectedProgram.budget.income.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expense Breakdown */}
                      <div className="p-7">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" /> Expense Details
                          </h4>
                          <span className="text-[10px] font-black text-slate-400">DEBIT</span>
                        </div>
                        <div className="space-y-2">
                          {selectedProgram.budget.expense.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-4 rounded-xl bg-red-50/50 border border-red-100/30 group hover:bg-red-50 transition-colors">
                              <span className="text-sm font-bold text-slate-600">{item.item || "Unspecified Expense"}</span>
                              <span className="text-sm font-black text-slate-900">৳{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-4 border-t border-slate-100 flex justify-between items-center px-2">
                            <span className="text-xs font-black uppercase text-slate-400">Total Expenses</span>
                            <span className="text-lg font-black text-red-500">৳{selectedProgram.budget.expense.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Net Summary */}
                    <div className="bg-slate-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                          <PieChart className="text-brand-accent" size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Financial Reconciliation</p>
                          <h4 className="text-xl font-bold text-white font-display">Closing Event Balance</h4>
                        </div>
                      </div>
                      <div className="text-center md:text-right relative z-10">
                        <span className={`text-4xl md:text-5xl font-black font-display italic tracking-tight ${
                          (selectedProgram.budget.income.reduce((a, b) => a + b.amount, 0) - selectedProgram.budget.expense.reduce((a, b) => a + b.amount, 0)) >= 0 
                          ? 'text-brand-accent' 
                          : 'text-red-400'
                        }`}>
                          ৳{(selectedProgram.budget.income.reduce((a, b) => a + b.amount, 0) - selectedProgram.budget.expense.reduce((a, b) => a + b.amount, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Gallery Bottom */}
              {selectedProgram.gallery && selectedProgram.gallery.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                      <ImageIcon size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight italic">Program Gallery</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {selectedProgram.gallery.map((img, i) => (
                      <div 
                        key={i} 
                        onClick={() => setFullScreenImage(i)}
                        className="aspect-square rounded-[2rem] overflow-hidden hover:scale-105 transition-all shadow-lg group relative border-4 border-white cursor-zoom-in active:scale-95"
                      >
                        {img && <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="text-white drop-shadow-lg scale-0 group-hover:scale-100 transition-transform" size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Full Image Lightbox */}
        <AnimatePresence>
          {fullScreenImage !== null && selectedProgram?.gallery && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullScreenImage(null)}
              className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
            >
              {/* Keyboard Listener */}
              <div 
                tabIndex={0}
                className="hidden"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    setFullScreenImage((prev) => (prev! + 1) % selectedProgram.gallery!.length);
                  } else if (e.key === 'ArrowLeft') {
                    setFullScreenImage((prev) => (prev! - 1 + selectedProgram.gallery!.length) % selectedProgram.gallery!.length);
                  } else if (e.key === 'Escape') {
                    setFullScreenImage(null);
                  }
                }}
              />

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImage(null);
                }}
                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all z-[110]"
              >
                <X size={24} />
              </motion.button>

              {/* Navigation Buttons */}
              <div className="absolute inset-x-4 sm:inset-x-8 flex items-center justify-between z-[105]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenImage((prev) => (prev! - 1 + selectedProgram.gallery!.length) % selectedProgram.gallery!.length);
                  }}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-lg border border-white/10 transition-all group pointer-events-auto"
                >
                  <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={28} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenImage((prev) => (prev! + 1) % selectedProgram.gallery!.length);
                  }}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-lg border border-white/10 transition-all group pointer-events-auto"
                >
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={28} />
                </button>
              </div>
              
              <motion.div
                key={fullScreenImage}
                initial={{ scale: 0.9, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.9, opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center"
              >
                {selectedProgram.gallery[fullScreenImage] ? (
                  <img 
                    src={selectedProgram.gallery[fullScreenImage]} 
                    alt={`Full Screen View ${fullScreenImage}`} 
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="w-64 h-64 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600">
                    <ImageIcon size={64} />
                  </div>
                )}
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white font-bold text-sm tracking-widest uppercase">
                    Photo {fullScreenImage + 1} <span className="text-white/40">/</span> {selectedProgram.gallery.length}
                  </div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Use Arrow Keys to Navigate</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showMemberDashboard && user && !isAdmin && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary p-3 rounded-2xl text-white">
                  <Users size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-slate-900 italic">Member Dashboard</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500 text-sm">Welcome back, {userProfile?.name || user.displayName || 'Member'}</p>
                    {userProfile?.memberCode && (
                      <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-lg border border-brand-primary/20">
                        {userProfile.memberCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowMemberDashboard(false)}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-primary font-bold text-sm transition-all"
              >
                <ArrowLeft size={16} />
                Back to Website
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_2fr] gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4 group">
                    <img 
                      src={userProfile?.profilePicture || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border-4 border-brand-primary/10"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={24} className="text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setIsUploading('profile');
                              const url = await uploadImage(file);
                              setUserProfile((prev: any) => ({ ...prev, profilePicture: url }));
                            } catch (err: any) {
                              alert(err.message);
                            } finally {
                              setIsUploading(null);
                            }
                          }
                        }}
                      />
                    </label>
                    {isUploading === 'profile' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                        <Loader2 className="animate-spin text-brand-primary" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900">{userProfile?.name}</h3>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {userProfile?.memberCode && (
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-tighter bg-brand-primary/5 py-1 px-2 rounded-lg inline-block">
                        ID: {userProfile.memberCode}
                      </p>
                    )}
                    <p className={`text-[10px] font-black uppercase tracking-tighter py-1 px-2 rounded-lg inline-block ${executiveMembers.some(m => m.userId === user.uid) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {executiveMembers.some(m => m.userId === user.uid) ? 'Executive Member' : 'Association Member'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{userProfile?.role?.replace('_', ' ')}</p>
                  {userProfile?.phone && (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <Phone size={10} /> {userProfile.phone}
                    </div>
                  )}
                </div>

                <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10">
                  <div className="flex items-center gap-2 mb-4 text-brand-primary">
                    <ShieldCheck size={18} />
                    <span className="font-bold text-sm">Account Status</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Verified Member</span>
                    <span className={userProfile?.isVerified ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                      {userProfile?.isVerified ? "Yes" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-brand-primary/5">
                    <span className="text-slate-500">Member Level</span>
                    <span className="text-brand-primary font-bold">
                      {executiveMembers.some(m => m.userId === user.uid) 
                        ? "Executive Committee Member" 
                        : (userProfile?.membershipStatus === 'approved' ? "Association Member" : "Membership Pending")}
                    </span>
                  </div>
                </div>

                {/* Membership Status Tracker */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-brand-primary" />
                    Membership Journey
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Payment Submitted', status: ['pending_finance', 'pending_secretary', 'approved', 'declined_finance', 'declined_secretary'].includes(userProfile?.membershipStatus) },
                      { 
                        label: 'Finance Approval', 
                        status: ['pending_secretary', 'approved', 'declined_secretary'].includes(userProfile?.membershipStatus) ? 'success' : 
                                (userProfile?.membershipStatus === 'declined_finance' ? 'error' : 
                                (userProfile?.membershipStatus === 'pending_finance' ? 'pending' : 'waiting')) 
                      },
                      { 
                        label: 'Secretary Approval', 
                        status: userProfile?.membershipStatus === 'approved' ? 'success' : 
                                (userProfile?.membershipStatus === 'declined_secretary' ? 'error' : 
                                (userProfile?.membershipStatus === 'pending_secretary' ? 'pending' : 'waiting')) 
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-4 items-start relative">
                        {idx !== 2 && <div className="absolute left-[9px] top-6 w-[2px] h-8 bg-slate-100" />}
                        <div className={`w-5 h-5 rounded-full z-10 flex items-center justify-center ${
                          step.status === true || step.status === 'success' ? 'bg-green-500 text-white' : 
                          step.status === 'error' ? 'bg-red-500 text-white' :
                          step.status === 'pending' ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200'
                        }`}>
                          {step.status === true || step.status === 'success' ? <Check size={12} strokeWidth={4} /> : 
                           step.status === 'error' ? <X size={12} strokeWidth={4} /> : null}
                        </div>
                        <div className="flex-grow">
                          <p className={`text-xs font-bold leading-none ${step.status === 'waiting' ? 'text-slate-400' : 'text-slate-900'}`}>{step.label}</p>
                          {step.status === 'pending' && <p className="text-[10px] text-amber-600 mt-1">Pending Review</p>}
                          {step.status === 'error' && <p className="text-[10px] text-red-600 mt-1">Declined — Please contact office</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Membership Payment Section */}
                {(!userProfile?.membershipStatus || userProfile.membershipStatus === 'unpaid' || userProfile.membershipStatus.startsWith('declined')) && (
                  <div className="bg-brand-primary/5 rounded-3xl p-8 border-2 border-dashed border-brand-primary/20">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="bg-brand-primary p-3 rounded-2xl text-white">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 italic">Become an Association Member</h2>
                        <p className="text-slate-600 text-sm mt-1">{membershipSettings?.paymentInstructions || "Please follow the instructions below to complete your registration."}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-2xl border border-brand-primary/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">bKash Personal</p>
                        <p className="font-mono font-bold text-slate-900">{membershipSettings?.bkashNumber || '017XXXXXXXX'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-brand-primary/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nagad Personal</p>
                        <p className="font-mono font-bold text-slate-900">{membershipSettings?.nagadNumber || '017XXXXXXXX'}</p>
                      </div>
                      <div className="sm:col-span-2 bg-brand-primary text-white p-4 rounded-2xl flex justify-between items-center">
                        <span className="font-bold text-sm">Required Fee</span>
                        <span className="text-2xl font-display font-bold italic">{membershipSettings?.membershipAmount || 100} BDT</span>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                      <div className="grid sm:grid-cols-[120px_1fr] gap-4">
                        <select 
                          value={membershipPaymentForm.method}
                          onChange={(e) => setMembershipPaymentForm({ ...membershipPaymentForm, method: e.target.value })}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                        >
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                        </select>
                        <input 
                          type="text"
                          value={membershipPaymentForm.transactionId}
                          onChange={(e) => setMembershipPaymentForm({ ...membershipPaymentForm, transactionId: e.target.value })}
                          placeholder="Enter Transaction ID"
                          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
                      >
                        {userProfile?.membershipStatus?.startsWith('declined') ? 'Resubmit Payment Information' : 'Become a Member — Pay Now'}
                        {submittingPayment && <Loader2 className="animate-spin" />}
                      </button>
                    </form>
                  </div>
                )}

                {/* Executive Fees Section */}
                {executiveMembers.some(m => m.userId === user.uid) && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-primary/10 p-2.5 rounded-xl text-brand-primary">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Executive Fees</h2>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Committee Member Dues</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Priority Payment Rules Active
                      </div>
                    </div>

                    <div className="space-y-4">
                      {feeStructures.map(fee => {
                        if (fee.type === 'one-time') {
                          const submission = paymentSubmissions.find(s => 
                            s.userId === user.uid && 
                            s.feeId === fee.id &&
                            s.status === 'approved'
                          );
                          const pendingSubmission = paymentSubmissions.find(s => 
                            s.userId === user.uid && 
                            s.feeId === fee.id &&
                            s.status === 'pending'
                          );
                          const rejectedSubmission = paymentSubmissions.find(s => 
                            s.userId === user.uid && 
                            s.feeId === fee.id &&
                            s.status === 'rejected'
                          );

                          return (
                            <div key={fee.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                                <div>
                                  <h3 className="font-bold text-slate-900">{fee.name}</h3>
                                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-1">One-Time Payment</span>
                                </div>
                                <span className="text-brand-primary font-bold text-sm">{fee.amount} BDT</span>
                              </div>
                              <div className="p-4">
                                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                  submission ? 'bg-green-50 border-green-100' :
                                  pendingSubmission ? 'bg-amber-50 border-amber-100' :
                                  rejectedSubmission ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                                }`}>
                                  <div className="text-left">
                                    <div className="text-[10px] font-bold text-slate-500 leading-none mb-1">Status</div>
                                    <div className={`text-xs font-bold ${
                                      submission ? 'text-green-700' :
                                      pendingSubmission ? 'text-amber-700' :
                                      rejectedSubmission ? 'text-red-700' : 'text-slate-900'
                                    }`}>
                                      {submission ? 'Paid & Approved' :
                                       pendingSubmission ? 'Pending Approval' :
                                       rejectedSubmission ? 'Payment Rejected' : 'Due for Payment'}
                                    </div>
                                  </div>

                                  {(!submission && !pendingSubmission) && (
                                    <button 
                                      onClick={() => {
                                        setSelectedFeeForPayment(fee);
                                        setPaymentForm({
                                          transactionDetails: '',
                                          selectedTerms: [{ termIndex: 0, year: 0 }]
                                        });
                                        setShowPaymentModal(true);
                                      }}
                                      className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                      Pay Now
                                    </button>
                                  )}

                                  {submission && (
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                      <Check size={18} strokeWidth={4} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const startYear = new Date(fee.createdAt?.toDate?.() || fee.createdAt || Date.now()).getFullYear();
                        const currentYear = new Date().getFullYear();
                        const feeYears = [];
                        for (let y = startYear; y <= currentYear; y++) feeYears.push(y);

                        return (
                          <div key={fee.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                              <h3 className="font-bold text-slate-900">{fee.name}</h3>
                              <span className="text-brand-primary font-bold text-sm">{fee.amount} BDT / term</span>
                            </div>
                            <div className="p-4 space-y-2">
                              {feeYears.map(year => (
                                <div key={year} className="space-y-2">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{year} Cycle</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {fee.terms.map((term, termIdx) => {
                                      const submission = paymentSubmissions.find(s => 
                                        s.userId === user.uid && 
                                        s.feeId === fee.id && 
                                        s.year === year && 
                                        s.termIndex === termIdx
                                      );

                                      const isPast = year < currentYear || (year === currentYear && new Date().getMonth() + 1 > term.lastDate.month);
                                      const isOverdue = isPast && (!submission || submission.status !== 'approved');

                                      // Priority Check: Are there any unpaid terms before this one?
                                      const previousUnpaid = feeYears.some(y => 
                                        fee.terms.some((t, tIdx) => {
                                          if (y < year || (y === year && tIdx < termIdx)) {
                                            const s = paymentSubmissions.find(sub => 
                                              sub.userId === user.uid && 
                                              sub.feeId === fee.id && 
                                              sub.year === y && 
                                              sub.termIndex === tIdx
                                            );
                                            return !s || s.status !== 'approved';
                                          }
                                          return false;
                                        })
                                      );

                                      return (
                                        <div 
                                          key={termIdx} 
                                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                            submission?.status === 'approved' ? 'bg-green-50 border-green-100' :
                                            submission?.status === 'pending' ? 'bg-amber-50 border-amber-100' :
                                            isOverdue ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                                          }`}
                                        >
                                          <div className="text-left">
                                            <div className="text-[10px] font-bold text-slate-500 leading-none mb-1">{term.timeline}</div>
                                            <div className={`text-xs font-bold ${
                                              submission?.status === 'approved' ? 'text-green-700' :
                                              submission?.status === 'pending' ? 'text-amber-700' :
                                              isOverdue ? 'text-red-700' : 'text-slate-900'
                                            }`}>
                                              {submission?.status === 'approved' ? 'Paid & Approved' :
                                               submission?.status === 'pending' ? 'Pending Approval' :
                                               submission?.status === 'rejected' ? 'Payment Rejected' :
                                               isOverdue ? 'Overdue - Pay Now' : 'Due for Payment'}
                                            </div>
                                          </div>
                                          
                                          {(!submission || submission.status === 'rejected') && (
                                            <button 
                                              disabled={previousUnpaid}
                                              onClick={() => {
                                                setSelectedFeeForPayment(fee);
                                                setPaymentForm({
                                                  transactionDetails: '',
                                                  selectedTerms: [{ termIndex: termIdx, year }]
                                                });
                                                setShowPaymentModal(true);
                                              }}
                                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                previousUnpaid 
                                                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                                  : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95'
                                              }`}
                                              title={previousUnpaid ? "Please pay earlier dues first" : "Submit payment"}
                                            >
                                              {previousUnpaid ? 'Locked' : 'Pay'}
                                            </button>
                                          )}
                                          
                                          {submission?.status === 'approved' && (
                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                                              <Check size={14} strokeWidth={4} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {feeStructures.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <PieChart size={32} className="mx-auto text-slate-300 mb-3 opacity-20" />
                          <p className="text-xs text-slate-400 font-medium">No fee structures defined yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-brand-primary" />
                  Edit Profile Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text"
                        value={userProfile?.name || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session</label>
                      <input 
                        type="text"
                        value={userProfile?.session || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, session: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="e.g. 2020-21"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shift</label>
                      <select 
                        value={userProfile?.shift || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, shift: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      >
                        <option value="">Select Shift</option>
                        <option value="1st">1st Shift</option>
                        <option value="2nd">2nd Shift</option>
                        <option value="Days">Day</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Blood Group</label>
                      <select 
                        value={userProfile?.bloodGroup || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, bloodGroup: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      >
                        <option value="">Select Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number (Optional)</label>
                      <input 
                        type="tel"
                        value={userProfile?.phone || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="e.g. +88017..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Name</label>
                      <input 
                        type="text"
                        value={userProfile?.companyName || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, companyName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="Current workplace or company"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Designation</label>
                      <input 
                        type="text"
                        value={userProfile?.designation || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, designation: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="Current Designation"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Institution Name</label>
                      <input 
                        type="text"
                        value={userProfile?.institution || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, institution: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="Rangpur Polytechnic Institute (RPI)"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Update Profile Information
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {showAdminDashboard && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
            {/* Success Toast */}
            <AnimatePresence>
              {saveStatus && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]"
                >
                  <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 min-w-[320px]">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <Save size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">System Update</p>
                      <p className="font-bold text-sm">{saveStatus.message}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-6 bg-brand-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Control Center</span>
                </div>
                <h1 className="text-4xl font-display font-medium text-slate-900 italic font-bold">
                  {specializedRole === 'finance' ? 'Finance Dashboard' : 
                   specializedRole === 'secretary' ? 'Secretary Dashboard' : 
                   'Admin Dashboard'}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {specializedRole === 'finance' 
                    ? 'Track association income and expenditures.' 
                    : specializedRole === 'secretary'
                    ? 'Manage your specialized secretary profile.'
                    : 'Manage association content and specialized accounts.'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${specializedRole === 'finance' ? 'bg-brand-secondary text-white' : 'bg-slate-50 text-brand-primary'}`}>
                    {specializedRole === 'finance' ? <PieChart size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-none capitalize">{specializedRole || 'Super Admin'} Access</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">Identity Verified</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-1 space-y-2">
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => setAdminTab('members')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'members' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <Search size={18} />
                      <span className="font-bold text-sm">Member Analysis</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('general')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'general' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <Settings size={18} />
                      <span className="font-bold text-sm">General Settings</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('programs')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'programs' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <Calendar size={18} />
                      <span className="font-bold text-sm">Program Management</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('portal')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'portal' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <Monitor size={18} />
                      <span className="font-bold text-sm">Portal Settings</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('accounts')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'accounts' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <UserPlus size={18} />
                      <span className="font-bold text-sm">Specialized Accounts</span>
                    </button>
                  </>
                )}
                
                {specializedRole === 'finance' && (
                  <>
                    <button 
                      onClick={() => setAdminTab('finance')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'finance' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <PieChart size={18} />
                      <span className="font-bold text-sm">Finances</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('ledger')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'ledger' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <CreditCard size={18} />
                      <span className="font-bold text-sm">Member Ledger</span>
                    </button>
                  </>
                )}

                {specializedRole === 'secretary' && (
                  <button 
                    onClick={() => setAdminTab('profile')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'profile' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    <ShieldCheck size={18} />
                    <span className="font-bold text-sm">Secretary Profile</span>
                  </button>
                )}

                {(specializedRole === 'finance' || specializedRole === 'secretary') && (
                  <button 
                    onClick={() => setAdminTab('approvals')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${adminTab === 'approvals' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <Users size={18} />
                      <span className="font-bold text-sm">Approvals</span>
                    </div>
                    {(() => {
                      const queueCount = 
                        specializedRole === 'finance' ? (
                          allUsers.filter(u => u.membershipStatus === 'pending_finance').length + 
                          paymentSubmissions.filter(p => p.status === 'pending').length
                        ) :
                        specializedRole === 'secretary' ? allUsers.filter(u => u.membershipStatus === 'pending_secretary').length : 
                        0;
                      
                      return queueCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-sm animate-pulse">
                          {queueCount}
                        </span>
                      );
                    })()}
                  </button>
                )}

                {specializedRole === 'finance' && (
                  <button 
                    onClick={() => setAdminTab('fees')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'fees' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    <CreditCard size={18} />
                    <span className="font-bold text-sm">Fee Management</span>
                  </button>
                )}

                {isAdmin && (
                  <>
                    <button 
                      onClick={() => setAdminTab('notices')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'notices' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <FileText size={18} />
                      <span className="font-bold text-sm">Notice Management</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('membership-config')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'membership-config' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <CreditCard size={18} />
                      <span className="font-bold text-sm">Membership Setup</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('branding')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'branding' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <ImageIcon size={18} />
                      <span className="font-bold text-sm">Header & Footer (Logo)</span>
                    </button>
                    <button 
                      onClick={() => setAdminTab('executive')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${adminTab === 'executive' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <Users size={18} />
                      <span className="font-bold text-sm">Executive Committee</span>
                    </button>
                  </>
                )}
              </div>

              {/* Content Area */}
              <div className="lg:col-span-3">
                {adminTab === 'general' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-display font-bold text-xl text-slate-900">Update Core Messaging</h3>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">About Association</label>
                          <span className="text-[10px] text-slate-300 font-medium">Main Hero Description</span>
                        </div>
                        <textarea 
                          value={editAbout || associationConfig.about}
                          onChange={(e) => setEditAbout(e.target.value)}
                          className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-2xl outline-none transition-all text-sm leading-relaxed text-slate-600 font-medium"
                          placeholder="Association summary for homepage..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Our Mission</label>
                          <span className="text-[10px] text-slate-300 font-medium">Auto-saves locally</span>
                        </div>
                        <textarea 
                          value={editMission || associationConfig.mission}
                          onChange={(e) => setEditMission(e.target.value)}
                          className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-2xl outline-none transition-all text-sm leading-relaxed text-slate-600 font-medium"
                          placeholder="Define the association's mission..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Our Vision</label>
                          <span className="text-[10px] text-slate-300 font-medium">Maximum 2,000 characters</span>
                        </div>
                        <textarea 
                          value={editVision || associationConfig.vision}
                          onChange={(e) => setEditVision(e.target.value)}
                          className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-2xl outline-none transition-all text-sm leading-relaxed text-slate-600 font-medium"
                          placeholder="Define the association's vision..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Program Categories</label>
                          <span className="text-[10px] text-slate-300 font-medium">Manage dropdown options</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {editCategories.map((cat, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-full text-xs font-bold">
                                {cat}
                                <button 
                                  onClick={() => setEditCategories(editCategories.filter((_, i) => i !== idx))}
                                  className="hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newCategory.trim()) {
                                    setEditCategories([...editCategories, newCategory.trim()]);
                                    setNewCategory('');
                                  }
                                }
                              }}
                              placeholder="Add new category..."
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/30"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (newCategory.trim()) {
                                  setEditCategories([...editCategories, newCategory.trim()]);
                                  setNewCategory('');
                                }
                              }}
                              className="p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-colors"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Homepage Hero Slider</label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-300 font-medium">Recommended: 21:9 ratio (1920x820)</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          {editHeroImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-[21/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                              <img src={img} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setEditHeroImages(editHeroImages.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-4">
                          <input 
                            type="file"
                            id="hero-images-upload"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                              const files = Array.from(e.target.files || []) as File[];
                              if (files.length > 0) {
                                try {
                                  setIsUploading('hero');
                                  const uploadPromises = files.map((file: File) => uploadImage(file));
                                  const urls = await Promise.all(uploadPromises);
                                  setEditHeroImages([...editHeroImages, ...urls]);
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Hero upload failed');
                                } finally {
                                  setIsUploading(null);
                                }
                              }
                            }}
                          />
                          <label 
                            htmlFor="hero-images-upload"
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-brand-primary hover:text-brand-primary transition-all cursor-pointer shadow-sm group"
                          >
                            {isUploading === 'hero' ? (
                              <Loader2 size={20} className="animate-spin text-brand-primary" />
                            ) : (
                              <Upload size={20} className="group-hover:scale-110 transition-transform" />
                            )}
                            {isUploading === 'hero' ? 'Uploading Banner Photos...' : 'Upload Hero Banners (Multiple)'}
                          </label>
                        </div>
                      </div>

                      <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-50">
                        <button 
                          onClick={() => { 
                            setEditMission(associationConfig.mission); 
                            setEditVision(associationConfig.vision); 
                            setEditAbout(associationConfig.about); 
                            setEditCategories(associationConfig.categories);
                            setEditHeroImages(associationConfig.heroImages);
                          }}
                          className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
                        >
                          Reset Changes
                        </button>
                        <button 
                          onClick={handleSaveConfig}
                          className="flex items-center gap-3 bg-brand-primary text-white px-10 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <Save size={16} />
                          Update Website
                        </button>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'profile' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-12 text-center space-y-8">
                      <div className="w-32 h-32 bg-brand-primary/10 rounded-[3rem] flex items-center justify-center mx-auto text-brand-primary">
                        <ShieldCheck size={64} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-3xl text-slate-900">Office Secretary Portal</h3>
                        <p className="text-slate-500 mt-2">Welcome to your specialized association profile.</p>
                      </div>
                      
                      <div className="max-w-md mx-auto p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Role</span>
                          <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-widest">Office Secretary</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal Access</span>
                          <span className="text-sm font-bold text-slate-900">Active</span>
                        </div>
                      </div>

                      <div className="pt-8 text-center bg-slate-50/50 p-6 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Administrative Notice</p>
                        <p className="text-[10px] text-slate-300 font-medium italic mt-2">Specialized administrative functions for the Office Secretary role are being prepared and will be added in upcoming portal updates. Your account is verified and ready.</p>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'portal' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-display font-bold text-xl text-slate-900">Portal & ICT Secretary Settings</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                          <ImageIcon size={14} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Cloudinary Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Title</label>
                          <input 
                            type="text"
                            value={editPortal.title}
                            onChange={(e) => setEditPortal({...editPortal, title: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secretary Name</label>
                          <input 
                            type="text"
                            value={editPortal.secretaryName}
                            onChange={(e) => setEditPortal({...editPortal, secretaryName: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secretary Role</label>
                          <input 
                            type="text"
                            value={editPortal.secretaryRole}
                            onChange={(e) => setEditPortal({...editPortal, secretaryRole: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secretary Institution</label>
                          <input 
                            type="text"
                            value={editPortal.secretaryInstitution}
                            onChange={(e) => setEditPortal({...editPortal, secretaryInstitution: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Phone</label>
                          <input 
                            type="text"
                            value={editPortal.secretaryPhone}
                            onChange={(e) => setEditPortal({...editPortal, secretaryPhone: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Email</label>
                          <input 
                            type="text"
                            value={editPortal.secretaryEmail}
                            onChange={(e) => setEditPortal({...editPortal, secretaryEmail: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all text-sm font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secretary Image</label>
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                            {editPortal.secretaryImage ? (
                              <img src={editPortal.secretaryImage} alt="Secretary Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <ImageIcon className="text-slate-300" size={32} />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow space-y-2">
                            <input 
                              type="file"
                              id="portal-image-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setIsUploading('portal');
                                    const url = await uploadImage(file);
                                    setEditPortal({...editPortal, secretaryImage: url});
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : 'Upload failed');
                                  } finally {
                                    setIsUploading(null);
                                  }
                                }
                              }}
                            />
                            <label 
                              htmlFor="portal-image-upload"
                              className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all cursor-pointer shadow-sm group"
                            >
                              {isUploading === 'portal' ? (
                                <Loader2 size={16} className="animate-spin text-brand-primary" />
                              ) : (
                                <Upload size={16} className="group-hover:scale-110 transition-transform" />
                              )}
                              {isUploading === 'portal' ? 'Uploading...' : 'Direct Image Upload'}
                            </label>
                            <p className="text-[10px] text-slate-400">Upload a professional photo of the ICT Secretary.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal Description</label>
                        <textarea 
                          value={editPortal.description}
                          onChange={(e) => setEditPortal({...editPortal, description: e.target.value})}
                          className="w-full h-24 p-5 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-2xl outline-none transition-all text-sm leading-relaxed text-slate-600 font-medium"
                        />
                      </div>

                      <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-50">
                        <button 
                          onClick={() => setEditPortal(portalConfig)}
                          className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
                        >
                          Reset Changes
                        </button>
                        <button 
                          onClick={handleSavePortal}
                          className="flex items-center gap-3 bg-slate-900 text-white px-10 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all hover:bg-brand-primary"
                        >
                          <Save size={16} />
                          Save Portal Settings
                        </button>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'members' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h3 className="font-display font-bold text-xl text-slate-900">Member Analysis & Directory</h3>
                        <p className="text-slate-500 text-sm mt-1">Full database of registered and approved members.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            placeholder="Search name, ID, phone, etc..."
                            value={memberAnalysisSearch}
                            onChange={(e) => setMemberAnalysisSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Filter size={14} className="text-slate-400" />
                          <select
                            value={memberAnalysisPaymentFilter}
                            onChange={(e) => setMemberAnalysisPaymentFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
                          >
                            <option value="all">All Payments</option>
                            <option value="approved">Paid Only</option>
                            <option value="pending">Pending/Unpaid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Member</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Contact</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Professional Info</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Payments</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {allUsers
                            .filter(u => {
                              const searchLower = memberAnalysisSearch.toLowerCase();
                              const matchesSearch = !memberAnalysisSearch || 
                                u.name.toLowerCase().includes(searchLower) || 
                                u.phone?.includes(memberAnalysisSearch) ||
                                u.memberCode?.toLowerCase().includes(searchLower) ||
                                u.session?.toLowerCase().includes(searchLower) ||
                                u.email?.toLowerCase().includes(searchLower) ||
                                u.designation?.toLowerCase().includes(searchLower) ||
                                u.companyName?.toLowerCase().includes(searchLower) ||
                                u.workplace?.toLowerCase().includes(searchLower) ||
                                u.bloodGroup?.toLowerCase().includes(searchLower);

                              const matchesPayment = memberAnalysisPaymentFilter === 'all' || 
                                (memberAnalysisPaymentFilter === 'approved' ? u.membershipStatus === 'approved' : u.membershipStatus !== 'approved');

                              return matchesSearch && matchesPayment;
                            })
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                                      <img 
                                        src={u.profilePicture || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`} 
                                        alt={u.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-medium text-slate-400">{u.memberCode || 'No ID Assigned'}</span>
                                        {u.membershipStatus === 'approved' && (
                                          <span className="w-1 h-1 rounded-full bg-green-500" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-500">
                                      <Phone size={12} className="text-slate-300" />
                                      <span className="text-xs font-medium">{u.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                      <Mail size={12} className="text-slate-300" />
                                      <span className="text-xs font-medium truncate max-w-[150px]">{u.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-700">{u.designation || 'Engineer'}</p>
                                    <p className="text-[10px] text-slate-400 max-w-[200px] truncate">{u.companyName || u.workplace || 'Not Specified'}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${u.membershipStatus === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {(u.membershipStatus || 'unpaid').replace('_', ' ')}
                                    </span>
                                    {u.paymentHistory && u.paymentHistory.length > 0 ? (
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                                        {u.paymentHistory.length} TXNS
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase">
                                        NO PAYMENTS
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => setSelectedAnalysisUser(u)}
                                    className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                                  >
                                    <Eye size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {allUsers.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                        <Users size={48} className="text-slate-100 mb-4" />
                        <p className="text-sm font-medium">No members found in the database.</p>
                      </div>
                    )}
                  </div>
                ) : adminTab === 'branding' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-display font-bold text-slate-900">Logo Management</h3>
                        <p className="text-slate-500 text-sm">Update the association logo shown in Header and Footer.</p>
                      </div>
                      <button 
                        onClick={handleSaveBranding}
                        className="bg-brand-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2"
                      >
                        <Save size={16} />
                        Update Header & Footer
                      </button>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="max-w-xl">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <ImageIcon className="text-brand-primary" size={18} />
                          Main Association Logo
                        </h4>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                          <div className="w-40 h-40 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative">
                            {editLogoUrl ? (
                              <>
                                <img src={editLogoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                <button 
                                  onClick={() => setEditLogoUrl('')}
                                  className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Upload size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">No Logo</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logo Image URL</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={editLogoUrl}
                                  onChange={(e) => setEditLogoUrl(e.target.value)}
                                  className="flex-1 bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                  placeholder="https://..."
                                />
                                <label className="cursor-pointer bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary p-3 rounded-xl transition-all">
                                  <Upload size={18} />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          setIsUploading('logo');
                                          const url = await uploadImage(file);
                                          setEditLogoUrl(url);
                                        } catch (err: any) {
                                          alert(err.message);
                                        } finally {
                                          setIsUploading(null);
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <p className="text-[10px] text-slate-400">Recommended size: 200x200px or wide aspect ratio. PNG or SVG preferred.</p>
                            </div>

                            {isUploading === 'logo' && (
                              <div className="flex items-center gap-2 text-brand-primary">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Uploading logo...</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Header Preview</h5>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                            {editLogoUrl ? (
                              <img src={editLogoUrl} alt="Preview" className="h-8 w-auto object-contain" />
                            ) : (
                              <div className="bg-brand-primary p-1.5 rounded-lg">
                                <Cpu className="text-white w-4 h-4" />
                              </div>
                            )}
                            <span className="font-display font-bold text-lg text-brand-primary">
                              EDEA RANGPUR
                            </span>
                          </div>

                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-8 mb-4">Footer Social Icons Preview</h5>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3">
                            {editSocialLinks.facebook && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Facebook size={16} /></div>
                            )}
                            {editSocialLinks.twitter && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Twitter size={16} /></div>
                            )}
                            {editSocialLinks.linkedin && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Linkedin size={16} /></div>
                            )}
                            {editSocialLinks.instagram && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Instagram size={16} /></div>
                            )}
                            {editSocialLinks.whatsapp && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><MessageCircle size={16} /></div>
                            )}
                            {editSocialLinks.youtube && (
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Youtube size={16} /></div>
                            )}
                            {!Object.values(editSocialLinks).some(link => link) && (
                              <p className="text-[10px] text-slate-400 font-medium italic">No social links configured. Add URLs above to see icons here.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="max-w-3xl">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Info className="text-brand-primary" size={18} />
                          Footer Information
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Footer Description</label>
                              <textarea 
                                value={editFooterDescription}
                                onChange={(e) => setEditFooterDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="A brief description for the footer..."
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Office Address</label>
                              <input 
                                type="text"
                                value={editOfficeAddress}
                                onChange={(e) => setEditOfficeAddress(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="Full address..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Email</label>
                                <input 
                                  type="email"
                                  value={editContactEmail}
                                  onChange={(e) => setEditContactEmail(e.target.value)}
                                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                  placeholder="info@edea..."
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Phone</label>
                                <input 
                                  type="text"
                                  value={editContactPhone}
                                  onChange={(e) => setEditContactPhone(e.target.value)}
                                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                  placeholder="+880..."
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Privacy Policy</label>
                              <textarea 
                                value={editPrivacyPolicy}
                                onChange={(e) => setEditPrivacyPolicy(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="Privacy policy details..."
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Terms of Service</label>
                              <textarea 
                                value={editTermsOfService}
                                onChange={(e) => setEditTermsOfService(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="Terms of service details..."
                              />
                            </div>
                          </div>

                          <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Media Links</h5>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">Facebook URL</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <Facebook size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.facebook}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, facebook: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://facebook.com/..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">LinkedIn URL</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                                    <Linkedin size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.linkedin}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, linkedin: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://linkedin.com/..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">Twitter URL</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-lg">
                                    <Twitter size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.twitter}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, twitter: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://twitter.com/..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">Instagram URL</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-pink-50 text-pink-600 rounded-lg">
                                    <Instagram size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.instagram}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, instagram: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://instagram.com/..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">WhatsApp Group Link</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-green-50 text-green-600 rounded-lg">
                                    <MessageCircle size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.whatsapp}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, whatsapp: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://chat.whatsapp.com/..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400">YouTube URL</label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-red-50 text-red-600 rounded-lg">
                                    <Youtube size={14} />
                                  </div>
                                  <input 
                                    type="text"
                                    value={editSocialLinks.youtube}
                                    onChange={(e) => setEditSocialLinks({...editSocialLinks, youtube: e.target.value})}
                                    className="w-full pl-12 bg-slate-50 border-slate-200 rounded-xl py-3 text-sm focus:ring-brand-primary"
                                    placeholder="https://youtube.com/..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'executive' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-display font-bold text-xl text-slate-900">Executive Committee Setup</h3>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Committee Group Cover Photo</label>
                        <div className="flex flex-col gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-100 group">
                            {editPortal.ecCoverPhoto ? (
                              <img src={editPortal.ecCoverPhoto} alt="EC Cover Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon size={48} />
                              </div>
                            )}
                            {isUploading === 'ec-cover' && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                  <Loader2 size={32} className="animate-spin text-white" />
                                  <span className="text-white text-xs font-bold uppercase tracking-widest">Processing...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <input 
                              type="file"
                              id="ec-cover-admin-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setIsUploading('ec-cover');
                                    const url = await uploadImage(file);
                                    setEditPortal({...editPortal, ecCoverPhoto: url});
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : 'Upload failed');
                                  } finally {
                                    setIsUploading(null);
                                  }
                                }
                              }}
                            />
                            <label 
                              htmlFor="ec-cover-admin-upload"
                              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all cursor-pointer shadow-sm group active:scale-95"
                            >
                              <Upload size={16} className="group-hover:scale-110 transition-transform" />
                              Change Committee Cover Photo
                            </label>
                            <p className="text-[10px] text-slate-400 text-center font-medium italic">This photo appears on the Homepage "Leadership" section and the main Committee page.</p>
                          </div>
                        </div>
                      </div>

                      {/* Member Management Section */}
                      <div className="pt-12 border-t border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Committee Member Management</h4>
                          <button 
                            onClick={() => setIsAddingECMember(!isAddingECMember)}
                            className="flex items-center gap-2 text-brand-primary font-bold text-xs hover:underline"
                          >
                            {isAddingECMember ? 'Cancel' : '+ Add Committee Member'}
                          </button>
                        </div>

                        {isAddingECMember && (
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member Designation *</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. President, General Secretary"
                                  value={ecMemberForm.role}
                                  onChange={(e) => setEcMemberForm({...ecMemberForm, role: e.target.value})}
                                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none text-left"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search & Select Member *</label>
                                <div className="space-y-3">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                      type="text"
                                      placeholder="Search by name or session..."
                                      value={ecMemberSearch}
                                      onChange={(e) => setEcMemberSearch(e.target.value)}
                                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                  </div>
                                  
                                  <div className="max-h-[200px] overflow-y-auto bg-white border border-slate-100 rounded-xl divide-y divide-slate-50 shadow-inner">
                                    {allUsers
                                      .filter(u => u.membershipStatus === 'approved')
                                      .filter(u => 
                                        !ecMemberSearch || 
                                        u.name.toLowerCase().includes(ecMemberSearch.toLowerCase()) || 
                                        (u.session && u.session.toLowerCase().includes(ecMemberSearch.toLowerCase()))
                                      )
                                      .slice(0, 50) // Performance limit
                                      .map(u => (
                                        <button
                                          key={u.id}
                                          onClick={() => {
                                            setEcMemberForm({...ecMemberForm, userId: u.id});
                                            setEcMemberSearch(u.name);
                                          }}
                                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group ${ecMemberForm.userId === u.id ? 'bg-brand-primary/5' : ''}`}
                                        >
                                          <div>
                                            <div className="font-bold text-sm text-slate-900">{u.name}</div>
                                            <div className="text-[10px] text-slate-400">Session: {u.session || 'N/A'} • {u.companyName || u.institution || 'N/A'}</div>
                                          </div>
                                          {ecMemberForm.userId === u.id && (
                                            <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                          )}
                                        </button>
                                      ))}
                                    {allUsers.filter(u => u.membershipStatus === 'approved').length === 0 && (
                                      <div className="p-4 text-center text-[10px] text-slate-400">No approved members found.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button 
                                onClick={handleAddECMember}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                              >
                                Add to Committee
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-3">
                          {executiveMembers.map((member) => (
                            <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-brand-primary/30 transition-all">
                              <div className="flex items-center gap-4">
                                <img src={member.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-50" />
                                <div className="text-left">
                                  <div className="text-[8px] font-black text-brand-primary uppercase tracking-tighter mb-0.5">{member.role}</div>
                                  <div className="text-sm font-bold text-slate-900 leading-tight">{member.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{member.institution}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveECMember(member.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          {executiveMembers.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                              <Users className="mx-auto text-slate-300 mb-3 opacity-20" size={48} />
                              <p className="text-sm text-slate-400 font-medium">No committee members added yet.</p>
                              <p className="text-[10px] text-slate-300">Existing demo data is being shown on homepage.</p>
                            </div>
                          )}
                        </div>

                        {/* Active Member Status Display Section */}
                        <div className="pt-12 border-t border-slate-100 mb-8">
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                  <h4 className="text-sm font-bold text-slate-900">Active Member Status Display</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium ml-3.5">Configure how the member counter appears to visitors.</p>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                <button 
                                  onClick={() => setEditMemberCountMode('realtime')}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMemberCountMode === 'realtime' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                  Real-time
                                </button>
                                <button 
                                  onClick={() => setEditMemberCountMode('manual')}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMemberCountMode === 'manual' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                  Manual
                                </button>
                              </div>

                              {editMemberCountMode === 'manual' && (
                                <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-slate-200 min-w-[200px]">
                                  <Users size={14} className="text-slate-400" />
                                  <input 
                                    type="number"
                                    value={editManualMemberCount}
                                    onChange={(e) => setEditManualMemberCount(parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900"
                                    placeholder="Enter Number..."
                                  />
                                </div>
                              )}
                              
                              {editMemberCountMode === 'realtime' && (
                                <div className="bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/10 flex items-center gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none">
                                    Current: {allUsers.filter(u => u.membershipStatus === 'approved').length} Members
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-50">
                        <button 
                          onClick={() => setEditPortal(portalConfig)}
                          className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSavePortal}
                          className="flex items-center gap-3 bg-brand-primary text-white px-10 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <Save size={16} />
                          Save Committee Settings
                        </button>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'notices' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {isAddingNotice ? (
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                          <button 
                            onClick={() => { setIsAddingNotice(false); setEditingNotice(null); }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div>
                            <h3 className="font-display font-bold text-xl text-slate-900">{editingNotice ? 'Edit Notice' : 'Publish New Notice'}</h3>
                            <p className="text-xs text-slate-500">All fields marked with * are required</p>
                          </div>
                        </div>

                        <form onSubmit={handleSaveNotice} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Title *</label>
                              <input 
                                required
                                type="text"
                                value={noticeForm.title}
                                onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-bold"
                                placeholder="e.g., Annual General Meeting 2024"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Category *</label>
                              <select 
                                required
                                value={noticeForm.category}
                                onChange={(e) => setNoticeForm({...noticeForm, category: e.target.value as any})}
                                className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-medium"
                              >
                                <option value="General">General Notice</option>
                                <option value="Event">Event Announcement</option>
                                <option value="Committee">Committee Notice</option>
                                <option value="Financial">Financial Statement</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Date *</label>
                              <input 
                                required
                                type="date"
                                value={noticeForm.date}
                                onChange={(e) => setNoticeForm({...noticeForm, date: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facebook Post Link</label>
                              <input 
                                type="url"
                                value={noticeForm.fbLink}
                                onChange={(e) => setNoticeForm({...noticeForm, fbLink: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-medium"
                                placeholder="https://facebook.com/..."
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Description *</label>
                            <textarea 
                              required
                              value={noticeForm.description}
                              onChange={(e) => setNoticeForm({...noticeForm, description: e.target.value})}
                              className="w-full h-32 p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                              placeholder="Brief summary of the notice..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Picture / Attachment</label>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-white">
                                {noticeForm.image ? (
                                  <img src={noticeForm.image} alt="Notice Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="text-slate-200" size={32} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow space-y-2">
                                <input 
                                  type="file"
                                  id="notice-image-upload"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        setIsUploading('notice');
                                        const url = await uploadImage(file);
                                        setNoticeForm({...noticeForm, image: url});
                                      } catch (err) {
                                        alert(err instanceof Error ? err.message : 'Upload failed');
                                      } finally {
                                        setIsUploading(null);
                                      }
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor="notice-image-upload"
                                  className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all cursor-pointer shadow-sm group"
                                >
                                  {isUploading === 'notice' ? (
                                    <Loader2 size={16} className="animate-spin text-brand-primary" />
                                  ) : (
                                    <Upload size={16} className="group-hover:scale-110 transition-transform" />
                                  )}
                                  {isUploading === 'notice' ? 'Uploading...' : 'Upload Notice Picture'}
                                </label>
                                <p className="text-[10px] text-slate-400 font-medium">Recommended: High quality JPG/PNG. This will be the main visual for the notice.</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
                            <button 
                              type="button"
                              onClick={() => { setIsAddingNotice(false); setEditingNotice(null); }}
                              className="px-8 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              className="flex items-center gap-3 bg-brand-primary text-white px-12 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              <Save size={16} />
                              {editingNotice ? 'Update Notice' : 'Publish Notice'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-medium text-2xl text-slate-900 italic font-bold">Manage Notice Board</h3>
                            <p className="text-xs text-slate-500">Create and edit official association notices</p>
                          </div>
                          <button 
                            onClick={() => setIsAddingNotice(true)}
                            className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                          >
                            <Plus size={16} />
                            Create Notice
                          </button>
                        </div>

                        {notices.length === 0 ? (
                          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                              <FileText size={40} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Notice Board is empty</h4>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Publish your first official notice to inform members about updates and events.</p>
                            <button 
                              onClick={() => setIsAddingNotice(true)}
                              className="bg-brand-primary text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
                            >
                              Create First Notice
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {notices.map(n => (
                              <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                    {n.image ? (
                                      <img src={n.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <FileText className="text-slate-300" size={20} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                        n.category === 'Financial' ? 'text-red-500 bg-red-50' :
                                        n.category === 'Event' ? 'text-green-500 bg-green-50' :
                                        n.category === 'Committee' ? 'text-blue-500 bg-blue-50' :
                                        'text-slate-500 bg-slate-100'
                                      }`}>
                                        {n.category}
                                      </span>
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{n.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors text-sm">{n.title}</h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => openEditNotice(n)}
                                    className="p-3 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
                                  >
                                    <Settings size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteNotice(n.id)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : adminTab === 'accounts' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-xl text-slate-900">Specialized Account Management</h3>
                        <p className="text-xs text-slate-500 mt-1">Create accounts for specific administrative roles.</p>
                      </div>
                      <button 
                        onClick={() => setShowAccountForm(!showAccountForm)}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        {showAccountForm ? <Minus size={16} /> : <Plus size={16} />}
                        {showAccountForm ? 'Close Form' : 'Create New Account'}
                      </button>
                    </div>

                    <div className="p-8 space-y-8">
                      {showAccountForm && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                              <input 
                                type="text"
                                value={accountForm.name}
                                onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                placeholder="Enter account name..."
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                              <input 
                                type="email"
                                value={accountForm.email}
                                onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                placeholder="name@example.com"
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Role</label>
                              <select 
                                value={accountForm.role}
                                onChange={(e) => setAccountForm({...accountForm, role: e.target.value as any})}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                              >
                                <option value="finance">Finance / Accountant</option>
                                <option value="admin">System Admin</option>
                                <option value="secretary">Office Secretary</option>
                              </select>
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Password</label>
                              <input 
                                type="password"
                                value={accountForm.password}
                                onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                placeholder="Set access password..."
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-4">
                            <button 
                              onClick={async () => {
                                if (!accountForm.name || !accountForm.email || !accountForm.password) return alert('Name, Email, and Password are required');
                                try {
                                  // Use email as ID for security rules efficiency
                                  await setDoc(doc(db, 'specializedAccounts', accountForm.email.toLowerCase()), {
                                    ...accountForm,
                                    email: accountForm.email.toLowerCase(),
                                    createdAt: serverTimestamp()
                                  });
                                  setAccountForm({ name: '', email: '', password: '', role: 'finance' });
                                  setShowAccountForm(false);
                                  setSaveStatus({ id: 'account', type: 'success', message: 'Account profile created successfully' });
                                  setTimeout(() => setSaveStatus(null), 3000);
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.CREATE, 'specializedAccounts');
                                }
                              }}
                              className="bg-slate-900 text-white px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg"
                            >
                              Create Account Profile
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Specialized Profiles</label>
                        <div className="grid gap-3">
                          {specializedAccounts.map(account => (
                            <div key={account.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                                  <ShieldCheck size={20} />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{account.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{account.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  account.role === 'admin' ? 'bg-purple-50 text-purple-600' : 
                                  account.role === 'secretary' ? 'bg-brand-primary/10 text-brand-primary' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {account.role}
                                </span>
                                <button 
                                  onClick={async () => {
                                    if(confirm('Are you sure you want to delete this profile?')) {
                                      await deleteDoc(doc(db, 'specializedAccounts', account.id));
                                    }
                                  }}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'finance' ? (
                  <div className="space-y-6">
                    {/* General Ledger only in Finances tab */}
                    <div className="space-y-6">
                      {/* General Ledger */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                              <h3 className="font-display font-bold text-xl text-slate-900">Finance Ledger</h3>
                              <p className="text-xs text-slate-500 mt-1">Track income and expenditures</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</div>
                                <div className="text-xl font-display font-bold text-slate-900">
                                  ৳ {consolidatedFinanceLedger.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}
                                </div>
                              </div>
                              <button 
                                onClick={() => setShowFinanceForm(!showFinanceForm)}
                                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-brand-primary transition-all"
                              >
                                {showFinanceForm ? <Minus size={20} /> : <Plus size={20} />}
                              </button>
                            </div>
                          </div>

                          <div className="p-8 space-y-8">
                            {showFinanceForm && (
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                                {/* Finance Entry Form Fields ... */}
                                <div className="grid md:grid-cols-3 gap-6">
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entry Type</label>
                                    <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-200">
                                      <button 
                                        onClick={() => setFinanceForm({...financeForm, type: 'income'})}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${financeForm.type === 'income' ? 'bg-green-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                      >
                                        Income
                                      </button>
                                      <button 
                                        onClick={() => setFinanceForm({...financeForm, type: 'expense'})}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${financeForm.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                      >
                                        Expense
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (৳)</label>
                                    <input 
                                      type="number"
                                      value={financeForm.amount || ''}
                                      onChange={(e) => setFinanceForm({...financeForm, amount: parseFloat(e.target.value) || 0})}
                                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
                                    <input 
                                      type="date"
                                      value={financeForm.date}
                                      onChange={(e) => setFinanceForm({...financeForm, date: e.target.value})}
                                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                    />
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                    <input 
                                      type="text"
                                      value={financeForm.description}
                                      onChange={(e) => setFinanceForm({...financeForm, description: e.target.value})}
                                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                      placeholder="e.g., General Donation"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                                    <select 
                                      value={financeForm.category}
                                      onChange={(e) => setFinanceForm({...financeForm, category: e.target.value})}
                                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                    >
                                      <option value="">Select Category</option>
                                      <option value="Membership">Membership</option>
                                      <option value="Donation">Donation</option>
                                      <option value="Event">Event</option>
                                      <option value="Office">Office</option>
                                    </select>
                                  </div>
                                </div>
                                <button 
                                  onClick={async () => {
                                    if (!financeForm.amount || !financeForm.description) return alert('Required fields missing');
                                    try {
                                      await addDoc(collection(db, 'finances'), {
                                        ...financeForm,
                                        recordedBy: user?.displayName || 'Admin',
                                        createdAt: serverTimestamp()
                                      });
                                      setFinanceForm({ type: 'income', amount: 0, description: '', category: '', date: new Date().toISOString().split('T')[0] });
                                      setShowFinanceForm(false);
                                    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'finances'); }
                                  }}
                                  className="w-full bg-brand-primary text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                  Record Entry
                                </button>
                              </div>
                            )}

                            {/* Recent Ledger Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                  <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date/Desc</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {consolidatedFinanceLedger.map(entry => (
                                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{entry.description}</div>
                                        <div className="text-[10px] text-slate-400">{entry.date}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{entry.category || 'General'}</span>
                                      </td>
                                      <td className={`px-6 py-4 text-sm font-black text-right ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.type === 'income' ? '+' : '-'} ৳{entry.amount.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {!entry.isAuto ? (
                                          <button 
                                            onClick={async () => { if(confirm('Delete?')) await deleteDoc(doc(db, 'finances', entry.id)); }}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        ) : (
                                          <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Auto</div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'ledger' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <h3 className="font-display font-bold text-2xl text-slate-900">Member Financial Ledger</h3>
                          <p className="text-slate-500 text-sm mt-1">Financial transparency & membership payment tracking</p>
                        </div>
                        <button 
                          onClick={downloadFinancialReport}
                          className="bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Download size={14} /> Download CSV Report
                        </button>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            {selectedFeeFilter === 'all' ? 'Total Collection' : 'Fee Collection'}
                          </p>
                          <div className="text-3xl font-black text-brand-primary font-display italic">
                            ৳{memberFinancialReports.reduce((sum, m) => sum + m.totalPaid, 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-red-500/10 transition-colors" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            {selectedFeeFilter === 'all' ? 'Total Dues' : 'Fee Dues'}
                          </p>
                          <div className="text-3xl font-black text-red-500 font-display italic">
                            ৳{(memberFinancialReports.reduce((sum, m) => sum + m.totalDue, 0) + memberFinancialReports.reduce((sum, m) => sum + m.totalPending, 0)).toLocaleString()}
                          </div>
                          {memberFinancialReports.reduce((sum, m) => sum + m.totalPending, 0) > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                              <Clock size={10} />
                              ৳{memberFinancialReports.reduce((sum, m) => sum + m.totalPending, 0).toLocaleString()} Pending Review
                            </div>
                          )}
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Relevant Members</p>
                          <div className="text-3xl font-black text-slate-900 font-display italic">
                            {memberFinancialReports.length}
                          </div>
                        </div>
                      </div>

                      {/* Search & Filters */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              type="text"
                              value={financialTransparencySearch}
                              onChange={(e) => setFinancialTransparencySearch(e.target.value)}
                              placeholder="Search member name or ID..."
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-medium"
                            />
                          </div>

                          {/* Fee Type Filter */}
                          <div className="shrink-0">
                            <select
                              value={selectedFeeFilter}
                              onChange={(e) => setSelectedFeeFilter(e.target.value)}
                              className="w-full lg:w-48 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm font-bold text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                            >
                              <option value="all">All Fee Structures</option>
                              <option value="reg-fee">Registration Fee</option>
                              {feeStructures.map(fee => (
                                <option key={fee.id} value={fee.id}>{fee.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                            {[
                              { id: 'all', label: 'All', icon: Users },
                              { id: 'due', label: 'Dues', icon: Clock },
                              { id: 'paid', label: 'Paid', icon: Check }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setFinancialTransparencyFilter(tab.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  financialTransparencyFilter === tab.id 
                                    ? 'bg-white text-brand-primary shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                <tab.icon size={10} />
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Ledger Table */}
                      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Information</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Paid (BDT)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Outstanding Due</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Payment Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {memberFinancialReports.map(m => (
                                <motion.tr 
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  key={m.id} 
                                  className="hover:bg-slate-50/50 transition-colors group"
                                >
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm shrink-0">
                                        <img 
                                          src={m.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`} 
                                          alt="" 
                                          className="w-full h-full object-cover" 
                                        />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-sm tracking-tight">{m.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] font-black text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {m.memberCode || 'New Member'}
                                          </span>
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight ${executiveMembers.some(ecm => ecm.userId === m.id) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {executiveMembers.some(ecm => ecm.userId === m.id) ? 'Executive' : 'Association'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="text-sm font-black text-slate-900 font-display">৳{m.totalPaid.toLocaleString()}</span>
                                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${['approved', 'pending_secretary'].includes(m.membershipStatus) ? 'text-slate-400' : 'text-amber-500'}`}>
                                        {['approved', 'pending_secretary'].includes(m.membershipStatus) ? 'Verified' : 'Pending Review'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <div className="inline-flex flex-col items-center gap-2">
                                      {m.totalPending > 0 && (
                                        <div className="flex flex-col items-center">
                                          <span className="text-sm font-black font-display text-amber-500">
                                            ৳{m.totalPending.toLocaleString()}
                                          </span>
                                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter">Pending</span>
                                        </div>
                                      )}
                                      {m.totalDue > 0 && (
                                        <div className="flex flex-col items-center">
                                          <span className="text-sm font-black font-display text-red-500">
                                            ৳{m.totalDue.toLocaleString()}
                                          </span>
                                          <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Due</span>
                                        </div>
                                      )}
                                      {m.totalPending === 0 && m.totalDue === 0 && (
                                        <span className="text-sm font-black font-display text-slate-300">৳0</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 shadow-sm ${
                                      (m.totalDue === 0 && m.totalPending === 0)
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : m.totalPending > 0 
                                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                                          : 'bg-red-50 text-red-500 border-red-100'
                                    }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${
                                        (m.totalDue === 0 && m.totalPending === 0) 
                                          ? 'bg-emerald-500' 
                                          : m.totalPending > 0 
                                            ? 'bg-amber-500 animate-pulse' 
                                            : 'bg-red-500 animate-pulse'
                                      }`} />
                                      {(m.totalDue === 0 && m.totalPending === 0) ? 'Settled' : m.totalPending > 0 ? 'Pending Review' : 'Action Required'}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                              {memberFinancialReports.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-16 text-center">
                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No matching results</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  ) : adminTab === 'fees' ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="font-display font-bold text-xl text-slate-900">Fee Structures</h3>
                          <p className="text-xs text-slate-500 mt-1">Manage recurring fees for executive members.</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingFee(!isAddingFee)}
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center gap-2 shadow-lg"
                        >
                          {isAddingFee ? <Minus size={16} /> : <Plus size={16} />}
                          {isAddingFee ? 'Cancel' : 'Define New Fee'}
                        </button>
                      </div>

                      {isAddingFee && (
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                          <form onSubmit={handleSaveFee} className="space-y-8">
                            <div className="grid md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Name</label>
                                <input 
                                  required
                                  type="text"
                                  value={feeForm.name}
                                  onChange={(e) => setFeeForm({...feeForm, name: e.target.value})}
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                  placeholder="e.g. Executive Support Fund"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (৳)</label>
                                <input 
                                  required
                                  type="number"
                                  value={feeForm.amount || ''}
                                  onChange={(e) => setFeeForm({...feeForm, amount: parseFloat(e.target.value) || 0})}
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                  placeholder="Amount"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Type</label>
                                <select 
                                  value={feeForm.type}
                                  onChange={(e) => {
                                    const type = e.target.value as 'yearly' | 'one-time';
                                    if (type === 'one-time') {
                                      setFeeForm({
                                        ...feeForm, 
                                        type, 
                                        frequency: 1, 
                                        terms: [{ timeline: 'One Time Payment', lastDate: { day: 31, month: 12 } }]
                                      });
                                    } else {
                                      setFeeForm({...feeForm, type});
                                    }
                                  }}
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                >
                                  <option value="yearly">Yearly / Monthly (Recurring)</option>
                                  <option value="one-time">One Time Payment</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Member Type</label>
                                <select 
                                  value={feeForm.targetMemberType}
                                  onChange={(e) => setFeeForm({...feeForm, targetMemberType: e.target.value as any})}
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 transition-all font-sans"
                                >
                                  <option value="all">All Members</option>
                                  <option value="association">Association Members Only</option>
                                  <option value="executive">Executive Committee Only</option>
                                </select>
                              </div>
                              {feeForm.type === 'yearly' && (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annual Frequency</label>
                                  <select 
                                    value={feeForm.frequency}
                                    onChange={(e) => {
                                      const freq = parseInt(e.target.value);
                                      const newTerms = Array.from({ length: freq }, (_, i) => ({
                                        timeline: feeForm.terms[i]?.timeline || '',
                                        lastDate: feeForm.terms[i]?.lastDate || { day: 31, month: 12 }
                                      }));
                                      setFeeForm({...feeForm, frequency: freq, terms: newTerms});
                                    }}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                  >
                                    {[1, 2, 3, 4, 6, 12].map(f => (
                                      <option key={f} value={f}>{f} times / year</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">Dynamic Term Deadlines</h4>
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {feeForm.terms.map((term, idx) => (
                                  <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
                                    <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Term {idx + 1}</h5>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</label>
                                        <input 
                                          required
                                          type="text"
                                          value={term.timeline}
                                          onChange={(e) => {
                                            const newTerms = [...feeForm.terms];
                                            newTerms[idx].timeline = e.target.value;
                                            setFeeForm({...feeForm, terms: newTerms});
                                          }}
                                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-bold"
                                          placeholder="e.g. Jan - Mar"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Day</label>
                                          <input 
                                            required
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={term.lastDate.day}
                                            onChange={(e) => {
                                              const newTerms = [...feeForm.terms];
                                              newTerms[idx].lastDate.day = parseInt(e.target.value);
                                              setFeeForm({...feeForm, terms: newTerms});
                                            }}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-bold text-center"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Month</label>
                                          <select 
                                            value={term.lastDate.month}
                                            onChange={(e) => {
                                              const newTerms = [...feeForm.terms];
                                              newTerms[idx].lastDate.month = parseInt(e.target.value);
                                              setFeeForm({...feeForm, terms: newTerms});
                                            }}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-bold"
                                          >
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                              <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end gap-4">
                              <button 
                                type="submit"
                                className="px-8 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 transition-all outline-none"
                              >
                                Create Fee Structure
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      <div className="grid gap-6">
                        {feeStructures.map(fee => (
                          <div key={fee.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{fee.name}</h4>
                                {fee.targetMemberType && (
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                                    fee.targetMemberType === 'executive' ? 'bg-amber-100 text-amber-700' : 
                                    fee.targetMemberType === 'association' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-slate-200 text-slate-600'
                                  }`}>
                                    {fee.targetMemberType === 'executive' ? 'Executive Only' : 
                                     fee.targetMemberType === 'association' ? 'Association Only' : 
                                     'All Members'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-6 mt-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <CreditCard size={12} /> ৳{fee.amount} / term
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <Clock size={12} /> {fee.frequency} times / year
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleFeeStatus(fee)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all shadow-sm ${
                                  fee.isActive === false
                                    ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600'
                                    : 'bg-white border-slate-100 text-slate-300 hover:text-amber-500 hover:border-amber-100'
                                }`}
                                title={fee.isActive === false ? "Resume Fee" : "Pause Fee"}
                              >
                                {fee.isActive === false ? <Play size={18} /> : <Pause size={18} />}
                              </button>
                              <button 
                                onClick={() => handleDeleteFee(fee.id)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'programs' ? (
                  <div className="space-y-6">
                    {isAddingProgram ? (
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                          <h3 className="font-display font-bold text-xl text-slate-900">
                            {editingProgram ? 'Edit Program' : 'Create New Program'}
                          </h3>
                          <button onClick={() => { setIsAddingProgram(false); setEditingProgram(null); }} className="text-slate-400 hover:text-slate-900">
                            <X size={24} />
                          </button>
                        </div>
                        
                        <form onSubmit={handleSaveProgram} className="p-8 space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Program Title</label>
                              <input 
                                required
                                value={programForm.title}
                                onChange={(e) => setProgramForm({...programForm, title: e.target.value})}
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                                placeholder="e.g. Advanced Medical Workshop"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                              <select 
                                required
                                value={programForm.category}
                                onChange={(e) => setProgramForm({...programForm, category: e.target.value})}
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                              >
                                <option value="">Select Category</option>
                                {associationConfig.categories.map((cat, idx) => (
                                  <option key={idx} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
                              <input 
                                required
                                value={programForm.date}
                                onChange={(e) => setProgramForm({...programForm, date: e.target.value})}
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                                placeholder="e.g. May 15, 2024"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</label>
                              <input 
                                required
                                value={programForm.location}
                                onChange={(e) => setProgramForm({...programForm, location: e.target.value})}
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                                placeholder="e.g. RMCH Conference Hall"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                              <select 
                                value={programForm.status}
                                onChange={(e) => setProgramForm({...programForm, status: e.target.value as 'upcoming' | 'completed'})}
                                className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                              >
                                <option value="upcoming">Upcoming</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Program Cover Image</label>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              {programForm.image ? (
                                <div className="w-32 h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                                  <img src={programForm.image} alt="Program Preview" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-32 h-20 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center shrink-0">
                                  <ImageIcon className="text-slate-300" size={24} />
                                </div>
                              )}
                              <div className="flex-grow space-y-2">
                                <input 
                                  type="file"
                                  id="program-cover-upload"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        setIsUploading('main');
                                        const url = await uploadImage(file);
                                        setProgramForm({...programForm, image: url});
                                      } catch (err) {
                                        alert(err instanceof Error ? err.message : 'Upload failed');
                                      } finally {
                                        setIsUploading(null);
                                      }
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor="program-cover-upload"
                                  className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all cursor-pointer shadow-sm group"
                                >
                                  {isUploading === 'main' ? (
                                    <Loader2 size={16} className="animate-spin text-brand-primary" />
                                  ) : (
                                    <Upload size={16} className="group-hover:scale-110 transition-transform" />
                                  )}
                                  {isUploading === 'main' ? 'Uploading...' : 'Direct Image Upload'}
                                </label>
                                <p className="text-[10px] text-slate-400">Choose a high-quality cover photo for the program card.</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Short Description (for cards)</label>
                              <span className={`text-[10px] font-bold ${programForm.description.length > 150 ? 'text-red-500' : 'text-slate-300'}`}>
                                {programForm.description.length}/150
                              </span>
                            </div>
                            <textarea 
                              required
                              value={programForm.description}
                              onChange={(e) => setProgramForm({...programForm, description: e.target.value.slice(0, 200)})}
                              className="w-full h-24 p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                              placeholder="Brief summary (supports bullet points: • Item)..."
                            />
                            <p className="text-[10px] text-slate-400">Recommended: keeping under 150 characters for best display on cards.</p>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-brand-primary/5 p-6 rounded-[2rem] border border-brand-primary/10">
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary mb-6 flex items-center gap-3">
                                <FileText size={16} />
                                Financial Statement (Income & Expense)
                              </h4>
                              
                              <div className="grid md:grid-cols-2 gap-8">
                                {/* Income Section */}
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Income Sources</label>
                                  <div className="space-y-2">
                                    {(programForm.budget?.income || []).map((item, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <input 
                                          type="text"
                                          placeholder="Source"
                                          value={item.item}
                                          onChange={(e) => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newIncome = [...(budget.income || [])];
                                            newIncome[idx] = { ...newIncome[idx], item: e.target.value };
                                            setProgramForm({...programForm, budget: {...budget, income: newIncome}});
                                          }}
                                          className="flex-1 p-3 bg-white border border-slate-100 rounded-lg text-xs"
                                        />
                                        <input 
                                          type="number"
                                          placeholder="Amount"
                                          value={item.amount}
                                          onChange={(e) => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newIncome = [...(budget.income || [])];
                                            newIncome[idx] = { ...newIncome[idx], amount: Number(e.target.value) };
                                            setProgramForm({...programForm, budget: {...budget, income: newIncome}});
                                          }}
                                          className="w-24 p-3 bg-white border border-slate-100 rounded-lg text-xs"
                                        />
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newIncome = (budget.income || []).filter((_, i) => i !== idx);
                                            setProgramForm({...programForm, budget: {...budget, income: newIncome}});
                                          }}
                                          className="p-3 text-red-400 hover:text-red-600"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const budget = programForm.budget || { income: [], expense: [] };
                                        const newIncome = [...(budget.income || []), { item: '', amount: 0 }];
                                        setProgramForm({...programForm, budget: {...budget, income: newIncome}});
                                      }}
                                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2 hover:border-brand-primary/30 hover:text-brand-primary transition-all"
                                    >
                                      <Plus size={12} /> Add Income Source
                                    </button>
                                  </div>
                                </div>

                                {/* Expense Section */}
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expenses</label>
                                  <div className="space-y-2">
                                    {(programForm.budget?.expense || []).map((item, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <input 
                                          type="text"
                                          placeholder="Expense Item"
                                          value={item.item}
                                          onChange={(e) => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newExpense = [...(budget.expense || [])];
                                            newExpense[idx] = { ...newExpense[idx], item: e.target.value };
                                            setProgramForm({...programForm, budget: {...budget, expense: newExpense}});
                                          }}
                                          className="flex-1 p-3 bg-white border border-slate-100 rounded-lg text-xs"
                                        />
                                        <input 
                                          type="number"
                                          placeholder="Amount"
                                          value={item.amount}
                                          onChange={(e) => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newExpense = [...(budget.expense || [])];
                                            newExpense[idx] = { ...newExpense[idx], amount: Number(e.target.value) };
                                            setProgramForm({...programForm, budget: {...budget, expense: newExpense}});
                                          }}
                                          className="w-24 p-3 bg-white border border-slate-100 rounded-lg text-xs"
                                        />
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const budget = programForm.budget || { income: [], expense: [] };
                                            const newExpense = (budget.expense || []).filter((_, i) => i !== idx);
                                            setProgramForm({...programForm, budget: {...budget, expense: newExpense}});
                                          }}
                                          className="p-3 text-red-400 hover:text-red-600"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const budget = programForm.budget || { income: [], expense: [] };
                                        const newExpense = [...(budget.expense || []), { item: '', amount: 0 }];
                                        setProgramForm({...programForm, budget: {...budget, expense: newExpense}});
                                      }}
                                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2 hover:border-brand-primary/30 hover:text-brand-primary transition-all"
                                    >
                                      <Plus size={12} /> Add Expense Item
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 pt-6 border-t border-brand-primary/10 flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Overview</span>
                                <div className="flex gap-6">
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Total Income</p>
                                    <p className="text-sm font-bold text-green-600">৳{(programForm.budget?.income || []).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Total Expense</p>
                                    <p className="text-sm font-bold text-red-600">৳{(programForm.budget?.expense || []).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Balance</p>
                                    <p className={`text-sm font-black ${((programForm.budget?.income || []).reduce((acc, curr) => acc + curr.amount, 0) - (programForm.budget?.expense || []).reduce((acc, curr) => acc + curr.amount, 0)) >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>
                                      ৳{((programForm.budget?.income || []).reduce((acc, curr) => acc + curr.amount, 0) - (programForm.budget?.expense || []).reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Highlights (Cards/Buttons)</label>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {(programForm.highlights || []).map((h, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-brand-primary text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-brand-primary/20">
                                    {h}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const newH = programForm.highlights.filter((_, i) => i !== idx);
                                        setProgramForm({...programForm, highlights: newH});
                                      }}
                                      className="hover:text-red-200 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  id="new-highlight-input"
                                  placeholder="Add a key highlight (e.g. Expert Speakers)..."
                                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-brand-primary/30"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      if (val) {
                                        setProgramForm({...programForm, highlights: [...(programForm.highlights || []), val]});
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('new-highlight-input') as HTMLInputElement;
                                    if (input.value.trim()) {
                                      setProgramForm({...programForm, highlights: [...(programForm.highlights || []), input.value.trim()]});
                                      input.value = '';
                                    }
                                  }}
                                  className="p-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark transition-colors"
                                >
                                  <Plus size={20} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Photo Gallery Section */}
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <ImageIcon size={14} /> Photo Gallery (Event Images)
                            </label>
                            
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                              {programForm.gallery && programForm.gallery.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                  {programForm.gallery.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-sm flex items-center justify-center bg-slate-100">
                                      {img ? (
                                        <img src={img} alt={`Gallery Preview ${idx}`} className="w-full h-full object-cover" />
                                      ) : (
                                        <ImageIcon className="text-slate-300" size={16} />
                                      )}
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newGallery = programForm.gallery.filter((_, i) => i !== idx);
                                          setProgramForm({...programForm, gallery: newGallery});
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-col gap-4">
                                <input 
                                  type="file"
                                  id="gallery-bulk-upload"
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const files = Array.from(e.target.files || []) as File[];
                                    if (files.length > 0) {
                                      try {
                                        setIsUploading('gallery');
                                        const uploadPromises = files.map((file: File) => uploadImage(file));
                                        const urls = await Promise.all(uploadPromises);
                                        setProgramForm({
                                          ...programForm, 
                                          gallery: [...(programForm.gallery || []), ...urls]
                                        });
                                      } catch (err) {
                                        alert(err instanceof Error ? err.message : 'Gallery upload failed');
                                      } finally {
                                        setIsUploading(null);
                                      }
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor="gallery-bulk-upload"
                                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-brand-primary hover:text-brand-primary transition-all cursor-pointer shadow-sm group"
                                >
                                  {isUploading === 'gallery' ? (
                                    <Loader2 size={20} className="animate-spin text-brand-primary" />
                                  ) : (
                                    <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                  )}
                                  {isUploading === 'gallery' ? 'Uploading Multiple Photos...' : 'Upload Gallery Photos (Multiple)'}
                                </label>
                                <p className="text-[10px] text-center text-slate-400">Select one or more photos taken during the event to showcase in the gallery.</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extended Details (HTML supported)</label>
                            <textarea 
                              required
                              value={programForm.details}
                              onChange={(e) => setProgramForm({...programForm, details: e.target.value})}
                              className="w-full h-48 p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                              placeholder="Full program agenda and details. Supports HTML (e.g. <ul><li>Step 1</li></ul>)..."
                            />
                            <p className="text-[10px] text-slate-400">Use &lt;ul&gt;&lt;li&gt; tags for bullet points if needed.</p>
                          </div>

                          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                            <input 
                              type="checkbox"
                              id="featured"
                              checked={programForm.featured}
                              onChange={(e) => setProgramForm({...programForm, featured: e.target.checked})}
                              className="w-5 h-5 accent-brand-primary"
                            />
                            <label htmlFor="featured" className="text-sm font-bold text-slate-700">Set as Featured (Homepage Hero)</label>
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
                            <button 
                              type="button"
                              onClick={() => { setIsAddingProgram(false); setEditingProgram(null); }}
                              className="px-8 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-900 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              className="flex items-center gap-3 bg-brand-primary text-white px-12 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              <Save size={16} />
                              {editingProgram ? 'Update Program' : 'Publish Program'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-medium text-2xl text-slate-900 italic font-bold">Programs List</h3>
                          <button 
                            onClick={() => setIsAddingProgram(true)}
                            className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                          >
                            <Plus size={16} />
                            Add Program
                          </button>
                        </div>

                        {programs.length === 0 ? (
                          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                              <Calendar size={40} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">No programs added yet</h4>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start adding programs to showcase the association's activities on the website.</p>
                            <button 
                              onClick={() => setIsAddingProgram(true)}
                              className="bg-brand-primary text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
                            >
                              Add Your First Program
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {programs.map(p => (
                              <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-primary/30 transition-all">
                                <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                    {p.image ? (
                                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="text-slate-300" size={20} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.featured ? 'bg-brand-accent/20 text-brand-accent' : 'bg-slate-100 text-slate-400'}`}>
                                        {p.featured ? 'Featured' : 'Standard'}
                                      </span>
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.status === 'upcoming' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{p.title}</h4>
                                    <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-400 font-medium">
                                      <span className="flex items-center gap-1"><Calendar size={10} /> {p.date}</span>
                                      <span className="flex items-center gap-1"><MapPin size={10} /> {p.location}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => openEditProgram(p)}
                                    className="p-3 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
                                    title="Edit"
                                  >
                                    <Settings size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProgram(p.id)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : adminTab === 'membership-config' ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                      <h3 className="font-display font-bold text-xl text-slate-900 italic">Membership Payment Settings</h3>
                      <p className="text-slate-500 text-sm mt-1">Configure bKash/Nagad details and registration amount.</p>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">bKash Number (Personal)</label>
                          <input 
                            type="text"
                            value={membershipSettings?.bkashNumber || ''}
                            onChange={(e) => setMembershipSettings({...membershipSettings, bkashNumber: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nagad Number (Personal)</label>
                          <input 
                            type="text"
                            value={membershipSettings?.nagadNumber || ''}
                            onChange={(e) => setMembershipSettings({...membershipSettings, nagadNumber: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Membership Fee (BDT)</label>
                        <input 
                          type="number"
                          value={membershipSettings?.membershipAmount || 100}
                          onChange={(e) => setMembershipSettings({...membershipSettings, membershipAmount: parseInt(e.target.value) || 0})}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Instructions / Info Message</label>
                        <textarea 
                          value={membershipSettings?.paymentInstructions || ''}
                          onChange={(e) => setMembershipSettings({...membershipSettings, paymentInstructions: e.target.value})}
                          className="w-full h-32 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium leading-relaxed"
                          placeholder="e.g. Send money then submit transaction ID here..."
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdateMembershipSettings(membershipSettings)}
                        disabled={savingMembershipSettings}
                        className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                      >
                        {savingMembershipSettings ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                        Save Membership Settings
                      </button>
                    </div>
                  </div>
                ) : adminTab === 'approvals' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
                         <div>
                           <h3 className="font-display font-bold text-xl text-slate-900 leading-none">
                             Pending Approvals
                           </h3>
                           <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-widest">Review and approve registration payments and annual fee submissions</p>
                         </div>
                         <div className="flex gap-2">
                           <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-2">
                             <Clock size={12} /> Total Pending: {
                               allUsers.filter(u => {
                                 if (specializedRole === 'finance') return u.membershipStatus === 'pending_finance' || u.membershipStatus === 'declined_finance';
                                 if (specializedRole === 'secretary') return u.membershipStatus === 'pending_secretary' || u.membershipStatus === 'declined_secretary';
                                 return u.membershipStatus && u.membershipStatus !== 'unpaid' && u.membershipStatus !== 'approved';
                               }).length + (specializedRole === 'finance' ? paymentSubmissions.filter(p => p.status === 'pending').length : 0)
                             }
                           </span>
                         </div>
                       </div>

                       <div className="space-y-12">
                         {/* Unified Approvals Queue */}
                         <div className="space-y-6">
                           {/* Registration Approvals Sub-section */}
                           {(specializedRole === 'finance' || specializedRole === 'secretary') && (
                             <div className="space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                 <Users size={14} /> Registration Requests
                               </h4>
                               <div className="grid gap-4">
                                 {allUsers
                                   .filter(u => {
                                     if (specializedRole === 'finance') return u.membershipStatus === 'pending_finance' || u.membershipStatus === 'declined_finance';
                                     if (specializedRole === 'secretary') return u.membershipStatus === 'pending_secretary' || u.membershipStatus === 'declined_secretary';
                                     return u.membershipStatus && u.membershipStatus !== 'unpaid' && u.membershipStatus !== 'approved';
                                   })
                                   .map(m => (
                                   <div key={m.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-primary/20 transition-all">
                                     <div>
                                       <div className="flex items-center gap-3 mb-2">
                                         <h4 className="font-bold text-slate-900">{m.name}</h4>
                                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                           (m.membershipStatus || '').includes('declined') ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                         }`}>
                                           {(m.membershipStatus || 'unpaid').replace('_', ' ')}
                                         </span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                                         <span className="text-slate-400">Method: <span className="text-slate-600 font-bold uppercase">{m.paymentMethod}</span></span>
                                         <span className="text-slate-400">TXID: <span className="text-slate-600 font-mono font-bold">{m.transactionId}</span></span>
                                         <span className="text-slate-400">Amount: <span className="text-slate-600 font-bold tracking-tighter">৳{m.paymentAmount}</span></span>
                                         <span className="text-slate-400">Date: <span className="text-slate-600 font-bold">{m.paymentSubmittedAt ? safeToDate(m.paymentSubmittedAt).toLocaleDateString() : 'N/A'}</span></span>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                       <button 
                                         onClick={() => updateUserStatus(m.id, specializedRole === 'finance' ? 'pending_secretary' : 'approved')}
                                         className="px-6 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2"
                                       >
                                         <Check size={14} strokeWidth={3} /> Approve
                                       </button>
                                       <button 
                                         onClick={() => updateUserStatus(m.id, specializedRole === 'finance' ? 'declined_finance' : 'declined_secretary')}
                                         className="px-6 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                                       >
                                         <X size={14} strokeWidth={3} /> Decline
                                       </button>
                                     </div>
                                   </div>
                                 ))}
                                 {allUsers.filter(u => {
                                   if (specializedRole === 'finance') return u.membershipStatus === 'pending_finance' || u.membershipStatus === 'declined_finance';
                                   if (specializedRole === 'secretary') return u.membershipStatus === 'pending_secretary' || u.membershipStatus === 'declined_secretary';
                                   return u.membershipStatus && u.membershipStatus !== 'unpaid' && u.membershipStatus !== 'approved';
                                 }).length === 0 && (
                                   <div className="py-8 text-center text-slate-300 italic text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                     No pending registration requests.
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}

                           {/* Fee Payment Approvals Sub-section */}
                           {specializedRole === 'finance' && (
                             <div className="space-y-4 pt-8 border-t border-slate-50">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                 <Receipt size={14} /> Annual Fee Submissions
                               </h4>
                               <div className="grid gap-4">
                                 {paymentSubmissions
                                   .filter(p => p.status === 'pending')
                                   .map(p => (
                                   <div key={p.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-brand-primary/20 transition-all group">
                                     <div className="space-y-4">
                                       <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 bg-white border border-slate-200 text-brand-primary rounded-xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                           {p.userName.charAt(0)}
                                         </div>
                                         <div>
                                           <h4 className="font-bold text-slate-900 leading-none">{p.userName}</h4>
                                           <p className="text-[10px] text-slate-400 mt-1">{p.feeName} — Term {p.termIndex + 1}, {p.year}</p>
                                         </div>
                                       </div>
                                       <div className="grid grid-cols-2 gap-8">
                                         <div>
                                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">TX Details</span>
                                           <span className="text-xs font-mono text-slate-600 font-bold">{p.transactionDetails}</span>
                                         </div>
                                         <div>
                                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Amount Paid</span>
                                           <span className="text-sm font-black text-slate-900 tracking-tighter">৳{p.amount}</span>
                                         </div>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-3 shrink-0">
                                       <button 
                                         onClick={() => handleApprovePayment(p)}
                                         className="px-7 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2"
                                       >
                                         <Check size={16} strokeWidth={3} /> Approve
                                       </button>
                                       <button 
                                         onClick={() => handleRejectPayment(p.id)}
                                         className="px-7 py-3 bg-white border border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all flex items-center gap-2"
                                       >
                                         <X size={16} strokeWidth={3} /> Reject
                                       </button>
                                     </div>
                                   </div>
                                 ))}
                                 {paymentSubmissions.filter(p => p.status === 'pending').length === 0 && (
                                   <div className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-300 italic text-xs">
                                     No fee payment submissions.
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>

                       {/* Full User List for Admin */}
                       {isAdmin && (
                         <div className="mt-12 pt-12 border-t border-slate-100">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                             <Users size={14} /> Global User Registrar
                           </h4>
                           <div className="overflow-hidden rounded-2xl border border-slate-100">
                             <table className="w-full text-left text-[11px]">
                               <thead className="bg-slate-50 border-b border-slate-100">
                                 <tr>
                                   <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">User / Identity</th>
                                   <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Membership Status</th>
                                   <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Workflow Stage</th>
                                   <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                 {allUsers.map(u => (
                                   <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4">
                                       <div className="font-bold text-slate-900">{u.name || 'Anonymous'}</div>
                                       <div className="text-slate-400 font-medium">{u.email}</div>
                                     </td>
                                     <td className="px-6 py-4">
                                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                         u.membershipStatus === 'approved' ? 'bg-green-100 text-green-600' :
                                         u.membershipStatus === 'unpaid' ? 'bg-slate-100 text-slate-400' :
                                         (u.membershipStatus || '').includes('declined') ? 'bg-red-100 text-red-600' :
                                         'bg-amber-100 text-amber-600'
                                       }`}>
                                         {u.membershipStatus === 'unpaid' ? '🔵 Just Registered' : 
                                          u.membershipStatus === 'approved' ? '🟢 Full Member' : 
                                          (u.membershipStatus || '').includes('declined') ? '🔴 Declined' : 
                                          u.membershipStatus === 'pending_finance' ? '🟡 Pending Finance' : '🟠 Pending Secretary'}
                                       </span>
                                     </td>
                                     <td className="px-6 py-4">
                                       <div className="flex items-center gap-1">
                                          {[1, 2, 3].map(i => {
                                            const isActive = (i === 1 && ['pending_finance', 'pending_secretary', 'approved', 'declined_finance', 'declined_secretary'].includes(u.membershipStatus)) ||
                                                             (i === 2 && ['pending_secretary', 'approved', 'declined_secretary'].includes(u.membershipStatus)) ||
                                                             (i === 3 && u.membershipStatus === 'approved');
                                            return <div key={i} className={`h-1.5 w-6 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-slate-100'}`} />;
                                          })}
                                       </div>
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                       <button 
                                         onClick={() => updateUserStatus(u.id, u.membershipStatus === 'approved' ? 'unpaid' : 'approved')}
                                         className="text-brand-primary hover:underline font-bold"
                                       >
                                         {u.membershipStatus === 'approved' ? 'Revoke' : 'Force Approve'}
                                       </button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                    </div>
                ) : null}
              </div>
            </div>

              <div className="mt-8 p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 flex items-start gap-4">
                <div className="bg-brand-primary text-white p-2 rounded-lg shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Update Transparency</h4>
                  <p className="text-[11px] text-brand-primary/70 leading-relaxed">
                    Changes made here will be instantly visible to all website visitors. Ensure your mission and vision statements reflect the association's current objectives.
                  </p>
                </div>
              </div>

              <div className="mt-16 text-center">
                <button 
                  onClick={() => { setShowAdminDashboard(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  Return to Homepage
                </button>
            </div>
          </div>
        )}

        {showNoticesView && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 md:py-8">
            {/* Image Lightbox */}
            <AnimatePresence>
              {selectedNoticeImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md"
                  onClick={() => setSelectedNoticeImage(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative max-w-5xl w-full flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setSelectedNoticeImage(null)}
                      className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
                    >
                      <X size={32} />
                    </button>
                    
                    <img 
                      src={selectedNoticeImage} 
                      alt="Notice Detail" 
                      className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                    />
                    
                    <div className="mt-8">
                      <a 
                        href={selectedNoticeImage} 
                        download="notice-attachment"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-white text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary hover:text-white transition-all shadow-xl"
                      >
                        <Download size={18} />
                        Download Image
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-8 bg-brand-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Official Communication</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-medium text-slate-900 italic font-bold">Notice Board</h2>
                <p className="text-slate-500 max-w-md">Access latest announcements, schedules, and important documents from the association.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative group flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by title..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm"
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                  />
                </div>
                
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <select 
                    value={noticeCategoryFilter}
                    onChange={(e) => setNoticeCategoryFilter(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm appearance-none cursor-pointer font-bold text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    <option value="General">General</option>
                    <option value="Event">Events</option>
                    <option value="Committee">Committee</option>
                    <option value="Financial">Financial</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notices Content */}
            <div className="space-y-8">
              {filteredNotices.length > 0 ? (
                filteredNotices.map((notice, idx) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group"
                  >
                    {/* Entry Header: Title (L) - Date (R) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-50 pb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          notice.category === 'Financial' ? 'bg-red-500' :
                          notice.category === 'Event' ? 'bg-green-500' :
                          notice.category === 'Committee' ? 'bg-blue-500' :
                          'bg-slate-400'
                        } shrink-0`} />
                        <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 group-hover:text-brand-primary transition-colors leading-tight">
                          {notice.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-100 text-slate-500 font-mono text-sm font-bold shrink-0">
                        <Clock size={16} className="text-slate-300" />
                        {notice.date}
                      </div>
                    </div>

                    {/* Entry Body: Image (L) - Description (R) */}
                    <div className="grid md:grid-cols-12 gap-10">
                      {/* Image Area */}
                      <div className="md:col-span-5 lg:col-span-4 relative group/img cursor-pointer" onClick={() => notice.image && setSelectedNoticeImage(notice.image)}>
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner group-hover/img:shadow-xl transition-all duration-500">
                          {notice.image ? (
                            <>
                              <img 
                                src={notice.image} 
                                alt={notice.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                              />
                              <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/30 transition-all flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover/img:opacity-100 scale-50 group-hover/img:scale-100 transition-all duration-300" size={32} />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <ImageIcon size={64} strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        {notice.image && (
                          <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-slate-400 group-hover/img:text-brand-primary transition-colors">
                            <Maximize2 size={20} />
                          </div>
                        )}
                      </div>

                      {/* Description & Links Area */}
                      <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between">
                        <div className="space-y-6">
                          <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                            notice.category === 'Financial' ? 'text-red-600 bg-red-50' :
                            notice.category === 'Event' ? 'text-green-600 bg-green-50' :
                            notice.category === 'Committee' ? 'text-blue-600 bg-blue-50' :
                            'text-slate-500 bg-slate-100'
                          }`}>
                            {notice.category} Posting
                          </span>
                          <p className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line">
                            {notice.description}
                          </p>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-4 pt-8 border-t border-slate-50">
                          {notice.fbLink && (
                            <button 
                              onClick={() => window.open(notice.fbLink, '_blank')}
                              className="flex items-center gap-3 bg-[#1877F2] text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#166fe5] hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                              <Facebook size={18} />
                              Facebook Post
                            </button>
                          )}

                          {notice.image && (
                            <button 
                              onClick={() => handleDownloadImage(notice.image!, `notice-${notice.id}.jpg`)}
                              className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                              <Download size={18} />
                              Download Image
                            </button>
                          )}
                          
                          {(notice.pdfUrl && notice.pdfUrl !== '#') && (
                            <button 
                              onClick={() => window.open(notice.pdfUrl, '_blank')}
                              className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary hover:shadow-xl hover:shadow-brand-primary/20 transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                              <FileText size={18} />
                              Read Document
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">No matching notices</h3>
                  <p className="text-slate-400 mt-2 max-w-xs mx-auto">We couldn't find any notices matching your current search or filter criteria.</p>
                  <button 
                    onClick={() => { setNoticeSearch(''); setNoticeCategoryFilter('All'); }}
                    className="mt-8 px-10 py-3 bg-brand-primary text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:shadow-xl transition-all"
                  >
                    View All Notices
                  </button>
                </div>
              )}
            </div>

            <div className="mt-24 text-center">
              <button 
                onClick={() => { setShowNoticesView(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group relative inline-flex items-center gap-4 px-12 py-4 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all text-xs font-black tracking-[0.2em] uppercase overflow-hidden"
              >
                <div className="absolute inset-0 bg-slate-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <ArrowLeft className="relative z-10 transition-transform group-hover:-translate-x-1" size={16} />
                <span className="relative z-10">Return to Portal</span>
              </button>
            </div>
          </div>
        )}
        {showAllMembers && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 scroll-mt-20">
            {/* Compact Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-5 bg-brand-primary" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-brand-primary">Member</span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-medium text-slate-900 italic font-bold leading-none">Our All Association Member List</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1 md:max-w-xl justify-end">
                <div className="relative flex-1 w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search name, hospital..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-[11px]"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                <div className="relative w-full sm:w-40">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <select 
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-[11px] appearance-none cursor-pointer font-medium"
                  >
                    <option value="All">All Sessions</option>
                    {allSessions.map(session => (
                      <option key={session} value={session}>{session}</option>
                    ))}
                  </select>
                  <ChevronRight size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                </div>
                <button 
                  onClick={() => { setShowAllMembers(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="bg-slate-900 px-4 py-2 rounded-lg text-white hover:bg-brand-primary transition-all shadow-sm flex items-center gap-2 font-bold active:scale-95 text-[9px] uppercase tracking-widest"
                >
                  <ArrowRight className="rotate-180" size={12} /> Home
                </button>
              </div>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMembers.map((member, idx) => (
                  <motion.div
                    layout
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-2xl border-b-4 border-brand-primary/20 hover:border-brand-primary p-2 flex flex-col shadow-sm hover:shadow-xl transition-all group overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-100">
                      <img 
                        src={member.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                        alt={member.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {member.bloodGroup && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg">
                          {member.bloodGroup}
                        </div>
                      )}
                    </div>

                    <div className="px-2 pb-3 flex flex-col items-center text-center">
                      <div className="flex flex-col items-center gap-0.5 mb-1.5">
                        <h3 className="font-display font-bold text-[13px] text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1 leading-tight">
                          {member.name}
                        </h3>
                        {member.memberCode && (
                          <span className="text-[9px] font-black text-brand-primary/60 uppercase tracking-widest">
                            {member.memberCode}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[10px] mb-2 line-clamp-1 font-medium">
                        {member.designation && <span className="block italic opacity-80 truncate">{member.designation}</span>}
                        {member.companyName || (member.shift ? `${member.shift} Shift` : 'Member')}
                      </div>
                      <div className="inline-flex items-center justify-center px-3 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-tighter mb-3">
                        Session: {member.session || 'N/A'}
                      </div>

                      {member.phone && (
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold text-[10px] mt-auto w-full pt-2 border-t border-slate-50">
                          <Phone size={10} className="text-brand-primary" />
                          <a href={`tel:${member.phone}`} className="hover:text-brand-primary transition-colors">
                            {member.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                <Search size={32} className="mx-auto text-slate-200 mb-3" />
                <h3 className="text-sm font-display font-bold text-slate-900">No members found</h3>
                <p className="text-slate-400 text-[10px] mt-1">Try another search or session</p>
                <button 
                  onClick={() => { setMemberSearch(''); setSessionFilter('All'); }}
                  className="mt-4 text-brand-primary font-bold text-[9px] uppercase tracking-widest hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="mt-12 text-center">
              <button 
                onClick={() => { setShowAllMembers(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all text-[9px] font-bold tracking-widest uppercase"
              >
                <ArrowRight className="rotate-180" size={12} /> Finish exploring
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {associationConfig.logoUrl ? (
                <img src={associationConfig.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="bg-brand-primary p-2 rounded-lg">
                  <Cpu className="text-white w-6 h-6" />
                </div>
              )}
              <span className="font-display font-bold text-xl text-brand-primary">
                EDEA RANGPUR
              </span>
            </div>
            <p className="text-slate-500 max-w-sm mb-6">
              {associationConfig.footerDescription || 'The leading association for electromedical diploma engineers in the Rangpur region. Dedicated to professional growth and technical excellence.'}
            </p>
            <div className="flex flex-wrap gap-4">
              {associationConfig.socialLinks?.facebook && associationConfig.socialLinks.facebook.trim() !== '' && (
                <a href={associationConfig.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Facebook size={18} />
                </a>
              )}
              {associationConfig.socialLinks?.linkedin && associationConfig.socialLinks.linkedin.trim() !== '' && (
                <a href={associationConfig.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Linkedin size={18} />
                </a>
              )}
              {associationConfig.socialLinks?.twitter && associationConfig.socialLinks.twitter.trim() !== '' && (
                <a href={associationConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Twitter size={18} />
                </a>
              )}
              {associationConfig.socialLinks?.instagram && associationConfig.socialLinks.instagram.trim() !== '' && (
                <a href={associationConfig.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Instagram size={18} />
                </a>
              )}
              {associationConfig.socialLinks?.whatsapp && associationConfig.socialLinks.whatsapp.trim() !== '' && (
                <a href={associationConfig.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <MessageCircle size={18} />
                </a>
              )}
              {associationConfig.socialLinks?.youtube && associationConfig.socialLinks.youtube.trim() !== '' && (
                <a href={associationConfig.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <button 
                  onClick={() => { 
                    setShowAllProgramsView(false); 
                    setShowFullCommittee(false); 
                    setSelectedProgram(null);
                    setShowAllMembers(false);
                    setShowNoticesView(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  }} 
                  className="hover:text-brand-primary transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setShowAllProgramsView(true);
                    setShowFullCommittee(false);
                    setShowAllMembers(false);
                    setShowNoticesView(false);
                    setSelectedProgram(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-brand-primary transition-colors"
                >
                  All Programs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setShowAllMembers(true);
                    setShowAllProgramsView(false);
                    setShowFullCommittee(false);
                    setShowNoticesView(false);
                    setSelectedProgram(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-brand-primary transition-colors"
                >
                  Member Directory
                </button>
              </li>
              <li><a href="#mission" className="hover:text-brand-primary transition-colors">Mission Statement</a></li>
              <li>
                <button 
                  onClick={() => {
                    setShowFullCommittee(true);
                    setShowAllProgramsView(false);
                    setShowAllMembers(false);
                    setShowNoticesView(false);
                    setSelectedProgram(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-brand-primary transition-colors"
                >
                  Executive Committee
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-secondary shrink-0" />
                <span>{associationConfig.officeAddress || 'Rangpur Medical College Road, Rangpur, Bangladesh'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-brand-secondary shrink-0" />
                <span>{associationConfig.contactEmail || 'info@edea-rangpur.org'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-brand-secondary shrink-0" />
                <span>{associationConfig.contactPhone || '+880 1234 567890'}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} Electromedical Diploma Engineers Association, Rangpur. All rights reserved.</p>
          <div className="flex gap-8">
            <button 
              onClick={() => setShowPrivacyPolicy(true)} 
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setShowTermsOfService(true)} 
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Specialized Staff Login Modal */}
      <AnimatePresence>
        {showStaffLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStaffLogin(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                      <LogIn size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-slate-900 leading-none">EDEA Login</h3>
                      <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-2">Association Portal Access</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowStaffLogin(false)}
                    className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                  <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
                    <button 
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => {
                        setAuthMode('register');
                        setRegisterStep('form');
                      }}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Register
                    </button>
                  </div>

                  {authMode === 'login' ? (
                    <div className="space-y-8">
                      {/* Option 1: Google */}
                      <button 
                        onClick={() => {
                          setShowStaffLogin(false);
                          signInWithGoogle();
                        }}
                        className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-100 text-slate-700 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-brand-primary hover:bg-slate-50 transition-all group"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300">
                          <span className="bg-white px-4">or password login</span>
                        </div>
                      </div>

                      {/* Option 2: Email Login */}
                      <form onSubmit={handleMemberLogin} className="space-y-4">
                        <div className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                              type="email"
                              required
                              value={staffLoginForm.email}
                              onChange={(e) => setStaffLoginForm({...staffLoginForm, email: e.target.value})}
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs font-medium"
                              placeholder="Email Address"
                            />
                          </div>
                          <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                              type="password"
                              required
                              value={staffLoginForm.password}
                              onChange={(e) => setStaffLoginForm({...staffLoginForm, password: e.target.value})}
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs font-medium"
                              placeholder="Password"
                            />
                          </div>
                        </div>

                        {staffLoginError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-center gap-2">
                            <Info size={14} />
                            {staffLoginError}
                          </div>
                        )}

                        <button 
                          type="submit"
                          disabled={isLoggingInStaff}
                          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all disabled:opacity-50"
                        >
                          {isLoggingInStaff ? <Loader2 className="animate-spin" size={16} /> : "Login to Portal"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {registerStep === 'form' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                          <div className="space-y-3">
                            <div className="relative">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input 
                                type="text"
                                required
                                value={registerForm.name}
                                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs font-medium"
                                placeholder="Full Name"
                              />
                            </div>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input 
                                type="email"
                                required
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs font-medium"
                                placeholder="Email Address"
                              />
                            </div>
                            <div className="relative">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input 
                                type="password"
                                required
                                minLength={6}
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs font-medium"
                                placeholder="Password (min 6 chars)"
                              />
                            </div>
                          </div>

                          {registerError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-center gap-2">
                              <Info size={14} />
                              {registerError}
                            </div>
                          )}

                          <button 
                            type="submit"
                            disabled={isRegistering}
                            className="w-full flex items-center justify-center gap-3 bg-brand-primary text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {isRegistering ? <Loader2 className="animate-spin" size={16} /> : "Continue for OTP"}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-primary">
                              <Mail size={32} />
                            </div>
                            <h4 className="font-bold text-slate-900">Verify your email</h4>
                            <p className="text-xs text-slate-500 mt-2">Enter the 6-digit OTP sent to <span className="font-bold text-slate-900">{registerForm.email}</span></p>
                          </div>

                          <div className="flex justify-center">
                            <input 
                              type="text"
                              required
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="w-48 text-center px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-2xl font-black tracking-[0.5em] text-slate-900"
                              placeholder="000000"
                            />
                          </div>

                          {registerError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-center gap-2">
                              <Info size={14} />
                              {registerError}
                            </div>
                          )}

                          <div className="space-y-3">
                            <button 
                              type="submit"
                              disabled={isRegistering}
                              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all disabled:opacity-50"
                            >
                              {isRegistering ? <Loader2 className="animate-spin" size={16} /> : "Verify & Account Create"}
                            </button>
                            <button 
                              type="button"
                              onClick={() => setRegisterStep('form')}
                              className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                            >
                              Back to Details
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fee Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedFeeForPayment && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-display font-bold text-slate-900 italic">Submit Fee Payment</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                <p className="text-slate-500 text-sm">Please provide transaction details for the selected term(s).</p>
              </div>

              <form onSubmit={handleFeePaymentSubmit} className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Fee Structure</span>
                    <span>Amount per term</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{selectedFeeForPayment.name}</span>
                    <span className="font-mono font-bold text-brand-primary">{selectedFeeForPayment.amount} BDT</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paying for:</div>
                    {paymentForm.selectedTerms.map((t, idx) => (
                      <div key={idx} className="text-xs font-bold text-slate-600">
                        {selectedFeeForPayment.type === 'one-time' 
                          ? selectedFeeForPayment.name
                          : `Term ${t.termIndex + 1} - ${selectedFeeForPayment.terms[t.termIndex].timeline} (${t.year})`
                        }
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-display font-bold text-brand-primary italic">
                      {selectedFeeForPayment.amount * paymentForm.selectedTerms.length} BDT
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <p className="text-xs font-bold text-brand-primary mb-2">Payment Instructions:</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                      Send the total amount to bKash: <span className="font-mono font-bold select-all">{membershipSettings?.bkashNumber || '017XXXXXXXX'}</span> (Personal). 
                      Include your name in the reference if possible. Paste the Transaction ID below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID / Details *</label>
                    <textarea 
                      required
                      value={paymentForm.transactionDetails}
                      onChange={(e) => setPaymentForm({...paymentForm, transactionDetails: e.target.value})}
                      placeholder="e.g. bKash: 7XJ9W... or Bank Transfer Ref..."
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 hover:bg-brand-primary hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {submittingPayment ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Confirm & Submit Payment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysisUser && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysisUser(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900 leading-none">Member Analysis Profile</h3>
                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-2">Administrative View</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAnalysisUser(null)}
                  className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-12">
                <div className="grid md:grid-cols-3 gap-12">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl shadow-slate-200/50">
                      <img 
                        src={selectedAnalysisUser.profilePicture || selectedAnalysisUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAnalysisUser.name)}&background=random`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{selectedAnalysisUser.name}</h4>
                      <p className="text-xs text-brand-primary font-black uppercase tracking-widest mt-1">{selectedAnalysisUser.memberCode || 'NO ID'}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Details</h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">{selectedAnalysisUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">{selectedAnalysisUser.phone || 'Not Provided'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">Session: {selectedAnalysisUser.session || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={14} className="text-slate-300" />
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${selectedAnalysisUser.membershipStatus === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            Status: {(selectedAnalysisUser.membershipStatus || 'unpaid').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Details</h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Briefcase size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">Designation: {selectedAnalysisUser.designation || 'Engineer'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Building2 size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">Workplace: {selectedAnalysisUser.companyName || selectedAnalysisUser.workplace || 'Not Specified'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <GraduationCap size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">Institution: {selectedAnalysisUser.institution || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={14} className="text-slate-300" />
                          <span className="text-sm text-slate-600">Blood Group: {selectedAnalysisUser.bloodGroup || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                        <CreditCard size={18} />
                      </div>
                      <h5 className="font-bold text-slate-900 italic">Financial Analysis & Payment History</h5>
                    </div>
                    
                    {/* Financial Summary Cards */}
                    <div className="flex items-center gap-2">
                      <div className="bg-green-50 border border-green-100 px-3 py-2 rounded-xl text-center min-w-[70px]">
                        <p className="text-[8px] font-black uppercase tracking-widest text-green-600 opacity-70">Total Paid</p>
                        <p className="text-xs font-black text-green-700">
                          ৳{memberAnalysisProfileHistory.filter((p: any) => p.status === 'confirmed' || p.status === 'approved').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl text-center min-w-[70px]">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 opacity-70">Pending</p>
                        <p className="text-xs font-black text-amber-700">
                          ৳{memberAnalysisProfileHistory.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)}
                        </p>
                      </div>
                      {selectedAnalysisUser.membershipStatus !== 'approved' && (
                        <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-xl text-center min-w-[70px]">
                          <p className="text-[8px] font-black uppercase tracking-widest text-red-600 opacity-70">Due (Reg)</p>
                          <p className="text-xs font-black text-red-700">
                            ৳{membershipSettings?.membershipAmount || 100}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {memberAnalysisProfileHistory.length > 0 ? (
                    <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment For</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Amount</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {memberAnalysisProfileHistory.map((payment, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                    <Receipt size={14} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">{payment.type} {payment.type.toLowerCase().includes('fee') ? '' : 'Fee'}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">via {payment.method} • {payment.transactionId || 'No Ref'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-[10px] font-bold text-slate-500">{payment.date}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="text-xs font-black text-slate-900">৳{payment.amount}</span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  payment.status === 'confirmed' || payment.status === 'approved' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-amber-100 text-amber-600'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <CreditCard size={32} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No transaction history found.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedAnalysisUser(null)}
                  className="px-10 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg active:scale-95"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modals (Privacy & Terms) */}
      <AnimatePresence>
        {(showPrivacyPolicy || showTermsOfService) && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowPrivacyPolicy(false); setShowTermsOfService(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900 leading-none">
                      {showPrivacyPolicy ? 'Privacy Policy' : 'Terms of Service'}
                    </h3>
                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-2 italic">Legal Information</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowPrivacyPolicy(false); setShowTermsOfService(false); }}
                  className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-10 overflow-y-auto custom-scrollbar">
                <div className="whitespace-pre-wrap text-slate-600 text-sm leading-relaxed font-regular">
                  {showPrivacyPolicy 
                    ? (associationConfig.privacyPolicy || "Sample Privacy Policy\n\nYour privacy is important to us. This policy explains how Electromedical Diploma Engineers Association, Rangpur collects and uses your information.\n\n1. Data Collection: We collect information you provide when registering as a member.\n2. Usage: Your data is used for association member management and communication.\n3. Security: We implement industry-standard security to protect your data.") 
                    : (associationConfig.termsOfService || "Sample Terms of Service\n\nWelcome to EDEA Rangpur. By using our portal, you agree to these terms.\n\n1. Membership: Membership is subject to approval by the executive committee.\n2. Fees: Membership fees are non-refundable once approved.\n3. Conduct: Members must adhere to the high ethical standards of the profession.")
                  }
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => { setShowPrivacyPolicy(false); setShowTermsOfService(false); }}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg active:scale-95"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
