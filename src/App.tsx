import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Lightbulb, 
  Settings, 
  ChevronRight, 
  Copy, 
  History, 
  Trash2, 
  X, 
  Plus, 
  Info,
  Globe,
  Zap,
  Layers,
  Activity,
  Sun,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Stock {
  name: string;
  desc?: string;
}

interface Sector {
  id: string;
  name: string;
  full: string;
  keywords: string;
}

interface HistoryEntry {
  id: number;
  menuId: string;
  menu: string;
  prompt: string;
  time: string;
}

// --- Constants ---
const US_STOCKS = ['Apple', 'Microsoft', 'NVIDIA', 'Tesla', 'Google', 'Amazon', 'Meta', 'Netflix', 'AMD', 'Intel'];

const SECTORS: Sector[] = [
  { id: 'ai', name: 'AI', full: 'AI 인공지능', keywords: 'AI, 머신러닝, LLM, GPU' },
  { id: 'semiconductor', name: '반도체', full: '반도체', keywords: 'HBM, 메모리, 파운드리' },
  { id: 'battery', name: '2차전지', full: '2차전지', keywords: '전기차 배터리, ESS' },
  { id: 'bio', name: '바이오', full: '바이오/제약', keywords: '신약, CDMO, 임상' },
  { id: 'platform', name: 'IT플랫폼', full: 'IT 플랫폼', keywords: '포털, 커머스, 핀테크' },
  { id: 'defense', name: '방산', full: '방산', keywords: '글로벌 방산, 수출' },
  { id: 'energy', name: '에너지', full: '에너지', keywords: '수소, 원자력, 신재생' },
  { id: 'finance', name: '금융', full: '금융', keywords: '은행, 증권, 보험' },
  { id: 'consumer', name: '소비재', full: '소비재', keywords: '화장품, 식품, 유통' },
  { id: 'auto', name: '자동차', full: '자동차', keywords: '전기차, 자율주행' },
  { id: 'shipbuilding', name: '조선/해운', full: '조선/해운', keywords: 'LNG선, 컨테이너선, 해운' },
  { id: 'entertainment', name: '엔터/게임', full: '엔터테인먼트/게임', keywords: '스트리밍, 드라마, 게임' },
  { id: 'robot', name: '로봇', full: '로봇/자동화', keywords: '산업용로봇, 휴머노이드' },
  { id: 'travel', name: '항공/여행', full: '항공/여행', keywords: '항공사, 여행사, 면세점' },
  { id: 'construction', name: '건설', full: '건설/인프라', keywords: '아파트, SOC, 플랜트' },
  { id: 'telecom', name: '통신', full: '통신', keywords: '5G, 인터넷, 배당' }
];

// --- Components ---

