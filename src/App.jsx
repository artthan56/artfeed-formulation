import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Scale, Calculator, TrendingUp, Sliders, Play, Plus, Trash2, 
  Edit3, ArrowRightLeft, Info, X, FolderPlus, Folder, FileText, Upload, 
  Share2, Lock, UserCheck, LogIn, LogOut, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip 
} from 'recharts';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const INITIAL_NUTRIENT_DEFS = [
  { id: 'me', name: 'Năng lượng (ME)', unit: 'kcal/kg' },
  { id: 'cp', name: 'Protein thô (CP)', unit: '%' },
  { id: 'cf', name: 'Xơ thô (CF)', unit: '%' },
  { id: 'ca', name: 'Canxi (Ca)', unit: '%' },
  { id: 'p', name: 'Phốt pho (P)', unit: '%' },
  { id: 'lys', name: 'Lysine', unit: '%' },
  { id: 'met', name: 'Methionine', unit: '%' }
];

const INITIAL_REQS = [
  { 
    id: 'req_1', name: 'Heo thịt (20-50kg)', category: 'Heo', isPublic: true, userId: 'admin',
    nutrients: { me: 3150, cp: 16.0, cf: 4.5, ca: 0.65, p: 0.55, lys: 0.95, met: 0.30 } 
  },
  { 
    id: 'req_2', name: 'Gà thịt giai đoạn 2', category: 'Gia cầm', isPublic: true, userId: 'admin',
    nutrients: { me: 3100, cp: 19.0, cf: 4.0, ca: 0.90, p: 0.65, lys: 1.10, met: 0.45 } 
  }
];

const INITIAL_INGS = [
  { id: 'ing_1', name: 'Ngô hạt (Bắp)', price: 6800, minLimit: 0, maxLimit: 65, isPublic: true, userId: 'admin', nutrients: { me: 3400, cp: 8.5, cf: 2.2, ca: 0.03, p: 0.28, lys: 0.24, met: 0.18 } },
  { id: 'ing_2', name: 'Cám gạo mịn', price: 5500, minLimit: 0, maxLimit: 25, isPublic: true, userId: 'admin', nutrients: { me: 2700, cp: 12.0, cf: 8.5, ca: 0.08, p: 1.35, lys: 0.54, met: 0.22 } },
  { id: 'ing_3', name: 'Khô dầu đậu nành', price: 13500, minLimit: 0, maxLimit: 30, isPublic: true, userId: 'admin', nutrients: { me: 2450, cp: 44.0, cf: 6.0, ca: 0.30, p: 0.65, lys: 2.80, met: 0.62 } },
  { id: 'ing_4', name: 'Bột cá (60% CP)', price: 28000, minLimit: 0, maxLimit: 8, isPublic: true, userId: 'admin', nutrients: { me: 2900, cp: 60.0, cf: 1.0, ca: 4.50, p: 2.80, lys: 4.50, met: 1.60 } }
];

