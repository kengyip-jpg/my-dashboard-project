'use client';

import { useState, useEffect } from 'react';

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

const INITIAL_BUDGET = 10000;
const MAX_GENERATIONS = 3;

export default function AiGeneratorPage() {
  const [selectedEnvId, setSelectedEnvId] = useState(ENVIRONMENTS[0].id);
  const [selectedFurnIds, setSelectedFurnIds] = useState<string[]>([FURNITURES[0].id]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 📝 新增狀態：用來控制下拉選單是打開還是關閉
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const savedCount = localStorage.getItem('ai-generator-usage');
    if (savedCount) setUsageCount(parseInt(savedCount, 10));
  }, []);

  const currentEnv = ENVIRONMENTS.find(e => e.id === selectedEnvId) || ENVIRONMENTS[0];
  const selectedFurns = FURNITURES.filter(f => selectedFurnIds.includes(f.id));
  
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
    setIsDropdownOpen(false); // 重置時順便關閉選單
  };

  const handleGenerate = async () => {
    if (isOverBudget || isNoFurnitureSelected || isLimitReached) return;
    
    setLoading(true);
    setResultImage('');
    setErrorMsg('');
    setIsDropdownOpen(false); // 開始生成時關閉選單，保持畫面整潔
    
    const furnitureNamesString = selectedFurns.map(f => f.name).join(', ');

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          environment: currentEnv.name, 
          furniture: furnitureNamesString, 
          description 
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

  const handleDownload = () => { /* 保持不變 */
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'my-dream-room.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => { /* 保持不變 */
    try {
      const base64Data = resultImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const file = new File([blob], 'my-dream-room.jpg', { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'My AI Interior Design', text: 'Look at this awesome room I designed within budget using AI!', files: [file] });
      } else {
        alert('Your browser does not support direct sharing. Please download the image and upload it to your social media!');
      }
    } catch (error) {
      console.log('User cancelled the share or an error occurred.', error);
    }
  };

  const scrollToGenerator = () => {
    document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans min-h-screen bg-white">
      
      {/* 第 1 區塊 & 第 2 區塊完全保持不變 */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white py-24 px-6 text-center shadow-xl">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 text-blue-200 text-sm font-bold tracking-wider mb-6 border border-blue-400/50">LIMITED TIME CAMPAIGN</span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">Build Your Dream Room.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Don't Break the Bank.</span></h1>
          <p className="text-xl md:text-2xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">Take the $10,000 challenge! Select your environment, pick your premium furniture, and let our AI generate your masterpiece in seconds.</p>
          <button onClick={scrollToGenerator} className="bg-white text-indigo-900 font-bold text-xl py-4 px-10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:scale-105 transition-all">Start Designing Now ✨</button>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">💰</div><h3 className="text-xl font-bold text-gray-800 mb-2">1. Manage Budget</h3><p className="text-gray-600">You start with $10,000. Every environment and furniture piece costs money. Choose wisely!</p></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">🛋️</div><h3 className="text-xl font-bold text-gray-800 mb-2">2. Mix & Match</h3><p className="text-gray-600">Select multiple items and add custom details to make the room truly yours.</p></div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"><div className="text-5xl mb-4">🎨</div><h3 className="text-xl font-bold text-gray-800 mb-2">3. AI Magic</h3><p className="text-gray-600">Click generate and watch our advanced AI engine bring your vision to life instantly.</p></div>
          </div>
        </div>
      </section>

      <section id="generator-section" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Design Studio</h2>
            <p className="text-gray-500">You have 3 free generations. Make them count!</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 text-teal-900 p-5 rounded-xl font-bold text-xl mb-8 flex justify-between items-center shadow-inner border border-teal-200">
            <span className="flex items-center gap-2">💳 Initial Budget:</span>
            <span className="text-2xl">${INITIAL_BUDGET.toLocaleString()}</span>
          </div>

          <div className={`p-4 rounded-xl font-bold mb-8 flex justify-between shadow-sm border ${isLimitReached ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <span>Free Generations Used:</span><span>{usageCount} / {MAX_GENERATIONS}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
            <div className="flex flex-col gap-6">
              
              {/* 環境單選維持不變 */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">1. Select Environment</label>
                <select className="w-full p-4 border border-gray-300 rounded-xl text-black bg-white shadow-sm disabled:bg-gray-100 focus:ring-4 focus:ring-blue-100 transition-all" value={selectedEnvId} onChange={(e) => setSelectedEnvId(e.target.value)} disabled={isLimitReached || loading}>
                  {ENVIRONMENTS.map(env => (
                    <option key={env.id} value={env.id}>{env.name} (+${env.cost})</option>
                  ))}
                </select>
              </div>

              {/* 📝 核心改動：多選家具變成「懸浮折疊選單」 */}
              <div className="relative">
                <label className="block mb-3 font-bold text-gray-700">2. Select Furnitures (Multiple)</label>
                
                {/* 這個按鈕是外觀，點擊用來展開/收合選單 */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isLimitReached || loading}
                  className={`w-full p-4 border border-gray-300 rounded-xl text-left bg-white shadow-sm flex justify-between items-center transition-all ${
                    (isLimitReached || loading) ? 'cursor-not-allowed opacity-60' : 'hover:border-blue-300 focus:ring-4 focus:ring-blue-100'
                  }`}
                >
                  <span className="truncate text-gray-800 font-medium">
                    {selectedFurnIds.length === 0 
                      ? 'Select items...' 
                      : `${selectedFurnIds.length} item(s) selected`}
                  </span>
                  <span className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* 絕對定位的下拉選單區塊 */}
                {isDropdownOpen && !(isLimitReached || loading) && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    <div className="p-2 flex flex-col gap-1">
                      {FURNITURES.map(furn => (
                        <label 
                          key={furn.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedFurnIds.includes(furn.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded" 
                            checked={selectedFurnIds.includes(furn.id)} 
                            onChange={() => handleFurnitureToggle(furn.id)} 
                          />
                          <span className="flex-1 text-gray-800 font-medium">{furn.name}</span>
                          <span className="text-gray-500 font-bold">(+${furn.cost})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">3. Extra Details (Optional)</label>
                <textarea className="w-full p-4 border border-gray-300 rounded-xl text-black disabled:bg-gray-100 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="E.g., cinematic lighting, a sleeping cat..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isLimitReached || loading} />
              </div>
            </div>

            {/* 右側 Summary 維持不變 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-inner flex flex-col justify-between">
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
              </div>
              <div className="mt-8 pt-6 border-t-2 border-gray-300">
                <div className="flex justify-between font-bold text-xl mb-3 text-gray-800"><span>Total Cost:</span><span>${totalCost.toLocaleString()}</span></div>
                <div className={`flex justify-between font-black text-2xl ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}><span>Remaining:</span><span>${remainingBudget.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          {errorMsg && <div className="mb-6 p-5 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-lg font-bold">⚠️ {errorMsg}</div>}

          <button onClick={handleGenerate} disabled={loading || isOverBudget || isNoFurnitureSelected || isLimitReached} className={`w-full font-bold py-5 rounded-2xl text-xl text-white shadow-xl transition-all flex justify-center items-center gap-3 ${isLimitReached ? 'bg-red-500 cursor-not-allowed' : (isOverBudget || isNoFurnitureSelected) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-95'}`}>
            {isLimitReached ? '❌ Limit Reached (3/3)' : loading ? (<><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>AI is crafting your room...</>) : '✨ Generate My Design'}
          </button>

          {/* 生成區與結果區維持不變 */}
          {loading && (
            <div className="mt-12 border-2 border-dashed border-gray-200 p-10 rounded-3xl bg-gray-50 flex flex-col items-center animate-pulse">
              <div className="w-64 h-8 bg-gray-200 rounded-full mb-6"></div>
              <div className="w-full max-w-2xl aspect-video bg-gray-200 rounded-2xl mb-6 flex items-center justify-center"><span className="text-gray-400 font-bold text-xl">Brewing AI Magic... 🪄</span></div>
            </div>
          )}

          {resultImage && !loading && (
            <div className="mt-12 border border-gray-100 p-8 rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center animate-fade-in-up">
              <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-4">SUCCESS</span>
              <h2 className="text-3xl font-extrabold mb-8 text-gray-900">Your Masterpiece</h2>
              <img src={resultImage} alt="Generated Design" className="w-full max-w-3xl rounded-2xl shadow-lg mb-8 border border-gray-100" />
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
                <button onClick={handleDownload} className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">📥 Save Image</button>
                <button onClick={handleShare} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">🚀 Share to IG/FB</button>
                {!isLimitReached && (<button onClick={handleReset} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">🔄 Start Over</button>)}
              </div>
            </div>
          )}

        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10 text-center">
        <p className="mb-2">© 2026 AI Interior Designer Campaign. All rights reserved.</p>
        <p className="text-sm">Powered by Google Nano Banana Pro 🍌</p>
      </footer>

    </div>
  );
}