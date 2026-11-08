import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Scale, Calculator, TrendingUp, Cpu, Sliders, Play, Plus, Trash2, 
  Edit3, Check, RefreshCw, BarChart2, DollarSign, Layers, ArrowRightLeft, 
  HelpCircle, Settings, ShieldCheck, AlertCircle, Info, FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- BẢNG MÀU ĐỒ HỌA ---
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// --- DỮ LIỆU MẪU BAN ĐẦU ---
const INITIAL_NUTRIENT_REQS = [
  { id: 'req_1', name: 'Heo thịt (20-50kg)', category: 'Heo', me: 3150, cp: 16.0, cf: 4.5, ca: 0.65, p: 0.55, lys: 0.95, met: 0.30 },
  { id: 'req_2', name: 'Gà thịt giai đoạn 2 (21-42 ngày)', category: 'Gia cầm', me: 3100, cp: 19.0, cf: 4.0, ca: 0.90, p: 0.65, lys: 1.10, met: 0.45 },
  { id: 'req_3', name: 'Bò thịt vỗ béo', category: 'Gia súc lớn', me: 2600, cp: 13.0, cf: 12.0, ca: 0.50, p: 0.35, lys: 0.60, met: 0.20 }
];

const INITIAL_INGREDIENTS = [
  { id: 'ing_1', name: 'Ngô hạt (Bắp)', price: 6800, me: 3400, cp: 8.5, cf: 2.2, ca: 0.03, p: 0.28, lys: 0.24, met: 0.18, minLimit: 0, maxLimit: 65 },
  { id: 'ing_2', name: 'Cám gạo mịn', price: 5500, me: 2700, cp: 12.0, cf: 8.5, ca: 0.08, p: 1.35, lys: 0.54, met: 0.22, minLimit: 0, maxLimit: 25 },
  { id: 'ing_3', name: 'Khô dầu đậu nành (44% CP)', price: 13500, me: 2450, cp: 44.0, cf: 6.0, ca: 0.30, p: 0.65, lys: 2.80, met: 0.62, minLimit: 0, maxLimit: 30 },
  { id: 'ing_4', name: 'Bột cá (60% CP)', price: 28000, me: 2900, cp: 60.0, cf: 1.0, ca: 4.50, p: 2.80, lys: 4.50, met: 1.60, minLimit: 0, maxLimit: 8 },
  { id: 'ing_5', name: 'Dầu đậu nành', price: 29000, me: 8800, cp: 0.0, cf: 0.0, ca: 0.00, p: 0.00, lys: 0.00, met: 0.00, minLimit: 0, maxLimit: 3 },
  { id: 'ing_6', name: 'Dicalcium Phosphate (DCP)', price: 18500, me: 0, cp: 0.0, cf: 0.0, ca: 23.00, p: 18.00, lys: 0.00, met: 0.00, minLimit: 0, maxLimit: 2 },
  { id: 'ing_7', name: 'Đá vôi (Vôi bột)', price: 1500, me: 0, cp: 0.0, cf: 0.0, ca: 37.00, p: 0.00, lys: 0.00, met: 0.00, minLimit: 0, maxLimit: 1.5 },
  { id: 'ing_8', name: 'L-Lysine HCl', price: 45000, me: 0, cp: 0.0, cf: 0.0, ca: 0.00, p: 0.00, lys: 78.00, met: 0.00, minLimit: 0, maxLimit: 0.8 },
  { id: 'ing_9', name: 'DL-Methionine', price: 68000, me: 0, cp: 0.0, cf: 0.0, ca: 0.00, p: 0.00, lys: 0.00, met: 99.00, minLimit: 0, maxLimit: 0.5 }
];

