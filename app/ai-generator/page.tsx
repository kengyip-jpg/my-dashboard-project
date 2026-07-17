'use client';

import { useState, useEffect } from 'react';

const ENVIRONMENTS = [
  { id: 'modern apartment', name: 'Modern Apartment', cost: 1000 },
  { id: 'seaside villa', name: 'Seaside Villa', cost: 3000 },
  { id: 'cozy wooden cabin', name: 'Cozy Wooden Cabin', cost: 1500 }
];

const FURNITURES = [
  { id: 'leather sofa', name: 'Leather Sofa', cost: 800 },
  { id: 'industrial metal desk', name: 'Industrial Metal Desk', cost: 500 },
  { id: 'minimalist double bed', name: 'Minimalist Double Bed', cost: 1200 },
  { id: 'luxury crystal chandelier', name: 'Luxury Crystal Chandelier', cost: 2500 },
  { id: 'indoor potted plant', name: 'Large Indoor Potted Plant', cost: 200 }
];

const INITIAL_BUDGET = 4000;
const MAX_GENERATIONS = 3;

export default function AiGeneratorPage() {
  const [selectedEnvId, setSelectedEnvId] = useState(ENVIRONMENTS[0].id);
  const [selectedFurnIds, setSelectedFurnIds] = useState<string[]>([FURNITURES[0].id]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  
  // 📝 新增狀態：用來在 UI 顯示錯誤，取代 alert()
  const [errorMsg, setErrorMsg] = useState('');

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

  // 📝 新增功能：一鍵還原預設狀態
  const handleReset = () => {
    setSelectedEnvId(ENVIRONMENTS[0].id);
    setSelectedFurnIds([FURNITURES[0].id]);
    setDescription('');
    setResultImage('');
    setErrorMsg('');
  };

  const handleGenerate = async () => {
    if (isOverBudget || isNoFurnitureSelected || isLimitReached) return;
    
    setLoading(true);
    setResultImage('');
    setErrorMsg(''); // 每次生成前清除錯誤
    
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
        // 📝 優化：把錯誤訊息寫進 State，而不是用 alert()
        setErrorMsg(data.error || 'Oops! Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'my-dream-room.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    try {
      const base64Data = resultImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const file = new File([blob], 'my-dream-room.jpg', { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My AI Interior Design',
          text: 'Look at this awesome room I designed within budget using AI!',
          files: [file]
        });
      } else {
        alert('Your browser does not support direct sharing. Please download the image and upload it to your social media!');
      }
    } catch (error) {
      console.log('User cancelled the share or an error occurred.', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">AI Interior Designer 🛋️</h1>
      <p className="text-gray-600 mb-8">Design your dream room within your budget!</p>
      
      <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold text-xl mb-6 flex justify-between shadow-sm">
        <span>Initial Budget:</span>
        <span>${INITIAL_BUDGET.toLocaleString()}</span>
      </div>

      <div className={`p-4 rounded-lg font-bold mb-6 flex justify-between shadow-sm border ${
        isLimitReached ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}>
        <span>Free Generations Used:</span>
        <span>{usageCount} / {MAX_GENERATIONS}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-6">
          {/* ... (左側表單區塊不變，省略重複程式碼以節省你的閱讀時間，請保留原本的 Select 和 Checkbox) ... */}
          
          <div>
            <label className="block mb-2 font-bold text-gray-700">1. Select Environment</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white shadow-sm disabled:bg-gray-100"
              value={selectedEnvId} 
              onChange={(e) => setSelectedEnvId(e.target.value)}
              disabled={isLimitReached || loading} 
            >
              {ENVIRONMENTS.map(env => (
                <option key={env.id} value={env.id}>{env.name} (+${env.cost})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-3 font-bold text-gray-700">2. Select Furnitures (Multiple)</label>
            <div className="flex flex-col gap-2">
              {FURNITURES.map(furn => (
                <label key={furn.id} className={`flex items-center gap-3 p-3 border rounded-lg ${(isLimitReached || loading) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${selectedFurnIds.includes(furn.id) ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
                  <input type="checkbox" className="w-5 h-5" checked={selectedFurnIds.includes(furn.id)} onChange={() => handleFurnitureToggle(furn.id)} disabled={isLimitReached || loading} />
                  <span className="flex-1 text-gray-800">{furn.name}</span>
                  <span className="text-gray-500 font-bold">(+${furn.cost})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-bold text-gray-700">3. Extra Details</label>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg text-black disabled:bg-gray-100"
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isLimitReached || loading}
            />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Order Summary</h2>
            <div className="flex justify-between mb-3 text-gray-800 font-medium">
              <span>🏠 {currentEnv.name}</span><span>${currentEnv.cost}</span>
            </div>
            <div className="mb-3">
              <span className="text-gray-800 font-medium block mb-1">🛋️ Furnitures:</span>
              {selectedFurns.map(furn => (
                <div key={furn.id} className="flex justify-between text-gray-600 text-sm pl-6 mb-1">
                  <span>+ {furn.name}</span><span>${furn.cost}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-gray-300">
            <div className="flex justify-between font-bold text-lg mb-2 text-gray-800">
              <span>Total Cost:</span><span>${totalCost.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between font-bold text-lg ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
              <span>Remaining Budget:</span><span>${remainingBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📝 新增：如果報錯，顯示漂亮的紅色框框 */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border-l-4 border-red-500 rounded font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      <button 
        onClick={handleGenerate} 
        disabled={loading || isOverBudget || isNoFurnitureSelected || isLimitReached}
        className={`w-full font-bold py-4 rounded-lg text-lg text-white shadow-lg transition-all flex justify-center items-center gap-2 ${
          isLimitReached ? 'bg-red-500 cursor-not-allowed' 
          : (isOverBudget || isNoFurnitureSelected) ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isLimitReached ? '❌ Limit Reached (3/3)' 
          : loading ? (
            <>
              {/* 📝 新增：按鈕裡面的旋轉小圈圈 */}
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              AI is drawing your room...
            </>
          ) 
          : '✨ Generate Design'}
      </button>

      {/* 📝 新增：等待過程中的大畫面骨架屏 (Skeleton) */}
      {loading && (
        <div className="mt-10 border-2 border-gray-100 p-6 rounded-xl bg-gray-50 shadow-inner flex flex-col items-center animate-pulse">
          <div className="w-64 h-8 bg-gray-200 rounded mb-4"></div>
          <div className="w-full max-w-2xl aspect-square bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
            <span className="text-gray-400 font-bold text-lg">Brewing AI Magic... 🪄</span>
          </div>
        </div>
      )}

      {resultImage && !loading && (
        <div className="mt-10 border-2 border-gray-100 p-6 rounded-xl bg-white shadow-xl flex flex-col items-center transition-all">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Masterpiece</h2>
          <img src={resultImage} alt="Generated Design" className="w-full max-w-2xl rounded-lg shadow-md mb-6" />
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <button onClick={handleDownload} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
              📥 Save to Device
            </button>
            <button onClick={handleShare} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md">
              🚀 Share
            </button>
            
            {/* 📝 新增：重新開始按鈕 */}
            {!isLimitReached && (
              <button onClick={handleReset} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                🔄 Start Over
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}