/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Plus, 
  PieChart, 
  Target, 
  Settings, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  Mic,
  Camera,
  ChevronRight,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  X,
  Shield,
  CheckCircle2,
  Moon,
  Sun,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Types ---
type Screen = 'home' | 'statement' | 'add' | 'insights' | 'goals' | 'settings' | 'admin' | 'ai' | 
              'settings_account' | 'settings_notifications' | 'settings_goals' | 'settings_security' | 'settings_reset';
type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
  userId?: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'support' | 'user';
  status: 'active' | 'inactive';
  joinedAt: string;
};

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
};

const INITIAL_USERS: UserProfile[] = [
  { id: '1', name: 'Carlos Alberto', email: 'carlosalbertotorelli@gmail.com', role: 'admin', status: 'active', joinedAt: '2024-01-10' },
  { id: '2', name: 'Ana Silva', email: 'ana@gmail.com', role: 'user', status: 'active', joinedAt: '2024-03-05' },
  { id: '3', name: 'Bruno Costa', email: 'bruno@suporte.com', role: 'support', status: 'active', joinedAt: '2024-02-15' },
];

const INITIAL_LOGS: AuditLog[] = [
  { id: '1', userId: '1', action: 'Login realizado', timestamp: '2024-03-15T10:00:00Z' },
  { id: '2', userId: '2', action: 'Novo lançamento: R$ 50,00', timestamp: '2024-03-15T11:30:00Z' },
  { id: '3', userId: '1', action: 'Alteração de plano: Premium', timestamp: '2024-03-14T15:45:00Z' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { 
    id: '1', 
    title: 'Meta atingida!', 
    message: 'Parabéns! Você atingiu sua meta de economia para a viagem.', 
    time: '2h atrás', 
    read: false,
    type: 'success'
  },
  { 
    id: '2', 
    title: 'Gasto elevado', 
    message: 'Seus gastos com Lazer estão 12% acima da média.', 
    time: '5h atrás', 
    read: false,
    type: 'warning'
  },
  { 
    id: '3', 
    title: 'Resumo semanal', 
    message: 'Seu resumo financeiro da semana já está disponível.', 
    time: '1 dia atrás', 
    read: true,
    type: 'info'
  },
];

// --- Mock Data ---
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'expense', amount: 50.00, category: 'Alimentação', description: 'Almoço Executivo', date: '2024-03-15' },
  { id: '2', type: 'expense', amount: 120.00, category: 'Transporte', description: 'Uber Viagem', date: '2024-03-15' },
  { id: '3', type: 'income', amount: 2500.00, category: 'Salário', description: 'Pagamento Mensal', date: '2024-03-01' },
  { id: '4', type: 'expense', amount: 350.00, category: 'Moradia', description: 'Aluguel Parcial', date: '2024-03-10' },
];

// --- Components ---

interface NavItem {
  id: Screen;
  icon: React.ElementType;
  label: string;
  primary?: boolean;
}

