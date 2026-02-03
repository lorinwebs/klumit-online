'use client';

import { useState, useEffect } from 'react';

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

export function useTranslateHTML(htmlContent: string, targetLanguage: 'en' | 'ru' | 'he') {
  const [translatedContent, setTranslatedContent] = useState<string>(htmlContent);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // אם השפה עברית, להחזיר את התוכן המקורי
    if (targetLanguage === 'he' || !htmlContent) {
      setTranslatedContent(htmlContent);
      return;
    }

    const translateContent = async () => {
      // Check cache first
      const cacheKey = `${htmlContent.substring(0, 150)}_${targetLanguage}`;
      if (translationCache[cacheKey]) {
        setTranslatedContent(translationCache[cacheKey]);
        return;
      }

      setIsTranslating(true);
      
      try {
        // Extract text from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        if (!textContent || textContent.length < 5) {
          setTranslatedContent(htmlContent);
          return;
        }
        
        // Split into smaller chunks for better translation
        const maxChunkLength = 400;
        const chunks: string[] = [];
        let currentChunk = '';
        
        // Split by sentences or line breaks
        const sentences = textContent.split(/(?<=[.!?\n])\s+/);
        
        for (const sentence of sentences) {
          if ((currentChunk.length + sentence.length) > maxChunkLength && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
        
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // Translate each chunk
        const translatedChunks: string[] = [];
        
        for (const chunk of chunks) {
          if (!chunk || chunk.length < 2) {
            translatedChunks.push(chunk);
            continue;
          }
          
          try {
            const response = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=he|${targetLanguage}`,
              { 
                cache: 'force-cache',
                next: { revalidate: 86400 } // Cache for 24 hours
              }
            );
            
            if (!response.ok) throw new Error('Translation API error');
            
            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
              translatedChunks.push(data.responseData.translatedText);
            } else {
              translatedChunks.push(chunk); // Fallback
            }
            
            // Small delay between requests to avoid rate limiting
            if (chunks.length > 1) {
              await new Promise(resolve => setTimeout(resolve, 150));
            }
          } catch (error) {
            console.warn('Translation chunk error:', error);
            translatedChunks.push(chunk); // Fallback
          }
        }
        
        // Join translated chunks
        const translatedText = translatedChunks.join('\n\n');
        
        // Preserve basic HTML structure
        // Replace paragraph and list structure
        let result = htmlContent;
        
        // Simple replacement: replace all text content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const resultDoc = parser.parseFromString(htmlContent, 'text/html');
        
        // Get all text nodes and replace them
        const walker = document.createTreeWalker(
          resultDoc.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const translatedSentences = translatedText.split(/\n+/);
        let sentenceIndex = 0;
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.trim()) {
            if (sentenceIndex < translatedSentences.length) {
              node.textContent = translatedSentences[sentenceIndex];
              sentenceIndex++;
            }
          }
        }
        
        result = resultDoc.body.innerHTML;
        
        // Cache the result
        translationCache[cacheKey] = result;
        setTranslatedContent(result);
        
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedContent(htmlContent); // Fallback
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [htmlContent, targetLanguage]);

  return { translatedContent, isTranslating };
}