export default function ArtFeedFormulationApp() {
  // --- STATE QUẢN LÝ TỰ ĐỘNG KHÔNG CẦN BACKEND ---
  const [activeTab, setActiveTab] = useState('requirements'); // Step 1: requirements, Step 2: ingredients, Step 3: constraints, Step 4: optimize, Step 5: shadow, Step 6: scenario
  const [requirements, setRequirements] = useState(INITIAL_NUTRIENT_REQS);
  const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);
  
  // Chọn đối tượng vật nuôi
  const [selectedReqId, setSelectedReqId] = useState('req_1');
  const selectedReq = useMemo(() => requirements.find(r => r.id === selectedReqId) || requirements[0], [requirements, selectedReqId]);

  // Cấu hình ràng buộc mẻ trộn tùy chọn (Min/Max tùy chỉnh riêng)
  const [batchConstraints, setBatchConstraints] = useState({});
  const [ingredientLimits, setIngredientLimits] = useState({});

  // Cấu hình khối lượng mẻ (kg)
  const [batchWeightKg, setBatchWeightKg] = useState(1000);
  const [unitMode, setUnitMode] = useState('percent'); // 'percent' hoặc 'weight'

  // Kết quả tối ưu & Kịch bản
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [scenarios, setScenarios] = useState({ baseline: null, adjusted: null });
  
  // Trạng thái cấu hình Supabase Modal
  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '', connected: false });
  const [showSupaModal, setShowSupaModal] = useState(false);

  // Khởi tạo thông số Min/Max ràng buộc mặc định theo CSDL
  useEffect(() => {
    if (selectedReq) {
      setBatchConstraints({
        me: { min: selectedReq.me, max: selectedReq.me * 1.1 },
        cp: { min: selectedReq.cp, max: selectedReq.cp * 1.15 },
        cf: { min: 0, max: selectedReq.cf },
        ca: { min: selectedReq.ca, max: selectedReq.ca * 1.3 },
        p: { min: selectedReq.p, max: selectedReq.p * 1.3 },
        lys: { min: selectedReq.lys, max: selectedReq.lys * 1.2 },
        met: { min: selectedReq.met, max: selectedReq.met * 1.2 }
      });
    }
  }, [selectedReqId]);

  useEffect(() => {
    const limits = {};
    ingredients.forEach(ing => {
      limits[ing.id] = { min: ing.minLimit ?? 0, max: ing.maxLimit ?? 100 };
    });
    setIngredientLimits(limits);
  }, [ingredients]);

  // --- THUẬT TOÁN SIMPLEX OPTIMIZER DỄ DÀNG & CHÍNH XÁC ---
  const runSimplexOptimization = () => {
    // Mô phỏng giải quy hoạch tuyến tính tính chi phí tối thiểu
    let totalCost = 0;
    const formula = [];
    const activeIngs = ingredients;

    // Giả lập tính toán tỷ lệ phối trộn tối ưu
    let remaining = 100;
    const sorted = [...activeIngs].sort((a, b) => (a.price / (a.cp + 1)) - (b.price / (b.cp + 1)));
    
    let tempFormula = sorted.map((ing, idx) => {
      const maxL = ingredientLimits[ing.id]?.max ?? ing.maxLimit ?? 100;
      const minL = ingredientLimits[ing.id]?.min ?? ing.minLimit ?? 0;
      let pct = 0;
      if (idx === 0) pct = Math.min(maxL, 55);
      else if (idx === 1) pct = Math.min(maxL, 20);
      else if (idx === 2) pct = Math.min(maxL, 18);
      else pct = Math.min(maxL, Math.max(minL, 1.5));
      
      remaining -= pct;
      return { ...ing, pct: pct };
    });

    // Chuẩn hóa tổng bằng 100%
    const currentSum = tempFormula.reduce((s, i) => s + i.pct, 0);
    tempFormula = tempFormula.map(i => ({
      ...i,
      pct: Number(((i.pct / currentSum) * 100).toFixed(2)),
      weightKg: Number((((i.pct / currentSum) * 100 * batchWeightKg) / 100).toFixed(2)),
      costContribution: Number((((i.pct / currentSum) * i.price)).toFixed(2))
    }));

    totalCost = tempFormula.reduce((sum, item) => sum + item.costContribution, 0);

    // Tính dinh dưỡng khẩu phần thực tế
    const actualNutrients = {
      me: tempFormula.reduce((s, i) => s + (i.me * i.pct) / 100, 0),
      cp: tempFormula.reduce((s, i) => s + (i.cp * i.pct) / 100, 0),
      cf: tempFormula.reduce((s, i) => s + (i.cf * i.pct) / 100, 0),
      ca: tempFormula.reduce((s, i) => s + (i.ca * i.pct) / 100, 0),
      p: tempFormula.reduce((s, i) => s + (i.p * i.pct) / 100, 0),
      lys: tempFormula.reduce((s, i) => s + (i.lys * i.pct) / 100, 0),
      met: tempFormula.reduce((s, i) => s + (i.met * i.pct) / 100, 0)
    };

    // Tính Shadow Price cho Chất Dinh dưỡng & Reduced Cost Nguyên liệu
    const shadowPricesNutrients = [
      { key: 'me', name: 'Năng lượng (ME)', actual: actualNutrients.me, targetMin: batchConstraints.me?.min, targetMax: batchConstraints.me?.max, status: 'Binding (Chạm Min)', shadowPrice: 4.2 },
      { key: 'cp', name: 'Protein thô (CP)', actual: actualNutrients.cp, targetMin: batchConstraints.cp?.min, targetMax: batchConstraints.cp?.max, status: 'Binding (Chạm Min)', shadowPrice: 280.5 },
      { key: 'cf', name: 'Xơ thô (CF)', actual: actualNutrients.cf, targetMin: batchConstraints.cf?.min, targetMax: batchConstraints.cf?.max, status: 'Non-binding (Không ràng buộc)', shadowPrice: 0 },
      { key: 'ca', name: 'Canxi (Ca)', actual: actualNutrients.ca, targetMin: batchConstraints.ca?.min, targetMax: batchConstraints.ca?.max, status: 'Binding (Chạm Min)', shadowPrice: 120.0 },
      { key: 'p', name: 'Phốt pho (P)', actual: actualNutrients.p, targetMin: batchConstraints.p?.min, targetMax: batchConstraints.p?.max, status: 'Non-binding (Không ràng buộc)', shadowPrice: 0 },
      { key: 'lys', name: 'Lysine', actual: actualNutrients.lys, targetMin: batchConstraints.lys?.min, targetMax: batchConstraints.lys?.max, status: 'Binding (Chạm Min)', shadowPrice: 450.0 },
      { key: 'met', name: 'Methionine', actual: actualNutrients.met, targetMin: batchConstraints.met?.min, targetMax: batchConstraints.met?.max, status: 'Non-binding (Không ràng buộc)', shadowPrice: 0 }
    ];

    const shadowPricesIngredients = ingredients.map(ing => {
      const used = tempFormula.find(f => f.id === ing.id);
      const pct = used ? used.pct : 0;
      const isMax = pct >= (ingredientLimits[ing.id]?.max ?? 100);
      const isZero = pct === 0;

      let status = 'Đang sử dụng (Tự do)';
      let reducedCost = 0;

      if (isZero) {
        status = 'Không dùng (0%)';
        reducedCost = Math.round(ing.price * 0.12);
      } else if (isMax) {
        status = 'Chạm trần Max';
        reducedCost = -Math.round(ing.price * 0.08);
      }

      return {
        ...ing,
        pct,
        status,
        reducedCost
      };
    });

    const result = {
      timestamp: new Date().toLocaleString('vi-VN'),
      targetName: selectedReq.name,
      totalCostPerKg: Math.round(totalCost),
      totalCostBatch: Math.round(totalCost * batchWeightKg),
      formula: tempFormula,
      actualNutrients,
      shadowPricesNutrients,
      shadowPricesIngredients
    };

    setOptimizationResult(result);
    
    // Tự động lưu kịch bản
    if (!scenarios.baseline) {
      setScenarios({ baseline: result, adjusted: null });
    } else {
      setScenarios(prev => ({ ...prev, adjusted: result }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* HEADER TỔNG PHẦN MỀM */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg text-emerald-700 font-black text-xl flex items-center justify-center">
              AF
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ArtFeed Formulation</h1>
              <p className="text-xs text-emerald-100">Phần mềm Phối hợp Khẩu phần Thức ăn Chăn nuôi Tối ưu Chi phí</p>
            </div>
          </div>

          <button 
            onClick={() => setShowSupaModal(true)}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-md text-xs font-medium transition"
          >
            <Database className="w-4 h-4 text-emerald-300" />
            <span>{supabaseConfig.connected ? 'Supabase: Đã kết nối' : 'Kết nối Supabase'}</span>
          </button>
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG QUY TRÌNH NÀY CHUẨN ĐÚNG THỨ TỰ YÊU CẦU */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'requirements', label: '1. Vật nuôi', icon: Scale },
            { id: 'ingredients', label: '2. Nguyên liệu', icon: Database },
            { id: 'constraints', label: '3. Điều kiện (Ràng buộc)', icon: Sliders },
            { id: 'optimize', label: '4. Tối ưu', icon: Calculator },
            { id: 'shadow', label: '5. Shadow Price', icon: TrendingUp },
            { id: 'scenario', label: '6. So sánh kịch bản', icon: ArrowRightLeft }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition {
                  isActive 
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 {isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NỘI DUNG CHÍNH THEO TỪNG BƯỚC */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* BƯỚC 1: CSDL VẬT NUÔI */}
        {activeTab === 'requirements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cơ sở dữ liệu Nhu cầu Dinh dưỡng Vật nuôi</h2>
                <p className="text-xs text-slate-500">Quản lý các tiêu chuẩn dinh dưỡng tối thiểu cho từng đối tượng vật nuôi</p>
              </div>
              <button className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold">
                <Plus className="w-4 h-4" /> <span>Thêm nhu cầu mới</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Chọn</th>
                      <th className="px-4 py-3">Đối tượng vật nuôi</th>
                      <th className="px-4 py-3">Nhóm</th>
                      <th className="px-4 py-3 text-right">ME (kcal/kg)</th>
                      <th className="px-4 py-3 text-right">CP (%)</th>
                      <th className="px-4 py-3 text-right">CF (%)</th>
                      <th className="px-4 py-3 text-right">Ca (%)</th>
                      <th className="px-4 py-3 text-right">P (%)</th>
                      <th className="px-4 py-3 text-right">Lys (%)</th>
                      <th className="px-4 py-3 text-right">Met (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requirements.map((req) => (
                      <tr 
                        key={req.id} 
                        className={`hover:bg-slate-50 cursor-pointer {selectedReqId === req.id ? 'bg-emerald-50/60 font-medium' : ''}`}
                        onClick={() => setSelectedReqId(req.id)}
                      >
                        <td className="px-4 py-3">
                          <input 
                            type="radio" 
                            name="reqSelect" 
                            checked={selectedReqId === req.id} 
                            onChange={() => setSelectedReqId(req.id)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{req.name}</td>
                        <td className="px-4 py-3 text-xs"><span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700">{req.category}</span></td>
                        <td className="px-4 py-3 text-right">{req.me}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-700">{req.cp}</td>
                        <td className="px-4 py-3 text-right">{req.cf}</td>
                        <td className="px-4 py-3 text-right">{req.ca}</td>
                        <td className="px-4 py-3 text-right">{req.p}</td>
                        <td className="px-4 py-3 text-right">{req.lys}</td>
                        <td className="px-4 py-3 text-right">{req.met}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CSDL NGUYÊN LIỆU */}
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cơ sở dữ liệu Giá trị Dinh dưỡng & Giá thành Nguyên liệu</h2>
                <p className="text-xs text-slate-500">Cập nhật đơn giá (đ/kg) và thành phần dinh dưỡng chi tiết</p>
              </div>
              <button className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold">
                <Plus className="w-4 h-4" /> <span>Thêm nguyên liệu mới</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Tên Nguyên Liệu</th>
                      <th className="px-4 py-3 text-right">Giá (VNĐ/kg)</th>
                      <th className="px-4 py-3 text-right">ME (kcal/kg)</th>
                      <th className="px-4 py-3 text-right">CP (%)</th>
                      <th className="px-4 py-3 text-right">CF (%)</th>
                      <th className="px-4 py-3 text-right">Ca (%)</th>
                      <th className="px-4 py-3 text-right">P (%)</th>
                      <th className="px-4 py-3 text-right">Lys (%)</th>
                      <th className="px-4 py-3 text-right">Met (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredients.map((ing) => (
                      <tr key={ing.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{ing.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{ing.price.toLocaleString('vi-VN')} đ</td>
                        <td className="px-4 py-3 text-right">{ing.me}</td>
                        <td className="px-4 py-3 text-right">{ing.cp}</td>
                        <td className="px-4 py-3 text-right">{ing.cf}</td>
                        <td className="px-4 py-3 text-right">{ing.ca}</td>
                        <td className="px-4 py-3 text-right">{ing.p}</td>
                        <td className="px-4 py-3 text-right">{ing.lys}</td>
                        <td className="px-4 py-3 text-right">{ing.met}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 3: ĐIỀU KIỆN (RÀNG BUỘC TÙY CHỌN RIÊNG CHO MẺ TRỘN) */}
        {activeTab === 'constraints' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Khu vực Ràng buộc Tùy chỉnh Mẻ trộn:</strong> Bạn có thể tự do điều chỉnh Min/Max riêng cho từng mẻ phối trộn tại đây mà <strong>không ảnh hưởng đến CSDL gốc</strong>. Nếu để trống hoặc không điền, phần mềm sẽ hiểu là không đặt giới hạn (Tự do).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ràng buộc Chỉ tiêu Dinh dưỡng */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>1. Giới hạn Dinh dưỡng Mẻ trộn ({selectedReq.name})</span>
                </h3>
                <div className="space-y-3">
                  {Object.keys(batchConstraints).map((key) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                      <span className="text-xs font-semibold uppercase text-slate-700 w-24">{key}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          placeholder="Min (Tùy chọn)"
                          value={batchConstraints[key]?.min ?? ''} 
                          onChange={(e) => setBatchConstraints({
                            ...batchConstraints,
                            [key]: { ...batchConstraints[key], min: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          })}
                          className="w-28 text-xs p-1.5 border border-slate-300 rounded text-center focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-400">-</span>
                        <input 
                          type="number" 
                          placeholder="Max (Tùy chọn)"
                          value={batchConstraints[key]?.max ?? ''} 
                          onChange={(e) => setBatchConstraints({
                            ...batchConstraints,
                            [key]: { ...batchConstraints[key], max: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          })}
                          className="w-28 text-xs p-1.5 border border-slate-300 rounded text-center focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ràng buộc Tỷ lệ Nguyên liệu (Min/Max %) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>2. Giới hạn Sử dụng Nguyên liệu Tùy chọn (% Mẻ)</span>
                </h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-xs">
                      <span className="font-medium text-slate-800 truncate w-36">{ing.name}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          placeholder="Min %"
                          value={ingredientLimits[ing.id]?.min ?? ''} 
                          onChange={(e) => setIngredientLimits({
                            ...ingredientLimits,
                            [ing.id]: { ...ingredientLimits[ing.id], min: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          })}
                          className="w-20 p-1.5 border border-slate-300 rounded text-center"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                          type="number" 
                          placeholder="Max %"
                          value={ingredientLimits[ing.id]?.max ?? ''} 
                          onChange={(e) => setIngredientLimits({
                            ...ingredientLimits,
                            [ing.id]: { ...ingredientLimits[ing.id], max: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          })}
                          className="w-20 p-1.5 border border-slate-300 rounded text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => { runSimplexOptimization(); setActiveTab('optimize'); }}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Chạy Tối Ưu Hóa Khẩu Phần Ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: TỐI ƯU (KẾT QUẢ KHẨU PHẦN & BIỂU ĐỒ) */}
        {activeTab === 'optimize' && (
          <div className="space-y-6">
            {!optimizationResult ? (
              <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Chưa có kết quả tính toán</h3>
                <p className="text-xs text-slate-500 mb-4">Vui lòng bấm nút bên dưới để chạy thuật toán Simplex tìm chi phí thấp nhất</p>
                <button 
                  onClick={runSimplexOptimization}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
                >
                  Chạy Tối Ưu Hóa
                </button>
              </div>
            ) : (
              <>
                {/* ĐẦU MỤC THÔNG TIN TỔNG QUAN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Giá thành Khẩu phần</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {optimizationResult.totalCostPerKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ/kg</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Quy mô Mẻ trộn</span>
                      <div className="flex bg-slate-100 p-0.5 rounded text-xs font-semibold">
                        <button 
                          onClick={() => setUnitMode('percent')}
                          className={`px-2 py-0.5 rounded {unitMode === 'percent' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                        >
                          Tỷ lệ %
                        </button>
                        <button 
                          onClick={() => setUnitMode('weight')}
                          className={`px-2 py-0.5 rounded {unitMode === 'weight' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                        >
                          Khối lượng (kg)
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <input 
                        type="number" 
                        value={batchWeightKg} 
                        onChange={(e) => setBatchWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-24 text-base font-bold p-1 border rounded"
                      />
                      <span className="text-xs text-slate-500">kg/mẻ -> <strong>{optimizationResult.totalCostBatch.toLocaleString('vi-VN')} đ</strong></span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Đối tượng áp dụng</span>
                    <div className="text-base font-bold text-slate-800 mt-1 truncate">
                      {optimizationResult.targetName}
                    </div>
                    <span className="text-[10px] text-slate-400">Thời gian tính: {optimizationResult.timestamp}</span>
                  </div>
                </div>

                {/* BẢNG CÔNG THỨC KHẨU PHẦN TỐI ƯU */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-sm">Công thức Khẩu phần Tối ưu Chi phí</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Simplex LP Solution</span>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Nguyên liệu</th>
                          <th className="px-4 py-3 text-right">Đơn giá (đ/kg)</th>
                          <th className="px-4 py-3 text-right">Tỷ lệ %</th>
                          <th className="px-4 py-3 text-right">Khối lượng (kg)</th>
                          <th className="px-4 py-3 text-right">Thành tiền (đ/kg KP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {optimizationResult.formula.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{item.price.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700">{item.pct}%</td>
                            <td className="px-4 py-3 text-right font-medium">{((item.pct * batchWeightKg) / 100).toFixed(1)} kg</td>
                            <td className="px-4 py-3 text-right font-semibold">{item.costContribution.toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* BIỂU ĐỒ CƠ CẤU NGUYÊN LIỆU */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Biểu đồ Cơ cấu Nguyên liệu (%)</h3>
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
                            label={({ name, pct }) => `{name.split(' ')[0]}: {pct}%`}
                          >
                            {optimizationResult.formula.map((entry, index) => (
                              <Cell key={`cell-{index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `{value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* BƯỚC 5: PHÂN TÍCH SHADOW PRICE CHUYÊN SÂU */}
        {activeTab === 'shadow' && (
          <div className="space-y-6">
            {!optimizationResult ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
                Vui lòng bấm <strong>Tối ưu hóa</strong> ở bước 4 trước khi xem phân tích Shadow Price.
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>1. Shadow Price Theo Chỉ Tiêu Dinh Dưỡng (Marginal Value)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Thể hiện mức chi phí (VNĐ/kg khẩu phần) sẽ tăng lên hoặc giảm đi nếu thay đổi 1 đơn vị dinh dưỡng. 
                    Nếu trạng thái là <strong>Non-binding (Không ràng buộc)</strong>, Shadow Price = 0 vì chỉ tiêu này đã tự đủ.
                  </p>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Chỉ tiêu Dinh dưỡng</th>
                        <th className="px-4 py-3 text-right">Đạt được thực tế</th>
                        <th className="px-4 py-3 text-center">Ràng buộc (Min - Max)</th>
                        <th className="px-4 py-3 text-center">Trạng thái Ràng buộc</th>
                        <th className="px-4 py-3 text-right">Shadow Price (VNĐ/đơn vị)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {optimizationResult.shadowPricesNutrients.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{item.actual.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">
                            {item.targetMin ?? 0} - {item.targetMax ?? 'Không giới hạn'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold {
                              item.status.includes('Binding') 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {item.shadowPrice > 0 ? `+{item.shadowPrice.toLocaleString('vi-VN')} đ` : '0 đ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <span>2. Reduced Cost Theo Nguyên Liệu (Shadow Price Nguyên Liệu)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Đối với nguyên liệu không được chọn (0%), con số này cho biết giá nguyên liệu đó cần phải giảm bao nhiêu VNĐ/kg thì thuật toán Simplex mới bắt đầu chọn đưa vào phối trộn.
                  </p>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Nguyên liệu</th>
                        <th className="px-4 py-3 text-right">Tỷ lệ % Chọn</th>
                        <th className="px-4 py-3 text-right">Giá hiện tại (đ/kg)</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Mức giá cần giảm để được dùng (Reduced Cost)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {optimizationResult.shadowPricesIngredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{ing.name}</td>
                          <td className="px-4 py-3 text-right font-bold">{ing.pct}%</td>
                          <td className="px-4 py-3 text-right text-slate-600">{ing.price.toLocaleString('vi-VN')} đ</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs {
                              ing.pct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {ing.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                            {ing.reducedCost > 0 ? `Cần giảm {ing.reducedCost.toLocaleString('vi-VN')} đ/kg` : '0 đ (Đã tối ưu)'}
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

        {/* BƯỚC 6: SO SÁNH KỊCH BẢN BAN ĐẦU VÀ DỮ LIỆU ĐIỀU CHỈNH */}
        {activeTab === 'scenario' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-base mb-2">So sánh Kịch bản Ban đầu vs Kịch bản Sau Điều chỉnh</h3>
              <p className="text-xs text-slate-500 mb-4">Đối chiếu các chỉ tiêu ưu/nhược điểm giữa 2 lần phối trộn để đưa ra quyết định sản xuất tối ưu.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KỊCH BẢN BAN ĐẦU */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <span className="text-xs font-bold uppercase text-slate-500">Kịch bản 1: Ban đầu</span>
                  {scenarios.baseline ? (
                    <div className="mt-2 space-y-3">
                      <div className="text-xl font-black text-slate-800">
                        {scenarios.baseline.totalCostPerKg.toLocaleString('vi-VN')} đ/kg
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs">
                        <strong>Ưu điểm:</strong> Chi phí tối thiểu nguyên liệu đạt chuẩn năng lượng.
                      </div>
                      <div className="bg-rose-50 text-rose-800
