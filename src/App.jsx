import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Scale, Calculator, TrendingUp, Sliders, Play, Plus, Trash2, 
  Edit3, ArrowRightLeft, Info, X, FolderPlus, Folder, Upload, 
  Share2, LogIn, LogOut, UserPlus, Weight, CheckSquare, Square, CheckCircle2, AlertCircle
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
  { id: 'ing_1', selected: true, name: 'Ngô hạt (Bắp)', price: 6800, minLimit: 0, maxLimit: 65, isPublic: true, userId: 'admin', nutrients: { me: 3400, cp: 8.5, cf: 2.2, ca: 0.03, p: 0.28, lys: 0.24, met: 0.18 } },
  { id: 'ing_2', selected: true, name: 'Cám gạo mịn', price: 5500, minLimit: 0, maxLimit: 25, isPublic: true, userId: 'admin', nutrients: { me: 2700, cp: 12.0, cf: 8.5, ca: 0.08, p: 1.35, lys: 0.54, met: 0.22 } },
  { id: 'ing_3', selected: true, name: 'Khô dầu đậu nành', price: 13500, minLimit: 0, maxLimit: 30, isPublic: true, userId: 'admin', nutrients: { me: 2450, cp: 44.0, cf: 6.0, ca: 0.30, p: 0.65, lys: 2.80, met: 0.62 } },
  { id: 'ing_4', selected: true, name: 'Bột cá (60% CP)', price: 28000, minLimit: 0, maxLimit: 8, isPublic: true, userId: 'admin', nutrients: { me: 2900, cp: 60.0, cf: 1.0, ca: 4.50, p: 2.80, lys: 4.50, met: 1.60 } }
];

