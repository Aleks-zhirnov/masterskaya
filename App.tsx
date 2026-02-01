import React, { useState, useEffect, useMemo } from 'react';
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
  Scissors,
  CalendarCheck,
  BarChart3,
  ListFilter
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

// Данные для базы знаний (FULL EDITION)
const KNOWLEDGE_BASE = [
  {
    title: 'Робот-пылесосы (Xiaomi, Roborock, iRobot)',
    icon: <Disc className="w-6 h-6 text-indigo-500" />,
    description: 'Лидары, колеса, турбины, док-станции',
    issues: [
      { 
        problem: 'Не видит базу / Тыкается в док / Не паркуется', 
        solution: '1. Царапины на ИК-фильтре бампера (полировать). 2. Сгорели ИК-диоды внутри самой док-станции (проверить камерой телефона). 3. Окисление контактов на "брюхе" - плата видит напряжение, но ток не идет (чистить ластиком). 4. Пробой TVS-диода или предохранителя на входе цепи заряда на материнской плате.' 
      },
      { 
        problem: 'Ошибка лидара (Lidar Error 1)', 
        solution: 'Башня не крутится: Моторчик привода (Mabuchi RF-500) или порван пассик (O-Ring). Если мотор грязный - чистка коллектора помогает временно. Башня крутится, но ошибка: Сел лазерный диод излучателя (замена диода или головки).' 
      },
      { 
        problem: 'Ошибка колеса (Wheel Error)', 
        solution: 'Робот на полу, но думает, что висит. Залип микропереключатель (концевик) внутри модуля колеса. Разобрать модуль, промыть микрик спиртом/WD-40.' 
      },
      { 
        problem: 'Громко гудит / Свистит', 
        solution: 'Разбиты подшипники турбины (вентилятора) из-за попадания влаги/пыли. Смазка не помогает надолго, замена узла в сборе.' 
      },
      { 
        problem: 'Не крутится боковая щетка', 
        solution: 'Намотались волосы под щетку -> перегрев мотора -> сгорел термопредохранитель внутри мотора редуктора или срезало пластиковые шестерни.' 
      },
      { 
        problem: 'Сообщение "Фильтр забит" (на чистом)', 
        solution: 'В фильтре стоит магнит, в корпусе - датчик Холла. Если фильтр неоригинал без магнита - будет ошибка. Либо датчик забился пылью.' 
      }
    ]
  },
  {
    title: 'Массажеры и Массажные кресла',
    icon: <Activity className="w-6 h-6 text-pink-600" />,
    description: 'Yamaguchi, Casada, Ergonova',
    issues: [
      { 
        problem: 'Не включается, моторы молчат, но НАГРЕВ есть', 
        solution: 'Питание нагрева идет напрямую (220В/24В) через реле, а логика (5В) мертва. 1. Проверить L7805/AMS1117 на плате. 2. Отвал кварцевого резонатора процессора от вибрации (частая болезнь). 3. Трещины пайки на трансформаторе дежурного питания.' 
      },
      { 
        problem: 'Пульт не работает / Моргает экран', 
        solution: 'Перелом провода в месте входа в пульт или у кресла. Провод многожильный, рвется земля или питание. Также окисление мембранных кнопок.' 
      },
      { 
        problem: 'Гудит мотор, ролики стоят', 
        solution: 'Слизало пластиковую шестерню на червячном валу. Решение: заказ токарю или 3D печать (Нейлон/PETG, ABS не выдержит).' 
      },
      { 
        problem: 'Скрип при работе', 
        solution: 'Высохла смазка на направляющих каретки. Использовать густую силиконовую смазку (СИ-180). Литол/Солидол разрушают пластик!' 
      },
      { 
        problem: 'Не качает воздух (Подушки)', 
        solution: '1. Слетел шланг с компрессора. 2. Порвалась мембрана компрессора. 3. Не открывается электромагнитный клапан распределителя (залип).' 
      }
    ]
  },
  {
    title: 'Автомобильные ЭБУ (ECU)',
    icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
    description: 'Двигатель, комфорт, ABS',
    issues: [
      { 
        problem: 'Троит (Нет искры/впрыска)', 
        solution: 'Пробой силового ключа (IGBT/MOSFET) управления катушкой/форсункой. При замене ОБЯЗАТЕЛЬНО проверять саму катушку на межвитковое, иначе новый ключ сгорит сразу.' 
      },
      { 
        problem: 'Нет связи (Check Engine не горит)', 
        solution: '1. Нет питания процессора (сгорел стабилизатор или дорожка). 2. Пробой CAN-трансивера (TJA1040/1050) статикой. 3. Кварц не генерит частоту.' 
      },
      { 
        problem: 'Ошибка дросселя / Педали', 
        solution: 'Отвал пайки на разъеме ЭБУ (пины шатаются). Драйвер управления мотором заслонки (H-bridge, TLE7209 и аналоги).' 
      },
      { 
        problem: 'Зелень на контактах (Утопленник)', 
        solution: 'Вода попадает через разъем. Гниют переходные отверстия (VIAs). Восстанавливать перемычками МГТФ, мыть в УЗ ванне.' 
      },
      { 
        problem: 'Слетает иммобилайзер', 
        solution: 'Битые ячейки в EEPROM памяти (24C04, 95160 и т.д.). Требуется перепрошивка (Immo Off или Virgin).' 
      }
    ]
  },
  {
    title: 'Газовые котлы (Платы управления)',
    icon: <Flame className="w-6 h-6 text-orange-500" />,
    description: 'Baxi, Navien, Protherm',
    issues: [
      { 
        problem: 'Перезагрузка / Щелкает реле', 
        solution: 'Высохли электролиты в БП (470uF 25V, 100uF 35V). Пульсации питания сбрасывают процессор при попытке включить реле.' 
      },
      { 
        problem: 'Ошибка розжига (Искра есть)', 
        solution: 'Не видит пламя. 1. Фазировка вилки (перевернуть). 2. Резисторы в цепи ионизации (высокоомные 1-10МОм) ушли в обрыв. 3. Грязный электрод.' 
      },
      { 
        problem: 'Вентилятор не стартует', 
        solution: 'Залипло или сгорело реле турбины (Omron/Relpol 24V). Проверить также трубку прессостата на конденсат.' 
      },
      { 
        problem: 'Трехходовой клапан не переключает', 
        solution: 'Попала вода в моторчик привода (протекает сальник) -> КЗ мотора -> сгорел симистор управления на плате.' 
      }
    ]
  },
  {
    title: 'ИБП (UPS) и Стабилизаторы',
    icon: <Battery className="w-6 h-6 text-green-600" />,
    description: 'APC, Ippon, Powercom',
    issues: [
      { 
        problem: 'Не держит нагрузку (сразу пищит)', 
        solution: 'Мертвая АКБ (95% случаев). Проверка лампочкой 12В 50Вт - напряжение не должно падать ниже 11В.' 
      },
      { 
        problem: 'Не включается вообще (Мертвый)', 
        solution: 'Высохли мелкие конденсаторы (22uF 50V) в обвязке ШИМ дежурки (UC3843). Запуск не происходит.' 
      },
      { 
        problem: 'Ошибка перегрузки (при выключенном)', 
        solution: 'Пробой силовых полевиков инвертора (IRF3205/IRF740). Менять все транзисторы плеча + драйверы затворов.' 
      },
      { 
        problem: 'Постоянно щелкает (AVR)', 
        solution: 'Подгорели контакты реле переключения обмоток. ИБП не может стабилизировать напряжение.' 
      }
    ]
  },
  {
    title: 'Увлажнители воздуха',
    icon: <Droplets className="w-6 h-6 text-cyan-500" />,
    description: 'Ультразвуковые',
    issues: [
      { 
        problem: 'Вентилятор дует, пара нет', 
        solution: 'Пробой транзистора генератора (BU406 / 2SC3834). Менять вместе с резистором в базе и стабилитроном.' 
      },
      { 
        problem: 'Слабый пар', 
        solution: 'Износ мембраны (пьезоэлемента). Появляется налет или микротрещины. Замена диска (20мм/25мм).' 
      },
      { 
        problem: 'Шумит / Гудит', 
        solution: 'Разбита втулка вентилятора (кулер улитка). Чистка помогает на неделю, лучше замена.' 
      },
      { 
        problem: 'Не видит воду (Красная лампа)', 
        solution: 'Залип поплавок (геркон) или размагнитился магнит в поплавке. Почистить от слизи.' 
      }
    ]
  },
  {
    title: 'Мультиварки',
    icon: <Utensils className="w-6 h-6 text-red-500" />,
    description: 'Redmond, Polaris',
    issues: [
      { 
        problem: 'Не включается (Экран темный)', 
        solution: 'Сгорел термопредохранитель (170-185°C) в кембрике на дне чаши. Проверить реле ТЭНа на залипание.' 
      },
      { 
        problem: 'Ошибка E1/E2/E3 (Обрыв датчика)', 
        solution: 'Перелом провода верхнего датчика (в крышке) в месте сгиба петли. Восстановить провод. Датчики обычно NTC 50k/100k.' 
      },
      { 
        problem: 'Сломалась защелка крышки', 
        solution: 'Старение пластика. Замена кнопки-защелки или ремонт пружины.' 
      },
      { 
        problem: 'Убегает молоко / Перегревает', 
        solution: 'Грязный нижний термодатчик (грибок по центру). Попала еда, плохой прижим к чаше.' 
      }
    ]
  },
  {
    title: 'Powerbank (Внешние АКБ)',
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    description: 'Xiaomi, Baseus',
    issues: [
      { 
        problem: 'Мигает диодом, не заряжается', 
        solution: 'Глубокий разряд (ниже 2.5В). Контроллер в защите. Разобрать, зарядить банки напрямую от ЛБП до 3.2В.' 
      },
      { 
        problem: 'Выломан разъем USB/Type-C', 
        solution: 'Механическое повреждение. Пропаять, усилить эпоксидкой. Проверить дорожки D+/D- (без них нет быстрой зарядки).' 
      },
      { 
        problem: 'Вздулся аккумулятор', 
        solution: 'Газообразование в Li-Po пакете. ОПАСНО! Проткнешь - пожар. Только утилизация и замена.' 
      }
    ]
  },
  {
    title: 'Электрогазонокосилки',
    icon: <Scissors className="w-6 h-6 text-green-700" />,
    description: 'Makita, Bosch',
    issues: [
      { 
        problem: 'Не включается (Тишина)', 
        solution: '1. Подгорели контакты кнопки пуска в ручке. 2. Перебит кабель удлинителя. 3. Сработала термозащита в обмотке.' 
      },
      { 
        problem: 'Гудит, нож стоит', 
        solution: 'Высох пусковой конденсатор (10-20uF). Или заклинил подшипник двигателя (перегрев посадочного места).' 
      },
      { 
        problem: 'Вибрация', 
        solution: 'Погнут нож после удара о камень или дисбаланс крыльчатки охлаждения.' 
      },
      { 
        problem: 'Запах гари / Искры', 
        solution: 'Межвитковое замыкание ротора (коллекторный мотор) или зависли щетки.' 
      }
    ]
  },
  {
    title: 'Диспенсеры для воды (Кулеры)',
    icon: <CupSoda className="w-6 h-6 text-blue-400" />,
    description: 'Нагрев и охлаждение',
    issues: [
      { 
        problem: 'Не холодит (Вентилятор стоит)', 
        solution: 'Сгорел элемент Пельтье (TEC1-12706) из-за остановки вентилятора. Менять пару: Пельтье + Вентилятор.' 
      },
      { 
        problem: 'Вода теплая (Не кипятит)', 
        solution: 'Сработала защитная таблетка (термостат) на баке (нажать кнопку). Либо сгорел ТЭН (обрыв).' 
      },
      { 
        problem: 'Течет вода на пол', 
        solution: '1. Трещина в баке холодной воды. 2. Слетел силиконовый патрубок. 3. Протекают краники (износ прокладок).' 
      },
      { 
        problem: 'Вкус пластика', 
        solution: 'Дешевые силиконовые трубки или перегрев пластикового бака.' 
      }
    ]
  },
  {
    title: 'Блоки управления сидений (Авто)',
    icon: <Car className="w-6 h-6 text-slate-600" />,
    description: 'Память, приводы',
    issues: [
      { 
        problem: 'Высаживает аккумулятор', 
        solution: 'Блок не засыпает. Пробит керамический конденсатор по питанию проца (КЗ). Греется стабилизатор.' 
      },
      { 
        problem: 'Движение рывками', 
        solution: 'Нет сигнала с датчика Холла (счетчика оборотов) в моторе. ЭБУ думает, что мотор заклинил. Проверить проводку к датчику.' 
      },
      { 
        problem: 'Не работает в одну сторону', 
        solution: 'Подгорели контакты реле реверса внутри блока или сама кнопка джойстика.' 
      },
      { 
        problem: 'Кнопки памяти не работают', 
        solution: 'Залитие кнопок кофе/колой. Окисление платы кнопок.' 
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

// --- COMPONENTS ---

const WorkshopRobot = () => {
  const [fact, setFact] = useState("Загружаю интересный факт...");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchFact = async () => {
      // Пытаемся получить факт от AI
      const prompt = "Расскажи один очень короткий, но интересный и малоизвестный технический факт или лайфхак для инженера-электронщика. Не более 2 предложений. В конце добавь веселый смайлик.";
      const response = await generateWorkshopAdvice(prompt);
      setFact(response);
    };
    fetchFact();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-64 z-50 p-4 w-64 animate-fade-in-up hidden md:block will-change-transform transform-gpu">
      <div className="relative bg-white border-2 border-slate-800 rounded-xl p-3 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
         <button onClick={() => setIsVisible(false)} className="absolute -top-2 -right-2 bg-slate-200 rounded-full p-1 hover:bg-slate-300 transition-colors"><X className="w-3 h-3"/></button>
         <div className="absolute -left-12 bottom-0 w-12 h-12">
            <Bot className="w-12 h-12 text-indigo-600 animate-bounce" />
         </div>
         <div className="text-xs font-medium text-slate-700 italic">
            "{fact}"
         </div>
         <div className="absolute -left-2 bottom-4 w-2 h-2 bg-white border-b border-l border-slate-800 transform rotate-45"></div>
      </div>
    </div>
  );
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
  const [sortMethod, setSortMethod] = useState<'date' | 'urgency' | 'status'>('urgency');
  
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
      
      return { devices: cloudDevices, parts: cloudParts };
    } catch (e: any) {
      console.warn("Cloud connection check failed (falling back to local):", e.message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const cleanupOldDevices = async (loadedDevices: Device[]) => {
    const now = new Date();
    const idsToDelete: string[] = [];
    
    loadedDevices.forEach(d => {
       if (d.status === DeviceStatus.ISSUED && d.statusChangedAt) {
          const changedAt = new Date(d.statusChangedAt);
          const diffTime = Math.abs(now.getTime() - changedAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > 4) {
             idsToDelete.push(d.id);
          }
       }
    });

    if (idsToDelete.length > 0) {
       console.log("Auto-deleting old issued devices:", idsToDelete);
       // Удаляем из стейта
       const remaining = loadedDevices.filter(d => !idsToDelete.includes(d.id));
       setDevices(remaining);
       
       // Удаляем из БД/LocalStorage
       if (storageMode === 'local') {
          localStorage.setItem('workshop_devices', JSON.stringify(remaining));
       } else {
          // Последовательно удаляем, чтобы не грузить базу параллельными запросами
          for (const id of idsToDelete) {
             await api.deleteDevice(id);
          }
       }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const cloudData = await tryConnectCloud();
      let currentDevices: Device[] = [];
      
      if (cloudData) {
        setDevices(cloudData.devices);
        setParts(cloudData.parts);
        currentDevices = cloudData.devices;
      } else {
        loadLocal();
        const localDevs = localStorage.getItem('workshop_devices');
        if (localDevs) currentDevices = JSON.parse(localDevs);
      }
      
      // Запускаем очистку старых заказов
      await cleanupOldDevices(currentDevices);
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
    const cloudData = await tryConnectCloud();
    if (cloudData) {
      setDevices(cloudData.devices);
      setParts(cloudData.parts);
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

  // MEMOIZATION OPTIMIZATION
  const sortedDevices = useMemo(() => {
     return [...devices].sort((a, b) => {
        if (sortMethod === 'urgency') {
           const urgencyOrder = { [Urgency.CRITICAL]: 0, [Urgency.HIGH]: 1, [Urgency.NORMAL]: 2 };
           const uDiff = urgencyOrder[a.urgency || Urgency.NORMAL] - urgencyOrder[b.urgency || Urgency.NORMAL];
           if (uDiff !== 0) return uDiff;
           return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
        }
        
        if (sortMethod === 'status') {
            if (a.status !== b.status) return a.status.localeCompare(b.status);
            return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
        }

        return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
     });
  }, [devices, sortMethod]);

  const getDaysInShop = (dateStr: string) => {
      const start = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

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
      notes: '',
      statusChangedAt: new Date().toISOString()
    };
    persistDevice([...devices, device], device);
    setNewDevice({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
    setShowAddDeviceModal(false);
  };

  const updateDeviceStatus = (id: string, status: DeviceStatus) => {
    const updatedDevices = devices.map(d => {
        if (d.id === id) {
            return { ...d, status, statusChangedAt: new Date().toISOString() };
        }
        return d;
    });
    persistDevice(updatedDevices, updatedDevices.find(d => d.id === id));
  };

  const updateDeviceUrgency = (id: string, urgency: Urgency) => {
    const updatedDevices = devices.map(d => d.id === id ? { ...d, urgency } : d);
    persistDevice(updatedDevices, updatedDevices.find(d => d.id === id));
  };
  
  const toggleDevicePlan = (id: string) => {
      const updatedDevices = devices.map(d => d.id === id ? { ...d, isPlanned: !d.isPlanned } : d);
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
      <div className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-screen fixed left-0 top-0 overflow-y-auto no-print z-10 shadow-xl transform-gpu">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400"><Wrench className="w-8 h-8" />Мастерская</h1>
          <button onClick={handleManualConnect} className="flex items-center gap-2 mt-4 text-xs bg-slate-800 py-1 px-2 rounded cursor-pointer hover:bg-slate-700 transition-colors w-full active:scale-95 duration-150 will-change-transform">
             {storageMode === 'cloud' ? <span className="text-green-400 flex items-center gap-1 font-bold"><Cloud className="w-3 h-3"/> Vercel DB</span> : <span className="text-orange-400 flex items-center gap-1 font-bold"><CloudOff className="w-3 h-3"/> Local Mode</span>}
             {isSyncing ? <RefreshCw className="w-3 h-3 ml-auto animate-spin text-slate-400" /> : <span className="ml-auto text-slate-500 text-[10px]">{storageMode === 'cloud' ? 'Connected' : 'Connect'}</span>}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2"><NavButtons current={view} setView={setView} devicesCount={devices.filter(d => d.status !== DeviceStatus.ISSUED).length} /></nav>
        <WorkshopRobot />
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">&copy; 2025 Workshop Pro</div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-slate-100 flex justify-around items-center p-3 z-50 border-t border-slate-800 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transform-gpu">
        <MobileNavButton view="repair" current={view} setView={setView} icon={<Clock className="w-6 h-6" />} label="Ремонт" badge={devices.filter(d => d.status !== DeviceStatus.ISSUED).length} />
        <MobileNavButton view="planning" current={view} setView={setView} icon={<CalendarCheck className="w-6 h-6" />} label="План" />
        <MobileNavButton view="inventory" current={view} setView={setView} icon={<Package className="w-6 h-6" />} label="Склад" />
        <MobileNavButton view="print" current={view} setView={setView} icon={<Printer className="w-6 h-6" />} label="Печать" />
        <MobileNavButton view="ai_chat" current={view} setView={setView} icon={<Bot className="w-6 h-6" />} label="AI" />
      </div>
    </>
  );

  const renderPlanningView = () => {
    const plannedDevices = sortedDevices.filter(d => d.isPlanned && d.status !== DeviceStatus.ISSUED);
    
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 animate-fade-in transform-gpu">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2"><CalendarCheck className="w-8 h-8 text-blue-600" />План работ на завтра</h2>
              <span className="text-xl font-bold text-slate-500">{plannedDevices.length} задач</span>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[50vh]">
              {plannedDevices.length === 0 ? (
                 <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 mb-4 text-green-200" />
                    <p className="text-lg">План пуст. Отметьте устройства галочками во вкладке "В ремонте".</p>
                 </div>
              ) : (
                  <div className="space-y-4">
                      {plannedDevices.map(device => (
                          <div key={device.id} className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-all hover:scale-[1.01] hover:shadow-md duration-200 cursor-default will-change-transform">
                              <button onClick={() => toggleDevicePlan(device.id)} className="text-green-600 hover:scale-110 transition-transform active:scale-90 will-change-transform"><CheckCircle className="w-6 h-6 fill-green-100" /></button>
                              <div className="flex-1">
                                  <div className="font-bold text-lg">{device.deviceModel}</div>
                                  <div className="text-sm text-slate-600">{device.issueDescription}</div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border mb-1 ${getUrgencyColor(device.urgency)}`}>{getUrgencyLabel(device.urgency)}</span>
                                  <span className="text-xs text-slate-400">{getDaysInShop(device.dateReceived)} дн. в работе</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
           </div>
        </div>
    );
  };

  const renderRepairView = () => {
      // Подсчет статистики MEMOIZED
      const stats = useMemo(() => ({
          total: devices.length,
          received: devices.filter(d => d.status === DeviceStatus.RECEIVED).length,
          inProgress: devices.filter(d => d.status === DeviceStatus.IN_PROGRESS).length,
          waiting: devices.filter(d => d.status === DeviceStatus.WAITING_PARTS).length,
          ready: devices.filter(d => d.status === DeviceStatus.READY).length,
          issued: devices.filter(d => d.status === DeviceStatus.ISSUED).length
      }), [devices]);

      return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 animate-fade-in transform-gpu">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 text-center">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-slate-500 uppercase font-bold">Всего</div><div className="text-xl font-bold text-slate-800">{stats.total}</div></div>
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-blue-500 uppercase font-bold">Принято</div><div className="text-xl font-bold text-blue-700">{stats.received}</div></div>
          <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-yellow-600 uppercase font-bold">В работе</div><div className="text-xl font-bold text-yellow-800">{stats.inProgress}</div></div>
          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-orange-600 uppercase font-bold">Ждут ЗИП</div><div className="text-xl font-bold text-orange-800">{stats.waiting}</div></div>
          <div className="bg-green-50 p-2 rounded-lg border border-green-100 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-green-600 uppercase font-bold">Готовы</div><div className="text-xl font-bold text-green-800">{stats.ready}</div></div>
          <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 opacity-70 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-gray-500 uppercase font-bold">Выдано</div><div className="text-xl font-bold text-gray-700">{stats.issued}</div></div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">В работе</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">{storageMode === 'local' && <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">Локальный режим</span>}<span>Сортировка:</span>
             <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value as any)} className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-800 transition-colors">
                 <option value="urgency">По срочности</option>
                 <option value="date">По дате</option>
                 <option value="status">По статусу</option>
             </select>
          </div>
        </div>
        <button onClick={() => setShowAddDeviceModal(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 duration-200 hover:shadow-lg will-change-transform"><Plus className="w-5 h-5" />Принять</button>
      </div>
      <div className="grid gap-4">
        {sortedDevices.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"><Package className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 text-lg">Нет устройств</p></div>
        ) : (
          sortedDevices.map((device) => (
            <div key={device.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform-gpu will-change-transform">
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => toggleDevicePlan(device.id)} 
                        className={`p-1 rounded transition-all duration-200 active:scale-90 ${device.isPlanned ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                        title="Добавить в план на завтра"
                     >
                        <CalendarCheck className="w-5 h-5" />
                     </button>
                     <h3 className="text-lg md:text-xl font-bold text-slate-800">{device.deviceModel}</h3>
                     {/* Urgency Badge */}
                     {device.urgency !== Urgency.NORMAL && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getUrgencyColor(device.urgency)}`}>
                           {getUrgencyLabel(device.urgency)}
                        </span>
                     )}
                  </div>
                  <div className="flex flex-col items-end">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded mb-1">{new Date(device.dateReceived).toLocaleDateString('ru-RU')}</span>
                      <span className="text-[10px] font-medium text-slate-400">{getDaysInShop(device.dateReceived)} дн. в сервисе</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <p className="text-sm text-slate-500 font-medium">{device.clientName}</p>
                   {/* Urgency Selector Small */}
                   <select 
                      value={device.urgency || Urgency.NORMAL}
                      onChange={(e) => updateDeviceUrgency(device.id, e.target.value as Urgency)}
                      className="text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-400 focus:text-slate-700 outline-none cursor-pointer hover:border-slate-400 transition-colors"
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
                  <select value={device.status} onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)} className={`w-full p-2 rounded border font-medium text-sm focus:outline-none transition-colors cursor-pointer ${device.status === DeviceStatus.READY ? 'bg-green-100 text-green-800 border-green-200' : device.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                    {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {device.status === DeviceStatus.ISSUED && (
                      <div className="text-[10px] text-center text-slate-400 mt-1">Авто-удаление через 4 дня</div>
                  )}
                </div>
                <button onClick={() => deleteDevice(device.id)} className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-all active:scale-90 duration-200"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))
        )}
      </div>
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-fade-in">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-slide-up md:animate-none transform-gpu will-change-transform">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">Новое устройство</h3>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700">Модель</label><input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.deviceModel || ''} onChange={e => setNewDevice({...newDevice, deviceModel: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-slate-700">Клиент</label><input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.clientName || ''} onChange={e => setNewDevice({...newDevice, clientName: e.target.value})} /></div>
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">Дата приема</label>
                    <input type="date" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.dateReceived ? newDevice.dateReceived.split('T')[0] : new Date().toLocaleDateString('en-CA')} onChange={e => setNewDevice({...newDevice, dateReceived: e.target.value})} />
                 </div>
                 <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700">Срочность</label>
                    <select 
                       value={newDevice.urgency} 
                       onChange={e => setNewDevice({...newDevice, urgency: e.target.value as Urgency})}
                       className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                       <option value={Urgency.NORMAL}>Обычная</option>
                       <option value={Urgency.HIGH}>Важно</option>
                       <option value={Urgency.CRITICAL}>Срочно!</option>
                    </select>
                 </div>
              </div>
              <div><label className="text-sm font-medium text-slate-700">Поломка</label><textarea className="w-full p-3 border border-slate-300 rounded-lg outline-none h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.issueDescription || ''} onChange={e => setNewDevice({...newDevice, issueDescription: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddDeviceModal(false)} className="flex-1 py-3 text-slate-600 font-medium bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors active:scale-95 duration-200">Отмена</button>
                <button onClick={addDevice} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 duration-200 shadow-md">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderInventoryView = () => {
    // Filter Logic
    const displayedParts = parts.filter(p => {
       const matchesTab = inventoryTab === 'stock' ? p.inStock : !p.inStock;
       const matchesType = inventoryFilterType === 'ALL' || p.type === inventoryFilterType;
       const matchesSubtype = inventoryFilterSubtype === 'ALL' || p.subtype === inventoryFilterSubtype;
       return matchesTab && matchesType && matchesSubtype;
    });

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto animate-fade-in transform-gpu">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Склад</h2>
        <div className="flex gap-2 mb-4 border-b border-slate-200">
          <button onClick={() => setInventoryTab('stock')} className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 ${inventoryTab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>В Наличии</button>
          <button onClick={() => setInventoryTab('buy')} className={`flex-1 md:flex-none pb-2 px-4 font-medium transition-colors border-b-2 flex justify-center gap-2 ${inventoryTab === 'buy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Купить <ShoppingCart className="w-4 h-4" /></button>
        </div>
        
        {/* ADD PART FORM */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col gap-3 transition-shadow hover:shadow-md will-change-transform">
          <div className="flex flex-col md:flex-row gap-3">
            <select value={newPartType} onChange={(e) => setNewPartType(e.target.value as PartType)} className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm outline-none flex-1 font-medium focus:border-blue-500 transition-colors">{Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}</select>
            <select value={newPartSubtype} onChange={(e) => setNewPartSubtype(e.target.value)} className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm outline-none flex-1 focus:border-blue-500 transition-colors"><option value="">-- Подкатегория --</option>{RADIO_SUBCATEGORIES[newPartType]?.map(st => <option key={st} value={st}>{st}</option>)}<option value="Другое">Другое</option></select>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder={inventoryTab === 'stock' ? "Название (номинал, маркировка)..." : "Что купить..."} className="flex-[2] p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors" value={newPartName} onChange={(e) => setNewPartName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPart()} />
            <input type="number" min="1" placeholder="Кол-во" className="w-20 p-3 border border-slate-300 rounded-lg outline-none text-center focus:border-blue-500 transition-colors" value={newPartQuantity} onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 1)} />
            <button onClick={addPart} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-bold flex items-center justify-center transition-all active:scale-95 duration-200 shadow-md will-change-transform"><Plus className="w-6 h-6" /></button>
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
             className="p-2 rounded border border-slate-300 text-sm bg-white outline-none flex-1 focus:border-blue-500 transition-colors"
           >
              <option value="ALL">Все категории</option>
              {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
           </select>
           {inventoryFilterType !== 'ALL' && (
             <select 
               value={inventoryFilterSubtype} 
               onChange={(e) => setInventoryFilterSubtype(e.target.value)}
               className="p-2 rounded border border-slate-300 text-sm bg-white outline-none flex-1 focus:border-blue-500 transition-colors"
             >
                <option value="ALL">Все подкатегории</option>
                {RADIO_SUBCATEGORIES[inventoryFilterType]?.map(st => <option key={st} value={st}>{st}</option>)}
             </select>
           )}
        </div>

        {/* PARTS LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-0">
          {displayedParts.map(part => (
            <div key={part.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 transform-gpu will-change-transform">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] text-white bg-blue-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{part.type}</span>
                   {part.subtype && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Tag className="w-3 h-3"/> {part.subtype}</span>}
                </div>
                <span className="font-medium text-slate-800 text-lg block">{part.name}</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                   <button onClick={() => updatePartQuantity(part.id, -1)} className="px-3 py-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
                   <div className="px-3 py-1 font-mono font-bold text-slate-700 min-w-[3rem] text-center border-l border-r border-slate-200 bg-white">{part.quantity || 1}</div>
                   <button onClick={() => updatePartQuantity(part.id, 1)} className="px-3 py-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePartStockStatus(part.id)} className={`p-2 rounded-full transition-all active:scale-90 duration-200 ${part.inStock ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`} title={part.inStock ? "Переместить в список покупок" : "Переместить на склад"}>{part.inStock ? <ShoppingCart className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}</button>
                  <button onClick={() => deletePart(part.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all active:scale-90 duration-200"><Trash2 className="w-5 h-5" /></button>
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto animate-fade-in transform-gpu">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="w-8 h-8 text-blue-600" />Справочники и Инструменты</h2>
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
        <button onClick={() => setActiveRefTab('esr')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all active:scale-95 duration-200 ${activeRefTab === 'esr' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Table className="w-4 h-4 inline mr-2" />ESR Таблица</button>
        <button onClick={() => setActiveRefTab('smd')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all active:scale-95 duration-200 ${activeRefTab === 'smd' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Calculator className="w-4 h-4 inline mr-2" />SMD Калькулятор</button>
        <button onClick={() => setActiveRefTab('divider')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all active:scale-95 duration-200 ${activeRefTab === 'divider' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Zap className="w-4 h-4 inline mr-2" />Делители & LED</button>
        <button onClick={() => setActiveRefTab('datasheet')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all active:scale-95 duration-200 ${activeRefTab === 'datasheet' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-100'}`}><Search className="w-4 h-4 inline mr-2" />AI Даташит</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex-1 overflow-auto">
        {activeRefTab === 'esr' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <div><h3 className="text-lg font-bold text-slate-800">Таблица ESR (ЭПС)</h3><p className="text-sm text-slate-500">Значения в Омах при 20-25°C. Зависят от производителя.</p></div>
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button onClick={() => setEsrMode('std')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${esrMode === 'std' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Стандартные</button>
                <button onClick={() => setEsrMode('low')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${esrMode === 'low' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>Low ESR</button>
              </div>
            </div>
            <div className="overflow-x-auto border rounded-lg border-slate-200">
              <table className="w-full text-sm text-left text-slate-600 border-collapse">
                <thead className={`text-xs uppercase ${esrMode === 'std' ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-green-800'}`}><tr><th className="px-4 py-3">Емкость</th><th className="px-4 py-3">10V</th><th className="px-4 py-3">16V</th><th className="px-4 py-3">25V</th><th className="px-4 py-3">63V+</th></tr></thead>
                <tbody>
                  {(esrMode === 'std' ? ESR_DATA_STD : ESR_DATA_LOW).map((row, i) => (
                    <tr key={i} className="bg-white border-b hover:bg-slate-50 last:border-0 transition-colors"><td className="px-4 py-3 font-bold text-slate-900">{row.cap}</td><td className="px-4 py-3">{row.v10}</td><td className="px-4 py-3">{row.v16}</td><td className="px-4 py-3">{row.v25}</td><td className="px-4 py-3">{row.v63}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeRefTab === 'smd' && (
          <div className="max-w-md mx-auto">
             <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Расшифровка SMD резисторов</h3>
             <div className="bg-slate-100 p-8 rounded-xl mb-6 flex flex-col items-center shadow-inner">
                <input type="text" maxLength={4} placeholder="Код (напр. 103, 4R7)" className="text-4xl font-mono text-center uppercase w-full max-w-[200px] p-2 border-b-2 border-slate-400 bg-transparent outline-none placeholder:text-slate-300 focus:border-blue-500 transition-colors" value={smdCode} onChange={(e) => setSmdCode(e.target.value)} />
                <div className="mt-6 text-xl font-bold text-blue-600 h-8">{smdCode ? calculateSMD(smdCode) : 'Введите код'}</div>
             </div>
          </div>
        )}

        {activeRefTab === 'divider' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Делитель напряжения</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">V in (Вольт)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={dividerValues.vin} onChange={e => setDividerValues({...dividerValues, vin: parseFloat(e.target.value) || 0})} /></div>
                <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">R1 (Ом)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={dividerValues.r1} onChange={e => setDividerValues({...dividerValues, r1: parseFloat(e.target.value) || 0})} /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">R2 (Ом)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={dividerValues.r2} onChange={e => setDividerValues({...dividerValues, r2: parseFloat(e.target.value) || 0})} /></div></div>
                <div className="mt-2 pt-4 border-t border-slate-200"><div className="text-xs text-slate-500 uppercase">V out</div><div className="text-3xl font-bold text-slate-800">{calculateDividerVout()} V</div></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-blue-500" /> Резистор для LED</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Напряжение источника (V)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={ledValues.vsource} onChange={e => setLedValues({...ledValues, vsource: parseFloat(e.target.value) || 0})} /></div>
                 <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">LED (V)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={ledValues.vled} onChange={e => setLedValues({...ledValues, vled: parseFloat(e.target.value) || 0})} /></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ток (mA)</label><input type="number" className="w-full p-2 border rounded focus:border-blue-500 transition-colors" value={ledValues.current} onChange={e => setLedValues({...ledValues, current: parseFloat(e.target.value) || 0})} /></div></div>
                 <div className="mt-2 pt-4 border-t border-slate-200 flex justify-between items-end"><div><div className="text-xs text-slate-500 uppercase">Резистор</div><div className="text-3xl font-bold text-slate-800">{calculateLedResistor().r} Ω</div></div><div className="text-right"><div className="text-xs text-slate-500 uppercase">Мощность</div><div className="text-xl font-bold text-slate-600">{calculateLedResistor().p} W</div></div></div>
              </div>
            </div>
          </div>
        )}

        {activeRefTab === 'datasheet' && (
          <div className="flex flex-col h-full">
            <div className="text-center mb-6"><div className="inline-block p-3 bg-purple-100 rounded-full mb-2 animate-bounce"><Search className="w-8 h-8 text-purple-600" /></div><h3 className="text-xl font-bold text-slate-800">Умный поиск Datasheet</h3><p className="text-slate-500">Введите маркировку (напр. NE555, IRF3205)</p></div>
            <div className="flex gap-2 max-w-lg mx-auto w-full mb-6">
              <input type="text" value={datasheetQuery} onChange={(e) => setDatasheetQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDatasheetSearch()} placeholder="Маркировка компонента..." className="flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:border-purple-500 shadow-sm transition-colors" />
              <button onClick={handleDatasheetSearch} disabled={isDatasheetLoading || !datasheetQuery} className="bg-purple-600 text-white px-4 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95 duration-200 shadow-md flex items-center gap-2 will-change-transform"><RefreshCw className={`w-5 h-5 ${isDatasheetLoading ? 'animate-spin' : ''}`}/> {isDatasheetLoading ? '' : 'AI Info'}</button>
              <button onClick={openAllDatasheet} disabled={!datasheetQuery} className="bg-orange-500 text-white px-4 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95 duration-200 shadow-md flex items-center gap-2 will-change-transform"><ExternalLink className="w-5 h-5"/>PDF</button>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-auto">{datasheetResult ? <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line animate-fade-in">{datasheetResult}</div> : <div className="text-center text-slate-400 mt-10">Введите название и нажмите <strong>AI Info</strong></div>}</div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderKnowledgeBaseView = () => (
     <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8 flex flex-col h-screen md:h-auto animate-fade-in transform-gpu">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BrainCircuit className="w-8 h-8 text-indigo-600" />База знаний мастера</h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
           {KNOWLEDGE_BASE.map((section, idx) => {
              const isExpanded = expandedKnowledge === section.title;
              return (
                 <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md will-change-transform">
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
                       <div className="p-4 bg-white border-t border-slate-100 animate-slide-down origin-top">
                          <div className="grid gap-6">
                             {section.issues.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                   <div className="mt-1 flex-shrink-0">
                                      <AlertCircle className="w-5 h-5 text-red-500" />
                                   </div>
                                   <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-sm mb-1">{item.problem}</h4>
                                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
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
    <div className="h-[calc(100vh-80px)] md:h-full flex flex-col bg-slate-50 pb-safe animate-fade-in transform-gpu">
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Bot className="w-6 h-6 text-purple-600" />AI Помощник</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{chatMessages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}><div className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm md:text-base ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>{msg.text.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}</div></div>))}{isChatLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm"><div className="flex gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div></div></div></div>}</div>
      <div className="p-3 bg-white border-t border-slate-200"><div className="flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Спросить..." className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-purple-500 transition-colors" disabled={isChatLoading} /><button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="bg-purple-600 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all active:scale-95 duration-200 will-change-transform"><ArrowRight className="w-6 h-6" /></button></div></div>
    </div>
  );

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      {renderSidebar()}
      <main className="flex-1 ml-0 md:ml-64 print:ml-0 min-h-screen overflow-auto print:overflow-visible">
        {view === 'repair' && renderRepairView()}
        {view === 'planning' && renderPlanningView()}
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
    <button onClick={() => setView('repair')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'repair' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Clock className="w-5 h-5" /><span>В ремонте</span>{devicesCount > 0 && <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full">{devicesCount}</span>}</button>
    <button onClick={() => setView('planning')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'planning' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><CalendarCheck className="w-5 h-5" /><span>План</span></button>
    <button onClick={() => setView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Package className="w-5 h-5" /><span>Склад</span></button>
    <button onClick={() => setView('references')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'references' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BookOpen className="w-5 h-5" /><span>Справочники</span></button>
    <button onClick={() => setView('knowledge')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'knowledge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BrainCircuit className="w-5 h-5" /><span>База Знаний</span></button>
    <button onClick={() => setView('print')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'print' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Printer className="w-5 h-5" /><span>Печать</span></button>
    <button onClick={() => setView('ai_chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 will-change-transform ${current === 'ai_chat' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Bot className="w-5 h-5" /><span>AI</span></button>
  </>
);

const MobileNavButton = ({ view, current, setView, icon, label, badge }: any) => (
  <button onClick={() => setView(view)} className={`flex flex-col items-center gap-1 p-2 rounded-lg relative transition-all duration-200 active:scale-90 min-h-[44px] min-w-[44px] justify-center will-change-transform ${current === view ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}><div className="relative">{icon}{badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{badge}</span>}</div><span className="text-[10px] font-medium">{label}</span></button>
);

export default App;