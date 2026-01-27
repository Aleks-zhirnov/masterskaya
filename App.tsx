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
  Database,
  RefreshCw,
  Minus,
  Tag,
  BookOpen,
  Calculator,
  Table,
  Zap,
  Search,
  Lightbulb,
  ExternalLink,
  Filter,
  AlertCircle,
  BrainCircuit,
  Flame,
  Battery,
  ChevronDown,
  ChevronUp,
  Car,
  Utensils,
  Droplets,
  CupSoda,
  Activity,
  Disc,
  Scissors
} from 'lucide-react';
import { Device, DeviceStatus, PartType, SparePart, ViewState, ChatMessage, Urgency } from './types';
import { generateWorkshopAdvice } from './services/ai';
import { Printables } from './components/Printables';

// --- CONSTANTS ---

// Справочник категорий радиодеталей
const RADIO_SUBCATEGORIES: Record<PartType, string[]> = {
  [PartType.CAPACITOR]: ['Электролитические', 'Керамические (SMD)', 'Керамические (Выводные)', 'Танталовые', 'Пленочные', 'Пусковые'],
  [PartType.RESISTOR]: ['0.125Вт', '0.25Вт', '0.5Вт', '1Вт', '2Вт', '5Вт (Цемент)', 'SMD 0805', 'SMD 0603', 'SMD 1206', 'Переменные (Потенциометры)'],
  [PartType.DIODE]: ['Выпрямительные', 'Шоттки', 'Стабилитроны', 'Диодные мосты', 'Варикапы', 'SMD'],
  [PartType.TRANSISTOR]: ['Биполярные NPN', 'Биполярные PNP', 'MOSFET N-канал', 'MOSFET P-канал', 'IGBT', 'Полевые'],
  [PartType.LED]: ['3мм', '5мм', '10мм', 'SMD', 'Ленты', 'Мощные (1W+)'],
  [PartType.CHIP]: ['Микроконтроллеры', 'Память', 'Логика', 'ШИМ контроллеры', 'Операционные усилители', 'Стабилизаторы'],
  [PartType.CONNECTOR]: ['USB', 'HDMI', 'Audio Jack', 'Клеммники', 'Питание DC', 'Шлейфы'],
  [PartType.SWITCH]: ['Тактовые кнопки', 'Тумблеры', 'Рокерные', 'Микропереключатели'],
  [PartType.FUSE]: ['Стеклянные 5x20', 'Автомобильные', 'Термопредохранители', 'Самовосстанавливающиеся'],
  [PartType.MODULE]: ['DC-DC Понижающие', 'DC-DC Повышающие', 'Зарядка Li-Ion', 'Arduino', 'ESP', 'Датчики'],
  [PartType.OTHER]: ['Провода', 'Термоусадка', 'Припой/Флюс', 'Винты/Гайки', 'Радиаторы', 'Корпуса']
};