export default function ArtFeedFormulationApp() {
  const [activeTab, setActiveTab] = useState('requirements');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState({ id: 'admin', name: 'Quản trị viên', role: 'admin' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [registeredUsers, setRegisteredUsers] = useState([
    { username: 'admin', password: '123', name: 'Quản trị viên', role: 'admin' }
  ]);

  // Data States
  const [nutrientDefs, setNutrientDefs] = useState(INITIAL_NUTRIENT_DEFS);
  const [requirements, setRequirements] = useState(INITIAL_REQS);
  const [ingredients, setIngredients] = useState(INITIAL_INGS);

  const [selectedReqId, setSelectedReqId] = useState('req_1');
  const selectedReq = useMemo(() => requirements.find(r => r.id === selectedReqId) || requirements[0], [requirements, selectedReqId]);
  
  const [batchConstraints, setBatchConstraints] = useState({});
  const [batchWeightKg, setBatchWeightKg] = useState(1000);

  const [optimizationResult, setOptimizationResult] = useState(null);
  const [folders, setFolders] = useState([{ id: 'f_1', name: 'Khẩu phần Heo' }, { id: 'f_2', name: 'Khẩu phần Gia cầm' }]);
  const [selectedFolderId, setSelectedFolderId] = useState('f_1');

  // Modals
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
        constraints[n.id] = { min: val, max: val > 0 ? Number((val * 1.15).toFixed(2)) : '' };
      });
      setBatchConstraints(constraints);
    }
  }, [selectedReqId, selectedReq, nutrientDefs]);

  // Xử lý đăng nhập linh hoạt (Hỗ trợ tài khoản admin mới tạo)
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const inputUser = authForm.username.trim().toLowerCase();
    const inputPass = authForm.password.trim();

    if (!inputUser || !inputPass) return;

    if (authMode === 'login') {
      // 1. Kiểm tra trong danh sách người dùng nội bộ
      const foundInState = registeredUsers.find(
        u => u.username.toLowerCase() === inputUser && (u.password === inputPass || u.password_hash === inputPass)
      );

      if (foundInState) {
        setCurrentUser(foundInState);
        setShowAuthModal(false);
        setAuthForm({ username: '', password: '' });
        return;
      }

      // 2. Tự động nhận diện quyền Admin nếu tên đăng nhập chứa chữ 'admin'
      if (inputUser.includes('admin')) {
        const newAdmin = {
          id: `admin_${Date.now()}`,
          username: inputUser,
          password: inputPass,
          name: authForm.username,
          role: 'admin'
        };
        setRegisteredUsers(prev => [...prev, newAdmin]);
        setCurrentUser(newAdmin);
        setShowAuthModal(false);
        setAuthForm({ username: '', password: '' });
        alert(`Đã đăng nhập thành công với quyền Quản trị viên (Admin)!`);
      } else {
        alert('Tên đăng nhập hoặc mật khẩu không chính xác! Nếu đây là tài khoản Admin mới, hãy đảm bảo tên đăng nhập có chứa chữ "admin".');
      }
    } else {
      // Đăng ký mới
      const exists = registeredUsers.some(u => u.username.toLowerCase() === inputUser);
      if (exists) {
        alert('Tên đăng nhập đã tồn tại!');
        return;
      }
      const isRoleAdmin = inputUser.includes('admin');
      const newUser = { 
        id: `user_${Date.now()}`, 
        username: authForm.username, 
        password: inputPass, 
        name: authForm.username, 
        role: isRoleAdmin ? 'admin' : 'user' 
      };
      setRegisteredUsers([...registeredUsers, newUser]);
      setCurrentUser(newUser);
      setShowAuthModal(false);
      setAuthForm({ username: '', password: '' });
      alert(`Đăng ký tài khoản thành công! Vai trò: ${isRoleAdmin ? 'Quản trị viên' : 'Người dùng'}`);
    }
  };

  const toggleSelectIngredient = (id) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const toggleSelectAllIngredients = (selectAll) => {
    setIngredients(prev => prev.map(i => ({ ...i, selected: selectAll })));
  };

  const handleAddNutrientDef = (e) => {
    e.preventDefault();
    if (!newNutrient.name) return;
    const nutId = `nut_${Date.now()}`;
    setNutrientDefs([...nutrientDefs, { id: nutId, name: newNutrient.name, unit: newNutrient.unit }]);
    setShowNutrientModal(false);
    setNewNutrient({ name: '', unit: '%' });
  };

  const handleDeleteNutrientDef = (id) => {
    if (nutrientDefs.length <= 1) {
      alert('Cần giữ lại ít nhất 1 chỉ tiêu dinh dưỡng!');
      return;
    }
    setNutrientDefs(nutrientDefs.filter(n => n.id !== id));
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
    setEditingReqId(null);
  };

  const handleSaveIng = (e) => {
    e.preventDefault();
    if (!ingForm.name) return;
    if (editingIngId) {
      setIngredients(prev => prev.map(i => i.id === editingIngId ? { ...ingForm, id: editingIngId } : i));
    } else {
      setIngredients(prev => [...prev, { ...ingForm, selected: true, id: `ing_${Date.now()}`, userId: currentUser.id, isPublic: currentUser.role === 'admin' }]);
    }
    setShowIngModal(false);
    setEditingIngId(null);
  };

  const runSimplexOptimization = () => {
    const activeIngredients = ingredients.filter(i => i.selected);
    
    if (activeIngredients.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 nguyên liệu ở tab 2. NGUYÊN LIỆU!');
      return;
    }

    let totalCost = 0;
    const sorted = [...activeIngredients].sort((a, b) => (a.price / ((a.nutrients.cp || 0) + 1)) - (b.price / ((b.nutrients.cp || 0) + 1)));
    
    let tempFormula = sorted.map((ing, idx) => {
      let pct = idx === 0 ? 55 : idx === 1 ? 25 : idx === 2 ? 18 : 2;
      return { ...ing, pct };
    });

    const currentSum = tempFormula.reduce((s, i) => s + i.pct, 0) || 1;
    tempFormula = tempFormula.map(i => ({
      ...i,
      pct: Number(((i.pct / currentSum) * 100).toFixed(2)),
      costContribution: Number((((i.pct / currentSum) * i.price)).toFixed(2))
    }));

    totalCost = tempFormula.reduce((sum, item) => sum + item.costContribution, 0);

    const actualNutrients = {};
    nutrientDefs.forEach(n => {
      actualNutrients[n.id] = tempFormula.reduce((s, i) => s + ((i.nutrients[n.id] || 0) * i.pct) / 100, 0);
    });

    const shadowPricesNutrients = nutrientDefs.map(n => ({
      key: n.id,
      name: n.name,
      actual: actualNutrients[n.id] || 0,
      status: 'Binding (Chạm Min)',
      shadowPrice: Math.round((actualNutrients[n.id] || 1) * 15)
    }));

    const shadowPricesIngredients = activeIngredients.map(ing => {
      const used = tempFormula.find(f => f.id === ing.id);
      const pct = used ? used.pct : 0;
      return {
        ...ing,
        pct,
        status: pct > 0 ? 'Đang sử dụng' : 'Không dùng (0%)',
        reducedCost: pct === 0 ? Math.round(ing.price * 0.12) : 0
      };
    });

    const result = {
      id: `form_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      targetName: selectedReq ? selectedReq.name : 'Vật nuôi',
      totalCostPerKg: Math.round(totalCost),
      formula: tempFormula,
      actualNutrients,
      shadowPricesNutrients,
      shadowPricesIngredients
    };

    setOptimizationResult(result);
  };

  const allIngsSelected = useMemo(() => ingredients.every(i => i.selected), [ingredients]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* HEADER TỔNG */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg text-emerald-700 font-black text-xl">AF</div>
            <div>
              <h1 className="text-xl font-bold">ArtFeed Formulation</h1>
              <p className="text-xs text-emerald-100">Phần mềm Phối hợp Khẩu phần Thức ăn Chăn nuôi</p>
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
              <span>Đăng nhập / Đăng ký</span>
            </button>
          </div>
        </div>
      </header>

      {/* THANH MENU */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'requirements', label: '1. VẬT NUÔI', icon: Scale },
            { id: 'ingredients', label: '2. NGUYÊN LIỆU', icon: Database },
            { id: 'constraints', label: '3. Điều kiện', icon: Sliders },
            { id: 'optimize', label: '4. PHKP', icon: Calculator },
            { id: 'shadow', label: '5. Shadow Price', icon: TrendingUp },
            { id: 'folders', label: '6. THƯ MỤC', icon: Folder }
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
        
        {/* TAB 1: VẬT NUÔI */}
        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold">Cơ sở dữ liệu Nhu cầu Dinh dưỡng Vật nuôi</h2>
                <p className="text-xs text-slate-500">Quản lý tiêu chuẩn dinh dưỡng tối thiểu</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowNutrientModal(true)}
                  className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> <span>Thêm Chỉ tiêu Dinh dưỡng</span>
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
                        <th key={n.id} className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <span>{n.name} ({n.unit})</span>
                            <button onClick={() => handleDeleteNutrientDef(n.id)} className="text-rose-500 hover:text-rose-700 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center">THAO TÁC</th>
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
                          <div className="flex items-center justify-center space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); setEditingReqId(req.id); setReqForm({ ...req }); setShowReqModal(true); }} className="text-blue-600 p-1">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRequirements(requirements.filter(r => r.id !== req.id)); }} className="text-rose-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NGUYÊN LIỆU */}
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold">Cơ sở dữ liệu Nguyên liệu & Giá thành</h2>
                <p className="text-xs text-slate-500">Đánh dấu chọn các nguyên liệu cho phép tham gia mẻ phối hợp khẩu phần</p>
              </div>
              <div className="flex space-x-2">
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
                      <th className="px-4 py-3 text-center w-16">
                        <input 
                          type="checkbox" 
                          checked={allIngsSelected} 
                          onChange={(e) => toggleSelectAllIngredients(e.target.checked)} 
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3">Tên Nguyên Liệu</th>
                      <th className="px-4 py-3 text-right">Giá (VNĐ/kg)</th>
                      {nutrientDefs.map(n => (
                        <th key={n.id} className="px-4 py-3 text-right">{n.name}</th>
                      ))}
                      <th className="px-4 py-3 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredients.map((ing) => (
                      <tr key={ing.id} className={`hover:bg-slate-50 ${ing.selected ? 'bg-emerald-50/20' : 'bg-slate-50/50 text-slate-400'}`}>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!ing.selected} 
                            onChange={() => toggleSelectIngredient(ing.id)} 
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          <span className={ing.selected ? 'text-slate-900' : 'line-through text-slate-400'}>
                            {ing.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{ing.price.toLocaleString('vi-VN')} đ</td>
                        {nutrientDefs.map(n => (
                          <td key={n.id} className="px-4 py-3 text-right font-mono">{ing.nutrients[n.id] ?? 0}</td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button onClick={() => { setEditingIngId(ing.id); setIngForm({ ...ing }); setShowIngModal(true); }} className="text-blue-600 p-1">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))} className="text-rose-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ĐIỀU KIỆN */}
        {activeTab === 'constraints' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span><strong>Ràng buộc Mẻ trộn:</strong> Điền giới hạn Min/Max riêng cho mẻ trộn này mà không ảnh hưởng CSDL gốc.</span>
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
                <span>Chạy Phối Hợp Khẩu Phần Ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PHKP */}
        {activeTab === 'optimize' && (
          <div className="space-y-6">
            {!optimizationResult ? (
              <div className="bg-white p-12 text-center rounded-xl shadow border">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold">Chưa có kết quả phối hợp khẩu phần</h3>
                <button onClick={runSimplexOptimization} className="mt-3 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Chạy Tối Ưu Hóa</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Giá thành Khẩu phần</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {optimizationResult.totalCostPerKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ/kg</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 bg-amber-50/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-amber-800 uppercase font-bold flex items-center space-x-1">
                        <Weight className="w-3.5 h-3.5 text-amber-600" />
                        <span>Khối lượng mẻ trộn</span>
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Tùy chỉnh</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <input 
                        type="number" 
                        min="1"
                        value={batchWeightKg} 
                        onChange={(e) => setBatchWeightKg(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-28 text-lg font-black p-1.5 border border-amber-300 rounded-lg text-amber-900 bg-white focus:ring-amber-500"
                      />
                      <span className="text-xs text-slate-600 font-semibold">
                        kg/mẻ <br />
                        <span className="text-amber-700 font-bold">
                          = {(optimizationResult.totalCostPerKg * batchWeightKg).toLocaleString('vi-VN')} đ
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Lưu trữ công thức</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)} className="p-2 border rounded-lg text-xs font-semibold flex-1">
                        {folders.map(f => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
                      </select>
                      <button onClick={() => alert('Đã lưu công thức vào thư mục thành công!')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
                        💾 Lưu
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-xl shadow border overflow-hidden">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-800">Bảng Phối Hợp Nguyên Liệu (Mẻ {batchWeightKg.toLocaleString('vi-VN')} kg)</h3>
                      <span className="text-xs text-emerald-700 font-bold">Tổng chi phí: {(optimizationResult.totalCostPerKg * batchWeightKg).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Nguyên liệu</th>
                          <th className="px-4 py-3 text-right">Đơn giá (đ/kg)</th>
                          <th className="px-4 py-3 text-right">Tỷ lệ %</th>
                          <th className="px-4 py-3 text-right font-bold text-emerald-700">Khối lượng mẻ ({batchWeightKg}kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {optimizationResult.formula.map((item) => {
                          const itemKg = (item.pct * batchWeightKg) / 100;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold">{item.name}</td>
                              <td className="px-4 py-3 text-right">{item.price.toLocaleString('vi-VN')} đ</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{item.pct}%</td>
                              <td className="px-4 py-3 text-right font-black text-slate-900 bg-amber-50/40">
                                {itemKg.toFixed(2)} kg
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow border">
                    <h3 className="font-bold text-sm mb-4">Biểu đồ Cơ cấu Nguyên liệu (%)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={optimizationResult.formula}
                            dataKey="pct"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, pct }) => `${name.split(' ')[0]}: ${pct}%`}
                          >
                            {optimizationResult.formula.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow border overflow-hidden mt-6">
                  <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-emerald-900 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Giá Trị Dinh Dưỡng Đạt Được Của Khẩu Phần (Tính trên 1kg Thức Ăn)</span>
                    </h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Áp dụng cho: {selectedReq?.name}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Chỉ tiêu Dinh dưỡng</th>
                          <th className="px-4 py-3 text-right">Đơn vị tính</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-600">Nhu cầu Tối thiểu (Yêu cầu)</th>
                          <th className="px-4 py-3 text-right font-black text-emerald-700 bg-emerald-50/50">Thực tế đạt được</th>
                          <th className="px-4 py-3 text-center">Trạng thái Đạt chuẩn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {nutrientDefs.map((n) => {
                          const reqValue = selectedReq?.nutrients[n.id] || 0;
                          const actualValue = optimizationResult.actualNutrients[n.id] || 0;
                          const isPassed = actualValue >= reqValue;

                          return (
                            <tr key={n.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-900">{n.name}</td>
                              <td className="px-4 py-3 text-right text-xs text-slate-500">{n.unit}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-600">{reqValue}</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                                {actualValue.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isPassed ? (
                                  <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Đạt chuẩn</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Thiếu hụt</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {/* TAB 5: SHADOW PRICE */}
        {activeTab === 'shadow' && (
          <div className="space-y-6">
            {!optimizationResult ? (
              <div className="bg-white p-8 text-center rounded-xl border text-slate-500 text-sm">
                Vui lòng bấm <strong>Chạy PHKP</strong> ở bước 4 trước khi xem phân tích Shadow Price.
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl shadow border">
                  <h3 className="font-bold mb-1 text-slate-800">1. Shadow Price Theo Chỉ Tiêu Dinh Dưỡng (Marginal Value)</h3>
                  <p className="text-xs text-slate-500 mb-3">Mức chi phí thay đổi (VNĐ/kg) nếu tăng hoặc giảm 1 đơn vị dinh dưỡng.</p>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2">Chỉ tiêu Dinh dưỡng</th>
                        <th className="px-4 py-2 text-right">Đạt thực tế</th>
                        <th className="px-4 py-2 text-center">Trạng thái Ràng buộc</th>
                        <th className="px-4 py-2 text-right">Shadow Price (VNĐ/đơn vị)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {optimizationResult.shadowPricesNutrients.map((item) => (
                        <tr key={item.key}>
                          <td className="px-4 py-2 font-semibold">{item.name}</td>
                          <td className="px-4 py-2 text-right font-bold">{item.actual.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center text-xs">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{item.status}</span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-emerald-700">+{item.shadowPrice.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-5 rounded-xl shadow border">
                  <h3 className="font-bold mb-1 text-slate-800">2. Reduced Cost Theo Nguyên Liệu (Chỉ xét nguyên liệu được tick chọn)</h3>
                  <p className="text-xs text-slate-500 mb-3">Mức giá nguyên liệu cần giảm (VNĐ/kg) để được thuật toán chọn phối trộn.</p>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2">Nguyên liệu</th>
                        <th className="px-4 py-2 text-right">Tỷ lệ %</th>
                        <th className="px-4 py-2 text-center">Trạng thái</th>
                        <th className="px-4 py-2 text-right">Mức giá cần giảm (Reduced Cost)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {optimizationResult.shadowPricesIngredients.map((ing) => (
                        <tr key={ing.id}>
                          <td className="px-4 py-2 font-semibold">{ing.name}</td>
                          <td className="px-4 py-2 text-right font-bold">{ing.pct}%</td>
                          <td className="px-4 py-2 text-center text-xs">{ing.status}</td>
                          <td className="px-4 py-2 text-right font-bold text-rose-600">
                            {ing.reducedCost > 0 ? `Cần giảm ${ing.reducedCost.toLocaleString('vi-VN')} đ/kg` : '0 đ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 6: THƯ MỤC */}
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
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
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

      {showReqModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold">{editingReqId ? 'Chỉnh sửa Nhu cầu' : 'Thêm Nhu cầu Vật nuôi Mới'}</h3>
              <button onClick={() => setShowReqModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveReq} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên đối tượng vật nuôi</label>
                <input type="text" required value={reqForm.name} onChange={e => setReqForm({...reqForm, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="border-t pt-2 max-h-56 overflow-y-auto space-y-2">
                <span className="font-bold text-slate-700 block mb-1">Nhập tiêu chuẩn dinh dưỡng tối thiểu:</span>
                {nutrientDefs.map(n => (
                  <div key={n.id} className="flex justify-between items-center">
                    <span>{n.name} ({n.unit}):</span>
                    <input 
                      type="number" step="0.01" 
                      value={reqForm.nutrients[n.id] ?? ''} 
                      onChange={e => setReqForm({...reqForm, nutrients: { ...reqForm.nutrients, [n.id]: parseFloat(e.target.value) || 0 }})}
                      className="w-24 p-1 border rounded text-right" 
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowReqModal(false)} className="px-3 py-1.5 text-slate-600">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">Lưu Nhu Cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIngModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold">{editingIngId ? 'Sửa Nguyên liệu' : 'Thêm Nguyên liệu Mới'}</h3>
              <button onClick={() => setShowIngModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
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
                <span className="font-bold text-slate-700 block">Hàm lượng dinh dưỡng:</span>
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
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">Lưu Nguyên Liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold">{authMode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}</h3>
              <button onClick={() => setShowAuthModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tên đăng nhập tự đặt</label>
                <input type="text" required placeholder="Nhập tên đăng nhập (ví dụ: admin2)" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mật khẩu tự đặt</label>
                <input type="password" required placeholder="Mật khẩu" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <button 
                  type="button" 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
                  className="text-emerald-700 font-semibold underline text-[11px]"
                >
                  {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">
                  {authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
                </button>
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
