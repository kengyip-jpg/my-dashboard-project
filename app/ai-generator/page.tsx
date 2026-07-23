'use client';

import { useState, useEffect, useRef } from 'react';

const ENVIRONMENTS = [
  { id: 'shop office', name: 'Shop office', cost: 1000 },
  { id: '2-sty terrace', name: '2-sty terrace', cost: 500 },
  { id: 'semi detached', name: 'Semi Detached', cost: 1250 },
  { id: 'bungalow', name: 'Bungalow ', cost: 2000 }
];

const FURNITURES = [
  { id: 'leather sofa', name: 'Leather Sofa', cost: 800 },
  { id: 'industrial metal desk', name: 'Industrial Metal Desk', cost: 500 },
  { id: 'minimalist double bed', name: 'Minimalist Double Bed', cost: 1200 },
  { id: 'luxury crystal chandelier', name: 'Luxury Crystal Chandelier', cost: 2500 },
  { id: 'indoor potted plant', name: 'Large Indoor Potted Plant', cost: 200 },
  { id: 'vintage persian rug', name: 'Vintage Persian Rug', cost: 400 },
  { id: 'marble coffee table', name: 'Marble Coffee Table', cost: 600 },
  { id: 'abstract wall art', name: 'Abstract Canvas Wall Art', cost: 300 },
  { id: 'smart ambient tv', name: 'Smart TV with Ambient Lights', cost: 1100 },
  { id: 'hanging rattan chair', name: 'Hanging Rattan Swing Chair', cost: 350 },
  { id: 'modern floor lamp', name: 'Modern Arc Floor Lamp', cost: 150 },
  { id: 'solid oak bookshelf', name: 'Solid Oak Bookshelf', cost: 750 },
  { id: 'gaming setup', name: 'High-End RGB Gaming Setup', cost: 1800 }
];

const PERSONAS = [
  { id: 'none', name: 'Just the Room', icon: '🏠', desc: 'Focus purely on interior design' },
  { id: 'urban_exec', name: 'Urban Executive', icon: '👨‍💼', desc: 'Modern, sharp, and professional' },
  { id: 'zen_master', name: 'Zen Master', icon: '🧘‍♀️', desc: 'Calm, minimalist, and peaceful' },
  { id: 'vacationer', name: 'The Vacationer', icon: '🏖️', desc: 'Relaxed, breezy, and joyful' },
  { id: 'gamer', name: 'Pro Gamer', icon: '🎮', desc: 'Tech-savvy with neon vibes' }
];

const INITIAL_BUDGET = 10000;
const MAX_GENERATIONS = 3;

