'use client';

import { Activity, BookOpen, BellOff, Asterisk, Loader2, Sparkles } from 'lucide-react';
import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from 'next/link';

// Типы для данных из вебхука
interface CampaignData {
  row_number?: number;
  Месяц?: string;
  Показы?: string | number;
  Клики?: string | number;
  "Kлики"?: string | number;
  clicks?: string | number;
  Clicks?: string | number;
  CTR?: number;
  "Расходы, USD"?: number;
  "Расходы USD"?: number;
  "Expenses"?: number;
  "expenses"?: number;
  "Расход (BYN)"?: string | number;
  "Ср. цена за клик"?: number;
  "% показов на верх. поз."?: number;
  "% показов на сам. верх. поз."?: number;
  "Проц. получ. показ. в поиск. сети"?: number;
  "Коэфф. конверсии"?: number;
  "Стоимость/конв."?: number;
  Конверсии?: number;
  "Расход в BYN"?: number;
  "Цена конверсии в BYN"?: number;
}

export default function Home() {
  // Курс конвертации BYN в USD (можно изменить здесь)
  const BYN_TO_USD_RATE = 3.0
  
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CampaignData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для данных Google
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [dataGoogle, setDataGoogle] = useState<CampaignData[]>([]);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);
  
  // Время последнего обновления данных
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Состояние для управления видимостью данных на графике Яндекс
  const [visibleData, setVisibleData] = useState({
    Показы: true,
    Клики: true,
    CTR: true,
    Расходы: true,
    Конверсии: true
  });

  // Состояние для управления видимостью данных на графике Google
  const [visibleDataGoogle, setVisibleDataGoogle] = useState({
    Показы: true,
    Клики: true,
    CTR: true,
    Расходы: true,
    Конверсии: true
  });

  // Состояние для переключения между таблицей и графиком Яндекс
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Состояние для переключения между таблицей и графиком Google
  const [viewModeGoogle, setViewModeGoogle] = useState<'table' | 'chart'>('table');

  // Автоматическая загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
    fetchDataGoogle();
  }, []);

  // Функция для переключения видимости данных Яндекс
  const toggleDataVisibility = (dataType: keyof typeof visibleData) => {
    setVisibleData(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };

  // Функция для переключения видимости данных Google
  const toggleDataVisibilityGoogle = (dataType: keyof typeof visibleDataGoogle) => {
    setVisibleDataGoogle(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };

  // Функция для нормализации данных (приведение к одному масштабу)
  const normalizeData = (value: number, max: number, min: number) => {
    if (max === min) return 50; // Если все значения одинаковые, возвращаем 50
    return ((value - min) / (max - min)) * 100;
  };

  // Функция для конвертации BYN в USD
  const convertBYNtoUSD = (bynValue: string | number): number => {
    if (!bynValue) return 0;
    
    // Если это строка, убираем пробелы и заменяем запятую на точку
    const cleanValue = typeof bynValue === 'string' 
      ? bynValue.replace(/\s/g, '').replace(',', '.')
      : bynValue.toString();
    
    const bynNumber = parseFloat(cleanValue);
    if (isNaN(bynNumber)) return 0;
    
    // Конвертируем по текущему курсу
    return bynNumber / BYN_TO_USD_RATE;
  };

  // Функция для расчета статистики по столбцам Яндекс
  const calculateStatistics = () => {
    if (data.length === 0) return {};

    const stats: Record<string, { min: number; max: number; average: number }> = {};

    // Показы
    const показыValues = data.map(item => {
      const value = typeof item.Показы === 'string' 
        ? parseInt(item.Показы.replace(/\s/g, '')) 
        : item.Показы || 0;
      return value;
    });
    stats['Показы'] = {
      min: Math.min(...показыValues),
      max: Math.max(...показыValues),
      average: показыValues.reduce((sum, val) => sum + val, 0) / показыValues.length
    };

    // Клики
    const кликиValues = data.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const value = typeof clicks === 'string' 
        ? parseInt(clicks.toString().replace(/\s/g, '')) 
        : clicks || 0;
      return value;
    });
    stats['Клики'] = {
      min: Math.min(...кликиValues),
      max: Math.max(...кликиValues),
      average: кликиValues.reduce((sum, val) => sum + val, 0) / кликиValues.length
    };

    // CTR
    const ctrValues = data.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
      const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
      
      let ctr = item.CTR;
      if (!ctr && показы > 0 && клики > 0) {
        ctr = (клики / показы) * 100;
      }
      return ctr || 0;
    });
    stats['CTR (%)'] = {
      min: Math.min(...ctrValues),
      max: Math.max(...ctrValues),
      average: ctrValues.reduce((sum, val) => sum + val, 0) / ctrValues.length
    };

    // Расходы USD (конвертируем из BYN)
    const расходыValues = data.map(item => {
      const bynValue = item["Расход (BYN)"];
      if (bynValue) {
        return convertBYNtoUSD(bynValue);
      }
      return item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"] || 0;
    });
    stats['Расходы USD'] = {
      min: Math.min(...расходыValues),
      max: Math.max(...расходыValues),
      average: расходыValues.reduce((sum, val) => sum + val, 0) / расходыValues.length
    };

    // Конверсии
    const конверсииValues = data.map(item => item.Конверсии || 0);
    stats['Конверсии'] = {
      min: Math.min(...конверсииValues),
      max: Math.max(...конверсииValues),
      average: конверсииValues.reduce((sum, val) => sum + val, 0) / конверсииValues.length
    };

    return stats;
  };

  // Функция для расчета статистики по столбцам Google
  const calculateStatisticsGoogle = () => {
    if (dataGoogle.length === 0) return {};

    const stats: Record<string, { min: number; max: number; average: number }> = {};

    // Показы
    const показыValues = dataGoogle.map(item => {
      const value = typeof item.Показы === 'string' 
        ? parseInt(item.Показы.replace(/\s/g, '')) 
        : item.Показы || 0;
      return value;
    });
    stats['Показы'] = {
      min: Math.min(...показыValues),
      max: Math.max(...показыValues),
      average: показыValues.reduce((sum, val) => sum + val, 0) / показыValues.length
    };

    // Клики
    const кликиValues = dataGoogle.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const value = typeof clicks === 'string' 
        ? parseInt(clicks.toString().replace(/\s/g, '')) 
        : clicks || 0;
      return value;
    });
    stats['Клики'] = {
      min: Math.min(...кликиValues),
      max: Math.max(...кликиValues),
      average: кликиValues.reduce((sum, val) => sum + val, 0) / кликиValues.length
    };

    // CTR
    const ctrValues = dataGoogle.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
      const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
      
      let ctr = item.CTR;
      if (!ctr && показы > 0 && клики > 0) {
        ctr = (клики / показы) * 100;
      }
      return ctr || 0;
    });
    stats['CTR (%)'] = {
      min: Math.min(...ctrValues),
      max: Math.max(...ctrValues),
      average: ctrValues.reduce((sum, val) => sum + val, 0) / ctrValues.length
    };

    // Расходы USD
    const расходыValues = dataGoogle.map(item => item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"] || 0);
    stats['Расходы USD'] = {
      min: Math.min(...расходыValues),
      max: Math.max(...расходыValues),
      average: расходыValues.reduce((sum, val) => sum + val, 0) / расходыValues.length
    };

    // Конверсии
    const конверсииValues = dataGoogle.map(item => item.Конверсии || 0);
    stats['Конверсии'] = {
      min: Math.min(...конверсииValues),
      max: Math.max(...конверсииValues),
      average: конверсииValues.reduce((sum, val) => sum + val, 0) / конверсииValues.length
    };

    return stats;
  };

  // Функция для подготовки данных для графика Яндекс
  const prepareChartData = () => {
    const rawData = data.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
      const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
      
      // Вычисляем CTR если он не задан: CTR = (Клики / Показы) * 100
      let ctr = item.CTR;
      if (!ctr && показы > 0 && клики > 0) {
        ctr = (клики / показы) * 100;
      }
      
      return {
        Месяц: item.Месяц || 'N/A',
        Показы: показы,
        Клики: клики,
        CTR: ctr || 0,
        Расходы: (() => {
          const bynValue = item["Расход (BYN)"];
          if (bynValue) {
            return convertBYNtoUSD(bynValue);
          }
          return item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"] || 0;
        })(),
        Конверсии: item.Конверсии || 0
      };
    });

    // Находим минимумы и максимумы для каждой серии
    const показыValues = rawData.map(d => d.Показы);
    const кликиValues = rawData.map(d => d.Клики);
    const ctrValues = rawData.map(d => d.CTR);
    const расходыValues = rawData.map(d => d.Расходы);
    const конверсииValues = rawData.map(d => d.Конверсии);

    const показыMax = Math.max(...показыValues);
    const показыMin = Math.min(...показыValues);
    const кликиMax = Math.max(...кликиValues);
    const кликиMin = Math.min(...кликиValues);
    const ctrMax = Math.max(...ctrValues);
    const ctrMin = Math.min(...ctrValues);
    const расходыMax = Math.max(...расходыValues);
    const расходыMin = Math.min(...расходыValues);
    const конверсииMax = Math.max(...конверсииValues);
    const конверсииMin = Math.min(...конверсииValues);

    // Нормализуем данные
    return rawData.map(item => ({
      Месяц: item.Месяц,
      Показы: normalizeData(item.Показы, показыMax, показыMin),
      Клики: normalizeData(item.Клики, кликиMax, кликиMin),
      CTR: normalizeData(item.CTR, ctrMax, ctrMin),
      Расходы: normalizeData(item.Расходы, расходыMax, расходыMin),
      Конверсии: normalizeData(item.Конверсии, конверсииMax, конверсииMin),
      // Сохраняем оригинальные значения для тултипа
      Показы_original: item.Показы,
      Клики_original: item.Клики,
      CTR_original: item.CTR,
      Расходы_original: item.Расходы,
      Конверсии_original: item.Конверсии
    }));
  };

  // Функция для подготовки данных для графика Google
  const prepareChartDataGoogle = () => {
    const rawData = dataGoogle.map(item => {
      const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
      const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
      const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
      
      // Вычисляем CTR если он не задан: CTR = (Клики / Показы) * 100
      let ctr = item.CTR;
      if (!ctr && показы > 0 && клики > 0) {
        ctr = (клики / показы) * 100;
      }
      
      return {
        Месяц: item.Месяц || 'N/A',
        Показы: показы,
        Клики: клики,
        CTR: ctr || 0,
        Расходы: item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"] || 0,
        Конверсии: item.Конверсии || 0
      };
    });

    // Находим минимумы и максимумы для каждой серии
    const показыValues = rawData.map(d => d.Показы);
    const кликиValues = rawData.map(d => d.Клики);
    const ctrValues = rawData.map(d => d.CTR);
    const расходыValues = rawData.map(d => d.Расходы);
    const конверсииValues = rawData.map(d => d.Конверсии);

    const показыMax = Math.max(...показыValues);
    const показыMin = Math.min(...показыValues);
    const кликиMax = Math.max(...кликиValues);
    const кликиMin = Math.min(...кликиValues);
    const ctrMax = Math.max(...ctrValues);
    const ctrMin = Math.min(...ctrValues);
    const расходыMax = Math.max(...расходыValues);
    const расходыMin = Math.min(...расходыValues);
    const конверсииMax = Math.max(...конверсииValues);
    const конверсииMin = Math.min(...конверсииValues);

    // Нормализуем данные
    return rawData.map(item => ({
      Месяц: item.Месяц,
      Показы: normalizeData(item.Показы, показыMax, показыMin),
      Клики: normalizeData(item.Клики, кликиMax, кликиMin),
      CTR: normalizeData(item.CTR, ctrMax, ctrMin),
      Расходы: normalizeData(item.Расходы, расходыMax, расходыMin),
      Конверсии: normalizeData(item.Конверсии, конверсииMax, конверсииMin),
      // Сохраняем оригинальные значения для тултипа
      Показы_original: item.Показы,
      Клики_original: item.Клики,
      CTR_original: item.CTR,
      Расходы_original: item.Расходы,
      Конверсии_original: item.Конверсии
    }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Используем только POST запрос, так как вебхук поддерживает только POST
      const response = await fetch('https://clecucuci.beget.app/webhook/0d670d64-ecd3-41fb-b267-f8dcd2196bc1', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}) // Отправляем пустой объект
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Yandex fetch error:', err);
      
      // Всегда используем тестовые данные при любой ошибке
      setError('Не удалось загрузить данные Яндекс с сервера. Показываем тестовые данные.');
      // Тестовые данные на основе реальных данных из вебхука
      const testData = [
        {
          row_number: 1,
          Месяц: "янв. 2024",
          Показы: "467 853",
          "Kлики": 8516,
          CTR: 0.0182,
          "Расходы, USD": 1170.32,
          "Ср. цена за клик": 0.14,
          "% показов на верх. поз.": 0.6095,
          "% показов на сам. верх. поз.": 0.3766,
          "Проц. получ. показ. в поиск. сети": 0.2507,
          "Коэфф. конверсии": 0.0397,
          "Стоимость/конв.": 3.46,
          Конверсии: 338.09,
          "Расход в BYN": 3780.13,
          "Цена конверсии в BYN": 10.38
        },
        {
          row_number: 2,
          Месяц: "фев 2024",
          Показы: "255 293",
          "Kлики": 5662,
          CTR: 0.0222,
          "Расходы, USD": 791.73,
          "Ср. цена за клик": 0.14,
          "% показов на верх. поз.": 0.6572,
          "% показов на сам. верх. поз.": 0.3867,
          "Проц. получ. показ. в поиск. сети": 0.382,
          "Коэфф. конверсии": 0.0603,
          "Стоимость/конв.": 2.32,
          Конверсии: 341.26,
          "Расход в BYN": 2557.29,
          "Цена конверсии в BYN": 6.96
        },
        {
          row_number: 3,
          Месяц: "мар. 2024",
          Показы: "323 973",
          "Kлики": 7943,
          CTR: 0.0245,
          "Расходы, USD": 1007.42,
          "Ср. цена за клик": 0.13,
          "% показов на верх. поз.": 0.6994,
          "% показов на сам. верх. поз.": 0.4097,
          "Проц. получ. показ. в поиск. сети": 0.3442,
          "Коэфф. конверсии": 0.0527,
          "Стоимость/конв.": 2.41,
          Конверсии: 418.25,
          "Расход в BYN": 3253.97,
          "Цена конверсии в BYN": 7.23
        }
      ];
      console.log('Using test data:', testData);
      setData(testData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataGoogle = async () => {
    setIsLoadingGoogle(true);
    setErrorGoogle(null);
    
    try {
      // Используем только POST запрос, так как вебхук поддерживает только POST
      const response = await fetch('https://clecucuci.beget.app/webhook/d814cb72-d0ae-440e-8f44-241d44c2359e', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}) // Отправляем пустой объект
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setDataGoogle(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Google fetch error:', err);
      
      // Всегда используем тестовые данные при любой ошибке
      setErrorGoogle('Не удалось загрузить данные Google с сервера. Показываем тестовые данные.');
      // Тестовые данные для Google
      const testDataGoogle = [
        {
          row_number: 1,
          Месяц: "янв. 2024",
          Показы: "234 567",
          "Kлики": 4567,
          CTR: 0.0195,
          "Расходы, USD": 892.15,
          "Ср. цена за клик": 0.20,
          "% показов на верх. поз.": 0.5234,
          "% показов на сам. верх. поз.": 0.3123,
          "Проц. получ. показ. в поиск. сети": 0.1892,
          "Коэфф. конверсии": 0.0356,
          "Стоимость/конв.": 2.50,
          Конверсии: 162.45,
          "Расход в BYN": 2880.25,
          "Цена конверсии в BYN": 5.49
        },
        {
          row_number: 2,
          Месяц: "фев 2024",
          Показы: "198 432",
          "Kлики": 3891,
          CTR: 0.0196,
          "Расходы, USD": 756.89,
          "Ср. цена за клик": 0.19,
          "% показов на верх. поз.": 0.5678,
          "% показов на сам. верх. поз.": 0.3456,
          "Проц. получ. показ. в поиск. сети": 0.2345,
          "Коэфф. конверсии": 0.0423,
          "Стоимость/конв.": 1.95,
          Конверсии: 164.78,
          "Расход в BYN": 2445.67,
          "Цена конверсии в BYN": 4.85
        },
        {
          row_number: 3,
          Месяц: "мар. 2024",
          Показы: "267 891",
          "Kлики": 5234,
          CTR: 0.0195,
          "Расходы, USD": 945.67,
          "Ср. цена за клик": 0.18,
          "% показов на верх. поз.": 0.6123,
          "% показов на сам. верх. поз.": 0.3789,
          "Проц. получ. показ. в поиск. сети": 0.2678,
          "Коэфф. конверсии": 0.0389,
          "Стоимость/конв.": 1.81,
          Конверсии: 203.67,
          "Расход в BYN": 3056.78,
          "Цена конверсии в BYN": 4.64
        }
      ];
      console.log('Using Google test data:', testDataGoogle);
      setDataGoogle(testDataGoogle);
      setLastUpdated(new Date());
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Основной контент */}
        <main className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Рекламная Аналитика Kroks
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Данные по рекламным кампаниям Яндекс и Google
          </p>
          <div className="flex flex-col items-center gap-4">
            {(isLoading || isLoadingGoogle) && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Загрузка данных...</span>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  fetchData();
                  fetchDataGoogle();
                }}
                disabled={isLoading || isLoadingGoogle}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Обновить данные
              </button>
              
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>
        </main>


        {/* Отображение данных */}
        {(data.length > 0 || error) && (
          <div className="mb-16">
            {error && (
              <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4 max-w-4xl mx-auto">
                <strong>Внимание:</strong> {error}
              </div>
            )}
            
            {data.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Данные рекламной кампании Яндекс 2024
                </h2>
                
                {/* Переключатель режимов */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Таблица
                    </button>
                    <button
                      onClick={() => setViewMode('chart')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'chart'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      График
                    </button>
                  </div>
                </div>

                {/* Таблица */}
                {viewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Месяц
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Показы
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Клики
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            CTR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Расходы USD
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Конверсии
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.Месяц || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.Показы ? (typeof item.Показы === 'string' ? item.Показы : item.Показы.toLocaleString()) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                // Проверяем разные возможные названия поля
                                const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
                                return clicks !== undefined && clicks !== null 
                                  ? (typeof clicks === 'string' ? clicks : clicks.toLocaleString()) 
                                  : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
                                const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
                                const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
                                
                                let ctr = item.CTR;
                                if (!ctr && показы > 0 && клики > 0) {
                                  ctr = (клики / показы) * 100;
                                }
                                return ctr ? ctr.toFixed(2) + '%' : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                // Проверяем поле "Расход (BYN)" и конвертируем в USD
                                const bynValue = item["Расход (BYN)"];
                                if (bynValue) {
                                  const usdValue = convertBYNtoUSD(bynValue);
                                  return '$' + usdValue.toFixed(2);
                                }
                                
                                // Fallback на другие возможные поля
                                const expenses = item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"];
                                return expenses !== undefined && expenses !== null 
                                  ? '$' + expenses.toFixed(2) 
                                  : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.Конверсии ? item.Конверсии.toFixed(0) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* График */}
                {viewMode === 'chart' && (
                  <>
                    {/* Переключатели данных */}
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                      {Object.entries(visibleData).map(([key, isVisible]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleDataVisibility(key as keyof typeof visibleData)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {key}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Пояснение к графику */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Данные нормализованы для лучшей видимости всех серий (0-100%)
                      </p>
                    </div>

                    {/* Area Chart */}
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={prepareChartData()}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="Месяц" 
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string, props: any) => {
                              // Получаем оригинальное значение из данных
                              const originalValue = props.payload[`${name}_original`];
                              if (name === 'CTR') return [`${originalValue.toFixed(2)}%`, name];
                              if (name === 'Расходы') return [`$${originalValue.toFixed(2)}`, name];
                              if (originalValue >= 1000000) return [`${(originalValue / 1000000).toFixed(1)}M`, name];
                              if (originalValue >= 1000) return [`${(originalValue / 1000).toFixed(1)}K`, name];
                              return [originalValue.toLocaleString(), name];
                            }}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ 
                              backgroundColor: '#f9fafb', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          
                          {visibleData.Показы && (
                            <Area 
                              type="monotone" 
                              dataKey="Показы" 
                              stackId="1"
                              stroke="#3b82f6" 
                              fill="#3b82f6"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleData.Клики && (
                            <Area 
                              type="monotone" 
                              dataKey="Клики" 
                              stackId="2"
                              stroke="#ef4444" 
                              fill="#ef4444"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleData.CTR && (
                            <Area 
                              type="monotone" 
                              dataKey="CTR" 
                              stackId="3"
                              stroke="#8b5cf6" 
                              fill="#8b5cf6"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleData.Расходы && (
                            <Area 
                              type="monotone" 
                              dataKey="Расходы" 
                              stackId="4"
                              stroke="#10b981" 
                              fill="#10b981"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleData.Конверсии && (
                            <Area 
                              type="monotone" 
                              dataKey="Конверсии" 
                              stackId="5"
                              stroke="#f59e0b" 
                              fill="#f59e0b"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Статистика */}
            {data.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto mt-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Статистика по показателям
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(calculateStatistics()).map(([columnName, stats]) => (
                    <div key={columnName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                        {columnName}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Мин:</span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.min.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.min.toFixed(2)}`
                              : stats.min >= 1000000
                              ? `${(stats.min / 1000000).toFixed(1)}M`
                              : stats.min >= 1000
                              ? `${(stats.min / 1000).toFixed(1)}K`
                              : stats.min.toLocaleString()
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Макс:</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.max.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.max.toFixed(2)}`
                              : stats.max >= 1000000
                              ? `${(stats.max / 1000000).toFixed(1)}M`
                              : stats.max >= 1000
                              ? `${(stats.max / 1000).toFixed(1)}K`
                              : stats.max.toLocaleString()
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Средн:</span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.average.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.average.toFixed(2)}`
                              : stats.average >= 1000000
                              ? `${(stats.average / 1000000).toFixed(1)}M`
                              : stats.average >= 1000
                              ? `${(stats.average / 1000).toFixed(1)}K`
                              : stats.average.toLocaleString()
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Отображение данных Google */}
        {(dataGoogle.length > 0 || errorGoogle) && (
          <div className="mb-16">
            {errorGoogle && (
              <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4 max-w-4xl mx-auto">
                <strong>Внимание:</strong> {errorGoogle}
              </div>
            )}
            
            {dataGoogle.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Данные рекламной кампании Google 2024
                </h2>
                
                {/* Переключатель режимов */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
                    <button
                      onClick={() => setViewModeGoogle('table')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewModeGoogle === 'table'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Таблица
                    </button>
                    <button
                      onClick={() => setViewModeGoogle('chart')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewModeGoogle === 'chart'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      График
                    </button>
                  </div>
                </div>

                {/* Таблица */}
                {viewModeGoogle === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Месяц
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Показы
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Клики
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            CTR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Расходы USD
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Конверсии
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {dataGoogle.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.Месяц || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.Показы ? (typeof item.Показы === 'string' ? item.Показы : item.Показы.toLocaleString()) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                // Проверяем разные возможные названия поля
                                const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
                                return clicks !== undefined && clicks !== null 
                                  ? (typeof clicks === 'string' ? clicks : clicks.toLocaleString()) 
                                  : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                const clicks = item.Клики || item['Kлики'] || item.clicks || item.Clicks;
                                const показы = typeof item.Показы === 'string' ? parseInt(item.Показы.replace(/\s/g, '')) : item.Показы || 0;
                                const клики = typeof clicks === 'string' ? parseInt(clicks.toString().replace(/\s/g, '')) : clicks || 0;
                                
                                let ctr = item.CTR;
                                if (!ctr && показы > 0 && клики > 0) {
                                  ctr = (клики / показы) * 100;
                                }
                                return ctr ? ctr.toFixed(2) + '%' : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {(() => {
                                // Проверяем разные возможные названия поля расходов
                                const expenses = item["Расходы, USD"] || item["Расходы USD"] || item["Expenses"] || item["expenses"];
                                return expenses !== undefined && expenses !== null 
                                  ? '$' + expenses.toFixed(2) 
                                  : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.Конверсии ? item.Конверсии.toFixed(0) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* График */}
                {viewModeGoogle === 'chart' && (
                  <>
                    {/* Переключатели данных */}
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                      {Object.entries(visibleDataGoogle).map(([key, isVisible]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleDataVisibilityGoogle(key as keyof typeof visibleDataGoogle)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {key}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Пояснение к графику */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Данные нормализованы для лучшей видимости всех серий (0-100%)
                      </p>
                    </div>

                    {/* Area Chart */}
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={prepareChartDataGoogle()}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="Месяц" 
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string, props: any) => {
                              // Получаем оригинальное значение из данных
                              const originalValue = props.payload[`${name}_original`];
                              if (name === 'CTR') return [`${originalValue.toFixed(2)}%`, name];
                              if (name === 'Расходы') return [`$${originalValue.toFixed(2)}`, name];
                              if (originalValue >= 1000000) return [`${(originalValue / 1000000).toFixed(1)}M`, name];
                              if (originalValue >= 1000) return [`${(originalValue / 1000).toFixed(1)}K`, name];
                              return [originalValue.toLocaleString(), name];
                            }}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ 
                              backgroundColor: '#f9fafb', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          
                          {visibleDataGoogle.Показы && (
                            <Area 
                              type="monotone" 
                              dataKey="Показы" 
                              stackId="1"
                              stroke="#3b82f6" 
                              fill="#3b82f6"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleDataGoogle.Клики && (
                            <Area 
                              type="monotone" 
                              dataKey="Клики" 
                              stackId="2"
                              stroke="#ef4444" 
                              fill="#ef4444"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleDataGoogle.CTR && (
                            <Area 
                              type="monotone" 
                              dataKey="CTR" 
                              stackId="3"
                              stroke="#8b5cf6" 
                              fill="#8b5cf6"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleDataGoogle.Расходы && (
                            <Area 
                              type="monotone" 
                              dataKey="Расходы" 
                              stackId="4"
                              stroke="#10b981" 
                              fill="#10b981"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                          
                          {visibleDataGoogle.Конверсии && (
                            <Area 
                              type="monotone" 
                              dataKey="Конверсии" 
                              stackId="5"
                              stroke="#f59e0b" 
                              fill="#f59e0b"
                              fillOpacity={0.6}
                              strokeWidth={2}
                              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Статистика Google */}
            {dataGoogle.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto mt-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Статистика по показателям Google
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(calculateStatisticsGoogle()).map(([columnName, stats]) => (
                    <div key={columnName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                        {columnName}
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Мин:</span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.min.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.min.toFixed(2)}`
                              : stats.min >= 1000000
                              ? `${(stats.min / 1000000).toFixed(1)}M`
                              : stats.min >= 1000
                              ? `${(stats.min / 1000).toFixed(1)}K`
                              : stats.min.toLocaleString()
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Макс:</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.max.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.max.toFixed(2)}`
                              : stats.max >= 1000000
                              ? `${(stats.max / 1000000).toFixed(1)}M`
                              : stats.max >= 1000
                              ? `${(stats.max / 1000).toFixed(1)}K`
                              : stats.max.toLocaleString()
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Средн:</span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {columnName === 'CTR (%)' 
                              ? `${stats.average.toFixed(2)}%`
                              : columnName === 'Расходы USD'
                              ? `$${stats.average.toFixed(2)}`
                              : stats.average >= 1000000
                              ? `${(stats.average / 1000000).toFixed(1)}M`
                              : stats.average >= 1000
                              ? `${(stats.average / 1000).toFixed(1)}K`
                              : stats.average.toLocaleString()
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Кнопка перехода к генерации */}
        <div className="text-center mt-16">
          <Link 
            href="/generation"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Sparkles className="w-6 h-6" />
            Перейти к генерации
          </Link>
        </div>
      </div>
    </div>
  );
}