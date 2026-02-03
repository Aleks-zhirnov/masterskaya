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
  CheckSquare,
  Square
} from 'lucide-react';
import { Device, DeviceStatus, PartType, SparePart, ViewState, ChatMessage, Urgency } from './types';
import { generateWorkshopAdvice } from './services/ai';
import { Printables } from './components/Printables';

// --- CONSTANTS ---

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

const STORAGE_KEYS = {
  DEVICES: 'workshop_devices',
  PARTS: 'workshop_parts'
};

const api = {
  isOffline: false,

  request: async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      
      // Если сервер возвращает HTML (404 от Vite SPA или ошибка), считаем это сбоем API
      if (contentType && contentType.includes("text/html")) {
        throw new Error("API вернул HTML (возможно 404)");
      }

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
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
    try {
      await api.request('/api/seed');
      api.isOffline = false;
    } catch (e) {
      console.warn("Backend unavailable (404/Error), switching to Offline Mode.", e);
      api.isOffline = true;
      // Initialize local storage if empty
      if (!localStorage.getItem(STORAGE_KEYS.DEVICES)) {
        localStorage.setItem(STORAGE_KEYS.DEVICES, '[]');
      }
      if (!localStorage.getItem(STORAGE_KEYS.PARTS)) {
        localStorage.setItem(STORAGE_KEYS.PARTS, '[]');
      }
    }
  },
  
  getDevices: async () => {
    if (api.isOffline) {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
    }
    return api.request('/api/devices');
  },

  saveDevice: async (device: Device) => {
    if (api.isOffline) {
      const devices = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
      const idx = devices.findIndex((d: Device) => d.id === device.id);
      if (idx >= 0) {
        devices[idx] = device;
      } else {
        devices.push(device);
      }
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      return { success: true };
    }
    return api.request('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
  },

  deleteDevice: async (id: string) => {
    if (api.isOffline) {
      let devices = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
      devices = devices.filter((d: Device) => d.id !== id);
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      return { success: true };
    }
    return api.request(`/api/devices?id=${id}`, { method: 'DELETE' });
  },

  getParts: async () => {
    if (api.isOffline) {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTS) || '[]');
    }
    return api.request('/api/parts');
  },

  savePart: async (part: SparePart) => {
    if (api.isOffline) {
      const parts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTS) || '[]');
      const idx = parts.findIndex((p: SparePart) => p.id === part.id);
      if (idx >= 0) {
        parts[idx] = part;
      } else {
        parts.push(part);
      }
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts));
      return { success: true };
    }
    return api.request('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(part)
    });
  },

  deletePart: async (id: string) => {
    if (api.isOffline) {
      let parts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTS) || '[]');
      parts = parts.filter((p: SparePart) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts));
      return { success: true };
    }
    return api.request(`/api/parts?id=${id}`, { method: 'DELETE' });
  }
};

// --- COMPONENTS ---