// Данные для базы знаний (Расширенные для PRO уровня)
const KNOWLEDGE_BASE = [
  {
    title: 'Робот-пылесосы (Xiaomi, Roborock, iRobot)',
    icon: <Disc className="w-6 h-6 text-indigo-500" />,
    description: 'Лидары, датчики падения, цепи заряда',
    issues: [
      { 
        problem: 'Не видит базу / Тыкается в док / Не паркуется', 
        solution: '1. Проверить ИК-прозрачность переднего бампера (царапины рассеивают луч). 2. Док-станция: сгорают ИК-диоды внутри (проверить камерой телефона - должны светиться). 3. Материнская плата: Окисление контактов зарядки. Пылесос "видит" напряжение, но под нагрузкой оно проседает. Чистить контакты, проверять TVS-диоды и токоизмерительные шунты на входе цепи заряда.' 
      },
      { 
        problem: 'Ошибка лидара (Lidar Error 1)', 
        solution: 'Лидар крутится, но ошибка: Сдох лазерный диод (деградация). Лидар не крутится: Заклинил моторчик (Mabuchi RF-500) или лопнул пассик. Если моторчик грязный внутри - чистка коллектора помогает на месяц, лучше менять.' 
      },
      { 
        problem: 'Ошибка колеса (в воздухе)', 
        solution: 'Колесо на земле, но робот думает, что висит. Причина: Микропереключатель внутри модуля колеса окислился. Разобрать модуль, пролить WD-40/Contact Cleaner или заменить микрик.' 
      },
      { 
        problem: 'Залитие водой (Fan Error / Mop Error)', 
        solution: 'Вода засасывается в турбину. На плате гниет драйвер управления турбиной и переходные отверстия (VIAs). Если турбина "свистит" - подшипники ржавые, только замена узла.' 
      }
    ]
  },
  {
    title: 'Массажеры и Массажные кресла',
    icon: <Activity className="w-6 h-6 text-pink-600" />,
    description: 'Сложная механика и силовая электроника',
    issues: [
      { 
        problem: 'Не включается, моторы молчат, но НАГРЕВ есть', 
        solution: 'Питание нагрева часто идет напрямую через реле. Если моторы молчат, значит нет питания логики (5V/3.3V). 1. Проверить стабилизаторы (L7805, AMS1117) на плате управления. 2. Очень часто: От вибрации отваливается кварцевый резонатор (ноги ломаются у корпуса). 3. Проверить кнопку включения (мембрана лопается).' 
      },
      { 
        problem: 'Гудит, но ролики не крутятся под нагрузкой', 
        solution: 'Лопнула пластиковая шестерня в редукторе (часто на валу червяка). Решение: 3D печать из нейлона или поиск донора. Если шестерни целы - межвитковое в роторе двигателя (жрет ток, греется, нет момента).' 
      },
      { 
        problem: 'Хаотичные переключения / Самопроизвольный старт', 
        solution: 'Перетерт кабель пульта (многожильный шлейф). Прозванивать, изгибая провод. Также проверить кнопки на панели - "текущие" тактовые кнопки дают паразитное сопротивление.' 
      },
      { 
        problem: 'Ошибка положения каретки (Кресла)', 
        solution: 'Оптический энкодер или геркон на валу мотора не считает обороты. Пропаять датчик Холла, проверить магнитный диск на валу (мог треснуть или сместиться).' 
      }
    ]
  },
  {
    title: 'Автомобильные ЭБУ (ECU)',
    icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
    description: 'Bosch, Siemens, Delphi, Denso',
    issues: [
      { 
        problem: 'Троит, нет импульса на форсунку/катушку', 
        solution: 'Вылет силовых ключей (IGBT/MOSFET). Маркировка часто специфичная (Bosch 30xxx). Аналоги: GB10NB37LZ, IRGS14C40L. ВАЖНО: Перед заменой проверить катушку зажигания на межвитковое, иначе новый ключ сгорит сразу.' 
      },
      { 
        problem: 'Не выходит на диагностику (Нет связи)', 
        solution: '1. Проверить питание процессора (Watchdog/LDO). 2. Микросхема CAN-трансивера (TJA1040, TJA1050) часто пробивается статикой. 3. Кварц процессора (генерация).' 
      },
      { 
        problem: 'Ошибка дроссельной заслонки', 
        solution: 'Обычно это драйвер мотора заслонки (H-мост, типа TLE7209). Также проверить пайку разъема - пины отваливаются от вибрации.' 
      },
      { 
        problem: 'Утопленник (зелень на плате)', 
        solution: 'Гниют переходные отверстия (VIAs). Выглядят как черные точки. Прозванивать и дублировать тонкой жилой (МГТФ). УЗ ванна обязательна с Flux-Off.' 
      }
    ]
  },
  {
    title: 'Платы газовых котлов',
    icon: <Flame className="w-6 h-6 text-orange-500" />,
    description: 'Ответственная электроника. Осторожно!',
    issues: [
      { 
        problem: 'Циклическая перезагрузка (Реле щелкает)', 
        solution: 'Высох электролит по питанию реле (обычно 470uF 25V или 1000uF 25V). Напряжение проседает при включении реле -> проц сбрасывается. Менять на 105°C Low ESR.' 
      },
      { 
        problem: 'Ошибка пламени (E01), хотя искра есть', 
        solution: 'Цепь ионизации. 1. Проверить фазировку (вилка). 2. Резисторы в цепи электрода контроля пламени (обычно высокоомные 1-10 МОм) уходят в обрыв. 3. Оптопара в цепи детекции.' 
      },
      { 
        problem: 'Турбина не стартует / Ошибка дымоудаления', 
        solution: 'Реле турбины залипает (контакты сварились) или не замыкается (катушка в обрыве). Реже - симистор управления турбиной.' 
      }
    ]
  },
  {
    title: 'ИБП (UPS)',
    icon: <Battery className="w-6 h-6 text-green-600" />,
    description: 'Силовая часть и логика',
    issues: [
      { 
        problem: 'Не включается вообще (Мертвый)', 
        solution: 'Если АКБ в норме (>12В), смотреть "мелкие" конденсаторы (22uF 50V, 4.7uF 50V) в обвязке ШИМ контроллера дежурки (UC3843 и т.п.). Они высыхают и запуск не происходит ("цыканье").' 
      },
      { 
        problem: 'Не переходит на батарею (сразу глохнет)', 
        solution: 'Сгорели предохранители (автомобильные 30-40А) на плате. Причина: пробой плеча инвертора (полевики IRF3205/IRF740). Менять транзисторы ПАРАМИ/ЧЕТВЕРКАМИ из одной партии.' 
      },
      { 
        problem: 'Постоянно щелкает реле (AVR)', 
        solution: 'ИБП пытается выровнять напряжение, но реле не контачит. Подгорели контакты реле переключения обмоток трансформатора. Замена реле.' 
      }
    ]
  },
  {
    title: 'Увлажнители воздуха',
    icon: <Droplets className="w-6 h-6 text-cyan-500" />,
    description: 'Ультразвуковые генераторы',
    issues: [
      { 
        problem: 'Вентилятор крутит, пара нет', 
        solution: 'Генератор тумана. Транзистор BU406 (или 2SC3834) пробит. Обязательно проверить резистор в базе (0.47 Ом - 47 Ом) и стабилитрон. Без них новый транзистор сгорит сразу.' 
      },
      { 
        problem: 'Пар слабый, еле идет', 
        solution: 'Деградация пьезоэлемента. Если есть белесый налет, который не убирается - менять мембрану (20мм/25мм). Также проверить подстроечный резистор частоты (если есть) - он окисляется.' 
      },
      { 
        problem: 'Не видит воду (горит красным)', 
        solution: 'Герконовый поплавок. Магнит внутри кольца ржавеет и теряет силу. Или сам геркон залип. Часто лечится чисткой поплавка от слизи.' 
      }
    ]
  },
  {
    title: 'Мультиварки',
    icon: <Utensils className="w-6 h-6 text-red-500" />,
    description: 'Термоконтроль и силовые реле',
    issues: [
      { 
        problem: 'Полная тишина (Экран не горит)', 
        solution: 'Вскрывать дно. В белом кембрике, прижатом к чаше, стоит термопредохранитель (Termo Fuse 160-185°C). Он одноразовый. Если сгорел - проверить реле ТЭНа на залипание.' 
      },
      { 
        problem: 'Ошибка E1/E2 (Обрыв датчика)', 
        solution: 'Датчик крышки. Провод переламывается в петле крышки (место сгиба). Аккуратно вскрыть изоляцию, спаять, усилить термоусадкой. Датчик обычно NTC 50k или 100k.' 
      },
      { 
        problem: 'Убегает каша / Перегрев', 
        solution: 'Грязный датчик температуры (кнопка в центре нагревателя). Попала еда/жир, плохой тепловой контакт. Разобрать кнопку, почистить, проверить пружину.' 
      }
    ]
  },
  {
    title: 'Powerbank (Внешние АКБ)',
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    description: 'Контроллеры заряда и защиты',
    issues: [
      { 
        problem: 'Моргает одним диодом, заряд не берет', 
        solution: 'Глубокий разряд банок (ниже 2.8В). Контроллер (IP5306/IP5328) заблокировался. "Толкнуть" банки от ЛБП током 1А до 3.2В. Потом подключить зарядку - контроллер оживет.' 
      },
      { 
        problem: 'Не работает быстрая зарядка (QC/PD)', 
        solution: 'Линии данных D+/D- на разъеме USB/Type-C. Часто отвал пайки или пробой защитных сборок по линиям данных. Пропаять разъем.' 
      }
    ]
  },
  {
    title: 'Электрогазонокосилки',
    icon: <Scissors className="w-6 h-6 text-green-700" />,
    description: 'Двигатели и кнопки',
    issues: [
      { 
        problem: 'Не включается / Гудит', 
        solution: 'Кнопка пуска в ручке - подгорают контакты из-за пыли и вибрации. Разбирать, чистить ластиком. Если гудит и не крутит - пусковой конденсатор (10-16uF) потерял емкость.' 
      },
      { 
        problem: 'Тормоз не срабатывает / Запах гари', 
        solution: 'Механический тормоз (лента или прижим) забился травой и не отходит до конца -> перегрев двигателя и оплавление посадочного места подшипника в пластике.' 
      }
    ]
  },
  {
    title: 'Диспенсеры для воды (Кулеры)',
    icon: <CupSoda className="w-6 h-6 text-blue-400" />,
    description: 'Пельтье и ТЭНы',
    issues: [
      { 
        problem: 'Не холодит (Вентилятор не крутит)', 
        solution: 'В дешевых моделях элементы Пельтье умирают часто. Если вентилятор сдох, Пельтье перегревается и сгорает за минуты. Менять пару: TEC1-12706 + Вентилятор 80/90мм.' 
      },
      { 
        problem: 'Вода чуть теплая, не кипяток', 
        solution: 'Термодатчик на баке нагрева (KSD301). Они со временем "уплывают" и срабатывают раньше (например, на 70°C вместо 90°C). Замена таблетки.' 
      }
    ]
  },
  {
    title: 'Блоки управления кресел (Auto)',
    icon: <Car className="w-6 h-6 text-slate-600" />,
    description: 'Память, моторы, CAN',
    issues: [
      { 
        problem: 'Высаживает АКБ за ночь', 
        solution: 'Блок не засыпает. Частая причина в Mercedes/BMW - пробитый керамический конденсатор (SMD) по входу питания процессора или драйверов. Звонить на КЗ по питанию.' 
      },
      { 
        problem: 'Движение рывками (по 1 см)', 
        solution: 'Блок не видит импульсов от датчика Холла в моторе (считает, что мотор заклинил и отрубает ток). Проблема в самом датчике внутри мотора или проводке.' 
      }
    ]
  }
];

