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
  ListFilter,
  Pencil,
  Users,
  LayoutList,
  Phone,
  MessageCircle,
  Archive,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { Device, DeviceStatus, PartType, SparePart, ViewState, ChatMessage, Urgency } from './types';
import { generateWorkshopAdvice, getOpenRouterKey, setOpenRouterKey, beautifyDeviceText } from './services/ai';
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

interface EsrRow {
  cap: string;
  v10: string;
  v16: string;
  v25: string;
  v63: string;
}

// Данные для таблицы ESR (STANDARD)
const ESR_DATA_STD: EsrRow[] = [
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
const ESR_DATA_LOW: EsrRow[] = [
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
      try {
        const prompt = "Расскажи один очень короткий, но интересный и малоизвестный технический факт или лайфхак для инженера-электронщика. Не более 2 предложений. В конце добавь веселый смайлик.";
        const response = await generateWorkshopAdvice(prompt);
        setFact(response);
      } catch (error) {
        console.error("WorkshopRobot AI error:", error);
        setFact("Паяльник с жалом Hakko T12 прогревается за 8 секунд!");
      }
    };
    fetchFact();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-64 z-50 p-4 w-64 animate-fade-in-up hidden md:block will-change-transform transform-gpu no-print">
      <div className="relative bg-white border-2 border-slate-800 rounded-xl p-3 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <button onClick={() => setIsVisible(false)} className="absolute -top-2 -right-2 bg-slate-200 rounded-full p-1 hover:bg-slate-300 transition-colors"><X className="w-3 h-3" /></button>
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

interface NavButtonProps {
  current: ViewState;
  setView: (view: ViewState) => void;
  devicesCount: number;
}

const NavButtons: React.FC<NavButtonProps> = ({ current, setView, devicesCount }) => {
  const btnClass = (v: ViewState) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${current === v ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-5'}`;

  return (
    <div className="space-y-1">
      <div onClick={() => setView('repair')} className={btnClass('repair')}>
        <div className="relative"><Wrench className="w-5 h-5" />{devicesCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full animate-pulse">{devicesCount}</span>}</div>
        <span className="font-medium">В ремонте</span>
      </div>
      <div onClick={() => setView('planning')} className={btnClass('planning')}><CalendarCheck className="w-5 h-5" /><span className="font-medium">План работ</span></div>
      <div onClick={() => setView('inventory')} className={btnClass('inventory')}><Package className="w-5 h-5" /><span className="font-medium">Склад</span></div>
      <div onClick={() => setView('print')} className={btnClass('print')}><Printer className="w-5 h-5" /><span className="font-medium">Печать</span></div>
      <div onClick={() => setView('archive')} className={btnClass('archive')}><Archive className="w-5 h-5" /><span className="font-medium">Архив</span></div>
      <div onClick={() => setView('ai_chat')} className={btnClass('ai_chat')}><Bot className="w-5 h-5" /><span className="font-medium">AI Помощник</span></div>

      <div className="pt-4 pb-2 text-xs font-bold text-slate-600 uppercase tracking-wider px-4">База знаний</div>
      <div onClick={() => setView('references')} className={btnClass('references')}><BookOpen className="w-5 h-5" /><span className="font-medium">Справочники</span></div>
      <div onClick={() => setView('knowledge')} className={btnClass('knowledge')}><BrainCircuit className="w-5 h-5" /><span className="font-medium">База дефектов</span></div>
    </div>
  );
};

interface MobileNavButtonProps {
  view: ViewState;
  current: ViewState;
  setView: (view: ViewState) => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({ view, current, setView, icon, label, badge }) => (
  <button
    onClick={() => setView(view)}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${current === view ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
  >
    <div className="relative">
      {icon}
      {badge && badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">{badge}</span>}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewState>('repair');

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('workshop_darkMode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('workshop_darkMode', String(darkMode)); } catch { }
  }, [darkMode]);

  // Storage Mode
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);

  // Data State
  const [devices, setDevices] = useState<Device[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);

  // UI State - Repair
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
  const [sortMethod, setSortMethod] = useState<'date' | 'urgency' | 'status'>('urgency');
  const [groupByClient, setGroupByClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'ALL'>('ALL');

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
  const [activeRefTab, setActiveRefTab] = useState<'esr' | 'smd' | 'divider' | 'led' | 'datasheet'>('esr');
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

  // AI Beautify State
  const [aiEditingDeviceId, setAiEditingDeviceId] = useState<string | null>(null);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyForm, setShowApiKeyForm] = useState(!getOpenRouterKey());
  const [hasApiKey, setHasApiKey] = useState(!!getOpenRouterKey());

  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key) return;
    setOpenRouterKey(key);
    setHasApiKey(true);
    setShowApiKeyForm(false);
    setApiKeyInput('');
    setChatMessages(prev => [...prev, { role: 'model', text: '✅ Ключ OpenRouter сохранён! Теперь можете задавать вопросы по ремонту.' }]);
  };

  const handleRemoveApiKey = () => {
    setOpenRouterKey('');
    setHasApiKey(false);
    setShowApiKeyForm(true);
    setApiKeyInput('');
    setChatMessages(prev => [...prev, { role: 'model', text: '🔑 Ключ удалён. Введите новый ключ для работы AI.' }]);
  };

  // --- INITIALIZATION & SYNC ---

  const loadLocal = () => {
    setStorageMode('local');
    try {
      const localDevs = localStorage.getItem('workshop_devices');
      const localParts = localStorage.getItem('workshop_parts');
      if (localDevs) setDevices(JSON.parse(localDevs));
      if (localParts) setParts(JSON.parse(localParts));
    } catch (e) {
      console.error("Error loading localStorage data:", e);
      setDevices([]);
      setParts([]);
    }
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

  const archiveOldDevices = async (loadedDevices: Device[], mode: 'local' | 'cloud') => {
    const now = new Date();
    const idsToArchive: string[] = [];

    loadedDevices.forEach(d => {
      if (d.status === DeviceStatus.ISSUED && d.statusChangedAt && !d.isArchived) {
        const changedAt = new Date(d.statusChangedAt);
        const diffTime = Math.abs(now.getTime() - changedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 4) {
          idsToArchive.push(d.id);
        }
      }
    });

    if (idsToArchive.length > 0) {
      console.log("Auto-archiving old issued devices:", idsToArchive);
      const updated = loadedDevices.map(d =>
        idsToArchive.includes(d.id) ? { ...d, isArchived: true } : d
      );
      setDevices(updated);

      if (mode === 'local') {
        localStorage.setItem('workshop_devices', JSON.stringify(updated));
      } else {
        for (const id of idsToArchive) {
          const device = updated.find(d => d.id === id);
          if (device) await api.saveDevice(device);
        }
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const cloudData = await tryConnectCloud();
      let currentDevices: Device[] = [];
      let currentMode: 'local' | 'cloud' = 'local';

      if (cloudData) {
        setDevices(cloudData.devices);
        setParts(cloudData.parts);
        currentDevices = cloudData.devices;
        currentMode = 'cloud';
      } else {
        loadLocal();
        try {
          const localDevs = localStorage.getItem('workshop_devices');
          if (localDevs) currentDevices = JSON.parse(localDevs);
        } catch { }
      }

      // Запускаем архивацию старых заказов
      await archiveOldDevices(currentDevices, currentMode);
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
    return [...devices].filter(d => !d.isArchived).sort((a, b) => {
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

  const filteredDevices = useMemo(() => {
    let result = sortedDevices;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.clientName.toLowerCase().includes(q) ||
        d.deviceModel.toLowerCase().includes(q) ||
        d.issueDescription.toLowerCase().includes(q) ||
        (d.clientPhone && d.clientPhone.includes(q))
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(d => d.status === statusFilter);
    }
    return result;
  }, [sortedDevices, searchQuery, statusFilter]);

  const groupedDevices = useMemo<Record<string, Device[]> | null>(() => {
    if (!groupByClient) return null;

    const groups: Record<string, Device[]> = {};
    filteredDevices.forEach(device => {
      const client = device.clientName || 'Неизвестный клиент';
      if (!groups[client]) {
        groups[client] = [];
      }
      groups[client].push(device);
    });
    return groups;
  }, [filteredDevices, groupByClient]);

  const activeDevices = useMemo(() => devices.filter(d => !d.isArchived), [devices]);

  const stats = useMemo(() => ({
    total: activeDevices.length,
    received: activeDevices.filter(d => d.status === DeviceStatus.RECEIVED).length,
    inProgress: activeDevices.filter(d => d.status === DeviceStatus.IN_PROGRESS).length,
    waiting: activeDevices.filter(d => d.status === DeviceStatus.WAITING_PARTS).length,
    ready: activeDevices.filter(d => d.status === DeviceStatus.READY).length,
    issued: activeDevices.filter(d => d.status === DeviceStatus.ISSUED).length,
    revenue: activeDevices.filter(d => d.status === DeviceStatus.ISSUED && d.estimatedCost).reduce((sum, d) => sum + (d.estimatedCost || 0), 0)
  }), [activeDevices]);

  const getDaysInShop = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSaveDevice = () => {
    if (!newDevice.clientName || !newDevice.deviceModel) return;

    let dateReceived = new Date().toISOString();
    if (newDevice.dateReceived) {
      // Проверяем, если дата уже ISO, не трогаем, иначе форматируем
      if (!newDevice.dateReceived.includes('T')) {
        dateReceived = new Date(newDevice.dateReceived).toISOString();
      } else {
        dateReceived = newDevice.dateReceived;
      }
    }

    if (editingId) {
      // Обновление существующего
      const updatedDevices = devices.map(d => {
        if (d.id === editingId) {
          return {
            ...d,
            ...newDevice,
            dateReceived: dateReceived, // Сохраняем дату
            // Сохраняем остальные поля, если они были
            id: d.id,
            status: newDevice.status || d.status,
            urgency: newDevice.urgency || d.urgency,
            statusChangedAt: d.status !== newDevice.status ? new Date().toISOString() : d.statusChangedAt
          } as Device;
        }
        return d;
      });
      persistDevice(updatedDevices, updatedDevices.find(d => d.id === editingId));
    } else {
      // Создание нового
      const device: Device = {
        id: Date.now().toString(),
        clientName: newDevice.clientName,
        clientPhone: newDevice.clientPhone || '',
        deviceModel: newDevice.deviceModel,
        issueDescription: newDevice.issueDescription || '',
        dateReceived: dateReceived,
        status: DeviceStatus.RECEIVED,
        urgency: newDevice.urgency || Urgency.NORMAL,
        estimatedCost: newDevice.estimatedCost,
        notes: newDevice.notes || '',
        statusChangedAt: new Date().toISOString()
      };
      persistDevice([...devices, device], device);
    }

    setNewDevice({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
    setEditingId(null);
    setShowAddDeviceModal(false);
  };

  const handleEditDevice = (device: Device) => {
    setEditingId(device.id);
    setNewDevice({
      clientName: device.clientName,
      clientPhone: device.clientPhone,
      deviceModel: device.deviceModel,
      issueDescription: device.issueDescription,
      dateReceived: device.dateReceived,
      status: device.status,
      urgency: device.urgency,
      estimatedCost: device.estimatedCost,
      notes: device.notes
    });
    setShowAddDeviceModal(true);
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

  const updateDeviceNotes = (id: string, notes: string) => {
    const updatedDevices = devices.map(d => d.id === id ? { ...d, notes } : d);
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
    if (confirm('Удалить запчасть?')) {
      const partToDelete = parts.find(p => p.id === id);
      const updatedParts = parts.filter(p => p.id !== id);
      persistPart(updatedParts, partToDelete, true);
    }
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
      if (val >= 1000000) return `${val / 1000000} MΩ`;
      if (val >= 1000) return `${val / 1000} kΩ`;
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

  // --- AI BEAUTIFY ---
  const handleAiBeautify = async (device: Device) => {
    if (aiEditingDeviceId) return; // уже идёт обработка
    setAiEditingDeviceId(device.id);
    try {
      const result = await beautifyDeviceText(
        device.deviceModel,
        device.issueDescription,
        device.notes
      );
      const updatedDevice: Device = {
        ...device,
        issueDescription: result.issueDescription,
        notes: result.notes !== undefined ? result.notes : device.notes,
      };
      const updatedDevices = devices.map(d =>
        d.id === device.id ? updatedDevice : d
      );
      persistDevice(updatedDevices, updatedDevice);
    } catch (error: any) {
      console.error('AI Beautify Error:', error);
      alert(error?.message || 'Ошибка AI. Попробуйте позже.');
    } finally {
      setAiEditingDeviceId(null);
    }
  };

  // --- RENDERERS ---
  const getUrgencyBorder = (u: Urgency) => {
    switch (u) {
      case Urgency.CRITICAL: return 'border-l-4 border-l-red-500';
      case Urgency.HIGH: return 'border-l-4 border-l-orange-400';
      default: return 'border-l-4 border-l-slate-200 dark:border-l-slate-600';
    }
  };

  const renderDeviceCard = (device: Device) => (
    <div key={device.id} className={`bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${getUrgencyBorder(device.urgency || Urgency.NORMAL)} flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform-gpu will-change-transform`}>
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
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{device.clientName}</p>
          {device.clientPhone && (
            <div className="flex items-center gap-1">
              <a href={`tel:${device.clientPhone}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs font-medium" title="Позвонить"><Phone className="w-3 h-3" />{device.clientPhone}</a>
              <a href={`https://wa.me/${device.clientPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-green-200 transition-colors flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />WA</a>
            </div>
          )}
          <select
            value={device.urgency || Urgency.NORMAL}
            onChange={(e) => updateDeviceUrgency(device.id, e.target.value as Urgency)}
            className="text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded px-1 py-0.5 text-slate-400 focus:text-slate-700 outline-none cursor-pointer hover:border-slate-400 transition-colors"
          >
            <option value={Urgency.NORMAL}>Норма</option>
            <option value={Urgency.HIGH}>Важно</option>
            <option value={Urgency.CRITICAL}>Срочно!</option>
          </select>
          {device.estimatedCost ? <span className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">{device.estimatedCost.toLocaleString('ru-RU')} ₽</span> : null}
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2 md:p-3 rounded-md text-sm border border-red-100 dark:border-red-900/30 mb-2">{device.issueDescription}</div>
        {/* Inline notes */}
        <details className="group mb-1">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Заметки {device.notes ? `(есть)` : '(пусто)'}
          </summary>
          <textarea
            defaultValue={device.notes || ''}
            onBlur={(e) => {
              if (e.target.value !== (device.notes || '')) {
                updateDeviceNotes(device.id, e.target.value);
              }
            }}
            className="w-full mt-1 p-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-400 resize-y min-h-[60px]"
            placeholder="Добавить заметку..."
          />
        </details>
      </div>
      <div className="w-full md:w-64 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
        <div className="flex-grow md:flex-grow-0">
          <select value={device.status} onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)} className={`w-full p-2 rounded border font-medium text-sm focus:outline-none transition-colors cursor-pointer ${device.status === DeviceStatus.READY ? 'bg-green-100 text-green-800 border-green-200' : device.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
            {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {device.status === DeviceStatus.ISSUED && (
            <div className="text-[10px] text-center text-slate-400 mt-1">В архив через 4 дня</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAiBeautify(device)}
            disabled={!!aiEditingDeviceId}
            className={`flex-1 p-2 rounded transition-all active:scale-90 duration-200 border flex justify-center items-center ${aiEditingDeviceId === device.id
              ? 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse'
              : 'text-amber-400 hover:text-amber-600 hover:bg-amber-50 border-slate-100'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="AI: улучшить описание"
          >
            {aiEditingDeviceId === device.id
              ? <RefreshCw className="w-5 h-5 animate-spin" />
              : <Sparkles className="w-5 h-5" />
            }
          </button>
          <button onClick={() => handleEditDevice(device)} className="flex-1 text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-all active:scale-90 duration-200 border border-slate-100 flex justify-center items-center"><Pencil className="w-5 h-5" /></button>
          <button onClick={() => deleteDevice(device.id)} className="flex-1 text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-all active:scale-90 duration-200 border border-slate-100 flex justify-center items-center"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );

  if (!initLoaded) return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500"><div className="animate-spin mr-2"><Clock className="w-6 h-6" /></div>Загрузка мастерской...</div>;

  const renderSidebar = () => (
    <>
      <div className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-screen fixed left-0 top-0 overflow-y-auto no-print z-10 shadow-xl transform-gpu">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-8 h-8 text-blue-400" /><span className="text-gradient">Мастерская</span></h1>
          <button onClick={handleManualConnect} className="flex items-center gap-2 mt-4 text-xs bg-slate-800 py-1 px-2 rounded cursor-pointer hover:bg-slate-700 transition-colors w-full active:scale-95 duration-150 will-change-transform">
            {storageMode === 'cloud' ? <span className="text-green-400 flex items-center gap-1 font-bold"><Cloud className="w-3 h-3" /> Vercel DB</span> : <span className="text-orange-400 flex items-center gap-1 font-bold"><CloudOff className="w-3 h-3" /> Local Mode</span>}
            {isSyncing ? <RefreshCw className="w-3 h-3 ml-auto animate-spin text-slate-400" /> : <span className="ml-auto text-slate-500 text-[10px]">{storageMode === 'cloud' ? 'Connected' : 'Connect'}</span>}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2"><NavButtons current={view} setView={setView} devicesCount={activeDevices.filter(d => d.status !== DeviceStatus.ISSUED).length} /></nav>
        {/* Robot moved out of here to main App component to fix z-index clipping */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {darkMode ? <><Sun className="w-4 h-4" /> Светлая тема</> : <><Moon className="w-4 h-4" /> Тёмная тема</>}
          </button>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">&copy; 2026 Workshop Pro</div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-slate-100 flex justify-around items-center p-3 z-50 border-t border-slate-800 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transform-gpu">
        <MobileNavButton view="repair" current={view} setView={setView} icon={<Clock className="w-6 h-6" />} label="Ремонт" badge={activeDevices.filter(d => d.status !== DeviceStatus.ISSUED).length} />
        <MobileNavButton view="planning" current={view} setView={setView} icon={<CalendarCheck className="w-6 h-6" />} label="План" />
        <MobileNavButton view="inventory" current={view} setView={setView} icon={<Package className="w-6 h-6" />} label="Склад" />
        <MobileNavButton view="archive" current={view} setView={setView} icon={<Archive className="w-6 h-6" />} label="Архив" />
        <MobileNavButton view="ai_chat" current={view} setView={setView} icon={<Bot className="w-6 h-6" />} label="AI" />
      </div>
    </>
  );

  const renderRepairView = () => {
    // stats is now computed at the component level to adhere to Rules of Hooks

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 animate-fade-in transform-gpu">
        {/* Статистика */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-6 text-center">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-slate-500 uppercase font-bold">Всего</div><div className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</div></div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-100 dark:border-blue-800 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-blue-500 uppercase font-bold">Принято</div><div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.received}</div></div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-lg border border-yellow-100 dark:border-yellow-800 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-yellow-600 uppercase font-bold">В работе</div><div className="text-xl font-bold text-yellow-800 dark:text-yellow-300">{stats.inProgress}</div></div>
          <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg border border-orange-100 dark:border-orange-800 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-orange-600 uppercase font-bold">Ждут ЗИП</div><div className="text-xl font-bold text-orange-800 dark:text-orange-300">{stats.waiting}</div></div>
          <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg border border-green-100 dark:border-green-800 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-green-600 uppercase font-bold">Готовы</div><div className="text-xl font-bold text-green-800 dark:text-green-300">{stats.ready}</div></div>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 opacity-70 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-gray-500 uppercase font-bold">Выдано</div><div className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.issued}</div></div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-transform hover:-translate-y-0.5 will-change-transform"><div className="text-xs text-emerald-600 uppercase font-bold">Выручка</div><div className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{stats.revenue.toLocaleString('ru-RU')} ₽</div></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">В работе</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {storageMode === 'local' && <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">Локальный режим</span>}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                <span>Сортировка:</span>
                <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value as any)} className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-800 transition-colors">
                  <option value="urgency">По срочности</option>
                  <option value="date">По дате</option>
                  <option value="status">По статусу</option>
                </select>
              </div>
              <button
                onClick={() => setGroupByClient(!groupByClient)}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${groupByClient ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                {groupByClient ? <LayoutList className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                <span>{groupByClient ? 'Разгруппировать' : 'Группировать по клиентам'}</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setNewDevice({ status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL });
              setShowAddDeviceModal(true);
            }}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 duration-200 hover:shadow-xl will-change-transform font-semibold"
          >
            <Plus className="w-5 h-5" />Принять
          </button>
        </div>

        {/* Поиск и фильтр */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по клиенту, модели, поломке, телефону..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as DeviceStatus | 'ALL')}
            className="p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm bg-white"
          >
            <option value="ALL">Все статусы</option>
            {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid gap-4">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12 md:py-20 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700"><Package className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 text-lg">{searchQuery ? 'Ничего не найдено' : 'Нет устройств'}</p></div>
          ) : groupByClient && groupedDevices ? (
            Object.entries(groupedDevices).map(([client, clientDevices]: [string, Device[]]) => (
              <div key={client} className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Users className="w-5 h-5 text-slate-400" />
                  <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{client}</h3>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{clientDevices.length}</span>
                </div>
                <div className="grid gap-4 pl-0 md:pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  {clientDevices.map(device => renderDeviceCard(device))}
                </div>
              </div>
            ))
          ) : (
            filteredDevices.map((device) => renderDeviceCard(device))
          )}
        </div>
      </div>
    );
  };

  const renderInventoryView = () => (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-blue-600" /> Склад запчастей</h2>
        <div className="flex gap-2">
          <button onClick={() => setInventoryTab('stock')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${inventoryTab === 'stock' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Наличие</button>
          <button onClick={() => setInventoryTab('buy')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${inventoryTab === 'buy' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Закупки</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Название</label>
          <input type="text" value={newPartName} onChange={e => setNewPartName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Например: Конденсатор 100uF 25V" />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Категория</label>
          <select value={newPartType} onChange={e => setNewPartType(e.target.value as PartType)} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
            {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Кол-во</label>
          <input type="number" min="1" value={newPartQuantity} onChange={e => setNewPartQuantity(parseInt(e.target.value) || 1)} className="w-full p-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
        </div>
        <button onClick={addPart} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold text-sm h-[38px] flex items-center gap-2"><Plus className="w-4 h-4" /> Добавить</button>
      </div>

      {/* Фильтр по категории */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Фильтр: Категория</label>
          <select value={inventoryFilterType} onChange={e => setInventoryFilterType(e.target.value as PartType | 'ALL')} className="p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm">
            <option value="ALL">Все категории</option>
            {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {inventoryFilterType !== 'ALL' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Подкатегория</label>
            <select value={inventoryFilterSubtype} onChange={e => setInventoryFilterSubtype(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm">
              <option value="ALL">Все</option>
              {(RADIO_SUBCATEGORIES[inventoryFilterType as PartType] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="p-4">Наименование</th>
                <th className="p-4">Категория</th>
                <th className="p-4 text-center">Остаток</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {parts.filter(p => (inventoryTab === 'stock' ? p.inStock : !p.inStock))
                .filter(p => inventoryFilterType === 'ALL' || p.type === inventoryFilterType)
                .filter(p => inventoryFilterSubtype === 'ALL' || p.subtype === inventoryFilterSubtype)
                .map(part => (
                  <tr key={part.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{part.name}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{part.type}</span>
                      {part.subtype && <span className="ml-1 text-[10px] text-slate-400">{part.subtype}</span>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updatePartQuantity(part.id, -1)} className="text-slate-400 hover:text-red-500"><Minus className="w-4 h-4" /></button>
                        <span className="w-8 font-bold">{part.quantity}</span>
                        <button onClick={() => updatePartQuantity(part.id, 1)} className="text-slate-400 hover:text-green-500"><Plus className="w-4 h-4" /></button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePartStockStatus(part.id)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">{part.inStock ? 'В покупки' : 'На склад'}</button>
                        <button onClick={() => deletePart(part.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              {parts.filter(p => (inventoryTab === 'stock' ? p.inStock : !p.inStock))
                .filter(p => inventoryFilterType === 'ALL' || p.type === inventoryFilterType)
                .filter(p => inventoryFilterSubtype === 'ALL' || p.subtype === inventoryFilterSubtype)
                .length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Пусто</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100`}>
      {renderSidebar()}

      <main className="flex-1 md:ml-64 relative min-h-screen">
        {view === 'repair' && renderRepairView()}
        {view === 'inventory' && renderInventoryView()}
        {view === 'planning' && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-green-600" /> План работ</h2>
            <div className="grid gap-4">
              {devices.filter(d => d.isPlanned && !d.isArchived).map(device => renderDeviceCard(device))}
              {devices.filter(d => d.isPlanned && !d.isArchived).length === 0 && <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500">Нет запланированных устройств. Отметьте устройства флажком в списке ремонта.</div>}
            </div>
          </div>
        )}
        {view === 'print' && <Printables devices={devices} />}
        {view === 'ai_chat' && (
          <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen p-4 max-w-3xl mx-auto pt-4 md:pt-8">
            {/* Настройка API ключа */}
            <div className={`rounded-xl mb-4 border transition-all duration-300 ${hasApiKey && !showApiKeyForm
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-3'
              : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 p-4'
              }`}>
              {hasApiKey && !showApiKeyForm ? (
                /* Ключ введён — компактный статус */
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">API ключ настроен</span>
                    <span className="text-xs text-green-600/60 dark:text-green-400/50 font-mono">••••••••{getOpenRouterKey().slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowApiKeyForm(true)}
                      className="text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 font-medium px-2 py-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={handleRemoveApiKey}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                /* Ключ не введён или идёт редактирование — форма ввода */
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      {hasApiKey ? 'Изменить API ключ' : '🔑 Настройте AI помощника (бесплатно)'}
                    </div>
                    {hasApiKey && (
                      <button
                        onClick={() => setShowApiKeyForm(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {!hasApiKey && (
                    <div className="text-xs text-amber-900 dark:text-amber-200 mb-3 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/50">
                      <p className="font-bold mb-1">💡 Рекомендуется использовать Google Gemini (полностью бесплатно, 1500 запросов в день!):</p>
                      <p className="mb-2">Перейдите на <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">aistudio.google.com/app/apikey</a> и скопируйте ключ.</p>

                      <p className="font-bold mb-1 mt-2">ℹ️ Либо используйте OpenRouter (имеет сильные лимиты):</p>
                      <p>Скопируйте ключ на <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">openrouter.ai</a>.</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
                      placeholder="AIzaSy... (Gemini) или sk-or-v1-... (OpenRouter)"
                      className="flex-1 p-2 text-sm border border-amber-300 dark:border-amber-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim()}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Сохранить
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 scroll-smooth">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                    {msg.role === 'model' && <div className="flex items-center gap-1 mb-1 text-xs font-bold text-blue-600 opacity-75"><Bot className="w-3 h-3" /> AI Ассистент</div>}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
              {isChatLoading && <div className="flex justify-start"><div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-slate-500 text-sm flex gap-2 items-center"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div></div></div>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Спросите совет по ремонту..."
                className="flex-1 p-4 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
              <button onClick={handleSendMessage} className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"><ArrowRight className="w-6 h-6" /></button>
            </div>
          </div>
        )}
        {view === 'references' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button onClick={() => setActiveRefTab('esr')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeRefTab === 'esr' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Таблица ESR</button>
                <button onClick={() => setActiveRefTab('smd')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeRefTab === 'smd' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>SMD Калькулятор</button>
                <button onClick={() => setActiveRefTab('divider')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeRefTab === 'divider' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Делитель</button>
                <button onClick={() => setActiveRefTab('led')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeRefTab === 'led' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>LED Резистор</button>
                <button onClick={() => setActiveRefTab('datasheet')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeRefTab === 'datasheet' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Даташиты</button>
              </div>
              <div className="p-6">
                {activeRefTab === 'esr' && (
                  <div>
                    <div className="flex justify-end mb-4">
                      <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                        <button onClick={() => setEsrMode('std')} className={`px-3 py-1 rounded-md transition-colors ${esrMode === 'std' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Standard</button>
                        <button onClick={() => setEsrMode('low')} className={`px-3 py-1 rounded-md transition-colors ${esrMode === 'low' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Low ESR</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500">
                            <th className="border p-2">Cap / V</th>
                            <th className="border p-2">10V</th>
                            <th className="border p-2">16V</th>
                            <th className="border p-2">25V</th>
                            <th className="border p-2">63V</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(esrMode === 'std' ? ESR_DATA_STD : ESR_DATA_LOW).map((row, i) => (
                            <tr key={i} className="text-center hover:bg-blue-50">
                              <td className="border p-2 font-bold bg-slate-50">{row.cap}</td>
                              <td className="border p-2">{row.v10}</td>
                              <td className="border p-2">{row.v16}</td>
                              <td className="border p-2">{row.v25}</td>
                              <td className="border p-2">{row.v63}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeRefTab === 'smd' && (
                  <div className="max-w-xs mx-auto text-center space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2">Код на корпусе</label>
                      <input type="text" value={smdCode} onChange={e => setSmdCode(e.target.value)} className="w-full text-center text-2xl p-2 border border-slate-300 rounded uppercase font-mono" placeholder="103" />
                    </div>
                    <div className="p-4 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Результат</div>
                      <div className="text-xl font-bold text-blue-600">{calculateSMD(smdCode)}</div>
                    </div>
                  </div>
                )}
                {activeRefTab === 'divider' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500">Vin (Вольт)</label><input type="number" value={dividerValues.vin} onChange={e => setDividerValues({ ...dividerValues, vin: parseFloat(e.target.value) })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                      <div><label className="text-xs font-bold text-slate-500">R1 (Ом)</label><input type="number" value={dividerValues.r1} onChange={e => setDividerValues({ ...dividerValues, r1: parseFloat(e.target.value) })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                      <div><label className="text-xs font-bold text-slate-500">R2 (Ом)</label><input type="number" value={dividerValues.r2} onChange={e => setDividerValues({ ...dividerValues, r2: parseFloat(e.target.value) })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                    </div>
                    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Vout</div>
                        <div className="text-4xl font-bold text-blue-600">{calculateDividerVout()} V</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeRefTab === 'led' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500">Напряжение источника (V)</label><input type="number" value={ledValues.vsource} onChange={e => setLedValues({ ...ledValues, vsource: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                      <div><label className="text-xs font-bold text-slate-500">Напряжение LED (V)</label><input type="number" value={ledValues.vled} onChange={e => setLedValues({ ...ledValues, vled: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                      <div><label className="text-xs font-bold text-slate-500">Ток LED (mA)</label><input type="number" value={ledValues.current} onChange={e => setLedValues({ ...ledValues, current: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" /></div>
                    </div>
                    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl p-6">
                      <div className="text-center space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Резистор</div>
                          <div className="text-4xl font-bold text-blue-600">{calculateLedResistor().r} &#937;</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Мощность</div>
                          <div className="text-2xl font-bold text-orange-600">{calculateLedResistor().p} W</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeRefTab === 'datasheet' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input type="text" value={datasheetQuery} onChange={e => setDatasheetQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDatasheetSearch()} placeholder="Введите маркировку (напр. LM317, IRF3205)" className="flex-1 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg" />
                      <button onClick={handleDatasheetSearch} disabled={isDatasheetLoading} className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"><Search className="w-5 h-5" /></button>
                      <button onClick={openAllDatasheet} className="bg-slate-600 text-white px-4 rounded-lg hover:bg-slate-700 flex items-center gap-1 transition-colors"><ExternalLink className="w-4 h-4" /> AllDatasheet</button>
                    </div>
                    {isDatasheetLoading && <div className="text-center text-slate-500 py-4">Ищу информацию...</div>}
                    {datasheetResult && <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 text-sm whitespace-pre-wrap">{datasheetResult}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {view === 'knowledge' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-700"><BrainCircuit className="w-8 h-8" />База знаний</h2>
            <div className="grid gap-4">
              {KNOWLEDGE_BASE.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-4 p-4 cursor-pointer bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => setExpandedKnowledge(expandedKnowledge === item.title ? null : item.title)}>
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    {expandedKnowledge === item.title ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {expandedKnowledge === item.title && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-6 animate-fade-in">
                      {item.issues.map((issue, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="mt-1"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                          <div>
                            <div className="text-sm font-bold text-red-600 mb-1">{issue.problem}</div>
                            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{issue.solution}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'archive' && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Archive className="w-6 h-6 text-emerald-600" /> Архив завершённых ремонтов
            </h2>

            {/* Revenue Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-6">
              <div className="text-sm text-emerald-600 font-bold uppercase">Общая выручка (архив)</div>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                {devices.filter(d => d.isArchived && d.estimatedCost).reduce((sum, d) => sum + (d.estimatedCost || 0), 0).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs text-emerald-500 mt-1">
                Всего завершено: {devices.filter(d => d.isArchived).length} ремонтов
              </div>
            </div>

            {/* Archived Devices */}
            <div className="space-y-3">
              {devices.filter(d => d.isArchived).sort((a, b) =>
                new Date(b.statusChangedAt || b.dateReceived).getTime() - new Date(a.statusChangedAt || a.dateReceived).getTime()
              ).map(device => (
                <div key={device.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-2">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{device.deviceModel}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {device.clientName}
                      {device.clientPhone && <span className="ml-2 text-blue-500">{device.clientPhone}</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{device.issueDescription}</div>
                    {device.notes && <div className="text-xs text-slate-400 mt-1 italic">Заметки: {device.notes}</div>}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-xs text-slate-500">
                      Принят: {new Date(device.dateReceived).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="text-xs text-slate-500">
                      Выдан: {device.statusChangedAt ? new Date(device.statusChangedAt).toLocaleDateString('ru-RU') : '---'}
                    </div>
                    {device.estimatedCost ? (
                      <div className="text-sm font-bold text-emerald-600 mt-1">{device.estimatedCost.toLocaleString('ru-RU')} ₽</div>
                    ) : null}
                  </div>
                </div>
              ))}
              {devices.filter(d => d.isArchived).length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500">Архив пуст. Завершённые ремонты появятся здесь автоматически через 4 дня после выдачи.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAddDeviceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddDeviceModal(false); setEditingId(null); } }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">{editingId ? 'Редактирование заказа' : 'Новое устройство'}</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Модель</label><input type="text" className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.deviceModel || ''} onChange={e => setNewDevice({ ...newDevice, deviceModel: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Клиент</label><input type="text" className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.clientName || ''} onChange={e => setNewDevice({ ...newDevice, clientName: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Телефон</label><input type="tel" className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.clientPhone || ''} onChange={e => setNewDevice({ ...newDevice, clientPhone: e.target.value })} placeholder="+7 (999) 123-45-67" /></div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Дата приема</label>
                    <input type="date" className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.dateReceived ? newDevice.dateReceived.split('T')[0] : new Date().toLocaleDateString('en-CA')} onChange={e => setNewDevice({ ...newDevice, dateReceived: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Срочность</label>
                    <select
                      value={newDevice.urgency}
                      onChange={e => setNewDevice({ ...newDevice, urgency: e.target.value as Urgency })}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value={Urgency.NORMAL}>Обычная</option>
                      <option value={Urgency.HIGH}>Важно</option>
                      <option value={Urgency.CRITICAL}>Срочно!</option>
                    </select>
                  </div>
                </div>
                {editingId && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Статус</label>
                    <select
                      value={newDevice.status}
                      onChange={e => setNewDevice({ ...newDevice, status: e.target.value as DeviceStatus })}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Стоимость ремонта (₽)</label>
                  <input type="number" min="0" step="100" className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.estimatedCost || ''} onChange={e => setNewDevice({ ...newDevice, estimatedCost: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="0" />
                </div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Поломка</label><textarea className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.issueDescription || ''} onChange={e => setNewDevice({ ...newDevice, issueDescription: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Заметки мастера</label><textarea className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg outline-none h-16 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={newDevice.notes || ''} onChange={e => setNewDevice({ ...newDevice, notes: e.target.value })} placeholder="Заметки по ремонту..." /></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowAddDeviceModal(false); setEditingId(null); }} className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95 duration-200">Отмена</button>
                  <button onClick={handleSaveDevice} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 duration-200 shadow-md">Сохранить</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkshopRobot />
    </div>
  );
};

export default App;