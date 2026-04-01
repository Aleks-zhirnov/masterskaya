import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Use POST to import parts' });
    }

    try {
        const parts = [
            // === Микросхемы ===
            { id: 'imp_1', name: 'LM358, Микросхема, Двухканальный операционный усилитель общего применения [SOP-8]\\USMicro', type: 'Микросхемы', subtype: 'Операционные усилители', quantity: 3 },

            // === Конденсаторы — Пленочные ===
            { id: 'imp_2', name: 'R46KI310050M1M, Конденсатор Безопасности, 0.1 мкФ, X2, R46 Series, 275 В, Metallized PP\\Kemet', type: 'Конденсаторы', subtype: 'Пленочные', quantity: 1 },

            // === Конденсаторы — Электролитические ===
            { id: 'imp_3', name: '220мкФ, 35В, 105°C, 20%, 8x12мм P:3.5мм, JRB1V221M035008001200008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitors', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 3 },
            { id: 'imp_4', name: '100мкФ, 25В, 105°C, 20%, 6.3x11мм, 5000ч, 25YXF100MEFC6.3X11 (К50-35 имп.), Конденсатор электролитический алюминиевый\\Rubycon', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 4 },
            { id: 'imp_5', name: '470мкФ, 25В, 105°C, 20%, 10x17мм, Low imp, JRC1E471M050010001700008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitor', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 3 },
            { id: 'imp_6', name: '10мкФ, 63В, 105°C, 20%, 5x11мм P:2мм, JRB1J100M020005001100008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitors', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 2 },
            { id: 'imp_7', name: '1000мкФ, 16В, 105°C, 20%, 10x17мм, Low imp, JRC1C102M050010001700008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitor', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 4 },
            { id: 'imp_8', name: '470мкФ, 16В, 105°C, 20%, 8x12мм, Low imp, JRC1C471M035008001200008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitor', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 3 },
            { id: 'imp_9', name: '100мкФ, 50В, 105°C, 20%, 8x12мм P:3.5мм, JRB1H101M035008001200008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitors', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 3 },
            { id: 'imp_10', name: '220мкФ, 25В, 105°C, 20%, 8x12мм, Low imp, JRC1E221M035008001200008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitor', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 3 },
            { id: 'imp_11', name: '680мкФ, 25В, 105°C, 20%, 10x16мм P:5мм, JRB1E681M050010001600008 (К50-35 имп.), Конденсатор электролитический алюминиевый\\JB Capacitors', type: 'Конденсаторы', subtype: 'Электролитические', quantity: 2 },

            // === Резисторы ===
            { id: 'imp_12', name: 'KNP-100 1Вт, 2.2 Ом, 5%, Резистор проволочный\\Тайвань', type: 'Резисторы', subtype: '1Вт', quantity: 5 },
            { id: 'imp_13', name: '0.125Вт 0805 (перемычка) 0 Ом, 1%, RC0805FR-070RL, Чип резистор (SMD)\\Yageo', type: 'Резисторы', subtype: 'SMD 0805', quantity: 10 },
            { id: 'imp_14', name: '0.1Вт 0603, 0 Ом, 1%, RC0603FR-070RL, Чип резистор (SMD)\\Yageo', type: 'Резисторы', subtype: 'SMD 0603', quantity: 10 },

            // === Диоды — Стабилитроны ===
            { id: 'imp_15', name: 'BZT52C3V3, Стабилитрон 3.3В 0.5Вт [SOD-123]\\YJ', type: 'Диоды', subtype: 'Стабилитроны', quantity: 3 },
            { id: 'imp_16', name: 'BZT52C5V1, Стабилитрон 5.1В 0.5Вт [SOD-123]\\YJ', type: 'Диоды', subtype: 'Стабилитроны', quantity: 3 },
            { id: 'imp_17', name: 'BZX55C12, Стабилитрон 0.5Вт 12В [DO-35.]\\LGGE', type: 'Диоды', subtype: 'Стабилитроны', quantity: 3 },

            // === Диоды — Шоттки ===
            { id: 'imp_18', name: 'B5819W, Диод Шоттки 40В 1А [SOD-123.]\\EVVO', type: 'Диоды', subtype: 'Шоттки', quantity: 3 },
            { id: 'imp_19', name: 'SS34A, Диод Шоттки 40В 3А [SMA / DO-214AC]\\UMW', type: 'Диоды', subtype: 'Шоттки', quantity: 5 },
            { id: 'imp_20', name: '1N5822, Диод Шоттки, 3А, 40В [DO-201AD / DO-27.]\\YJ', type: 'Диоды', subtype: 'Шоттки', quantity: 5 },
            { id: 'imp_21', name: '1N5819, Диод Шоттки 40В 1А/25А [DO-41]\\Mic', type: 'Диоды', subtype: 'Шоттки', quantity: 3 },
            { id: 'imp_22', name: 'BAT54, Диод Шоттки 0.2А 30В [SOT-23-3.]\\Hottech', type: 'Диоды', subtype: 'Шоттки', quantity: 3 },
            { id: 'imp_28', name: 'SS14, Диод\\DC Components', type: 'Диоды', subtype: 'Шоттки', quantity: 5 },

            // === Диоды — Выпрямительные ===
            { id: 'imp_23', name: '1N4148, Диод импульсный 0.15А 100В [DO-35.]\\YJ', type: 'Диоды', subtype: 'Выпрямительные', quantity: 1 },
            { id: 'imp_24', name: '1N4148W, Диод импульсный 0.15А 100В [SOD-123.]\\EVVO', type: 'Диоды', subtype: 'SMD', quantity: 4 },
            { id: 'imp_29', name: '1N4007, Диод выпрямительный 1А 1000В [DO-41.]\\Hottech', type: 'Диоды', subtype: 'Выпрямительные', quantity: 5 },
            { id: 'imp_30', name: 'UF4007, Диод\\Mic', type: 'Диоды', subtype: 'Выпрямительные', quantity: 4 },

            // === Диоды — SMD ===
            { id: 'imp_25', name: 'ESD5Z5.0T1G, Устройство защиты от ESD, защитный диод, 5В [SOD-523.]\\UMW', type: 'Диоды', subtype: 'SMD', quantity: 3 },
            { id: 'imp_26', name: 'SMBJ5.0A, Защитный диод 600Вт 5В [SMB / DO-214AA.]\\SUNMATE', type: 'Диоды', subtype: 'SMD', quantity: 1 },
            { id: 'imp_27', name: '1N4007 M7, Диод выпрямительный 1А 1000В [SMA / DO-214AC.]\\YONGYUTAI', type: 'Диоды', subtype: 'SMD', quantity: 3 },
            { id: 'imp_31', name: 'ES1J (ER1J), Диод сверхбыстрый 1А 600В [SMA / DO-214AC.]\\Hottech', type: 'Диоды', subtype: 'SMD', quantity: 3 },
            { id: 'imp_32', name: 'US1M, Диод ультрабыстрый 1А 1000В [SMA / DO-214AC]\\UMW', type: 'Диоды', subtype: 'SMD', quantity: 5 },

            // === Диоды — Диодные мосты ===
            { id: 'imp_33', name: 'DB107S, Диодный мост однофазный 1А 1000В [DB-S.]\\Hottech', type: 'Диоды', subtype: 'Диодные мосты', quantity: 3 },

            // === Транзисторы ===
            { id: 'imp_34', name: 'SS8050-D, Транзистор NPN 25В 1.5А [TO-92]\\LGGE', type: 'Транзисторы', subtype: 'Биполярные NPN', quantity: 2 },
            { id: 'imp_35', name: 'AO4884, Транзистор 2N-MOSFET 40В 10А 2Вт [SOP-8.]\\UMW', type: 'Транзисторы', subtype: 'MOSFET N-канал', quantity: 2 },
        ];

        let imported = 0;
        for (const p of parts) {
            await sql`
        INSERT INTO parts (id, name, type, subtype, quantity, inStock)
        VALUES (${p.id}, ${p.name}, ${p.type}, ${p.subtype}, ${p.quantity}, ${true})
        ON CONFLICT (id) DO UPDATE SET
          name = ${p.name},
          type = ${p.type},
          subtype = ${p.subtype},
          quantity = ${p.quantity},
          inStock = ${true};
      `;
            imported++;
        }

        return res.status(200).json({ success: true, imported, total: parts.length });
    } catch (error) {
        console.error("Import Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