// Данные для таблицы ESR (STANDARD)
const ESR_DATA_STD = [
  { cap: '1 uF', v10: '5.0', v16: '4.0', v25: '3.0', v63: '2.4' },
  { cap: '2.2 uF', v10: '3.5', v16: '3.0', v25: '2.5', v63: '1.8' },
  { cap: '4.7 uF', v10: '2.8', v16: '2.3', v25: '1.9', v63: '1.3' },
  { cap: '10 uF', v10: '1.8', v16: '1.5', v25: '1.2', v63: '0.9' },
  { cap: '22 uF', v10: '1.4', v16: '1.1', v25: '0.9', v63: '0.6' },
  { cap: '47 uF', v10: '0.95', v16: '0.80', v25: '0.70', v63: '0.45' },
  { cap: '100 uF', v10: '0.55', v16: '0.45', v25: '0.35', v63: '0.25' },
  { cap: '220 uF', v10: '0.35', v16: '0.28', v25: '0.22', v63: '0.15' },
  { cap: '470 uF', v10: '0.20', v16: '0.16', v25: '0.14', v63: '0.10' },
  { cap: '1000 uF', v10: '0.12', v16: '0.10', v25: '0.08', v63: '0.06' },
  { cap: '2200 uF', v10: '0.08', v16: '0.06', v25: '0.05', v63: '0.04' },
];

// Данные для таблицы Low ESR
const ESR_DATA_LOW = [
  { cap: '1 uF', v10: '-', v16: '-', v25: '-', v63: '-' },
  { cap: '4.7 uF', v10: '-', v16: '-', v25: '-', v63: '-' },
  { cap: '10 uF', v10: '0.58', v16: '0.45', v25: '0.38', v63: '0.28' },
  { cap: '22 uF', v10: '0.42', v16: '0.32', v25: '0.26', v63: '0.20' },
  { cap: '47 uF', v10: '0.28', v16: '0.22', v25: '0.18', v63: '0.14' },
  { cap: '100 uF', v10: '0.16', v16: '0.12', v25: '0.10', v63: '0.09' },
  { cap: '220 uF', v10: '0.09', v16: '0.07', v25: '0.06', v63: '0.05' },
  { cap: '470 uF', v10: '0.055', v16: '0.042', v25: '0.038', v63: '0.034' },
  { cap: '1000 uF', v10: '0.036', v16: '0.028', v25: '0.025', v63: '0.021' },
  { cap: '2200 uF', v10: '0.024', v16: '0.019', v25: '0.017', v63: '0.016' },
  { cap: '3300 uF', v10: '0.018', v16: '0.015', v25: '0.014', v63: '0.013' },
];

// --- SERVICE LAYER FOR DATA ---