const BottomNav = ({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) => {
  const items: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'statement', icon: Wallet, label: 'Extrato' },
    { id: 'add', icon: Plus, label: 'Lançar', primary: true },
    { id: 'insights', icon: Sparkles, label: 'Insights' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/80 backdrop-blur-2xl border-t border-border-main px-6 py-3 pb-8 flex justify-between items-center z-50 h-[80px]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            item.primary ? "bg-brand-primary w-[48px] h-[48px] rounded-[16px] -mt-12 shadow-lg shadow-brand-primary/30 flex items-center justify-center" : "opacity-60",
            active === item.id && !item.primary && "opacity-100 text-brand-secondary"
          )}
        >
          <item.icon size={item.primary ? 24 : 20} className={cn(item.primary && "text-white")} />
          {!item.primary && <span className="text-[10px] font-medium">{item.label}</span>}
        </button>
      ))}
    </nav>
  );
};

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulating API call with credential validation
    setTimeout(() => {
      setIsLoading(false);
      if (email === 'carlosalbertotorelli@gmail.com' && password === '123456') {
        onLogin();
      } else {
        setError('E-mail ou senha incorretos. Tente novamente.');
      }
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-bg-main flex flex-col p-8 justify-center space-y-12"
    >
      <div className="space-y-4 text-center">
        <div className="w-20 h-20 bg-brand-primary rounded-[24px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-brand-primary/40">
          <Sparkles size={40} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Flow</h1>
          <p className="text-text-secondary text-sm">Sua vida financeira em movimento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-status-danger/10 border border-status-danger/20 p-3 rounded-xl text-status-danger text-[13px] font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest ml-1">E-mail ou CPF</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                <Mail size={20} />
              </div>
              <input 
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@flow.com"
                className="w-full bg-bg-card border border-border-main rounded-[20px] py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary transition-all text-[15px]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-card border border-border-main rounded-[20px] py-4 pl-12 pr-12 focus:outline-none focus:border-brand-primary transition-all text-[15px]"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-primary py-4 rounded-[24px] font-bold text-lg text-white shadow-xl shadow-brand-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Entrar
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <div className="text-center space-y-4">
          <button type="button" className="text-[13px] font-bold text-brand-secondary">Esqueci minha senha</button>
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] bg-border-main flex-1"></div>
            <span className="text-[12px] text-text-secondary font-medium">ou</span>
            <div className="h-[1px] bg-border-main flex-1"></div>
          </div>
          <p className="text-[13px] text-text-secondary">
            Não tem conta? <button type="button" className="text-brand-secondary font-bold">Criar agora</button>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

const HomeScreen = ({ transactions, onNotificationClick, hasUnread }: { transactions: Transaction[], onNotificationClick: () => void, hasUnread: boolean }) => {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-text-secondary text-sm">Bom dia, Carlos</p>
          <h1 className="text-2xl font-bold">Março, 2024</h1>
        </div>
        <button 
          onClick={onNotificationClick}
          className="p-2 bg-bg-elevated rounded-full relative active:scale-95 transition-transform"
        >
          <Bell size={20} />
          {hasUnread && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-danger rounded-full border-2 border-bg-main"></span>
          )}
        </button>
      </header>

      {/* Main Card */}
      <div className="hero-gradient p-6 rounded-2xl text-white space-y-4 shadow-xl shadow-brand-primary/20 relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="space-y-1">
          <p className="text-white/80 text-[13px] font-medium">Disponível para gastar</p>
          <h2 className="text-[32px] font-bold tracking-tight">{formatCurrency(balance)}</h2>
        </div>
        <div className="flex gap-4 pt-2">
          <div className="text-[13px] bg-black/20 px-2.5 py-1 rounded-lg font-medium">
            Limite de hoje: {formatCurrency(48.34)}
          </div>
        </div>
      </div>

      {/* Daily Limit Insight (AI Insight style) */}
      <div className="bg-bg-card border border-border-main p-4 rounded-[20px] flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-primary/15 rounded-[10px] flex items-center justify-center text-brand-secondary">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <p className="text-text-secondary text-[13px] leading-relaxed">
            Seu gasto com <strong className="text-text-primary">Lazer</strong> está 12% acima da média. Economize R$ 15/dia para bater sua meta.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[14px] font-bold uppercase tracking-wider text-text-secondary">Atividade recente</h3>
        </div>
        <div className="space-y-3">
          {[...transactions].reverse().map((t) => (
            <div key={t.id} className="bg-bg-card p-3 rounded-[16px] flex items-center gap-3 border border-border-main">
              <div className="w-10 h-10 bg-bg-elevated rounded-[12px] flex items-center justify-center text-lg">
                {t.category === 'Alimentação' ? '🍔' : t.category === 'Transporte' ? '🚕' : t.category === 'Salário' ? '💰' : '💳'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[14px] text-text-primary">{t.description}</p>
                <p className="text-text-secondary text-[11px]">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <p className={cn("font-semibold text-[14px]", t.type === 'income' ? "text-status-success" : "text-text-primary")}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const AddScreen = ({ 
  onBack, 
  onSave,
  transactionToEdit
}: { 
  onBack: () => void; 
  onSave: (t: Transaction) => void;
  transactionToEdit?: Transaction | null;
}) => {
  const [input, setInput] = useState(transactionToEdit ? `${transactionToEdit.amount} ${transactionToEdit.description}` : '');
  const [date, setDate] = useState(transactionToEdit ? transactionToEdit.date : new Date().toISOString().split('T')[0]);
  const [isRetroactive, setIsRetroactive] = useState(transactionToEdit ? transactionToEdit.date !== new Date().toISOString().split('T')[0] : false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    // Robust parser: find the first number in the string
    const match = input.match(/(\d+([.,]\d+)?)/);
    const amount = match ? parseFloat(match[0].replace(',', '.')) : NaN;
    
    // Description is everything else
    let description = input.replace(/(\d+([.,]\d+)?)/, '').replace(/reais|real/gi, '').trim() || 'Lançamento';

    if (isNaN(amount)) return;

    const transaction: Transaction = {
      id: transactionToEdit ? transactionToEdit.id : Math.random().toString(36).substr(2, 9),
      type: transactionToEdit ? transactionToEdit.type : 'expense',
      amount: Math.abs(amount),
      category: transactionToEdit ? transactionToEdit.category : 'Outros',
      description: description.charAt(0).toUpperCase() + description.slice(1),
      date: isRetroactive ? date : new Date().toISOString().split('T')[0]
    };

    // Only auto-map category if we are NOT editing
    if (!transactionToEdit) {
      const categoryMap: Record<string, string[]> = {
        'Alimentação': ['almoço', 'almoco', 'janta', 'lanche', 'sorvete', 'ifood', 'mercado', 'restaurante', 'café', 'cafe', 'pizza', 'burger', 'hamburguer', 'padaria', 'doce', 'comida'],
        'Transporte': ['uber', '99', 'taxi', 'combustivel', 'gasolina', 'onibus', 'metrô', 'metro', 'trem', 'estacionamento', 'oficina', 'pedágio', 'pedagio'],
        'Moradia': ['aluguel', 'luz', 'agua', 'água', 'internet', 'condomínio', 'condominio', 'reforma', 'moveis', 'móveis', 'faxina'],
        'Lazer': ['cinema', 'show', 'viagem', 'hotel', 'festa', 'bar', 'boteco', 'cerveja', 'jogo', 'game', 'netflix', 'spotify', 'psn', 'xbox'],
        'Saúde': ['farmacia', 'farmácia', 'médico', 'medico', 'hospital', 'exame', 'dentista', 'academia'],
        'Educação': ['curso', 'escola', 'faculdade', 'livro', 'mensalidade'],
      };

      const lowerDesc = description.toLowerCase();
      for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
          transaction.category = category;
          break;
        }
      }

      const incomeKeywords = ['salário', 'salario', 'pix recebido', 'venda', 'reembolso', 'rendimento'];
      if (incomeKeywords.some(keyword => lowerDesc.includes(keyword))) {
        transaction.type = 'income';
        if (lowerDesc.includes('salário') || lowerDesc.includes('salario')) transaction.category = 'Salário';
      }
    }

    onSave(transaction);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onBack();
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-bg-main z-[60] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-status-success"
        >
          <CheckCircle2 size={80} />
        </motion.div>
        <h2 className="text-2xl font-bold">{transactionToEdit ? 'Lançamento atualizado!' : 'Lançamento realizado!'}</h2>
        <p className="text-text-secondary text-[14px]">Sua saúde financeira agradece.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 bg-bg-main z-[60] p-6 flex flex-col"
    >
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="p-2 bg-bg-elevated rounded-full"><X size={24} /></button>
        <h1 className="text-lg font-bold">{transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <p className="text-text-secondary text-center text-[14px]">O que você gastou agora?</p>
          <div className="relative">
            <input 
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: 50 almoço"
              className="w-full bg-transparent border-b-2 border-brand-primary py-4 text-[32px] font-bold text-center focus:outline-none placeholder:text-text-secondary/30"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex justify-center gap-4">
            <button className="p-4 bg-bg-elevated rounded-[16px] text-brand-secondary"><Mic size={24} /></button>
            <button className="p-4 bg-bg-elevated rounded-[16px] text-brand-secondary"><Camera size={24} /></button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-bg-card border border-border-main p-4 rounded-[20px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-[8px] flex items-center justify-center text-brand-secondary">
                <Bell size={16} />
              </div>
              <span className="text-[14px] font-medium">Lançamento retroativo?</span>
            </div>
            <button 
              onClick={() => setIsRetroactive(!isRetroactive)}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                isRetroactive ? "bg-brand-primary" : "bg-bg-elevated"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                isRetroactive ? "right-0.5" : "left-0.5"
              )}></div>
            </button>
          </div>

          {isRetroactive && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-2"
            >
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg-elevated border border-border-main rounded-[12px] p-3 text-[14px] focus:outline-none focus:border-brand-primary text-white"
              />
            </motion.div>
          )}
          
          {!isRetroactive && (
            <p className="text-[12px] text-text-secondary">Data definida para hoje: <span className="text-text-primary font-bold">{new Date().toLocaleDateString('pt-BR')}</span></p>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">Sugestões inteligentes</p>
          <div className="flex flex-wrap gap-2">
            {['Uber', 'iFood', 'Mercado', 'Lazer', 'Fixo'].map(tag => (
              <button 
                key={tag} 
                onClick={() => setInput(prev => prev ? `${prev} ${tag}` : tag)}
                className="px-4 py-2 bg-bg-elevated rounded-[12px] text-[13px] font-medium border border-border-main"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={!input}
        className="w-full bg-brand-primary py-4 rounded-[20px] font-bold text-lg shadow-lg shadow-brand-primary/30 disabled:opacity-50 disabled:shadow-none transition-all mb-8 text-white"
      >
        {transactionToEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}
      </button>
    </motion.div>
  );
};

const StatementScreen = ({ 
  transactions, 
  onTransactionClick 
}: { 
  transactions: Transaction[], 
  onTransactionClick: (t: Transaction) => void 
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => 
    filter === 'Todos' || t.category === filter || (filter === 'Entradas' && t.type === 'income') || (filter === 'Saídas' && t.type === 'expense')
  );

  // Group by date
  const groups = filteredTransactions.reduce((acc: Record<string, Transaction[]>, t) => {
    const date = t.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const exportToExcel = () => {
    const incomeByCategory = transactions.filter(t => t.type === 'income').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalIncome = Object.values(incomeByCategory).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

    const data = [
      ['DEMONSTRATIVO DE RESULTADOS (DRE)', 'VALOR'],
      ['', ''],
      ['RECEITAS', totalIncome],
      ...Object.entries(incomeByCategory).map(([cat, val]) => [`  (+) ${cat}`, val]),
      ['', ''],
      ['DESPESAS', -totalExpense],
      ...Object.entries(expenseByCategory).map(([cat, val]) => [`  (-) ${cat}`, -val]),
      ['', ''],
      ['RESULTADO LÍQUIDO', totalIncome - totalExpense]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DRE");
    XLSX.writeFile(wb, `DRE_Flow_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    
    const incomeByCategory = transactions.filter(t => t.type === 'income').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalIncome = Object.values(incomeByCategory).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

    doc.setFontSize(18);
    doc.text('Flow - Demonstrativo de Resultados (DRE)', 14, 22);
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const tableData = [
      [{ content: 'DESCRIÇÃO', styles: { fontStyle: 'bold' } }, { content: 'VALOR', styles: { fontStyle: 'bold' } }],
      [{ content: 'RECEITAS', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: formatCurrency(totalIncome), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ...Object.entries(incomeByCategory).map(([cat, val]) => [`  (+) ${cat}`, formatCurrency(val)]),
      ['', ''],
      [{ content: 'DESPESAS', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: `(${formatCurrency(totalExpense)})`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ...Object.entries(expenseByCategory).map(([cat, val]) => [`  (-) ${cat}`, `(${formatCurrency(val)})`]),
      ['', ''],
      [{ content: 'RESULTADO LÍQUIDO', styles: { fontStyle: 'bold', fillColor: [124, 58, 237], textColor: [255, 255, 255] } }, { content: formatCurrency(totalIncome - totalExpense), styles: { fontStyle: 'bold', fillColor: [124, 58, 237], textColor: [255, 255, 255] } }]
    ];

    doc.autoTable({
      startY: 40,
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' }
      }
    });

    doc.save(`DRE_Flow_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Hoje';
    if (dateStr === yesterday) return 'Ontem';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 pb-32"
    >
      <header className="flex justify-between items-end">
        <div>
          <p className="text-text-secondary text-sm">Olá, Carlos</p>
          <h1 className="text-2xl font-bold">Extrato</h1>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary flex items-center gap-2 hover:border-brand-primary transition-colors">
              <Download size={20} />
              <span className="text-[12px] font-bold hidden sm:inline">Exportar</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-border-main rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
              <button 
                onClick={exportToExcel}
                className="w-full p-4 flex items-center gap-3 hover:bg-bg-elevated transition-colors text-left"
              >
                <div className="p-2 bg-status-success/10 text-status-success rounded-lg">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-bold">Excel (DRE)</p>
                  <p className="text-[10px] text-text-secondary">Planilha .xlsx</p>
                </div>
              </button>
              <button 
                onClick={exportToPDF}
                className="w-full p-4 flex items-center gap-3 hover:bg-bg-elevated transition-colors text-left border-t border-border-main"
              >
                <div className="p-2 bg-status-danger/10 text-status-danger rounded-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-bold">PDF (DRE)</p>
                  <p className="text-[10px] text-text-secondary">Documento .pdf</p>
                </div>
              </button>
            </div>
          </div>
          <button 
            onClick={() => setIsHidden(!isHidden)}
            className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary"
          >
            {isHidden ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary">
            <Search size={20} />
          </button>
        </div>
      </header>

      {/* Balance Card */}
      <div className="bg-[#141419] border border-[#1F1F26] p-6 rounded-[24px] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="space-y-1">
          <p className="text-text-secondary text-[13px] font-medium">Saldo disponível</p>
          <h2 className="text-[36px] font-bold tracking-tight">
            {isHidden ? '••••••' : formatCurrency(balance)}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-main/50">
          <div className="space-y-1">
            <p className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Entradas</p>
            <p className="text-status-success font-bold text-[15px]">
              {isHidden ? '••••' : `+ ${formatCurrency(totalIncome)}`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Saídas</p>
            <p className="text-status-danger font-bold text-[15px]">
              {isHidden ? '••••' : `- ${formatCurrency(totalExpense)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
        {['Todos', 'Entradas', 'Saídas'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap border transition-all",
              filter === f 
                ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                : "bg-bg-card border-border-main text-text-secondary"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grouped List */}
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date} className="space-y-4">
            <h3 className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">
              {formatDateLabel(date)}
            </h3>
            <div className="space-y-3">
              {groups[date].map(t => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTransactionClick(t)}
                  className="w-full bg-bg-card border border-border-main p-4 rounded-[20px] flex items-center gap-4 text-left hover:border-brand-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-bg-elevated rounded-[16px] flex items-center justify-center text-xl shadow-inner">
                    {t.category === 'Alimentação' ? '🍔' : t.category === 'Transporte' ? '🚕' : t.category === 'Salário' ? '💼' : '💳'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[15px] text-text-primary">{t.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold text-[15px]",
                      t.type === 'income' ? "text-status-success" : "text-status-danger"
                    )}>
                      {isHidden ? '••••' : `${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}`}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const TransactionDetailModal = ({ transaction, onClose, onEdit, onDelete }: { transaction: Transaction, onClose: () => void, onEdit: (t: Transaction) => void, onDelete: (id: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-bg-card w-full max-w-md rounded-t-[32px] p-8 space-y-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-bg-elevated rounded-full mx-auto mb-2"></div>
        
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-bg-elevated rounded-[24px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl">
            {transaction.category === 'Alimentação' ? '🍔' : transaction.category === 'Transporte' ? '🚕' : transaction.category === 'Salário' ? '💼' : '💳'}
          </div>
          <h2 className="text-3xl font-bold">{formatCurrency(transaction.amount)}</h2>
          <p className="text-text-secondary font-medium">{transaction.description}</p>
        </div>

        <div className="bg-bg-elevated rounded-[24px] p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border-main pb-4">
            <span className="text-text-secondary text-sm">Data</span>
            <span className="font-bold">{new Date(transaction.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border-main pb-4">
            <span className="text-text-secondary text-sm">Categoria</span>
            <span className="font-bold">{transaction.category}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Tipo</span>
            <span className={cn("font-bold", transaction.type === 'income' ? "text-status-success" : "text-status-danger")}>
              {transaction.type === 'income' ? 'Entrada' : 'Saída'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(transaction)}
            className="flex-1 py-4 bg-bg-elevated rounded-[20px] font-bold text-sm hover:bg-bg-elevated/80 transition-colors"
          >
            Editar
          </button>
          <button 
            onClick={() => onDelete(transaction.id)}
            className="flex-1 py-4 bg-status-danger/10 text-status-danger rounded-[20px] font-bold text-sm hover:bg-status-danger/20 transition-colors"
          >
            Excluir
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-brand-primary text-white rounded-[20px] font-bold text-lg shadow-lg shadow-brand-primary/20"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
};

const AdminScreen = () => {
  const [tab, setTab] = useState<'users' | 'logs' | 'stats'>('stats');
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [logs] = useState<AuditLog[]>(INITIAL_LOGS);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-32"
    >
      <header>
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <p className="text-text-secondary text-sm">Controle central da plataforma</p>
      </header>

      {/* Admin Tabs */}
      <div className="flex bg-bg-card p-1 rounded-2xl border border-border-main">
        {(['stats', 'users', 'logs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all capitalize",
              tab === t ? "bg-brand-primary text-white shadow-lg" : "text-text-secondary"
            )}
          >
            {t === 'stats' ? 'KPIs' : t === 'users' ? 'Usuários' : 'Logs'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-card border border-border-main p-5 rounded-[24px] space-y-2">
              <p className="text-[11px] text-text-secondary uppercase font-bold tracking-widest">MRR</p>
              <p className="text-2xl font-bold text-brand-secondary">R$ 12.450</p>
              <p className="text-[10px] text-status-success font-bold">+12% este mês</p>
            </div>
            <div className="bg-bg-card border border-border-main p-5 rounded-[24px] space-y-2">
              <p className="text-[11px] text-text-secondary uppercase font-bold tracking-widest">Usuários</p>
              <p className="text-2xl font-bold text-text-primary">1.240</p>
              <p className="text-[10px] text-status-success font-bold">+45 novos</p>
            </div>
          </div>

          <div className="bg-bg-card border border-border-main p-6 rounded-[24px] space-y-4">
            <h3 className="font-bold text-[15px]">Status dos Módulos</h3>
            <div className="space-y-3">
              {[
                { name: 'API Gateway', status: 'online' },
                { name: 'Auth Service', status: 'online' },
                { name: 'Billing Engine', status: 'online' },
                { name: 'AI Insights', status: 'online' },
              ].map(m => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-status-success rounded-full"></div>
                    <span className="text-[11px] font-bold uppercase text-status-success">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="bg-bg-card border border-border-main p-4 rounded-[20px] flex items-center gap-4">
              <div className="w-10 h-10 bg-bg-elevated rounded-full flex items-center justify-center font-bold text-brand-secondary">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[14px] text-text-primary">{u.name}</p>
                <p className="text-[11px] text-text-secondary">{u.email}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-2 py-1 rounded-md text-[9px] font-bold uppercase",
                  u.role === 'admin' ? "bg-brand-primary/20 text-brand-secondary" : "bg-bg-elevated text-text-secondary"
                )}>
                  {u.role}
                </span>
              </div>
            </div>
          ))}
          <button className="w-full py-4 border-2 border-dashed border-border-main rounded-[20px] text-text-secondary font-bold text-sm">
            + Convidar Usuário
          </button>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-3">
          {logs.map(l => (
            <div key={l.id} className="bg-bg-card border border-border-main p-4 rounded-[16px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-text-primary">{l.action}</span>
                <span className="text-[10px] text-text-secondary">
                  {new Date(l.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary">Usuário ID: {l.userId}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const InsightsScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      <header>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-text-secondary text-sm">O que sua conta diz hoje</p>
      </header>

      <div className="space-y-4">
        <div className="bg-bg-card border border-border-main p-5 rounded-[20px] space-y-3">
          <div className="flex items-center gap-2 text-status-danger">
            <TrendingUp size={20} />
            <span className="font-bold text-[14px]">Atenção no Delivery</span>
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Você gastou <strong className="text-text-primary">32% a mais</strong> com delivery este mês em comparação a Fevereiro.
          </p>
          <button className="text-[12px] font-bold text-brand-secondary underline">Ver detalhes</button>
        </div>

        <div className="bg-bg-card border border-border-main p-5 rounded-[20px] space-y-3">
          <div className="flex items-center gap-2 text-status-info">
            <Sparkles size={20} />
            <span className="font-bold text-[14px]">Projeção de Fechamento</span>
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Se continuar assim, você fechará o mês com <strong className="text-status-success">R$ 420,00</strong> de sobra.
          </p>
        </div>

        <div className="bg-bg-card border border-border-main p-5 rounded-[20px] space-y-4">
          <h3 className="text-[14px] font-bold uppercase tracking-wider text-text-secondary">Maiores Gastos</h3>
          <div className="space-y-4">
            {[
              { label: 'Moradia', value: 45, color: 'bg-brand-primary' },
              { label: 'Alimentação', value: 25, color: 'bg-status-warning' },
              { label: 'Transporte', value: 15, color: 'bg-status-info' },
              { label: 'Outros', value: 15, color: 'bg-text-secondary' },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="font-bold text-text-primary">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GoalsScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-text-secondary text-sm">Foco no seu futuro</p>
        </div>
        <button className="p-2 bg-brand-primary/10 text-brand-primary rounded-full"><Plus size={20} /></button>
      </header>

      <div className="space-y-6">
        <div className="bg-bg-card border border-border-main p-6 rounded-[20px] space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold text-[15px]">Reserva de Emergência</h3>
              <p className="text-text-secondary text-[12px]">Meta: {formatCurrency(10000)}</p>
            </div>
            <div className="bg-status-success/10 text-status-success px-2 py-1 rounded-[6px] text-[10px] font-bold">NO CAMINHO</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{formatCurrency(6500)}</span>
              <span className="text-text-secondary text-sm">65%</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-status-success rounded-full"
              ></motion.div>
            </div>
          </div>

          <p className="text-[12px] text-text-secondary text-center">Faltam <span className="font-bold text-text-primary">R$ 3.500</span> para atingir seu objetivo.</p>
        </div>

        <div className="bg-bg-card border border-border-main p-6 rounded-[20px] space-y-6 opacity-60">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold text-[15px]">Viagem Japão</h3>
              <p className="text-text-secondary text-[12px]">Meta: {formatCurrency(15000)}</p>
            </div>
            <div className="bg-bg-elevated text-text-secondary px-2 py-1 rounded-[6px] text-[10px] font-bold">PAUSADA</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{formatCurrency(1200)}</span>
              <span className="text-text-secondary text-sm">8%</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary w-[8%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsScreen = ({ theme, onToggleTheme, onNavigate }: { theme: 'dark' | 'light', onToggleTheme: () => void, onNavigate: (s: Screen) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <header>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-text-secondary text-sm">Sua conta, suas regras</p>
      </header>

      <div className="bg-bg-card border border-border-main rounded-[24px] overflow-hidden">
        <div className="p-5 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-bg-elevated rounded-[12px] text-brand-secondary">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="font-bold text-[14px]">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          </div>
          <button 
            onClick={onToggleTheme}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              theme === 'dark' ? "bg-brand-primary" : "bg-bg-elevated"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
              theme === 'dark' ? "right-1" : "left-1"
            )}></div>
          </button>
        </div>

        {[
          { id: 'settings_account', icon: Wallet, label: 'Minhas Contas' },
          { id: 'settings_notifications', icon: Bell, label: 'Notificações' },
          { id: 'settings_goals', icon: Target, label: 'Preferências de Meta' },
          { id: 'settings_security', icon: Shield, label: 'Segurança' },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => onNavigate(item.id as Screen)}
            className="w-full p-5 border-b border-border-main flex items-center justify-between last:border-0 active:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-bg-elevated rounded-[12px] text-text-secondary">
                <item.icon size={20} />
              </div>
              <span className="font-bold text-[14px] text-text-primary">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-text-secondary opacity-50" />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] ml-1">Área de Risco</p>
        <button 
          onClick={() => onNavigate('settings_reset')}
          className="w-full p-5 bg-bg-card border border-border-main rounded-[24px] flex items-center justify-between active:bg-status-danger/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-secondary rounded-[12px]">
              <Sparkles size={20} />
            </div>
            <span className="font-bold text-[14px] text-brand-secondary">Configurar novamente</span>
          </div>
          <ChevronRight size={18} className="text-brand-secondary opacity-50" />
        </button>
      </div>

      <button className="w-full py-5 text-status-danger font-bold text-[14px] bg-status-danger/5 rounded-[24px] active:scale-[0.98] transition-all">
        Sair da conta
      </button>
    </motion.div>
  );
};

const AccountSettings = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Minha Conta</h1>
      </header>
      
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary border-4 border-bg-card shadow-xl">
          <span className="text-3xl font-bold">CA</span>
        </div>
        <button className="text-brand-secondary font-bold text-sm">Alterar foto</button>
      </div>

      <div className="space-y-6">
        {[
          { label: 'Nome completo', value: 'Carlos Alberto' },
          { label: 'E-mail', value: 'carlosalbertotorelli@gmail.com' },
          { label: 'Telefone', value: '+55 11 99999-9999' },
          { label: 'Moeda principal', value: 'Real (R$)' },
        ].map(field => (
          <div key={field.label} className="space-y-2">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">{field.label}</label>
            <input 
              type="text" 
              defaultValue={field.value}
              className="w-full bg-bg-card border border-border-main rounded-[20px] py-4 px-5 text-[15px] focus:border-brand-primary outline-none transition-all"
            />
          </div>
        ))}
        <button className="w-full bg-brand-primary py-4 rounded-[24px] font-bold text-white shadow-lg shadow-brand-primary/20 mt-4">
          Salvar Alterações
        </button>
      </div>
    </motion.div>
  );
};

const NotificationSettings = ({ onBack }: { onBack: () => void }) => {
  const [settings, setSettings] = useState({
    daily: true,
    budget: true,
    goals: true,
    weekly: false,
    push: true,
    email: false
  });

  const items = [
    { id: 'daily', title: 'Lembrete diário', desc: 'Aviso para registrar seus gastos do dia.' },
    { id: 'budget', title: 'Alerta de orçamento', desc: 'Quando atingir 80% do limite mensal.' },
    { id: 'goals', title: 'Aviso de meta', desc: 'Novidades sobre suas metas de poupança.' },
    { id: 'weekly', title: 'Resumo semanal', desc: 'Um relatório completo do seu progresso.' },
    { id: 'push', title: 'Notificações Push', desc: 'Alertas em tempo real no seu celular.' },
    { id: 'email', title: 'E-mail', desc: 'Relatórios e novidades por e-mail.' },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      <div className="bg-bg-card border border-border-main rounded-[24px] overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="p-5 border-b border-border-main flex items-center justify-between last:border-0">
            <div className="flex-1 pr-4">
              <p className="font-bold text-[14px] text-text-primary">{item.title}</p>
              <p className="text-[12px] text-text-secondary mt-0.5">{item.desc}</p>
            </div>
            <button 
              onClick={() => setSettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative shrink-0",
                settings[item.id as keyof typeof settings] ? "bg-brand-primary" : "bg-bg-elevated"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                settings[item.id as keyof typeof settings] ? "right-1" : "left-1"
              )}></div>
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const GoalSettings = ({ onBack }: { onBack: () => void }) => {
  const [mode, setMode] = useState<'conservador' | 'moderado' | 'agressivo'>('moderado');
  const [percent, setPercent] = useState(20);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Preferências de Meta</h1>
      </header>

      <div className="space-y-6">
        <div className="bg-bg-card border border-border-main p-6 rounded-[24px] space-y-4">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Quanto quer poupar?</label>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-brand-secondary">{percent}%</span>
            <span className="text-sm text-text-secondary">da sua renda</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="50" 
            value={percent}
            onChange={(e) => setPercent(parseInt(e.target.value))}
            className="w-full h-1.5 bg-bg-elevated rounded-full appearance-none accent-brand-primary cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Perfil de Poupança</label>
          <div className="grid grid-cols-1 gap-3">
            {(['conservador', 'moderado', 'agressivo'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "p-5 rounded-[24px] border text-left transition-all",
                  mode === m ? "bg-brand-primary/10 border-brand-primary" : "bg-bg-card border-border-main"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold capitalize text-[15px]">{m}</span>
                  {mode === m && <CheckCircle2 size={20} className="text-brand-primary" />}
                </div>
                <p className="text-[12px] text-text-secondary mt-1">
                  {m === 'conservador' && 'Foco em segurança, poupando o essencial.'}
                  {m === 'moderado' && 'Equilíbrio entre gastos e economia futura.'}
                  {m === 'agressivo' && 'Máxima economia para metas rápidas.'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand-primary/5 border border-brand-primary/10 p-5 rounded-[24px]">
          <p className="text-[12px] text-brand-secondary leading-relaxed">
            <strong>Impacto:</strong> Sua IA usará este perfil para sugerir se você deve ou não fazer uma compra baseada no saldo restante do mês.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const SecuritySettings = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Segurança</h1>
      </header>

      <div className="space-y-6">
        <div className="bg-bg-card border border-border-main rounded-[24px] overflow-hidden">
          <button className="w-full p-5 border-b border-border-main flex items-center justify-between active:bg-bg-elevated transition-colors">
            <span className="font-bold text-[14px]">Alterar senha</span>
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
          <div className="p-5 border-b border-border-main flex items-center justify-between">
            <span className="font-bold text-[14px]">Face ID / Biometria</span>
            <div className="w-12 h-6 bg-brand-primary rounded-full relative">
              <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className="font-bold text-[14px]">Autenticação 2FA</span>
            <div className="w-12 h-6 bg-bg-elevated rounded-full relative">
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1">Sessões Ativas</label>
          <div className="bg-bg-card border border-border-main p-5 rounded-[24px] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bg-elevated rounded-lg text-brand-primary">
                  <Home size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-bold">iPhone 15 Pro</p>
                  <p className="text-[11px] text-text-secondary">São Paulo, Brasil • Agora</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-status-success uppercase">Atual</span>
            </div>
            <button className="w-full py-3 text-status-danger font-bold text-[12px] border border-status-danger/20 rounded-xl">
              Encerrar todas as sessões
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ResetSettings = ({ onBack }: { onBack: () => void }) => {
  const [confirm, setConfirm] = useState('');
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Zerar Experiência</h1>
      </header>

      <div className="bg-status-danger/5 border border-status-danger/20 p-6 rounded-[24px] space-y-4 text-center">
        <div className="w-16 h-16 bg-status-danger/10 text-status-danger rounded-full flex items-center justify-center mx-auto">
          <X size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-status-danger">Atenção Total</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Ao resetar sua conta, todos os lançamentos, metas e o aprendizado da sua IA serão apagados permanentemente.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-text-secondary text-center">Digite <strong className="text-text-primary">RESETAR</strong> para confirmar</p>
        <input 
          type="text" 
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="RESETAR"
          className="w-full bg-bg-card border border-border-main rounded-[20px] py-4 px-5 text-center font-bold tracking-widest focus:border-status-danger outline-none transition-all"
        />
        <button 
          disabled={confirm !== 'RESETAR'}
          className="w-full bg-status-danger py-4 rounded-[24px] font-bold text-white shadow-lg shadow-status-danger/20 disabled:opacity-30 transition-all"
        >
          Resetar Conta
        </button>
      </div>
    </motion.div>
  );
};

const NotificationCenter = ({ 
  notifications, 
  onClose, 
  onMarkAsRead 
}: { 
  notifications: Notification[], 
  onClose: () => void,
  onMarkAsRead: (id: string) => void
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-bg-main z-[100] flex flex-col"
    >
      <header className="p-6 border-b border-border-main flex items-center gap-4">
        <button onClick={onClose} className="p-2 bg-bg-card border border-border-main rounded-full">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-4">
            <Bell size={48} className="opacity-20" />
            <p className="text-sm">Nenhuma notificação por aqui.</p>
          </div>
        ) : (
          notifications.map(n => (
            <button 
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={cn(
                "w-full text-left p-5 rounded-[24px] border transition-all relative overflow-hidden",
                n.read ? "bg-bg-card border-border-main opacity-60" : "bg-bg-card border-brand-primary shadow-lg shadow-brand-primary/5"
              )}
            >
              {!n.read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
              )}
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-[13px] font-bold",
                  n.type === 'success' ? "text-status-success" : 
                  n.type === 'warning' ? "text-status-warning" : "text-brand-secondary"
                )}>
                  {n.title}
                </span>
                <span className="text-[10px] text-text-secondary">{n.time}</span>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{n.message}</p>
            </button>
          ))
        )}
      </div>

      <div className="p-6 border-t border-border-main bg-bg-card">
        <button 
          onClick={onClose}
          className="w-full bg-brand-primary py-4 rounded-[24px] font-bold text-white shadow-lg shadow-brand-primary/20"
        >
          Fechar
        </button>
      </div>
    </motion.div>
  );
};

const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-4 bottom-24 bg-bg-card border border-border-main rounded-[24px] z-[70] shadow-2xl flex flex-col overflow-hidden"
    >
      <header className="p-4 border-b border-border-main flex justify-between items-center bg-brand-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-[10px] flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-[14px]">Flow AI</h3>
            <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-bg-elevated rounded-full transition-colors">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
        <div className="bg-bg-elevated p-3 rounded-[16px] rounded-tl-none max-w-[85%]">
          <p className="text-[13px] leading-relaxed">Olá Carlos! Analisei seus gastos de hoje. Você ainda tem <span className="font-bold text-brand-secondary">R$ 48,34</span> para gastar dentro da sua meta. Alguma dúvida sobre seu orçamento?</p>
        </div>
        
        <div className="flex justify-end">
          <div className="bg-brand-primary p-3 rounded-[16px] rounded-tr-none max-w-[85%] text-white shadow-lg shadow-brand-primary/20">
            <p className="text-[13px] leading-relaxed">Posso pedir um iFood hoje?</p>
          </div>
        </div>

        <div className="bg-bg-elevated p-3 rounded-[16px] rounded-tl-none max-w-[85%]">
          <p className="text-[13px] leading-relaxed">Se o pedido for até <span className="font-bold text-text-primary">R$ 45,00</span>, sim! Mas lembre-se que você já gastou bastante com delivery esta semana. Que tal cozinhar algo hoje para garantir a meta da viagem?</p>
        </div>
      </div>

      <div className="p-4 border-t border-border-main bg-bg-main">
        <div className="relative">
          <input 
            placeholder="Pergunte ao Flow..."
            className="w-full bg-bg-elevated border border-border-main rounded-full py-3 px-4 pr-12 text-[13px] focus:outline-none focus:border-brand-primary"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-full">
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAIActive, setIsAIActive] = useState(false);
  const [isNotificationActive, setIsNotificationActive] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
    
    // Check for /admin path (hidden route)
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setCurrentScreen('admin');
    }
  }, [theme]);

  const saveTransaction = (t: Transaction) => {
    setTransactions(prev => {
      const exists = prev.find(item => item.id === t.id);
      if (exists) {
        return prev.map(item => item.id === t.id ? t : item);
      }
      return [...prev, t];
    });
    setTransactionToEdit(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setSelectedTransaction(null);
  };

  const handleEdit = (t: Transaction) => {
    setTransactionToEdit(t);
    setSelectedTransaction(null);
    setCurrentScreen('add');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const hasUnreadNotifications = notifications.some(n => !n.read);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home': return (
        <HomeScreen 
          transactions={transactions} 
          onNotificationClick={() => setIsNotificationActive(true)}
          hasUnread={hasUnreadNotifications}
        />
      );
      case 'statement': return <StatementScreen transactions={transactions} onTransactionClick={setSelectedTransaction} />;
      case 'insights': return <InsightsScreen />;
      case 'admin': return <AdminScreen />;
      case 'goals': return <GoalsScreen />;
      case 'settings': return <SettingsScreen theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onNavigate={setCurrentScreen} />;
      case 'settings_account': return <AccountSettings onBack={() => setCurrentScreen('settings')} />;
      case 'settings_notifications': return <NotificationSettings onBack={() => setCurrentScreen('settings')} />;
      case 'settings_goals': return <GoalSettings onBack={() => setCurrentScreen('settings')} />;
      case 'settings_security': return <SecuritySettings onBack={() => setCurrentScreen('settings')} />;
      case 'settings_reset': return <ResetSettings onBack={() => setCurrentScreen('settings')} />;
      default: return (
        <HomeScreen 
          transactions={transactions} 
          onNotificationClick={() => setIsNotificationActive(true)}
          hasUnread={hasUnreadNotifications}
        />
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-bg-main relative overflow-x-hidden">
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-bg-main relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      <AnimatePresence>
        {(currentScreen === 'add' || transactionToEdit) && (
          <AddScreen 
            onBack={() => {
              setCurrentScreen('home');
              setTransactionToEdit(null);
            }} 
            onSave={saveTransaction} 
            transactionToEdit={transactionToEdit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAIActive && <AIAssistant onClose={() => setIsAIActive(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationActive && (
          <NotificationCenter 
            notifications={notifications} 
            onClose={() => setIsNotificationActive(false)}
            onMarkAsRead={markNotificationAsRead}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTransaction && (
          <TransactionDetailModal 
            transaction={selectedTransaction} 
            onClose={() => setSelectedTransaction(null)} 
            onEdit={handleEdit}
            onDelete={deleteTransaction}
          />
        )}
      </AnimatePresence>

      {/* Floating AI Trigger */}
      {currentScreen !== 'add' && (
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAIActive(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-bg-card border border-border-main rounded-full flex items-center justify-center shadow-2xl z-40 text-brand-primary"
        >
          <Sparkles size={24} />
        </motion.button>
      )}

      <BottomNav active={currentScreen} onChange={setCurrentScreen} />
    </div>
  );
}