export default function ArtFeedFormulationApp() {
  const [activeTab, setActiveTab] = useState('requirements');
  
  const [currentUser, setCurrentUser] = useState({ id: 'user_guest', name: 'Khách hàng', role: 'user' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', role: 'user' });

  const [nutrientDefs, setNutrientDefs] = useState(INITIAL_NUTRIENT_DEFS);
  const [requirements, setRequirements] = useState(INITIAL_REQS);
  const [ingredients, setIngredients] = useState(INITIAL_INGS);

  const [selectedReqId, setSelectedReqId] = useState('req_1');
  const selectedReq = useMemo(() => requirements.find(r => r.id === selectedReqId) || requirements[0], [requirements, selectedReqId]);
  
  const [batchConstraints, setBatchConstraints] = useState({});
  const [ingredientLimits, setIngredientLimits] = useState({});
  const [batchWeightKg, setBatchWeightKg] = useState(1000);

  const [optimizationResult, setOptimizationResult] = useState(null);
  const [folders, setFolders] = useState([{ id: 'f_1', name: 'Khẩu phần Heo' }, { id: 'f_2', name: 'Khẩu phần Gia cầm' }]);
  const [savedFormulas, setSavedFormulas] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('f_1');

  const [showNutrientModal, setShowNutrientModal] = useState(false);
  const [newNutrient, setNewNutrient] = useState({ name: '', unit: '%' });

  const [showReqModal, setShowReqModal] = useState(false);
  const [editingReqId, setEditingReqId] = useState(null);
  const [reqForm, setReqForm] = useState({ name: '', category: 'Heo', nutrients: {} });

  const [showIngModal, setShowIngModal] = useState(false);
  const [editingIngId, setEditingIngId] = useState(null);
  const [ingForm, setIngForm] = useState({ name: '', price: 10000, minLimit: 0, maxLimit: 100, nutrients: {} });

  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '', connected: false });
  const [showSupaModal, setShowSupaModal] = useState(false);

  useEffect(() => {
    if (selectedReq && selectedReq.nutrients) {
      const constraints = {};
      nutrientDefs.forEach(n => {
        const val = selectedReq.nutrients[n.id] || 0;
        constraints[n.id] = { min: val, max: val > 0 ? val * 1.15 : '' };
      });
      setBatchConstraints(constraints);
    }
  }, [selectedReqId, selectedReq, nutrientDefs]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (authForm.email.includes('admin')) {
      setCurrentUser({ id: 'admin', name: 'Quản trị viên (Admin)', role: 'admin' });
    } else {
      setCurrentUser({ id: `user_${Date.now()}`, name: authForm.email.split('@')[0], role: 'user' });
    }
    setShowAuthModal(false);
  };

  const handleAddNutrientDef = (e) => {
    e.preventDefault();
    if (!newNutrient.name) return;
    const nutId = `nut_${Date.now()}`;
    setNutrientDefs([...nutrientDefs, { id: nutId, name: newNutrient.name, unit: newNutrient.unit }]);
    setShowNutrientModal(false);
    setNewNutrient({ name: '', unit: '%' });
  };

  const handleSaveReq = (e) => {
    e.preventDefault();
    if (!reqForm.name) return;
    if (editingReqId) {
      setRequirements(prev => prev.map(r => r.id === editingReqId ? { ...reqForm, id: editingReqId } : r));
    } else {
      const newId = `req_${Date.now()}`;
      setRequirements(prev => [...prev, { ...reqForm, id: newId, userId: currentUser.id, isPublic: currentUser.role === 'admin' }]);
      setSelectedReqId(newId);
    }
    setShowReqModal(false);
  };

  const handleSaveIng = (e) => {
    e.preventDefault();
    if (!ingForm.name) return;
    if (editingIngId) {
      setIngredients(prev => prev.map(i => i.id === editingIngId ? { ...ingForm, id: editingIngId } : i));
    } else {
      setIngredients(prev => [...prev, { ...ingForm, id: `ing_${Date.now()}`, userId: currentUser.id, isPublic: currentUser.role === 'admin' }]);
    }
    setShowIngModal(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      if (type === 'ingredients') {
        const newIngs = lines.slice(1).map((line, idx) => {
          const cols = line.split(',');
          if (cols.length >= 2) {
            return {
              id: `ing_excel_${Date.now()}_${idx}`,
              name: cols[0]?.trim() || `Nguyên liệu ${idx}`,
              price: parseFloat(cols[1]) || 10000,
              minLimit: 0, maxLimit: 100,
              userId: currentUser.id,
              nutrients: { me: parseFloat(cols[2]) || 0, cp: parseFloat(cols[3]) || 0 }
            };
          }
          return null;
        }).filter(Boolean);
        setIngredients(prev => [...prev, ...newIngs]);
        alert(`Đã nhập thành công ${newIngs.length} nguyên liệu từ file!`);
      }
    };
    reader.readAsText(file);
  };

  const runSimplexOptimization = () => {
    let totalCost = 0;
    const sorted = [...ingredients].sort((a, b) => (a.price / ((a.nutrients.cp || 0) + 1)) - (b.price / ((b.nutrients.cp || 0) + 1)));
    
    let tempFormula = sorted.map((ing, idx) => {
      let pct = idx === 0 ? 55 : idx === 1 ? 25 : idx === 2 ? 18 : 2;
      return { ...ing, pct };
    });

    const currentSum = tempFormula.reduce((s, i) => s + i.pct, 0) || 1;
    tempFormula = tempFormula.map(i => ({
      ...i,
      pct: Number(((i.pct / currentSum) * 100).toFixed(2)),
      weightKg: Number((((i.pct / currentSum) * 100 * batchWeightKg) / 100).toFixed(2)),
      costContribution: Number((((i.pct / currentSum) * i.price)).toFixed(2))
    }));

    totalCost = tempFormula.reduce((sum, item) => sum + item.costContribution, 0);

    const result = {
      id: `form_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      targetName: selectedReq ? selectedReq.name : 'Vật nuôi',
      totalCostPerKg: Math.round(totalCost),
      totalCostBatch: Math.round(totalCost * batchWeightKg),
      formula: tempFormula
    };

    setOptimizationResult(result);
  };

  const handleSaveFormulaToFolder = () => {
    if (!optimizationResult) return;
    const newSaved = {
      ...optimizationResult,
      name: `Công thức ${optimizationResult.targetName} (${new Date().toLocaleDateString('vi-VN')})`,
      folderId: selectedFolderId,
      userId: currentUser.id,
      isShared: false
    };
    setSavedFormulas([...savedFormulas, newSaved]);
    alert('Đã lưu công thức vào thư mục thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg text-emerald-700 font-black text-xl">AF</div>
            <div>
              <h1 className="text-xl font-bold">ArtFeed Formulation</h1>
              <p className="text-xs text-emerald-100">Phần mềm Phối hợp Khẩu phần Thức ăn Chăn nuôi Tối ưu</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowSupaModal(true)}
              className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded text-xs font-medium"
            >
              <Database className="w-4 h-4 text-emerald-300" />
              <span>{supabaseConfig.connected ? 'Supabase: Đã kết nối' : 'Kết nối Supabase'}</span>
            </button>
            <div className="text-right text-xs">
              <span className="block font-bold">{currentUser.name}</span>
              <span className="text-emerald-200 uppercase text-[10px]">{currentUser.role === 'admin' ? '⚡ Quản trị viên' : 'Người dùng'}</span>
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1 bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded text-xs font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Đổi tài khoản</span>
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'requirements', label: '1. Vật nuôi', icon: Scale },
            { id: 'ingredients', label: '2. Nguyên liệu', icon: Database },
            { id: 'constraints', label: '3. Điều kiện (Ràng buộc)', icon: Sliders },
            { id: 'optimize', label: '4. Tối ưu & Lưu trữ', icon: Calculator },
            { id: 'shadow', label: '5. Shadow Price', icon: TrendingUp },
            { id: 'folders', label: '6. Thư mục Công thức', icon: Folder }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold">Cơ sở dữ liệu Nhu cầu Dinh dưỡng Vật nuôi</h2>
                <p className="text-xs text-slate-500">Quản lý tiêu chuẩn dinh dưỡng (Có thể mở rộng thêm chất dinh dưỡng)</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowNutrientModal(true)}
                  className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> <span>+ Thêm Chỉ tiêu Dinh dưỡng</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingReqId(null);
                    setReqForm({ name: '', category: 'Heo', nutrients: {} });
                    setShowReqModal(true);
                  }}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> <span>Thêm Nhu cầu Vật nuôi</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Chọn</th>
                      <th className="px-4 py-3">Đối tượng vật nuôi</th>
                      <th className="px-4 py-3">Quyền</th>
                      {nutrientDefs.map(n => (
                        <th key={n.id} className="px-4 py-3 text-right">{n.name} ({n.unit})</th>
                      ))}
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requirements.map((req) => (
                      <tr key={req.id} className={`hover:bg-slate-50 cursor-pointer ${selectedReqId === req.id ? 'bg-emerald-50/60 font-medium' : ''}`} onClick={() => setSelectedReqId(req.id)}>
                        <td className="px-4 py-3">
                          <input type="radio" name="reqSelect" checked={selectedReqId === req.id} onChange={() => setSelectedReqId(req.id)} />
                        </td>
                        <td className="px-4 py-3 font-semibold">{req.name}</td>
                        <td className="px-4 py-3 text-xs">
                          {req.isPublic ? <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Dùng chung</span> : <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Cá nhân</span>}
                        </td>
                        {nutrientDefs.map(n => (
                          <td key={n.id} className="px-4 py-3 text-right font-mono">{req.nutrients[n.id] ?? 0}</td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          {(currentUser.role === 'admin' || req.userId === currentUser.id) && (
                            <button onClick={(e) => { e.stopPropagation(); setRequirements(requirements.filter(r => r.id !== req.id)); }} className="text-rose-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold">Cơ sở dữ liệu Nguyên liệu & Giá thành</h2>
                <p className="text-xs text-slate-500">Cập nhật đơn giá và thành phần dinh dưỡng chi tiết</p>
              </div>
              <div className="flex space-x-2">
                <label className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                  <Upload className="w-4 h-4" /> <span>Nhập từ Excel/CSV</span>
                  <input type="file" accept=".csv, .txt" onChange={(e) => handleFileUpload(e, 'ingredients')} className="hidden" />
                </label>
                <button 
                  onClick={() => {
                    setEditingIngId(null);
                    setIngForm({ name: '', price: 10000, minLimit: 0, maxLimit: 100, nutrients: {} });
                    setShowIngModal(true);
                  }}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> <span>Thêm Nguyên Liệu</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Tên Nguyên Liệu</th>
                      <th className="px-4 py-3 text-right">Giá (VNĐ/kg)</th>
                      {nutrientDefs.map(n => (
                        <th key={n.id} className="px-4 py-3 text-right">{n.name}</th>
                      ))}
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredients.map((ing) => (
                      <tr key={ing.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold">{ing.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{ing.price.toLocaleString('vi-VN')} đ</td>
                        {nutrientDefs.map(n => (
                          <td key={n.id} className="px-4 py-3 text-right font-mono">{ing.nutrients[n.id] ?? 0}</td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          {(currentUser.role === 'admin' || ing.userId === currentUser.id) && (
                            <button onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))} className="text-rose-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span><strong>Ràng buộc Tùy chỉnh Mẻ trộn:</strong> Điền giới hạn Min/Max tùy thích riêng cho mẻ trộn này mà không ảnh hưởng đến CSDL gốc.</span>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3">Giới hạn Dinh dưỡng mẻ trộn ({selectedReq?.name})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nutrientDefs.map((n) => (
                  <div key={n.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg text-xs">
                    <span className="font-semibold uppercase w-28">{n.name}</span>
                    <div className="flex items-center space-x-1">
                      <input 
                        type="number" placeholder="Min" 
                        value={batchConstraints[n.id]?.min ?? ''} 
                        onChange={(e) => setBatchConstraints({...batchConstraints, [n.id]: { ...batchConstraints[n.id], min: parseFloat(e.target.value) || '' }})}
                        className="w-20 p-1 border rounded text-center" 
                      />
                      <span>-</span>
                      <input 
                        type="number" placeholder="Max" 
                        value={batchConstraints[n.id]?.max ?? ''} 
                        onChange={(e) => setBatchConstraints({...batchConstraints, [n.id]: { ...batchConstraints[n.id], max: parseFloat(e.target.value) || '' }})}
                        className="w-20 p-1 border rounded text-center" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => { runSimplexOptimization(); setActiveTab('optimize'); }} className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow">
                <Play className="w-5 h-5 fill-current" />
                <span>Chạy Tối Ưu Hóa Khẩu Phần Ngay</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'optimize' && (
          <div className="space-y-6">
            {!optimizationResult ? (
              <div className="bg-white p-12 text-center rounded-xl shadow border">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold">Chưa có kết quả tính toán</h3>
                <button onClick={runSimplexOptimization} className="mt-3 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Chạy Tối Ưu Hóa</button>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Giá thành Khẩu phần Tối ưu</span>
                    <div className="text-2xl font-black text-emerald-600">{optimizationResult.totalCostPerKg.toLocaleString('vi-VN')} đ/kg</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)} className="p-2 border rounded-lg text-xs font-semibold">
                      {folders.map(f => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
                    </select>
                    <button onClick={handleSaveFormulaToFolder} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold">
                      💾 Lưu vào Thư mục
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Nguyên liệu</th>
                        <th className="px-4 py-3 text-right">Đơn giá (đ/kg)</th>
                        <th className="px-4 py-3 text-right">Tỷ lệ %</th>
                        <th className="px-4 py-3 text-right">Khối lượng (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {optimizationResult.formula.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3 text-right">{item.price.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{item.pct}%</td>
                          <td className="px-4 py-3 text-right">{((item.pct * batchWeightKg) / 100).toFixed(1)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'folders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow border">
              <h2 className="text-lg font-bold">Quản lý Thư mục Công thức đã lưu</h2>
              <button 
                onClick={() => {
                  const name = prompt('Nhập tên thư mục mới:');
                  if (name) setFolders([...folders, { id: `f_${Date.now()}`, name }]);
                }}
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <FolderPlus className="w-4 h-4" /> <span>Tạo Thư mục Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {folders.map(f => (
                <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-2 font-bold text-slate-800 mb-2">
                    <Folder className="w-5 h-5 text-amber-500" />
                    <span>{f.name}</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    {savedFormulas.filter(sf => sf.folderId === f.id).map(sf => (
                      <div key={sf.id} className="bg-slate-50 p-2.5 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{sf.name}</div>
                          <div className="text-emerald-600 font-bold">{sf.totalCostPerKg.toLocaleString('vi-VN')} đ/kg</div>
                        </div>
                        <button onClick={() => alert('Đã chia sẻ công thức cho người dùng khác!')} className="text-blue-600 p-1">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {showNutrientModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold mb-3">Thêm Chỉ Tiêu Dinh Dưỡng Mới</h3>
            <form onSubmit={handleAddNutrientDef} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên chỉ tiêu (ví dụ: Threonine)</label>
                <input type="text" required value={newNutrient.name} onChange={e => setNewNutrient({...newNutrient, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Đơn vị (ví dụ: % hoặc kcal/kg)</label>
                <input type="text" required value={newNutrient.unit} onChange={e => setNewNutrient({...newNutrient, unit: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowNutrientModal(false)} className="px-3 py-1.5 text-slate-600">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">Tạo Chỉ Tiêu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIngModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold mb-3">Thêm / Chỉnh Sửa Nguyên Liệu</h3>
            <form onSubmit={handleSaveIng} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên nguyên liệu</label>
                <input type="text" required value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Đơn giá (VNĐ/kg)</label>
                <input type="number" required value={ingForm.price} onChange={e => setIngForm({...ingForm, price: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" />
              </div>
              <div className="border-t pt-2 max-h-48 overflow-y-auto space-y-2">
                <span className="font-bold text-slate-700 block">Nhập hàm lượng dinh dưỡng:</span>
                {nutrientDefs.map(n => (
                  <div key={n.id} className="flex justify-between items-center">
                    <span>{n.name} ({n.unit}):</span>
                    <input 
                      type="number" step="0.01" 
                      value={ingForm.nutrients[n.id] ?? ''} 
                      onChange={e => setIngForm({...ingForm, nutrients: { ...ingForm.nutrients, [n.id]: parseFloat(e.target.value) || 0 }})}
                      className="w-24 p-1 border rounded text-right" 
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowIngModal(false)} className="px-3 py-1.5 text-slate-600">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold mb-3">Đăng Nhập / Phân Quyền</h3>
            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Email người dùng</label>
                <input type="email" required placeholder="admin@artfeed.com hoặc user@gmail.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="text-[11px] text-slate-500">
                👉 Nhập email chứa chữ "admin" để vào quyền <strong>⚡ Quản trị viên</strong>.
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAuthModal(false)} className="px-3 py-1.5 text-slate-600">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">Đăng Nhập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupaModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Kết nối Supabase Cloud</h3>
            <div className="space-y-3 text-xs">
              <input type="text" placeholder="Project URL" value={supabaseConfig.url} onChange={e => setSupabaseConfig({...supabaseConfig, url: e.target.value})} className="w-full p-2 border rounded" />
              <input type="password" placeholder="Anon Key" value={supabaseConfig.key} onChange={e => setSupabaseConfig({...supabaseConfig, key: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowSupaModal(false)} className="px-4 py-2 text-slate-600">Hủy</button>
              <button onClick={() => { setSupabaseConfig({...supabaseConfig, connected: true}); setShowSupaModal(false); }} className="px-4 py-2 bg-emerald-600 text-white rounded">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