const api = {
  // Безопасный метод запроса с проверкой типа контента
  request: async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("text/html")) {
        throw new Error("API вернул HTML. Возможно, вы в локальном режиме или произошла ошибка сервера.");
      }

      if (!res.ok) {
        let errorMsg = `Ошибка сервера: ${res.status}`;
        try {
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          }
        } catch (e) { }
        throw new Error(errorMsg);
      }

      try {
        return await res.json();
      } catch (e) {
        throw new Error("Некорректный JSON от сервера");
      }
    } catch (error: any) {
      throw error; 
    }
  },

  initCloud: async () => {
    return api.request('/api/seed');
  },
  
  getDevices: async () => {
    return api.request('/api/devices');
  },
  saveDevice: async (device: Device) => {
    return api.request('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
  },
  deleteDevice: async (id: string) => {
    return api.request(`/api/devices?id=${id}`, { method: 'DELETE' });
  },

  getParts: async () => {
    return api.request('/api/parts');
  },
  savePart: async (part: SparePart) => {
    return api.request('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(part)
    });
  },
  deletePart: async (id: string) => {
    return api.request(`/api/parts?id=${id}`, { method: 'DELETE' });
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

  // UI State - Repair
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
  
  // UI State - Inventory
  const [inventoryTab, setInventoryTab] = useState<'stock' | 'buy'>('stock');
  const [inventoryFilterType, setInventoryFilterType] = useState<PartType | 'ALL'>('ALL');
  const [inventoryFilterSubtype, setInventoryFilterSubtype] = useState<string>('ALL');
  
  // UI State - Knowledge Base
  const [expandedKnowledge, setExpandedKnowledge] = useState<string | null>(null);

  // Parts Form State
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<PartType>(PartType.OTHER);
  const [newPartSubtype, setNewPartSubtype] = useState<string>('');
  const [newPartQuantity, setNewPartQuantity] = useState<number>(1);

  // References State
  const [activeRefTab, setActiveRefTab] = useState<'esr' | 'smd' | 'divider' | 'datasheet'>('esr');
  const [esrMode, setEsrMode] = useState<'std' | 'low'>('std');
  const [smdCode, setSmdCode] = useState('');
  const [dividerValues, setDividerValues] = useState({ vin: 12, r1: 10000, r2: 1000 });
  const [ledValues, setLedValues] = useState({ vsource: 12, vled: 3, current: 20 });
  const [datasheetQuery, setDatasheetQuery] = useState('');
  const [datasheetResult, setDatasheetResult] = useState('');
  const [isDatasheetLoading, setIsDatasheetLoading] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я ваш AI-помощник. Спросите про аналоги или диагностику.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- INITIALIZATION & SYNC ---

  const loadLocal = () => {
    setStorageMode('local');
    const localDevs = localStorage.getItem('workshop_devices');
    const localParts = localStorage.getItem('workshop_parts');
    if (localDevs) setDevices(JSON.parse(localDevs));
    if (localParts) setParts(JSON.parse(localParts));
  };

  const tryConnectCloud = async () => {
    setIsSyncing(true);
    try {
      await api.initCloud(); 
      setStorageMode('cloud');
      
      const cloudDevices = await api.getDevices();
      const cloudParts = await api.getParts();
      setDevices(cloudDevices);
      setParts(cloudParts);
      return true;
    } catch (e: any) {
      console.warn("Cloud connection check failed (falling back to local):", e.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const connected = await tryConnectCloud();
      if (!connected) {
        loadLocal();
      }
      setInitLoaded(true);
    };

    initApp();
  }, []);

  // Update subtype when type changes
  useEffect(() => {
    setNewPartSubtype(RADIO_SUBCATEGORIES[newPartType]?.[0] || '');
  }, [newPartType]);

  // Reset filter subtype when type filter changes
  useEffect(() => {
    setInventoryFilterSubtype('ALL');
  }, [inventoryFilterType]);

  const handleManualConnect = async () => {
    if (storageMode === 'cloud') return;
    const success = await tryConnectCloud();
    if (success) {
      alert("Успешно подключено к базе данных Vercel!");
    } else {
      alert("Не удалось подключиться к базе данных. Проверьте консоль.");
    }
  };

  // --- PERSISTENCE ---

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
        alert("Ошибка синхронизации с облаком.");
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
      } catch (e) { console.error("Sync error", e); } finally { setIsSyncing(false); }
    }
  };

  // --- ACTIONS ---

  const sortedDevices = [...devices].sort((a, b) => {
     // Сначала сортируем по срочности (Critical -> High -> Normal)
     const urgencyOrder = { [Urgency.CRITICAL]: 0, [Urgency.HIGH]: 1, [Urgency.NORMAL]: 2 };
     const uDiff = urgencyOrder[a.urgency || Urgency.NORMAL] - urgencyOrder[b.urgency || Urgency.NORMAL];
     if (uDiff !== 0) return uDiff;
     
     // Затем по дате (старые сверху)
     return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
  });

  const addDevice = () => {
    if (!newDevice.clientName || !newDevice.deviceModel) return;
    
    let dateReceived = new Date().toISOString();
    if (newDevice.dateReceived) {
        dateReceived = new Date(newDevice.dateReceived).toISOString();
    }

    const device: Device = {
      id: Date.now().toString(),
      clientName: newDevice.clientName,
      deviceModel: newDevice.deviceModel,
      issueDescription: newDevice.issueDescription || '',
      dateReceived: dateReceived,
      status: DeviceStatus.RECEIVED,
      urgency: newDevice.urgency || Urgency.NORMAL,
      notes: ''
    };
    persistDevice([...devices, device], device);
    setNewDevice({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
    setShowAddDeviceModal(false);
  };

  const updateDeviceStatus = (id: string, status: DeviceStatus) => {
    const updatedDevices = devices.map(d => d.id === id ? { ...d, status } : d);
    persistDevice(updatedDevices, updatedDevices.find(d => d.id === id));
  };

  const updateDeviceUrgency = (id: string, urgency: Urgency) => {
    const updatedDevices = devices.map(d => d.id === id ? { ...d, urgency } : d);
    persistDevice(updatedDevices, updatedDevices.find(d => d.id === id));
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
      subtype: newPartSubtype,
      quantity: newPartQuantity > 0 ? newPartQuantity : 1,
      inStock: inventoryTab === 'stock'
    };
    persistPart([...parts, part], part);
    setNewPartName('');
    setNewPartQuantity(1);
  };

  const updatePartQuantity = (id: string, delta: number) => {
    const part = parts.find(p => p.id === id);
    if (!part) return;
    const newQuantity = (part.quantity || 0) + delta;
    if (newQuantity < 0) return;
    const updatedPart = { ...part, quantity: newQuantity };
    const updatedParts = parts.map(p => p.id === id ? updatedPart : p);
    persistPart(updatedParts, updatedPart);
  };

  const togglePartStockStatus = (id: string) => {
    const updatedParts = parts.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p);
    persistPart(updatedParts, updatedParts.find(p => p.id === id));
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
    const prompt = `Контекст: Мастерская. В ремонте: ${devices.map(d => `${d.deviceModel} (${d.issueDescription})`).join(', ')}. Вопрос: ${userMsg.text}`;
    const responseText = await generateWorkshopAdvice(prompt);
    setIsChatLoading(false);
    setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
  };

  // --- HELPERS ---
  const calculateSMD = (code: string) => {
    if (!code) return '---';
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode.includes('R')) return `${cleanCode.replace('R', '.')} Ω`;
    if (/^\d+$/.test(cleanCode)) {
      const digits = cleanCode.split('').map(Number);
      const multiplier = Math.pow(10, digits.pop()!);
      const base = parseInt(digits.join(''));
      const val = base * multiplier;
      if (val >= 1000000) return `${val/1000000} MΩ`;
      if (val >= 1000) return `${val/1000} kΩ`;
      return `${val} Ω`;
    }
    return 'Некорректный код';
  };
  const calculateDividerVout = () => {
    const { vin, r1, r2 } = dividerValues;
    if (!r1 || !r2) return 0;
    return (vin * r2 / (r1 + r2)).toFixed(2);
  };
  const calculateLedResistor = () => {
    const { vsource, vled, current } = ledValues;
    if (vsource <= vled || current === 0) return { r: 0, p: 0 };
    const r = (vsource - vled) / (current / 1000);
    const p = Math.pow(current / 1000, 2) * r;
    return { r: Math.ceil(r), p: p.toFixed(2) };
  };
  const handleDatasheetSearch = async () => {
    if (!datasheetQuery.trim()) return;
    setIsDatasheetLoading(true);
    setDatasheetResult('');
    const prompt = `ЗАПРОС ДАТАШИТА: Найди информацию по компоненту "${datasheetQuery}". Дай ответ в формате: 1. Тип компонента 2. Краткое описание 3. Цоколевка (Pinout) 4. Основные характеристики 5. Популярные аналоги.`;
    const result = await generateWorkshopAdvice(prompt);
    setDatasheetResult(result);
    setIsDatasheetLoading(false);
  };
  const openAllDatasheet = () => {
    if (!datasheetQuery.trim()) return;
    const url = `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(datasheetQuery)}`;
    window.open(url, '_blank');
  };

  const getUrgencyColor = (u: Urgency) => {
    switch (u) {
      case Urgency.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
      case Urgency.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };
  
  const getUrgencyLabel = (u: Urgency) => {
    switch (u) {
      case Urgency.CRITICAL: return 'СРОЧНО';
      case Urgency.HIGH: return 'Важно';
      default: return '';
    }
  };

  // --- RENDERERS ---

  if (!initLoaded) return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500"><div className="animate-spin mr-2"><Clock className="w-6 h-6" /></div>Загрузка мастерской...</div>;

  const renderSidebar = () => (
    <>
      <div className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-screen fixed left-0 top-0 overflow-y-auto no-print z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400"><Wrench className="w-8 h-8" />Мастерская</h1>
          <button onClick={handleManualConnect} className="flex items-center gap-2 mt-4 text-xs bg-slate-800 py-1 px-2 rounded cursor-pointer hover:bg-slate-700 transition-colors w-full">
             {storageMode === 'cloud' ? <span className="text-green-400 flex items-center gap-1 font-bold"><Cloud className="w-3 h-3"/> Vercel DB</span> : <span className="text-orange-400 flex items-center gap-1 font-bold"><CloudOff className="w-3 h-3"/> Local Mode</span>}
             {isSyncing ? <RefreshCw className="w-3 h-3 ml-auto animate-spin text-slate-400" /> : <span className="ml-auto text-slate-500 text-[10px]">{storageMode === 'cloud' ? 'Connected' : 'Connect'}</span>}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2"><NavButtons current={view} setView={setView} devicesCount={devices.length} /></nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">&copy; 2025 Workshop Pro</div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-100 flex justify-around items-center p-3 z-50 border-t border-slate-800 pb-safe">
        <MobileNavButton view="repair" current={view} setView={setView} icon={<Clock className="w-6 h-6" />} label="Ремонт" badge={devices.length} />
        <MobileNavButton view="inventory" current={view} setView={setView} icon={<Package className="w-6 h-6" />} label="Склад" />
        <MobileNavButton view="references" current={view} setView={setView} icon={<BookOpen className="w-6 h-6" />} label="Справка" />
        <MobileNavButton view="knowledge" current={view} setView={setView} icon={<BrainCircuit className="w-6 h-6" />} label="База" />
        <MobileNavButton view="print" current={view} setView={setView} icon={<Printer className="w-6 h-6" />} label="Печать" />
      </div>
    </>
  );

  const renderRepairView = () => (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">В работе</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">{storageMode === 'local' && <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">Локальный режим</span>}<span>{sortedDevices.length} ус-тв</span></div>
        </div>
        <button onClick={() => setShowAddDeviceModal(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"><Plus className="w-5 h-5" />Принять</button>
      </div>
      <div className="grid gap-4">
        {sortedDevices.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"><Package className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 text-lg">Нет устройств</p></div>
        ) : (
          sortedDevices.map((device) => (
            <div key={device.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden">
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2">
                     <h3 className="text-lg md:text-xl font-bold text-slate-800">{device.deviceModel}</h3>
                     {/* Urgency Badge */}
                     {device.urgency !== Urgency.NORMAL && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getUrgencyColor(device.urgency)}`}>
                           {getUrgencyLabel(device.urgency)}
                        </span>
                     )}
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{new Date(device.dateReceived).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <p className="text-sm text-slate-500 font-medium">{device.clientName}</p>
                   {/* Urgency Selector Small */}
                   <select 
                      value={device.urgency || Urgency.NORMAL}
                      onChange={(e) => updateDeviceUrgency(device.id, e.target.value as Urgency)}
                      className="text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-400 focus:text-slate-700 outline-none"
                   >
                      <option value={Urgency.NORMAL}>Норма</option>
                      <option value={Urgency.HIGH}>Важно</option>
                      <option value={Urgency.CRITICAL}>Срочно!</option>
                   </select>
                </div>
                <div className="bg-red-50 text-red-700 p-2 md:p-3 rounded-md text-sm border border-red-100 mb-3">{device.issueDescription}</div>
              </div>
              <div className="w-full md:w-64 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                <div className="flex-grow md:flex-grow-0">
                  <select value={device.status} onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)} className={`w-full p-2 rounded border font-medium text-sm focus:outline-none ${device.status === DeviceStatus.READY ? 'bg-green-100 text-green-800 border-green-200' : device.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                    {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => deleteDevice(device.id)} className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))
        )}
      </div>
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-slide-up md:animate-none">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">Новое устройство</h3>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Модель</label><input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={newDevice.deviceModel || ''} onChange={e => setNewDevice({...newDevice, deviceModel: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-slate-700">Клиент</label><input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={newDevice.clientName || ''} onChange={e => setNewDevice({...newDevice, clientName: e.target.value})} /></div>
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">Дата приема</label>
                    <input type="date" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={newDevice.dateReceived ? newDevice.dateReceived.split('T')[0] : new Date().toLocaleDateString('en-CA')} onChange={e => setNewDevice({...newDevice, dateReceived: e.target.value})} />
                 </div>
                 <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">Срочность</label>
                    <select 
                       value={newDevice.urgency} 
                       onChange={e => setNewDevice({...newDevice, urgency: e.target.value as Urgency})}
                       className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white"
                    >
                       <option value={Urgency.NORMAL}>Обычная</option>
                       <option value={Urgency.HIGH}>Важно</option>
                       <option value={Urgency.CRITICAL}>Срочно!</option>
                    </select>
                 </div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Поломка</label><textarea className="w-full p-3 border border-slate-300 rounded-lg outline-none h-20" value={newDevice.issueDescription || ''} onChange={e => setNewDevice({...newDevice, issueDescription: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddDeviceModal(false)} className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-lg">Отмена</button>
                <button onClick={addDevice} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInventoryView = () => {
    // Filter Logic
    const displayedParts = parts.filter(p => {
       const matchesTab = inventoryTab === 'stock' ? p.inStock : !p.inStock;
       const matchesType = inventoryFilterType === 'ALL' || p.type === inventoryFilterType;
       const matchesSubtype = inventoryFilterSubtype === 'ALL' || p.subtype === inventoryFilterSubtype;
       return matchesTab && matchesType && matchesSubtype;
    });

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Склад</h2>
        <div className="flex gap-2 mb-4 border-b border-slate-200">
          <button onClick={() => setInventoryTab('stock')} className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 ${inventoryTab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>В Наличии</button>
          <button onClick={() => setInventoryTab('buy')} className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 flex justify-center gap-2 ${inventoryTab === 'buy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Купить <ShoppingCart className="w-4 h-4" /></button>
        </div>
        
        {/* ADD PART FORM */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <select value={newPartType} onChange={(e) => setNewPartType(e.target.value as PartType)} className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm outline-none flex-1 font-medium">{Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}</select>
            <select value={newPartSubtype} onChange={(e) => setNewPartSubtype(e.target.value)} className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm outline-none flex-1"><option value="">-- Подкатегория --</option>{RADIO_SUBCATEGORIES[newPartType]?.map(st => <option key={st} value={st}>{st}</option>)}<option value="Другое">Другое</option></select>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder={inventoryTab === 'stock' ? "Название (номинал, маркировка)..." : "Что купить..."} className="flex-[2] p-3 border border-slate-300 rounded-lg outline-none" value={newPartName} onChange={(e) => setNewPartName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPart()} />
            <input type="number" min="1" placeholder="Кол-во" className="w-20 p-3 border border-slate-300 rounded-lg outline-none text-center" value={newPartQuantity} onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 1)} />
            <button onClick={addPart} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-bold flex items-center justify-center transition-colors"><Plus className="w-6 h-6" /></button>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-col md:flex-row gap-2 mb-4 bg-slate-100 p-3 rounded-lg border border-slate-200">
           <div className="flex items-center gap-2 text-slate-500 min-w-fit">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Фильтр:</span>
           </div>
           <select 
             value={inventoryFilterType} 
             onChange={(e) => setInventoryFilterType(e.target.value as PartType | 'ALL')}
             className="p-2 rounded border border-slate-300 text-sm bg-white outline-none flex-1"
           >
              <option value="ALL">Все категории</option>
              {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
           </select>
           {inventoryFilterType !== 'ALL' && (
             <select 
               value={inventoryFilterSubtype} 
               onChange={(e) => setInventoryFilterSubtype(e.target.value)}
               className="p-2 rounded border border-slate-300 text-sm bg-white outline-none flex-1"
             >
                <option value="ALL">Все подкатегории</option>
                {RADIO_SUBCATEGORIES[inventoryFilterType]?.map(st => <option key={st} value={st}>{st}</option>)}
             </select>
           )}
        </div>

        {/* PARTS LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-0">
          {displayedParts.map(part => (
            <div key={part.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] text-white bg-blue-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{part.type}</span>
                   {part.subtype && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Tag className="w-3 h-3"/> {part.subtype}</span>}
                </div>
                <span className="font-medium text-slate-800 text-lg block">{part.name}</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                   <button onClick={() => updatePartQuantity(part.id, -1)} className="px-3 py-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600"><Minus className="w-4 h-4" /></button>
                   <div className="px-3 py-1 font-mono font-bold text-slate-700 min-w-[3rem] text-center border-l border-r border-slate-200 bg-white">{part.quantity || 1}</div>
                   <button onClick={() => updatePartQuantity(part.id, 1)} className="px-3 py-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePartStockStatus(part.id)} className={`p-2 rounded-full transition-colors ${part.inStock ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`} title={part.inStock ? "Переместить в список покупок" : "Переместить на склад"}>{part.inStock ? <ShoppingCart className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}</button>
                  <button onClick={() => deletePart(part.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}
          {displayedParts.length === 0 && <div className="text-center text-slate-400 py-10 flex flex-col items-center gap-2"><Package className="w-12 h-12 text-slate-200" /><span>Список пуст</span></div>}
        </div>
      </div>
    );
  };

  const renderReferencesView = () => (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="w-8 h-8 text-blue-600" />Справочники и Инструменты</h2>
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
        <button onClick={() => setActiveRefTab('esr')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all ${activeRefTab === 'esr' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Table className="w-4 h-4 inline mr-2" />ESR Таблица</button>
        <button onClick={() => setActiveRefTab('smd')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all ${activeRefTab === 'smd' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Calculator className="w-4 h-4 inline mr-2" />SMD Калькулятор</button>
        <button onClick={() => setActiveRefTab('divider')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all ${activeRefTab === 'divider' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Zap className="w-4 h-4 inline mr-2" />Делители & LED</button>
        <button onClick={() => setActiveRefTab('datasheet')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all ${activeRefTab === 'datasheet' ? 'bg-purple-600 text-white shadow' : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-100'}`}><Search className="w-4 h-4 inline mr-2" />AI Даташит</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex-1 overflow-auto">
        {activeRefTab === 'esr' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <div><h3 className="text-lg font-bold text-slate-800">Таблица ESR (ЭПС)</h3><p className="text-sm text-slate-500">Значения в Омах при 20-25°C. Зависят от производителя.</p></div>
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button onClick={() => setEsrMode('std')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${esrMode === 'std' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Стандартные</button>
                <button onClick={() => setEsrMode('low')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${esrMode === 'low' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Low ESR</button>
              </div>
            </div>
            <div className="overflow-x-auto border rounded-lg border-slate-200">
              <table className="w-full text-sm text-left text-slate-600 border-collapse">
                <thead className={`text-xs uppercase ${esrMode === 'std' ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-green-800'}`}><tr><th className="px-4 py-3">Емкость</th><th className="px-4 py-3">10V</th><th className="px-4 py-3">16V</th><th className="px-4 py-3">25V</th><th className="px-4 py-3">63V+</th></tr></thead>
                <tbody>
                  {(esrMode === 'std' ? ESR_DATA_STD : ESR_DATA_LOW).map((row, i) => (
                    <tr key={i} className="bg-white border-b hover:bg-slate-50 last:border-0"><td className="px-4 py-3 font-bold text-slate-900">{row.cap}</td><td className="px-4 py-3">{row.v10}</td><td className="px-4 py-3">{row.v16}</td><td className="px-4 py-3">{row.v25}</td><td className="px-4 py-3">{row.v63}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeRefTab === 'smd' && (
          <div className="max-w-md mx-auto">
             <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Расшифровка SMD резисторов</h3>
             <div className="bg-slate-100 p-8 rounded-xl mb-6 flex flex-col items-center">
                <input type="text" maxLength={4} placeholder="Код (напр. 103, 4R7)" className="text-4xl font-mono text-center uppercase w-full max-w-[200px] p-2 border-b-2 border-slate-400 bg-transparent outline-none placeholder:text-slate-300" value={smdCode} onChange={(e) => setSmdCode(e.target.value)} />
                <div className="mt-6 text-xl font-bold text-blue-600 h-8">{smdCode ? calculateSMD(smdCode) : 'Введите код'}</div>
             </div>
          </div>
        )}

        {activeRefTab === 'divider' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Делитель напряжения</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">V in (Вольт)</label><input type="number" className="w-full p-2 border rounded" value={dividerValues.vin} onChange={e => setDividerValues({...dividerValues, vin: parseFloat(e.target.value) || 0})} /></div>
                <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">R1 (Ом)</label><input type="number" className="w-full p-2 border rounded" value={dividerValues.r1} onChange={e => setDividerValues({...dividerValues, r1: parseFloat(e.target.value) || 0})} /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">R2 (Ом)</label><input type="number" className="w-full p-2 border rounded" value={dividerValues.r2} onChange={e => setDividerValues({...dividerValues, r2: parseFloat(e.target.value) || 0})} /></div></div>
                <div className="mt-2 pt-4 border-t border-slate-200"><div className="text-xs text-slate-500 uppercase">V out</div><div className="text-3xl font-bold text-slate-800">{calculateDividerVout()} V</div></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-blue-500" /> Резистор для LED</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Напряжение источника (V)</label><input type="number" className="w-full p-2 border rounded" value={ledValues.vsource} onChange={e => setLedValues({...ledValues, vsource: parseFloat(e.target.value) || 0})} /></div>
                 <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">LED (V)</label><input type="number" className="w-full p-2 border rounded" value={ledValues.vled} onChange={e => setLedValues({...ledValues, vled: parseFloat(e.target.value) || 0})} /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ток (mA)</label><input type="number" className="w-full p-2 border rounded" value={ledValues.current} onChange={e => setLedValues({...ledValues, current: parseFloat(e.target.value) || 0})} /></div></div>
                 <div className="mt-2 pt-4 border-t border-slate-200 flex justify-between items-end"><div><div className="text-xs text-slate-500 uppercase">Резистор</div><div className="text-3xl font-bold text-slate-800">{calculateLedResistor().r} Ω</div></div><div className="text-right"><div className="text-xs text-slate-500 uppercase">Мощность</div><div className="text-xl font-bold text-slate-600">{calculateLedResistor().p} W</div></div></div>
              </div>
            </div>
          </div>
        )}

        {activeRefTab === 'datasheet' && (
          <div className="flex flex-col h-full">
            <div className="text-center mb-6"><div className="inline-block p-3 bg-purple-100 rounded-full mb-2"><Search className="w-8 h-8 text-purple-600" /></div><h3 className="text-xl font-bold text-slate-800">Умный поиск Datasheet</h3><p className="text-slate-500">Введите маркировку (напр. NE555, IRF3205)</p></div>
            <div className="flex gap-2 max-w-lg mx-auto w-full mb-6">
              <input type="text" value={datasheetQuery} onChange={(e) => setDatasheetQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDatasheetSearch()} placeholder="Маркировка компонента..." className="flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:border-purple-500 shadow-sm" />
              <button onClick={handleDatasheetSearch} disabled={isDatasheetLoading || !datasheetQuery} className="bg-purple-600 text-white px-4 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">{isDatasheetLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : 'AI Info'}</button>
              <button onClick={openAllDatasheet} disabled={!datasheetQuery} className="bg-orange-500 text-white px-4 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"><ExternalLink className="w-5 h-5"/>PDF</button>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-auto">{datasheetResult ? <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line">{datasheetResult}</div> : <div className="text-center text-slate-400 mt-10">Введите название и нажмите <strong>AI Info</strong></div>}</div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderKnowledgeBaseView = () => (
     <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BrainCircuit className="w-8 h-8 text-indigo-600" />База знаний мастера</h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
           {KNOWLEDGE_BASE.map((section, idx) => {
              const isExpanded = expandedKnowledge === section.title;
              return (
                 <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                    <button 
                       onClick={() => setExpandedKnowledge(isExpanded ? null : section.title)}
                       className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg shadow-sm bg-white`}>{section.icon}</div>
                          <div>
                             <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
                             {section.description && <p className="text-xs text-slate-500">{section.description}</p>}
                          </div>
                       </div>
                       {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    
                    {isExpanded && (
                       <div className="p-4 bg-white border-t border-slate-100 animate-slide-down">
                          <div className="grid gap-6">
                             {section.issues.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                   <div className="mt-1 flex-shrink-0">
                                      <AlertCircle className="w-5 h-5 text-red-500" />
                                   </div>
                                   <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-sm mb-1">{item.problem}</h4>
                                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                         <span className="font-semibold text-slate-700">Решение: </span>
                                         {item.solution}
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              );
           })}
        </div>
     </div>
  );

  const renderAIChat = () => (
    <div className="h-[calc(100vh-80px)] md:h-full flex flex-col bg-slate-50 pb-safe">
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Bot className="w-6 h-6 text-purple-600" />AI Помощник</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{chatMessages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm md:text-base ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>{msg.text.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}</div></div>))}{isChatLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm"><div className="flex gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div></div></div></div>}</div>
      <div className="p-3 bg-white border-t border-slate-200"><div className="flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Спросить..." className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-purple-500" disabled={isChatLoading} /><button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="bg-purple-600 disabled:bg-slate-300 text-white p-3 rounded-xl"><ArrowRight className="w-6 h-6" /></button></div></div>
    </div>
  );

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      {renderSidebar()}
      <main className="flex-1 ml-0 md:ml-64 print:ml-0 min-h-screen overflow-auto print:overflow-visible">
        {view === 'repair' && renderRepairView()}
        {view === 'inventory' && renderInventoryView()}
        {view === 'references' && renderReferencesView()}
        {view === 'knowledge' && renderKnowledgeBaseView()}
        {view === 'print' && <Printables devices={devices.filter(d => d.status !== DeviceStatus.ISSUED)} />}
        {view === 'ai_chat' && renderAIChat()}
      </main>
    </div>
  );
}

const NavButtons = ({ current, setView, devicesCount }: any) => (
  <>
    <button onClick={() => setView('repair')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'repair' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Clock className="w-5 h-5" /><span>В ремонте</span>{devicesCount > 0 && <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full">{devicesCount}</span>}</button>
    <button onClick={() => setView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Package className="w-5 h-5" /><span>Склад</span></button>
    <button onClick={() => setView('references')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'references' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BookOpen className="w-5 h-5" /><span>Справочники</span></button>
    <button onClick={() => setView('knowledge')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'knowledge' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BrainCircuit className="w-5 h-5" /><span>База Знаний</span></button>
    <button onClick={() => setView('print')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'print' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Printer className="w-5 h-5" /><span>Печать</span></button>
    <button onClick={() => setView('ai_chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'ai_chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Bot className="w-5 h-5" /><span>AI</span></button>
  </>
);

const MobileNavButton = ({ view, current, setView, icon, label, badge }: any) => (
  <button onClick={() => setView(view)} className={`flex flex-col items-center gap-1 p-2 rounded-lg relative ${current === view ? 'text-blue-400' : 'text-slate-500'}`}><div className="relative">{icon}{badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{badge}</span>}</div><span className="text-[10px] font-medium">{label}</span></button>
);

export default App;