export default function AiGeneratorPage() {
  const [selectedEnvId, setSelectedEnvId] = useState(ENVIRONMENTS[0].id);
  const [selectedFurnIds, setSelectedFurnIds] = useState<string[]>([FURNITURES[0].id]);
  const [description, setDescription] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState(PERSONAS[0].id);

  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🛠️ 新增：開發者模式狀態
  const [isDevMode, setIsDevMode] = useState(false);
  
  // 🎯 新增：用來鎖定結果區塊的 Ref
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCount = localStorage.getItem('ai-generator-usage');
    if (savedCount) setUsageCount(parseInt(savedCount, 10));
  }, []);

  // 🚀 新增：當 resultImage 改變且不為載入中時，自動平滑滾動到結果區
  useEffect(() => {
    if (resultImage && !loading && resultRef.current) {
      // 給一點點微小延遲讓 DOM 渲染完成後再滾動，體驗更順暢
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [resultImage, loading]);

  const currentEnv = ENVIRONMENTS.find(e => e.id === selectedEnvId) || ENVIRONMENTS[0];
  const selectedFurns = FURNITURES.filter(f => selectedFurnIds.includes(f.id));
  const activePersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];
  
  const furnituresCost = selectedFurns.reduce((sum, furn) => sum + furn.cost, 0);
  const totalCost = currentEnv.cost + furnituresCost;
  const remainingBudget = INITIAL_BUDGET - totalCost;
  
  const isOverBudget = remainingBudget < 0;
  const isNoFurnitureSelected = selectedFurnIds.length === 0;
  const isLimitReached = usageCount >= MAX_GENERATIONS;

  const handleFurnitureToggle = (furnId: string) => {
    setSelectedFurnIds(prev => {
      if (prev.includes(furnId)) return prev.filter(id => id !== furnId);
      return [...prev, furnId];
    });
  };

  const handleReset = () => {
    setSelectedEnvId(ENVIRONMENTS[0].id);
    setSelectedFurnIds([FURNITURES[0].id]);
    setDescription('');
    setResultImage('');
    setErrorMsg('');
    setIsDropdownOpen(false);
    setSelectedPersonaId(PERSONAS[0].id);
  };

  const handleGenerate = async () => {
    if (isOverBudget || isNoFurnitureSelected || isLimitReached) return;
    
    setLoading(true);
    setResultImage('');
    setErrorMsg('');
    setIsDropdownOpen(false);
    
    const furnitureNamesString = selectedFurns.map(f => f.name).join(', ');
    let finalDescription = description;
    if (activePersona.id !== 'none') {
      finalDescription = `${description} The room features a person representing a ${activePersona.name} (${activePersona.desc}). They blend naturally into the environment.`;
    }

    // 🛠️ 開發者模式攔截邏輯
    if (isDevMode) {
      console.log("🛠️ Dev Mode Active: Skipping API call.");
      console.log("Mock Payload:", { environment: currentEnv.name, furniture: furnitureNamesString, description: finalDescription });
      
      // 模擬網路延遲 2 秒，然後塞一張高畫質的假圖進去
      setTimeout(() => {
        setResultImage('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80'); 
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('ai-generator-usage', newCount.toString());
        setLoading(false);
      }, 2000);
      return; // 直接中斷，不執行下方的 fetch
    }

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          environment: currentEnv.name, 
          furniture: furnitureNamesString, 
          description: finalDescription,
        }),
      });
      const data = await response.json();
      
      if (data.imageUrl) {
        setResultImage(data.imageUrl);
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('ai-generator-usage', newCount.toString());
      } else {
        setErrorMsg(data.error || 'Oops! Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToGenerator = () => {
    document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans min-h-screen bg-white">
      
      <section className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white py-24 px-6 text-center shadow-xl">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 text-blue-200 text-sm font-bold tracking-wider mb-6 border border-blue-400/50">PREMIUM EXPERIENCE</span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">Step Into Your Dream Room.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Literally.</span></h1>
          <p className="text-xl md:text-2xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">Take the $10,000 challenge! Build your room, pick your persona, and let our AI bring your lifestyle to life.</p>
          <button onClick={scrollToGenerator} className="bg-white text-indigo-900 font-bold text-xl py-4 px-10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:scale-105 transition-all">Start Designing Now ✨</button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">💰</div><h3 className="text-xl font-bold text-gray-800 mb-2">1. Manage Budget</h3><p className="text-gray-600">You start with $10,000. Choose wisely!</p></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">🛋️</div><h3 className="text-xl font-bold text-gray-800 mb-2">2. Mix & Match</h3><p className="text-gray-600">Select multiple items to build the room.</p></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">🎭</div><h3 className="text-xl font-bold text-gray-800 mb-2">3. Pick Persona</h3><p className="text-gray-600">Select the lifestyle avatar that best represents you.</p></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <div className="text-5xl mb-4">✨</div><h3 className="text-xl font-bold text-gray-800 mb-2">4. Submit via IG</h3><p className="text-gray-600">Share on Instagram using <span className="font-bold text-pink-600">#SPSetiaSpaces</span>!</p>
            </div>
          </div>
        </div>
      </section>

      <section id="generator-section" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Lifestyle Studio</h2>
            <p className="text-gray-500">You have 3 free generations. Make them count!</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 text-teal-900 p-5 rounded-xl font-bold text-xl mb-8 flex justify-between items-center shadow-inner border border-teal-200">
            <span className="flex items-center gap-2">💳 Initial Budget:</span>
            <span className="text-2xl">${INITIAL_BUDGET.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-bold text-gray-700">1. Select Environment</label>
                  <select className="w-full p-4 border border-gray-300 rounded-xl text-black bg-white shadow-sm disabled:bg-gray-100 focus:ring-4 focus:ring-blue-100 transition-all" value={selectedEnvId} onChange={(e) => setSelectedEnvId(e.target.value)} disabled={isLimitReached || loading}>
                    {ENVIRONMENTS.map(env => (
                      <option key={env.id} value={env.id}>{env.name} (+${env.cost})</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block mb-2 font-bold text-gray-700">2. Select Furnitures (Multiple)</label>
                  <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={isLimitReached || loading} className={`w-full p-4 border border-gray-300 rounded-xl text-left bg-white shadow-sm flex justify-between items-center transition-all ${(isLimitReached || loading) ? 'cursor-not-allowed opacity-60' : 'hover:border-blue-300 focus:ring-4 focus:ring-blue-100'}`}>
                    <span className="truncate text-gray-800 font-medium">{selectedFurnIds.length === 0 ? 'Select items...' : `${selectedFurnIds.length} item(s) selected`}</span>
                    <span className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isDropdownOpen && !(isLimitReached || loading) && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                      <div className="p-2 flex flex-col gap-1">
                        {FURNITURES.map(furn => (
                          <label key={furn.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selectedFurnIds.includes(furn.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}>
                            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={selectedFurnIds.includes(furn.id)} onChange={() => handleFurnitureToggle(furn.id)} />
                            <span className="flex-1 text-gray-800 font-medium">{furn.name}</span>
                            <span className="text-gray-500 font-bold">(+${furn.cost})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-3 font-bold text-gray-700">3. Who Are You? (Select Persona)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      disabled={isLimitReached || loading}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        selectedPersonaId === persona.id 
                          ? 'border-pink-500 bg-pink-50 shadow-md transform scale-[1.02]' 
                          : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-4xl">{persona.icon}</span>
                      <span className={`font-bold text-sm ${selectedPersonaId === persona.id ? 'text-pink-700' : 'text-gray-700'}`}>
                        {persona.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">4. Extra Details (Optional)</label>
                <textarea className="w-full p-4 border border-gray-300 rounded-xl text-black disabled:bg-gray-100 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="E.g., cinematic lighting, a sleeping cat..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={isLimitReached || loading} />
              </div>
            </div>

            {/* 右側 Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-inner flex flex-col justify-between h-full">
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-gray-200 pb-4">🧾 Order Summary</h2>
                <div className="flex justify-between mb-4 text-gray-800 font-medium text-lg"><span>🏠 {currentEnv.name}</span><span>${currentEnv.cost}</span></div>
                <div className="mb-4">
                  <span className="text-gray-800 font-bold block mb-2">🛋️ Furnitures:</span>
                  {selectedFurns.length > 0 ? (
                    selectedFurns.map(furn => (
                      <div key={furn.id} className="flex justify-between text-gray-600 pl-6 mb-2"><span>+ {furn.name}</span><span>${furn.cost}</span></div>
                    ))
                  ) : (
                    <div className="text-gray-400 pl-6 italic">No furniture selected</div>
                  )}
                </div>
                
                {activePersona.id !== 'none' && (
                  <div className="mt-6 p-4 bg-pink-100 rounded-xl border border-pink-200">
                    <span className="text-pink-800 font-bold block mb-1">🎭 Active Persona:</span>
                    <span className="text-pink-700 text-sm flex items-center gap-2">
                      {activePersona.icon} {activePersona.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t-2 border-gray-300">
                <div className="flex justify-between font-bold text-xl mb-3 text-gray-800"><span>Total Cost:</span><span>${totalCost.toLocaleString()}</span></div>
                <div className={`flex justify-between font-black text-2xl ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}><span>Remaining:</span><span>${remainingBudget.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          {errorMsg && <div className="mb-6 p-5 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-lg font-bold">⚠️ {errorMsg}</div>}

          <button onClick={handleGenerate} disabled={loading || isOverBudget || isNoFurnitureSelected || isLimitReached} className={`w-full font-bold py-5 rounded-2xl text-xl text-white shadow-xl transition-all flex justify-center items-center gap-3 ${isLimitReached ? 'bg-red-500 cursor-not-allowed' : (isOverBudget || isNoFurnitureSelected) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 hover:scale-[1.02] active:scale-95'}`}>
            {isLimitReached ? '❌ Limit Reached (3/3)' : loading ? (<><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Crafting Your Perfect Space... 🪄</>) : '✨ Generate My Room'}
          </button>

          {/* 🎯 綁定 Ref 的生成結果區 */}
          {resultImage && !loading && (
             <div ref={resultRef} className="mt-12 border border-gray-100 p-8 rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center animate-fade-in-up">
               {isDevMode && <span className="mb-4 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-400">⚠️ Developer Mode: Mock Image</span>}
               <h2 className="text-3xl font-extrabold mb-8 text-gray-900">Your Masterpiece</h2>
               <img src={resultImage} alt="Generated Design" className="w-full max-w-3xl rounded-2xl shadow-lg mb-8 border border-gray-100" />
               <button onClick={handleReset} className="w-full max-w-md bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all">🔄 Start Over</button>
             </div>
          )}

        </div>
      </section>

      {/* 🛠️ 放再頁尾上方、極度低調的開發者開關 */}
      <div className="bg-gray-100 text-center py-2 border-t border-gray-200 flex justify-center items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
          <input 
            type="checkbox" 
            checked={isDevMode} 
            onChange={(e) => setIsDevMode(e.target.checked)} 
            className="w-4 h-4 text-gray-600 rounded focus:ring-0 cursor-pointer"
          />
          Enable Developer Mode (Mock API)
        </label>
      </div>

    </div>
  );
}