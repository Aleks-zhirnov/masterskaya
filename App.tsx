import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Package, 
  Printer, 
  Bot, 
  Plus, 
  Trash2, 
  Clock, 
  ArrowRight,
  ShoppingCart,
  CheckCircle,
  Menu,
  X,
  Cloud,
  CloudOff,
  Database
} from 'lucide-react';
import { Device, DeviceStatus, PartType, SparePart, ViewState, ChatMessage } from './types';
import { generateWorkshopAdvice } from './services/ai';
import { Printables } from './components/Printables';

// --- SERVICE LAYER FOR DATA ---
// This allows switching between LocalStorage and Vercel API seamlessly

const api = {
  isCloudAvailable: async () => {
    try {
      // Try to hit the seed endpoint to check connection/init
      const res = await fetch('/api/seed'); 
      return res.ok;
    } catch (e) {
      return false;
    }
  },
  
  getDevices: async () => {
    const res = await fetch('/api/devices');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  saveDevice: async (device: Device) => {
    await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
  },
  deleteDevice: async (id: string) => {
    await fetch(`/api/devices?id=${id}`, { method: 'DELETE' });
  },

  getParts: async () => {
    const res = await fetch('/api/parts');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  savePart: async (part: SparePart) => {
    await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(part)
    });
  },
  deletePart: async (id: string) => {
    await fetch(`/api/parts?id=${id}`, { method: 'DELETE' });
  }
};

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewState>('repair');
  
  // Storage Mode
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);

  // Data State
  const [devices, setDevices] = useState<Device[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);

  // UI State
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({ status: DeviceStatus.RECEIVED });
  const [inventoryTab, setInventoryTab] = useState<'stock' | 'buy'>('stock');
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<PartType>(PartType.OTHER);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я ваш AI-помощник. Спросите про аналоги или диагностику.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- INITIALIZATION & SYNC ---

  useEffect(() => {
    const initApp = async () => {
      // 1. Check if Cloud is available
      const cloudAvailable = await api.isCloudAvailable();
      
      if (cloudAvailable) {
        setStorageMode('cloud');
        try {
          const cloudDevices = await api.getDevices();
          const cloudParts = await api.getParts();
          setDevices(cloudDevices);
          setParts(cloudParts);
        } catch (e) {
          console.error("Cloud fetch failed, falling back", e);
          loadLocal();
        }
      } else {
        loadLocal();
      }
      setInitLoaded(true);
    };

    const loadLocal = () => {
      setStorageMode('local');
      const localDevs = localStorage.getItem('workshop_devices');
      const localParts = localStorage.getItem('workshop_parts');
      if (localDevs) setDevices(JSON.parse(localDevs));
      if (localParts) setParts(JSON.parse(localParts));
    };

    initApp();
  }, []);

  // --- PERSISTENCE HELPERS ---

  const persistDevice = async (updatedDevices: Device[], changedDevice?: Device, isDelete?: boolean) => {
    setDevices(updatedDevices);
    
    if (storageMode === 'local') {
      localStorage.setItem('workshop_devices', JSON.stringify(updatedDevices));
    } else {
      setIsSyncing(true);
      try {
        if (isDelete && changedDevice) {
          await api.deleteDevice(changedDevice.id);
        } else if (changedDevice) {
          await api.saveDevice(changedDevice);
        }
      } catch (e) {
        console.error("Sync error", e);
        alert("Ошибка синхронизации с облаком. Проверьте соединение.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const persistPart = async (updatedParts: SparePart[], changedPart?: SparePart, isDelete?: boolean) => {
    setParts(updatedParts);
    
    if (storageMode === 'local') {
      localStorage.setItem('workshop_parts', JSON.stringify(updatedParts));
    } else {
      setIsSyncing(true);
      try {
        if (isDelete && changedPart) {
          await api.deletePart(changedPart.id);
        } else if (changedPart) {
          await api.savePart(changedPart);
        }
      } catch (e) {
        console.error("Sync error", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // --- ACTIONS ---

  const sortedDevices = [...devices].sort((a, b) => 
    new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime()
  );

  const addDevice = () => {
    if (!newDevice.clientName || !newDevice.deviceModel) return;
    const device: Device = {
      id: Date.now().toString(),
      clientName: newDevice.clientName,
      deviceModel: newDevice.deviceModel,
      issueDescription: newDevice.issueDescription || '',
      dateReceived: new Date().toISOString(),
      status: DeviceStatus.RECEIVED,
      notes: ''
    };
    persistDevice([...devices, device], device);
    setNewDevice({ status: DeviceStatus.RECEIVED });
    setShowAddDeviceModal(false);
  };

  const updateDeviceStatus = (id: string, status: DeviceStatus) => {
    const updatedDevices = devices.map(d => d.id === id ? { ...d, status } : d);
    const changedDevice = updatedDevices.find(d => d.id === id);
    persistDevice(updatedDevices, changedDevice);
  };

  const deleteDevice = (id: string) => {
    if (confirm('Удалить устройство?')) {
      const deviceToDelete = devices.find(d => d.id === id);
      const updatedDevices = devices.filter(d => d.id !== id);
      persistDevice(updatedDevices, deviceToDelete, true);
    }
  };

  const addPart = () => {
    if (!newPartName) return;
    const part: SparePart = {
      id: Date.now().toString(),
      name: newPartName,
      type: newPartType,
      quantity: 1,
      inStock: inventoryTab === 'stock'
    };
    persistPart([...parts, part], part);
    setNewPartName('');
  };

  const togglePartStockStatus = (id: string) => {
    const updatedParts = parts.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p);
    const changedPart = updatedParts.find(p => p.id === id);
    persistPart(updatedParts, changedPart);
  };

  const deletePart = (id: string) => {
    const partToDelete = parts.find(p => p.id === id);
    const updatedParts = parts.filter(p => p.id !== id);
    persistPart(updatedParts, partToDelete, true);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const prompt = `Контекст: Мастерская.
    В ремонте: ${devices.map(d => `${d.deviceModel} (${d.issueDescription})`).join(', ')}.
    Вопрос: ${userMsg.text}`;

    const responseText = await generateWorkshopAdvice(prompt);
    
    setIsChatLoading(false);
    setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
  };

  // --- RENDERERS ---

  if (!initLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <div className="animate-spin mr-2">
           <Clock className="w-6 h-6" />
        </div>
        Загрузка мастерской...
      </div>
    );
  }

  const renderSidebar = () => (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-screen fixed left-0 top-0 overflow-y-auto no-print z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
            <Wrench className="w-8 h-8" />
            Мастерская
          </h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
             {storageMode === 'cloud' ? (
               <span className="text-green-400 flex items-center gap-1"><Cloud className="w-3 h-3"/> Vercel DB</span>
             ) : (
               <span className="text-orange-400 flex items-center gap-1"><Database className="w-3 h-3"/> Local</span>
             )}
             {isSyncing && <span className="animate-pulse">...</span>}
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavButtons current={view} setView={setView} devicesCount={devices.length} />
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          &copy; 2025 Workshop Pro
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-100 flex justify-around items-center p-3 z-50 border-t border-slate-800 pb-safe">
        <MobileNavButton view="repair" current={view} setView={setView} icon={<Clock className="w-6 h-6" />} label="Ремонт" badge={devices.length} />
        <MobileNavButton view="inventory" current={view} setView={setView} icon={<Package className="w-6 h-6" />} label="Склад" />
        <MobileNavButton view="print" current={view} setView={setView} icon={<Printer className="w-6 h-6" />} label="Печать" />
        <MobileNavButton view="ai_chat" current={view} setView={setView} icon={<Bot className="w-6 h-6" />} label="AI" />
      </div>
    </>
  );

  const renderRepairView = () => (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">В работе</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {storageMode === 'local' && (
              <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">Локальный режим</span>
            )}
            <span>{sortedDevices.length} ус-тв</span>
          </div>
        </div>
        <button 
          onClick={() => setShowAddDeviceModal(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Принять
        </button>
      </div>

      <div className="grid gap-4">
        {sortedDevices.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Package className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Нет устройств</p>
          </div>
        ) : (
          sortedDevices.map((device) => (
            <div key={device.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800">{device.deviceModel}</h3>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {new Date(device.dateReceived).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{device.clientName}</p>
                <div className="bg-red-50 text-red-700 p-2 md:p-3 rounded-md text-sm border border-red-100 mb-3">
                  {device.issueDescription}
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                <div className="flex-grow md:flex-grow-0">
                  <select 
                    value={device.status} 
                    onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)}
                    className={`w-full p-2 rounded border font-medium text-sm focus:outline-none ${
                      device.status === DeviceStatus.READY ? 'bg-green-100 text-green-800 border-green-200' : 
                      device.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500 border-gray-200' :
                      'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {Object.values(DeviceStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => deleteDevice(device.id)}
                  className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Mobile Optimized */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-slide-up md:animate-none">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">Новое устройство</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Модель</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newDevice.deviceModel || ''}
                  onChange={e => setNewDevice({...newDevice, deviceModel: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Клиент</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newDevice.clientName || ''}
                  onChange={e => setNewDevice({...newDevice, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Поломка</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
                  value={newDevice.issueDescription || ''}
                  onChange={e => setNewDevice({...newDevice, issueDescription: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAddDeviceModal(false)}
                  className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button 
                  onClick={addDevice}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInventoryView = () => {
    const displayedParts = parts.filter(p => inventoryTab === 'stock' ? p.inStock : !p.inStock);

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Склад</h2>
        
        <div className="flex gap-2 mb-4 border-b border-slate-200">
          <button 
            onClick={() => setInventoryTab('stock')}
            className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 ${inventoryTab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            В Наличии
          </button>
          <button 
            onClick={() => setInventoryTab('buy')}
            className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 flex justify-center gap-2 ${inventoryTab === 'buy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Купить <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row gap-3">
          <select 
            value={newPartType}
            onChange={(e) => setNewPartType(e.target.value as PartType)}
            className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm outline-none"
          >
            {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2 flex-1">
            <input 
              type="text" 
              placeholder={inventoryTab === 'stock' ? "Название..." : "Что купить..."}
              className="flex-1 p-3 border border-slate-300 rounded-lg outline-none"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPart()}
            />
            <button 
              onClick={addPart}
              className="bg-blue-600 text-white px-4 rounded-lg font-bold"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-0">
          {displayedParts.map(part => (
            <div key={part.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">{part.type}</span>
                <span className="font-medium text-slate-800 text-lg">{part.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => togglePartStockStatus(part.id)}
                  className={`p-2 rounded-full ${part.inStock ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}
                >
                  {part.inStock ? <ShoppingCart className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => deletePart(part.id)}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {displayedParts.length === 0 && (
            <div className="text-center text-slate-400 py-10">Пусто</div>
          )}
        </div>
      </div>
    );
  };

  const renderAIChat = () => (
    <div className="h-[calc(100vh-80px)] md:h-full flex flex-col bg-slate-50 pb-safe">
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-600" />
          AI Помощник
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm md:text-base ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Спросить..."
            className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-purple-500"
            disabled={isChatLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-purple-600 disabled:bg-slate-300 text-white p-3 rounded-xl"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      {renderSidebar()}
      
      <main className="flex-1 ml-0 md:ml-64 print:ml-0 min-h-screen overflow-auto print:overflow-visible">
        {view === 'repair' && renderRepairView()}
        {view === 'inventory' && renderInventoryView()}
        {view === 'print' && <Printables devices={devices.filter(d => d.status !== DeviceStatus.ISSUED)} />}
        {view === 'ai_chat' && renderAIChat()}
      </main>
    </div>
  );
}

// Subcomponents for clearer render logic
const NavButtons = ({ current, setView, devicesCount }: any) => (
  <>
    <button 
      onClick={() => setView('repair')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'repair' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Clock className="w-5 h-5" />
      <span>В ремонте</span>
      {devicesCount > 0 && <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full">{devicesCount}</span>}
    </button>
    <button 
      onClick={() => setView('inventory')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Package className="w-5 h-5" />
      <span>Склад</span>
    </button>
    <button 
      onClick={() => setView('print')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'print' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Printer className="w-5 h-5" />
      <span>Печать</span>
    </button>
    <button 
      onClick={() => setView('ai_chat')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'ai_chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Bot className="w-5 h-5" />
      <span>AI</span>
    </button>
  </>
);

const MobileNavButton = ({ view, current, setView, icon, label, badge }: any) => (
  <button 
    onClick={() => setView(view)}
    className={`flex flex-col items-center gap-1 p-2 rounded-lg relative ${current === view ? 'text-blue-400' : 'text-slate-500'}`}
  >
    <div className="relative">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;