const OptionButtons = ({ label, options, value, onChange, cols = 3 }: { label: string, options: string[], value: string, onChange: (v: string) => void, cols?: number }) => (
  <div className="mb-6">
    {label && <div className="text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
      <div className="w-1 h-4 bg-blue-500 rounded-full" />
      {label}
    </div>}
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
            value === opt
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 active:scale-95'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const DropdownSelect = ({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="mb-6">
    {label && <div className="text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
      <div className="w-1 h-4 bg-blue-500 rounded-full" />
      {label}
    </div>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium text-slate-700 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all appearance-none cursor-pointer"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('morning');
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [promptHistory, setPromptHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const menus = [
    { id: 'morning', name: '모닝브리핑', icon: <Sun size={18} />, color: 'from-orange-500 to-amber-500' },
    { id: 'recommend', name: '종목발굴', icon: <Lightbulb size={18} />, color: 'from-blue-500 to-indigo-500' },
    { id: 'discovery', name: '내종목', icon: <Search size={18} />, color: 'from-emerald-500 to-teal-500' },
  ];

  const [recommendOpt, setRecommendOpt] = useState({ sector: 'ai', type: '성장주', period: '6개월', growthRate: '30%', count: '5개' });

  useEffect(() => {
    if (generatedPrompt && !isLoadingFromHistory) {
      const menuName = menus.find(m => m.id === currentMenu)?.name || '';
      const newEntry: HistoryEntry = {
        id: Date.now(),
        menuId: currentMenu,
        menu: menuName,
        prompt: generatedPrompt,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setPromptHistory(prev => [newEntry, ...prev].slice(0, 10));
    }
  }, [generatedPrompt]);

  const toggleStock = (name: string) => {
    setSelectedStocks(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const addCustomStock = () => {
    if (inputRef.current) {
      const value = inputRef.current.value.trim();
      if (value && !selectedStocks.includes(value)) {
        setSelectedStocks(prev => [...prev, value]);
        inputRef.current.value = '';
      }
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setIsLoadingFromHistory(true);
    setCurrentMenu(entry.menuId);
    setGeneratedPrompt(entry.prompt);
    setTimeout(() => {
      setIsLoadingFromHistory(false);
      const el = document.getElementById('promptTextarea');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const copyToClipboard = () => {
    const ta = document.getElementById('promptTextarea') as HTMLTextAreaElement;
    if (ta) {
      ta.select();
      document.execCommand('copy');
      alert('✅ 복사 완료!\n\nChatGPT, Claude, Gemini에 붙여넣기 하세요.');
    }
  };

  // --- Prompt Generators (Simplified for space but keeping logic) ---
  const generatePrompt = (type: string) => {
    let prompt = "";
    const today = new Date().toLocaleDateString('ko-KR');
    const list = selectedStocks.join(', ');

    switch(type) {
      case 'morning':
        prompt = `🌅 오늘의 미국 시장 모닝브리핑\n\n📅 기준일: ${today}\n\nR (Role) - 역할\n당신은 20년 경력의 미국 시장 분석 전문가입니다. 매일 새벽 뉴욕 증시 마감 상황과 최신 글로벌 이슈를 분석하여 시장의 흐름과 핵심 테마를 정리합니다.\n\nI (Instruction) - 지시사항\n오늘 미국 시장의 핵심 정보와 테마를 분석해주세요.\n- 분석 대상: 미국 시장 (Nasdaq, NYSE)\n- 뉴스 범위: 정치테마, 기업공시, 글로벌 이슈, 테마급등 전체\n\n⚠️ 매우 중요: 반드시 Web Search를 통해 최신 뉴스와 실시간 주가를 조회하세요. 학습 데이터의 과거 주가를 사용하지 마세요.\n\nC (Context) - 맥락\n시장 정보 수집 및 테마 분석에 집중하며, 거시 경제 흐름과 개별 기업의 주요 공시가 시장에 미치는 영향을 파악하는 것이 핵심입니다.\n\nE (Example) - 출력 형식\n1. 뉴욕 증시 마감 요약 (지수 등락 및 주요 특징)\n2. 핵심 뉴스 & 테마 분석 (정치, 공시, 글로벌 이슈 등)\n3. 주요 섹터 및 종목 동향\n4. 실시간 현재가/등락 (Web Search 필수)\n5. 오늘의 시장 관전 포인트`;
        break;
      case 'recommend':
        const sector = SECTORS.find(s => s.id === recommendOpt.sector);
        prompt = `💡 ${sector?.full} ${recommendOpt.type} 발굴\n\nR (Role) - 역할\n당신은 20년 경력의 ${sector?.full} 섹터 전문 애널리스트입니다. CFA 자격을 보유하고 있으며 산업 리서치 센터장 경력이 있습니다.\n\nI (Instruction) - 지시사항\n다음 조건에 맞는 ${recommendOpt.count} 종목을 발굴해주세요.\n- 섹터: ${sector?.full}\n- 투자 스타일: ${recommendOpt.type}\n- 투자 기간: ${recommendOpt.period}\n- 목표 수익률: ${recommendOpt.growthRate} 이상\n\n스크리닝 필터: PEG 1.5 이하, 매출 CAGR 15%+, 영업이익률 개선 여부 확인.\n\nC (Context) - 맥락\n현재 시장 상황과 업황을 고려하여 글로벌 경쟁사 대비 미국 기업의 경쟁력을 평가합니다.\n\nE (Example) - 출력 형식\n- 종목명 및 핵심 투자포인트\n- 밸류에이션/수익성/성장성 지표\n- 리스크 요인 및 모니터링 포인트\n- 매매 전략 (적정가, 목표가, 분할매수 가이드)`;
        break;
      case 'discovery':
        prompt = `🔍 관심종목 심층 분석\n\n분석 대상: ${list}\n\nR (Role) - 역할\n당신은 글로벌 투자은행의 수석 리서치 애널리스트입니다. 정량적/정성적 분석 모두에 능통합니다.\n\nI (Instruction) - 지시사항\n선택된 종목들을 심층 분석해주세요. 각 종목의 현재 주가와 시가총액을 웹에서 실시간 조회하여 반영하세요.\n\n분석 항목:\n1. 사업 모델 및 핵심 경쟁력\n2. 실시간 밸류에이션 평가\n3. SWOT 분석 (S/W/O/T)\n4. 투자 매력도 (5점 만점)\n\nC (Context) - 맥락\n6개월~1년 투자 관점에서 시장 대비 초과 수익을 목표로 합니다.\n\nE (Example) - 출력 형식\n- 종목별 상세 분석 카드\n- 종합 비교표\n- 투자 우선순위 제안`;
        break;
    }
    setGeneratedPrompt(prompt);
  };

  const StockSelector = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-blue-500" size={20} />
          종목 선택
        </h3>
        {selectedStocks.length > 0 && (
          <button onClick={() => setSelectedStocks([])} className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-3 py-1 rounded-lg transition">초기화</button>
        )}
      </div>
      
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            ref={inputRef} 
            type="text" 
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl text-slate-700 focus:border-blue-500 focus:outline-none transition-all" 
            placeholder="종목명 직접 입력" 
          />
        </div>
        <button onClick={addCustomStock} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2">
          <Plus size={18} />
          추가
        </button>
      </div>
      
      <AnimatePresence>
        {selectedStocks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100"
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-blue-800">✅ 선택됨 ({selectedStocks.length}개)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map(stock => (
                <motion.span 
                  layout
                  key={stock} 
                  className="bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {stock}
                  <button onClick={() => toggleStock(stock)} className="hover:text-rose-500 transition">
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🇺🇸 미국 주요 종목</p>
          <div className="flex flex-wrap gap-2">
            {US_STOCKS.map(stock => (
              <button 
                key={stock} 
                onClick={() => toggleStock(stock)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  selectedStocks.includes(stock) 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                {stock}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">
                  STOCK ANALYZER <span className="text-blue-600">PRO</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">AI Powered Investment Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition">
                <Settings size={20} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              {menus.map(menu => (
                <button
                  key={menu.id}
                  onClick={() => { setCurrentMenu(menu.id); setGeneratedPrompt(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    currentMenu === menu.id
                      ? `bg-gradient-to-r ${menu.color} text-white shadow-lg shadow-slate-200 scale-105`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {menu.icon}
                  <span>{menu.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMenu}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Menu Sections */}
            {currentMenu === 'morning' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                      <Sun size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">모닝브리핑</h2>
                      <p className="text-slate-500 font-medium">미국 시장 정보 수집 및 테마 분석</p>
                    </div>
                  </div>
                  
                  <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 mb-2">분석 범위</p>
                    <ul className="text-xs text-blue-700 space-y-1 font-medium">
                      <li>• 시장: 미국 시장 (Nasdaq, NYSE)</li>
                      <li>• 뉴스: 정치테마, 기업공시, 글로벌 이슈, 테마급등 전체</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      이 프롬프트는 미국 시장의 최신 흐름을 파악하기 위해 <strong>실시간 검색</strong>이 가능한 AI(Perplexity, Gemini 등)에서 사용하세요.
                    </p>
                  </div>
                </div>
                <button onClick={() => generatePrompt('morning')} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 transition-all active:scale-[0.98]">
                  브리핑 프롬프트 생성
                </button>
              </div>
            )}

            {currentMenu === 'recommend' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Lightbulb size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">신규종목 발굴</h2>
                      <p className="text-slate-500 font-medium">조건별 유망 종목 스크리닝 및 추천</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <div className="text-sm font-semibold mb-4 text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      🎯 섹터 선택
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {SECTORS.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setRecommendOpt({...recommendOpt, sector: s.id})}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                            recommendOpt.sector === s.id 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                              : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <OptionButtons label="📊 투자 스타일" options={['성장주','가치주','배당주']} value={recommendOpt.type} onChange={v => setRecommendOpt({...recommendOpt, type: v})} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DropdownSelect label="📅 투자 기간" options={['1개월','3개월','6개월','1년','2년','3년']} value={recommendOpt.period} onChange={v => setRecommendOpt({...recommendOpt, period: v})} />
                    <DropdownSelect label="📈 목표 수익률" options={['10%','20%','30%','50%','100%']} value={recommendOpt.growthRate} onChange={v => setRecommendOpt({...recommendOpt, growthRate: v})} />
                  </div>
                  
                  <OptionButtons label="🔢 추천 개수" options={['3개','5개','10개']} value={recommendOpt.count} onChange={v => setRecommendOpt({...recommendOpt, count: v})} cols={3} />
                </div>
                <button onClick={() => generatePrompt('recommend')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">
                  RICE 프롬프트 생성
                </button>
              </div>
            )}

            {currentMenu === 'discovery' && (
              <div className="space-y-6">
                <StockSelector />
                {selectedStocks.length > 0 && (
                  <button onClick={() => generatePrompt('discovery')} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]">
                    심층 분석 프롬프트 생성
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Generated Prompt Output */}
        <AnimatePresence>
          {generatedPrompt && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300 border border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white">RICE 프롬프트</h3>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center gap-2"
                >
                  <Copy size={16} />
                  복사하기
                </button>
              </div>
              <div className="relative">
                <textarea
                  id="promptTextarea"
                  value={generatedPrompt}
                  readOnly
                  className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 font-mono leading-relaxed resize-none focus:outline-none"
                />
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready to Paste</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Globe className="text-blue-400 shrink-0" size={18} />
                <p className="text-xs text-blue-300 font-medium">
                  복사한 내용을 <strong>ChatGPT, Claude, Gemini</strong>에 붙여넣어 심층 분석을 시작하세요.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {promptHistory.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History className="text-slate-400" size={20} />
                최근 히스토리
              </h3>
              <button 
                onClick={() => setPromptHistory([])}
                className="text-xs font-bold text-rose-500 flex items-center gap-1.5 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
              >
                <Trash2 size={14} />
                전체 삭제
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {promptHistory.map((entry) => (
                <button 
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform" />
                    <div>
                      <p className="text-sm font-black text-slate-800">{entry.menu}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{entry.time}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-slate-200 text-center">
          <div className="max-w-md mx-auto p-6 bg-slate-100 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-center gap-2 mb-3 text-rose-500">
              <AlertTriangle size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Investment Warning</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              본 서비스에서 제공하는 정보는 투자 참고용이며, 투자에 대한 최종 책임은 본인에게 있습니다.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
