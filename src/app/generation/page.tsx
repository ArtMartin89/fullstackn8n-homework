'use client';

import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';


export default function Generation() {
  // Состояние для генерации изображений
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Очистка blob URL при размонтировании компонента
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Функция для генерации изображения
  const generateImage = async () => {
    if (!prompt.trim()) {
      setGenerationError('Введите описание для генерации изображения');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImage(null);
    
    // Очищаем предыдущий blob URL если есть
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    try {
      // Создаем контроллер для отмены запроса при необходимости
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch('https://clecucuci.beget.app/webhook/cbc015c8-616a-4fd4-9857-7834a53867bf', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'image/*,*/*',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Получаем данные в зависимости от типа контента
      const contentType = response.headers.get('content-type');
      console.log('Content-Type ответа:', contentType);

      if (contentType && contentType.startsWith('image/')) {
        // Если это изображение, создаем blob URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setBlobUrl(imageUrl);
        setGeneratedImage(imageUrl);
      } else if (contentType && contentType.includes('application/json')) {
        // Если это JSON, парсим его
        const result = await response.json();
        console.log('JSON ответ:', result);
        
        // Проверяем на ошибки в ответе
        if (result.error || result.message || result.status === 'error') {
          throw new Error('Что-то пошло не так, попробуйте еще раз');
        }
        
        // Ищем URL изображения в разных возможных полях
        const imageUrl = result.imageUrl || result.image || result.data || result.url || result.image_url || result.file_url;
        
        if (imageUrl) {
          setGeneratedImage(imageUrl);
        } else {
          console.log('Полный JSON ответ:', JSON.stringify(result, null, 2));
          
          // Проверяем, есть ли информация о статусе генерации
          if (result.status === 'pending' || result.status === 'processing') {
            throw new Error('Что-то пошло не так, попробуйте еще раз');
          } else if (result.status === 'failed') {
            throw new Error('Что-то пошло не так, попробуйте еще раз');
          } else {
            throw new Error('Что-то пошло не так, попробуйте еще раз');
          }
        }
      } else {
        // Попробуем получить как текст (возможно base64)
        const textResponse = await response.text();
        console.log('Текстовый ответ:', textResponse);
        
        // Проверяем, является ли это base64 изображением
        if (textResponse.startsWith('data:image/') || textResponse.startsWith('/9j/') || textResponse.startsWith('iVBOR')) {
          setGeneratedImage(textResponse);
        } else {
          // Попробуем парсить как JSON
          try {
            const jsonResult = JSON.parse(textResponse);
            console.log('Парсированный JSON:', jsonResult);
            
            const imageUrl = jsonResult.imageUrl || jsonResult.image || jsonResult.data || jsonResult.url || jsonResult.image_url || jsonResult.file_url;
            
            if (imageUrl) {
              setGeneratedImage(imageUrl);
            } else {
              throw new Error('Что-то пошло не так, попробуйте еще раз');
            }
          } catch {
            throw new Error('Что-то пошло не так, попробуйте еще раз');
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setGenerationError('Превышено время ожидания ответа от сервера (30 сек)');
        } else if (err.message.includes('Failed to fetch')) {
          setGenerationError('Не удалось подключиться к серверу. Проверьте интернет-соединение и доступность сервера.');
        } else {
          setGenerationError(`Ошибка: ${err.message}`);
        }
      } else {
        setGenerationError('Неизвестная ошибка при генерации изображения');
      }
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Основной контент */}
        <main className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад к аналитике
            </Link>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Генерация изображений
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Просто впишите что вы хотите увидеть на картинке и нажмите кнопку.
          </p>
          
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
            {/* Поле для ввода запроса */}
            <div className="w-full">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание изображения для генерации
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Введите детальное описание изображения, которое хотите сгенерировать..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
              />
            </div>

            {/* Состояние загрузки */}
            {isGenerating && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Генерируем изображение...</span>
              </div>
            )}
            
            {/* Кнопка генерации */}
            <div className="flex justify-center">
              <button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                {isGenerating ? 'Генерируем...' : 'Сгенерировать изображение'}
              </button>
            </div>

            {/* Ошибка генерации */}
            {generationError && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Ошибка:</strong> {generationError}
                  </div>
                  <button
                    onClick={() => {
                      setGenerationError(null);
                      if (prompt.trim()) {
                        generateImage();
                      }
                    }}
                    className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Повторить
                  </button>
                </div>
              </div>
            )}

            {/* Сгенерированное изображение */}
            {generatedImage && (
              <div className="w-full mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Сгенерированное изображение
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <Image 
                    src={generatedImage} 
                    alt="Сгенерированное изображение" 
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg"
                    onError={() => setGenerationError('Ошибка при загрузке изображения')}
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