const WorkshopRobot = () => {
  const [fact, setFact] = useState("Загружаю интересный факт...");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchFact = async () => {
      const prompt = "Расскажи один очень короткий, но интересный и малоизвестный технический факт или лайфхак для инженера-электронщика. Не более 2 предложений. В конце добавь веселый смайлик.";
      const response = await generateWorkshopAdvice(prompt);
      setFact(response);
    };
    fetchFact();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-64 z-50 p-4 w-64 animate-fade-in-up hidden md:block will-change-transform transform-gpu no-print">
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
  
  // Data
  const [devices, setDevices] = useState<Device[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я AI-помощник мастерской. Чем могу помочь?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Forms
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    clientName: '', deviceModel: '', issueDescription: '', status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL, isPlanned: false
  });

  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState<Partial<SparePart>>({
    name: '', type: PartType.OTHER, quantity: 1, inStock: true
  });

  // Initialization
  useEffect(() => {
    const init = async () => {
      try {
        await api.initCloud();
        setIsOfflineMode(api.isOffline);
        const [d, p] = await Promise.all([api.getDevices(), api.getParts()]);
        if (d) setDevices(d);
        if (p) setParts(p);
      } catch (err) {
        console.error("Failed to init data", err);
      }
    };
    init();
  }, []);

  // Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAiLoading(true);

    const response = await generateWorkshopAdvice(chatInput);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setAiLoading(false);
  };

  const handleAddDevice = async () => {
    if (!newDevice.clientName || !newDevice.deviceModel) return;
    const dev: Device = {
      id: Date.now().toString(),
      clientName: newDevice.clientName!,
      deviceModel: newDevice.deviceModel!,
      issueDescription: newDevice.issueDescription || '',
      dateReceived: new Date().toISOString(),
      status: newDevice.status as DeviceStatus,
      urgency: newDevice.urgency as Urgency,
      notes: newDevice.notes,
      isPlanned: newDevice.isPlanned,
      statusChangedAt: new Date().toISOString()
    };
    await api.saveDevice(dev);
    setDevices(prev => [...prev, dev]);
    setShowAddDevice(false);
    setNewDevice({ clientName: '', deviceModel: '', issueDescription: '', status: DeviceStatus.RECEIVED, urgency: Urgency.NORMAL, isPlanned: false });
  };

  const handleDeleteDevice = async (id: string) => {
    if (confirm('Удалить устройство?')) {
      await api.deleteDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleAddPart = async () => {
    if (!newPart.name) return;
    const part: SparePart = {
      id: Date.now().toString(),
      name: newPart.name!,
      type: newPart.type as PartType,
      subtype: newPart.subtype,
      quantity: newPart.quantity || 1,
      inStock: newPart.inStock || false
    };
    await api.savePart(part);
    setParts(prev => [...prev, part]);
    setShowAddPart(false);
    setNewPart({ name: '', type: PartType.OTHER, quantity: 1, inStock: true });
  };

  const handleDeletePart = async (id: string) => {
    if (confirm('Удалить запчасть?')) {
      await api.deletePart(id);
      setParts(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- RENDERING ---

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-slate-900 flex-col border-r border-slate-800 hidden md:flex">
         <div className="p-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
               <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-xl font-bold text-white tracking-tight">Мастерская</h1>
               <div className="text-[10px] text-slate-500 font-mono uppercase">Pro Edition v2.0</div>
            </div>
         </div>

         <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
            <NavButtons current={view} setView={setView} devicesCount={devices.filter(d => d.status !== DeviceStatus.ISSUED).length} />
         </div>

         <div className="p-4 border-t border-slate-800">
             <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">ME</div>
                <div className="flex-1 min-w-0">
                   <div className="text-sm font-bold truncate">Инженер</div>
                   {isOfflineMode ? (
                     <div className="text-[10px] text-orange-400 flex items-center gap-1"><CloudOff className="w-3 h-3"/> Offline Mode</div>
                   ) : (
                     <div className="text-[10px] text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Online</div>
                   )}
                </div>
             </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30">
           <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg"><Wrench className="w-5 h-5"/></div>
              <span className="font-bold">Мастерская Pro</span>
           </div>
           {isOfflineMode && <div className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full border border-orange-500/50 flex items-center gap-1"><CloudOff className="w-3 h-3"/> Offline</div>}
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 text-slate-900 p-4 md:p-8">
           
           {/* VIEW: REPAIR */}
           {view === 'repair' && (
             <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Wrench className="w-6 h-6 text-blue-600"/> В ремонте</h2>
                   <button onClick={() => setShowAddDevice(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95">
                      <Plus className="w-4 h-4" /> Принять
                   </button>
                </div>
                
                {showAddDevice && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-fade-in-down mb-6">
                     <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-lg">Новое устройство</h3>
                        <button onClick={() => setShowAddDevice(false)}><X className="w-5 h-5 text-gray-400"/></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input placeholder="Клиент (Имя, Телефон)" className="border p-2 rounded" value={newDevice.clientName} onChange={e => setNewDevice({...newDevice, clientName: e.target.value})} />
                        <input placeholder="Модель устройства" className="border p-2 rounded" value={newDevice.deviceModel} onChange={e => setNewDevice({...newDevice, deviceModel: e.target.value})} />
                        <select className="border p-2 rounded" value={newDevice.urgency} onChange={e => setNewDevice({...newDevice, urgency: e.target.value as Urgency})}>
                          <option value={Urgency.NORMAL}>Обычная срочность</option>
                          <option value={Urgency.HIGH}>Высокая</option>
                          <option value={Urgency.CRITICAL}>Критическая (Срочно!)</option>
                        </select>
                        <div className="flex items-center gap-2">
                           <input type="checkbox" id="isPlanned" checked={newDevice.isPlanned} onChange={e => setNewDevice({...newDevice, isPlanned: e.target.checked})} className="w-5 h-5"/>
                           <label htmlFor="isPlanned">В план на завтра</label>
                        </div>
                     </div>
                     <textarea placeholder="Описание неисправности" className="border p-2 rounded w-full h-24 mb-4" value={newDevice.issueDescription} onChange={e => setNewDevice({...newDevice, issueDescription: e.target.value})} />
                     <div className="flex justify-end">
                        <button onClick={handleAddDevice} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {devices.map(dev => (
                      <div key={dev.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                         <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 ${dev.urgency === Urgency.CRITICAL ? 'bg-red-500' : dev.urgency === Urgency.HIGH ? 'bg-orange-500' : 'bg-transparent'}`}></div>
                         
                         <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              dev.status === DeviceStatus.READY ? 'bg-green-100 text-green-700' : 
                              dev.status === DeviceStatus.ISSUED ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
                            }`}>{dev.status}</span>
                            <button onClick={() => handleDeleteDevice(dev.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                         </div>
                         
                         <h3 className="font-bold text-lg mb-1 truncate" title={dev.deviceModel}>{dev.deviceModel}</h3>
                         <div className="text-sm text-slate-500 mb-3 flex items-center gap-1"><Users className="w-3 h-3"/> {dev.clientName}</div>
                         
                         <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-4 h-16 overflow-y-auto">
                            {dev.issueDescription}
                         </div>

                         <div className="flex gap-2 mt-auto">
                            <select 
                              value={dev.status} 
                              onChange={async (e) => {
                                const updated = { ...dev, status: e.target.value as DeviceStatus, statusChangedAt: new Date().toISOString() };
                                await api.saveDevice(updated);
                                setDevices(prev => prev.map(d => d.id === dev.id ? updated : d));
                              }}
                              className="flex-1 text-xs border border-slate-300 rounded p-1 bg-white"
                            >
                               {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                      </div>
                   ))}
                   {devices.length === 0 && <div className="col-span-full text-center py-20 text-slate-400">Список пуст</div>}
                </div>
             </div>
           )}

           {/* VIEW: PLANNING */}
           {view === 'planning' && (
             <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-purple-600"/> План работ</h2>
                <div className="space-y-4">
                  {devices.filter(d => d.isPlanned && d.status !== DeviceStatus.ISSUED).length === 0 && (
                    <div className="bg-white p-8 rounded-xl text-center text-slate-400">Нет запланированных устройств. Отметьте "В план" при приеме.</div>
                  )}
                  {devices.filter(d => d.isPlanned && d.status !== DeviceStatus.ISSUED).map(dev => (
                    <div key={dev.id} className="bg-white p-4 rounded-xl border border-l-4 border-purple-500 shadow-sm flex justify-between items-center">
                       <div>
                          <div className="font-bold">{dev.deviceModel}</div>
                          <div className="text-sm text-slate-500">{dev.issueDescription}</div>
                       </div>
                       <div className="text-xs font-bold px-2 py-1 bg-slate-100 rounded">{dev.urgency}</div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* VIEW: INVENTORY */}
           {view === 'inventory' && (
             <div className="max-w-6xl mx-auto">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package className="w-6 h-6 text-orange-600"/> Склад запчастей</h2>
                   <button onClick={() => setShowAddPart(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm">
                      <Plus className="w-4 h-4" /> Добавить
                   </button>
               </div>

               {showAddPart && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-6">
                     <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-lg">Новая запчасть</h3>
                        <button onClick={() => setShowAddPart(false)}><X className="w-5 h-5 text-gray-400"/></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input placeholder="Название / Номинал" className="border p-2 rounded" value={newPart.name} onChange={e => setNewPart({...newPart, name: e.target.value})} />
                        <select className="border p-2 rounded" value={newPart.type} onChange={e => setNewPart({...newPart, type: e.target.value as PartType, subtype: ''})}>
                           {Object.values(PartType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className="border p-2 rounded" value={newPart.subtype} onChange={e => setNewPart({...newPart, subtype: e.target.value})}>
                           <option value="">-- Подкатегория --</option>
                           {newPart.type && RADIO_SUBCATEGORIES[newPart.type as PartType]?.map(sub => (
                             <option key={sub} value={sub}>{sub}</option>
                           ))}
                        </select>
                     </div>
                     <div className="flex items-center gap-4 mb-4">
                        <input type="number" min="1" className="border p-2 rounded w-24" value={newPart.quantity} onChange={e => setNewPart({...newPart, quantity: parseInt(e.target.value)})} />
                        <label className="flex items-center gap-2">
                           <input type="checkbox" checked={newPart.inStock} onChange={e => setNewPart({...newPart, inStock: e.target.checked})} className="w-5 h-5"/> В наличии
                        </label>
                     </div>
                     <button onClick={handleAddPart} className="bg-orange-600 text-white px-6 py-2 rounded-lg w-full">Добавить на склад</button>
                  </div>
               )}

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <tr>
                           <th className="p-4">Название</th>
                           <th className="p-4">Категория</th>
                           <th className="p-4">Кол-во</th>
                           <th className="p-4">Статус</th>
                           <th className="p-4 text-right">Действия</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 text-sm">
                        {parts.map(part => (
                           <tr key={part.id} className="hover:bg-slate-50">
                              <td className="p-4 font-medium">{part.name}</td>
                              <td className="p-4 text-slate-500">{part.type} <span className="text-xs text-slate-400 block">{part.subtype}</span></td>
                              <td className="p-4">{part.quantity} шт.</td>
                              <td className="p-4">
                                 {part.inStock 
                                    ? <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3"/> В наличии</span>
                                    : <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><ShoppingCart className="w-3 h-3"/> Купить</span>
                                 }
                              </td>
                              <td className="p-4 text-right">
                                 <button onClick={() => handleDeletePart(part.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {parts.length === 0 && <div className="p-10 text-center text-slate-400">Склад пуст</div>}
               </div>
             </div>
           )}

           {/* VIEW: PRINT */}
           {view === 'print' && <Printables devices={devices} />}

           {/* VIEW: AI CHAT */}
           {view === 'ai_chat' && (
             <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b flex items-center gap-3">
                   <div className="bg-indigo-600 p-2 rounded-full"><Bot className="w-5 h-5 text-white"/></div>
                   <div>
                      <h3 className="font-bold">AI Инженер</h3>
                      <div className="text-xs text-slate-500">Помогает с диагностикой и аналогами</div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                            msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                         }`}>
                           {msg.role === 'model' ? (
                             <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                           ) : msg.text}
                         </div>
                      </div>
                   ))}
                   {aiLoading && (
                      <div className="flex justify-start"><div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                      </div></div>
                   )}
                </div>
                <div className="p-4 border-t flex gap-2">
                   <input 
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Спроси совета..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   />
                   <button onClick={handleSendMessage} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"><ArrowRight className="w-5 h-5"/></button>
                </div>
             </div>
           )}

           {/* VIEW: REFERENCES */}
           {view === 'references' && (
              <div className="max-w-5xl mx-auto space-y-8">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-6 h-6 text-teal-600"/> Справочные данные</h2>
                 
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 text-slate-700">Таблица ESR (ЭПС) конденсаторов</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-center border-collapse">
                         <thead>
                            <tr>
                               <th className="border p-2 bg-slate-100 text-left">Емкость</th>
                               <th className="border p-2 bg-slate-50">10 V</th>
                               <th className="border p-2 bg-slate-50">16 V</th>
                               <th className="border p-2 bg-slate-50">25 V</th>
                               <th className="border p-2 bg-slate-50">63 V</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr className="bg-slate-100"><td colSpan={5} className="p-2 font-bold text-left">Стандартные (Standard)</td></tr>
                            {ESR_DATA_STD.map(row => (
                               <tr key={`std-${row.cap}`}>
                                  <td className="border p-2 font-bold text-left">{row.cap}</td>
                                  <td className="border p-2">{row.v10}</td>
                                  <td className="border p-2">{row.v16}</td>
                                  <td className="border p-2">{row.v25}</td>
                                  <td className="border p-2">{row.v63}</td>
                               </tr>
                            ))}
                            <tr className="bg-slate-100"><td colSpan={5} className="p-2 font-bold text-left mt-4">Низкоимпедансные (Low ESR)</td></tr>
                            {ESR_DATA_LOW.map(row => (
                               <tr key={`low-${row.cap}`}>
                                  <td className="border p-2 font-bold text-left">{row.cap}</td>
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
              </div>
           )}

           {/* VIEW: KNOWLEDGE */}
           {view === 'knowledge' && (
              <div className="max-w-4xl mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-pink-600"/> База типовых дефектов</h2>
                 <div className="grid grid-cols-1 gap-4">
                    {KNOWLEDGE_BASE.map((item, idx) => (
                       <details key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 group">
                          <summary className="p-4 flex items-center gap-4 cursor-pointer list-none">
                             <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">{item.icon}</div>
                             <div className="flex-1">
                                <h3 className="font-bold text-lg">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.description}</p>
                             </div>
                             <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"/>
                          </summary>
                          <div className="p-4 pt-0 border-t border-slate-100 mt-2">
                             <div className="space-y-4 mt-4">
                                {item.issues.map((issue, i) => (
                                   <div key={i} className="bg-slate-50 p-3 rounded-lg">
                                      <div className="font-bold text-red-500 text-sm mb-1">{issue.problem}</div>
                                      <div className="text-sm text-slate-700 leading-relaxed">{issue.solution}</div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </details>
                    ))}
                 </div>
              </div>
           )}

        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 pb-safe sticky bottom-0 z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
           <MobileNavButton view="repair" current={view} setView={setView} icon={<Wrench className="w-6 h-6"/>} label="Ремонт" badge={devices.filter(d => d.status !== DeviceStatus.ISSUED).length} />
           <MobileNavButton view="inventory" current={view} setView={setView} icon={<Package className="w-6 h-6"/>} label="Склад" />
           <MobileNavButton view="planning" current={view} setView={setView} icon={<CalendarCheck className="w-6 h-6"/>} label="План" />
           <MobileNavButton view="print" current={view} setView={setView} icon={<Printer className="w-6 h-6"/>} label="Печать" />
           <MobileNavButton view="ai_chat" current={view} setView={setView} icon={<Bot className="w-6 h-6"/>} label="AI" />
        </div>

      </div>

      <WorkshopRobot />
    </div>
  );
};

export default App;