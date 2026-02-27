'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { ChevronLeft, ChevronRight, X, Share2, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ProductCard from '@/components/ProductCard';
import Tooltip from '@/components/Tooltip';
import ImageZoomModal from '@/components/ImageZoomModal';
import { trackProductViewed, trackAddToCart } from '@/lib/analytics';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslateHTML } from '@/lib/hooks/useTranslateHTML';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable: number;
        selectedOptions?: Array<{
          name: string;
          value: string;
        }>;
        image?: {
          url: string;
          altText: string | null;
        } | null;
      };
    }>;
  };
}

interface ProductClientProps {
  product: Product;
  relatedProducts: Product[];
}

function RelatedProductCard({ relatedProduct, formatPrice }: { relatedProduct: Product; formatPrice: (p: string) => string }) {
  const [imgIndex, setImgIndex] = useState(0);
  const images = relatedProduct.images.edges;
  const hasMultipleImages = images.length > 1;

  return (
    <div className="related-card flex-shrink-0 snap-start w-[calc(50%-8px)] md:w-[calc(25%-12px)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-warm border border-sand/60 group">
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-5 h-5 border-2 border-sand-dark border-t-espresso rounded-full animate-spin" />
        </div>
        <Link href={`/products/${relatedProduct.handle}`} className="block w-full h-full relative z-[1]">
          {images[imgIndex]?.node.url && (
            <Image
              src={images[imgIndex].node.url}
              alt={relatedProduct.title}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 45vw, 23vw"
            />
          )}
        </Link>
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream shadow-sm rounded-full w-7 h-7 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream shadow-sm rounded-full w-7 h-7 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === imgIndex ? 'bg-espresso' : 'bg-sand-dark'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Link href={`/products/${relatedProduct.handle}`} className="block mt-3 text-center space-y-1">
        <h3 className="text-xs md:text-sm font-light tracking-tight text-espresso line-clamp-2">
          {relatedProduct.title}
        </h3>
        <p className="text-xs md:text-sm font-normal text-stone">
          ₪{formatPrice(relatedProduct.priceRange.minVariantPrice.amount)}
        </p>
      </Link>
    </div>
  );
}

export default function ProductClient({ product, relatedProducts: initialRelatedProducts }: ProductClientProps) {
  const { t, language } = useLanguage();
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showStockToast, setShowStockToast] = useState(false);
  const [stockMessage, setStockMessage] = useState('');
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts] = useState<Product[]>(initialRelatedProducts);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterError, setNewsletterError] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const imageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const relatedScrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Translate product description
  const { translatedContent: translatedDescription } = useTranslateHTML(
    product.descriptionHtml || product.description,
    language
  );

  // Type for variant node
  type VariantNode = Product['variants']['edges'][0]['node'];

  // Extract colors from variants
  const getColorFromVariant = useCallback((variant: VariantNode): string | null => {
    const colorOption = variant.selectedOptions?.find(opt => 
      opt.name.toLowerCase() === 'color' || 
      opt.name.toLowerCase() === 'צבע' ||
      opt.name.toLowerCase() === 'colour'
    );
    return colorOption?.value || null;
  }, []);

  // Convert color name to hex value
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      // English colors
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',
      'navy': '#000080',
      'beige': '#F5F5DC',
      'khaki': '#C3B091',
      'tan': '#D2B48C',
      'camel': '#C19A6B',
      'camal': '#C19A6B',
      'burgundy': '#800020',
      'maroon': '#800000',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'teal': '#008080',
      'olive': '#808000',
      'lime': '#00FF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      // Hebrew colors
      'שחור': '#000000',
      'לבן': '#FFFFFF',
      'אדום': '#FF0000',
      'כחול': '#0000FF',
      'ירוק': '#008000',
      'צהוב': '#FFFF00',
      'כתום': '#FFA500',
      'סגול': '#800080',
      'ורוד': '#FFC0CB',
      'חום': '#A52A2A',
      'אפור': '#808080',
      'כחול כהה': '#000080',
      'בז': '#F5F5DC',
      'קרם': '#FFFDD0',
      'בורדו': '#800020',
      'טורקיז': '#40E0D0',
      'זהב': '#FFD700',
      'כסף': '#C0C0C0',
    };
    
    const normalizedName = colorName.toLowerCase().trim();
    return colorMap[normalizedName] || '#CCCCCC'; // Default gray if color not found
  };

  // Group variants by color
  const colorMap = new Map<string, VariantNode[]>();
  product.variants.edges.forEach(({ node }) => {
    const color = getColorFromVariant(node);
    if (color) {
      if (!colorMap.has(color)) {
        colorMap.set(color, []);
      }
      colorMap.get(color)!.push(node);
    }
  });

  // Get available colors
  const availableColors = Array.from(colorMap.keys());
  const hasColors = availableColors.length > 0;

  // Get current variant's color
  const currentVariant = useMemo(() => 
    product.variants.edges.find((e) => e.node.id === selectedVariant)?.node,
    [product.variants.edges, selectedVariant]
  );
  
  const currentColor = useMemo(() => 
    currentVariant ? getColorFromVariant(currentVariant) : null,
    [currentVariant, getColorFromVariant]
  );

  // Filter images by selected variant/color
  const filteredImages = useMemo(() => {
    if (!hasColors || !currentColor) {
      return product.images.edges;
    }

    // If variant has its own image, prioritize it
    if (currentVariant?.image?.url) {
      const variantImage = currentVariant.image.url;
      // Check if variant image is in product images
      const variantImageInList = product.images.edges.find(
        ({ node }) => node.url === variantImage
      );
      
      if (variantImageInList) {
        // Return images starting with variant image
        const variantIndex = product.images.edges.findIndex(
          ({ node }) => node.url === variantImage
        );
        return [
          ...product.images.edges.slice(variantIndex),
          ...product.images.edges.slice(0, variantIndex)
        ];
      }
      
      // If variant image is not in product images, add it first
      return [
        { node: { url: variantImage, altText: currentVariant.image.altText } },
        ...product.images.edges
      ];
    }

    // Fallback: return all images
    return product.images.edges;
  }, [hasColors, currentColor, currentVariant, product.images.edges]);

  // Initialize selected variant and image
  useEffect(() => {
    if (product.variants.edges.length > 0) {
      const firstVariant = product.variants.edges[0].node;
      setSelectedVariant(firstVariant.id);
      
      // Set initial image from variant if available
      if (firstVariant.image?.url) {
        const variantImageUrl = firstVariant.image.url;
        setSelectedImage(variantImageUrl);
        // Find the index in filteredImages
        const imageIndex = product.images.edges.findIndex(
          ({ node }) => node.url === variantImageUrl
        );
        setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
      } else if (product.images.edges.length > 0) {
        setSelectedImage(product.images.edges[0].node.url);
        setCurrentImageIndex(0);
      }
    } else if (product.images.edges.length > 0) {
      setSelectedImage(product.images.edges[0].node.url);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Track product view
  useEffect(() => {
    // Small delay to ensure Meta Pixel is initialized
    const timer = setTimeout(() => {
      trackProductViewed({
        id: product.id,
        name: product.title,
        price: parseFloat(product.priceRange.minVariantPrice.amount),
        currency: product.priceRange.minVariantPrice.currencyCode,
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [product.id, product.title, product.priceRange.minVariantPrice]);

  // Update image when variant changes
  useEffect(() => {
    if (currentVariant?.image?.url) {
      const variantImageUrl = currentVariant.image.url;
      const imageIndex = filteredImages.findIndex(
        ({ node }) => node.url === variantImageUrl
      );
      if (imageIndex >= 0) {
        setSelectedImage(variantImageUrl);
        setCurrentImageIndex(imageIndex);
      }
    }
  }, [selectedVariant, currentVariant, filteredImages]);

  // Use Intersection Observer instead of scroll listener for better performance
  useEffect(() => {
    if (!product || !scrollContainerRef.current) return;

    // Cleanup previous observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        // Find the most visible image
        let mostVisibleEntry: IntersectionObserverEntry | null = null;
        let maxRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleEntry = entry;
          }
        }

        if (mostVisibleEntry) {
          const target = mostVisibleEntry.target as HTMLElement;
          if (target && target.dataset) {
            const imageUrl = target.dataset.imageUrl;
            if (imageUrl && imageUrl !== selectedImage) {
              setSelectedImage(imageUrl);
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    // Observe all images
    filteredImages.forEach(({ node }) => {
      const imageElement = imageRefs.current[node.url];
      if (imageElement) {
        imageElement.setAttribute('data-image-url', node.url);
        observer.observe(imageElement);
      }
    });

    intersectionObserverRef.current = observer;

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [product, selectedImage, filteredImages]);

  // Show/hide floating cart button on mobile scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const ctaSection = document.querySelector('[data-cta-section]');
      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect();
        setShowFloatingCart(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle swipe for mobile images
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !product) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - next image
        const newIndex = currentImageIndex === filteredImages.length - 1 
          ? 0 
          : currentImageIndex + 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(filteredImages[newIndex].node.url);
      } else {
        // Swipe right - previous image
        const newIndex = currentImageIndex === 0 
          ? filteredImages.length - 1 
          : currentImageIndex - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(filteredImages[newIndex].node.url);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariant || isAddingToCart) return;
    
    if (currentVariant && currentVariant.availableForSale) {
      // בדיקת מלאי לפני הוספה
      const existingItem = items.find((i) => i.variantId === currentVariant.id);
      const currentQuantity = existingItem?.quantity || 0;
      const newQuantity = currentQuantity + 1;
      
      // בדיקת מלאי: רק אם יש מידע על מלאי (לא undefined ולא null)
      const quantityAvailable = currentVariant.quantityAvailable;
      if (quantityAvailable !== undefined && quantityAvailable !== null) {
        // אם המלאי הוא 0 - חוסמים (אזל במלאי)
        if (quantityAvailable === 0) {
          setStockMessage(t('products.outOfStock'));
          setShowStockToast(true);
          setTimeout(() => {
            setShowStockToast(false);
          }, 3000);
          return;
        }
        
        // אם הכמות החדשה גדולה מהמלאי הזמין - חוסמים
        if (newQuantity > quantityAvailable) {
          setStockMessage(`${t('products.stockWarning')} ${quantityAvailable} ${t('products.stockLeft')}`);
          setShowStockToast(true);
          setTimeout(() => {
            setShowStockToast(false);
          }, 3000);
          return;
        }
      }
      // אם quantityAvailable הוא undefined או null - מאפשרים הוספה (אין מידע על מלאי)
      
      // Set loading state
      setIsAddingToCart(true);
      
      // Use variant image if available, otherwise use selected image
      const imageToUse = currentVariant.image?.url || selectedImage;
      
      await addItem({
        id: currentVariant.id,
        variantId: currentVariant.id,
        title: product.title,
        price: currentVariant.price.amount,
        currencyCode: currentVariant.price.currencyCode,
        image: imageToUse,
        available: currentVariant.availableForSale,
        quantityAvailable: currentVariant.quantityAvailable,
        color: currentColor || undefined,
        variantTitle: currentVariant.title,
        handle: product.handle,
      });

      // Track add to cart
      trackAddToCart({
        id: currentVariant.id,
        name: product.title,
        price: parseFloat(currentVariant.price.amount),
        currency: currentVariant.price.currencyCode,
        variant: currentVariant.title,
        quantity: 1,
      });
      
      // Show toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);

      // Keep button disabled for 500ms to prevent double clicks
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    }
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    const variantsForColor = colorMap.get(color);
    if (variantsForColor && variantsForColor.length > 0) {
      // Select first available variant for this color, or first variant if none available
      const availableVariant = variantsForColor.find(v => v.availableForSale) || variantsForColor[0];
      setSelectedVariant(availableVariant.id);
    }
  };

  // Handle image click to open zoom modal
  const handleImageClick = (index: number) => {
    setZoomImageIndex(index);
    setShowZoomModal(true);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterConsent) return;
    
    setNewsletterStatus('loading');
    setNewsletterError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
        setNewsletterConsent(false);
      } else {
        setNewsletterStatus('error');
        setNewsletterError('אירעה שגיאה, נסו שוב');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterError('אירעה שגיאה, נסו שוב');
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = async () => {
    const productUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `https://www.klumit-online.co.il/products/${product.handle}`;
    const text = `${product.title} - ₪${price}\n${productUrl}`;
    
    // Send notification to Telegram
    try {
      await fetch('/api/telegram/notify-whatsapp-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: product.title,
          productUrl: productUrl,
          productPrice: `₪${price}`,
        }),
      });
    } catch (error) {
      // Silent fail - don't break WhatsApp share if Telegram fails
      console.warn('Failed to send WhatsApp share notification:', error);
    }
    
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Try Web Share API first on mobile (opens WhatsApp directly with text)
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: product.title,
            text: text,
            url: productUrl,
          });
          return; // Success - Web Share API handled it
        } catch (error: any) {
          // User cancelled or share failed, fall through to WhatsApp URL
          if (error.name === 'AbortError') {
            return; // User cancelled, don't proceed
          }
        }
      }
      
      // Fallback: Use WhatsApp URL scheme
      // For iOS: whatsapp://send?text=...
      // For Android: https://wa.me/?text=... (works better than intent://)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      let whatsappUrl: string;
      if (isIOS) {
        // iOS: Use whatsapp:// protocol to open app directly
        whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
      } else if (isAndroid) {
        // Android: Use intent:// to open app directly, fallback to wa.me
        whatsappUrl = `intent://send?text=${encodeURIComponent(text)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
      } else {
        // Desktop: Use wa.me
        whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      }
      
      // Try to open WhatsApp app directly
      if (isMobile) {
        window.location.href = whatsappUrl;
        // Fallback after 2 seconds if app didn't open
        setTimeout(() => {
          // If still on page, open wa.me as fallback
          if (document.visibilityState === 'visible') {
            window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
          }
        }, 2000);
      } else {
        // Desktop: try window.open, fallback to location.href
        const newWindow = window.open(whatsappUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = whatsappUrl;
        }
      }
    }
  };

  // פורמט מחיר פרימיום
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  const price = currentVariant?.price.amount 
    ? formatPrice(currentVariant.price.amount) 
    : formatPrice(product.priceRange.minVariantPrice.amount);

  // חילוץ השורה הראשונה מהתיאור (רק טקסט, ללא HTML)
  const extractFirstLine = (description: string | undefined): string => {
    if (!description) return '';
    
    // הסרת תגי HTML וניקוי רווחים
    const textOnly = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // נקח את המשפט הראשון (עד נקודה או שורה חדשה)
    const firstSentence = textOnly.split(/[.\n]/)[0].trim();
    return firstSentence || textOnly.split('\n')[0].trim();
  };

  // הסרת השורה הראשונה מהתיאור המלא (HTML)
  const getDescriptionWithoutFirstLine = (description: string | undefined): string => {
    if (!description) return '';
    
    const firstLine = extractFirstLine(description);
    if (!firstLine) return description;
    
    // נסיר את השורה הראשונה מהתיאור HTML
    // נחפש את הטקסט הראשון בתיאור ונסיר אותו יחד עם התגים סביבו
    const firstLineEscaped = firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // נסיר את השורה הראשונה - נחפש תבנית של טקסט + נקודה/שורה חדשה
    // נסיר גם תגי HTML שעשויים להיות סביב הטקסט
    let cleaned = description;
    
    // נסיר את השורה הראשונה אם היא מופיעה בתחילת התיאור
    const regex = new RegExp(`^\\s*(<[^>]*>\\s*)*${firstLineEscaped}[.\\s]*(</[^>]*>\\s*)*`, 'i');
    cleaned = cleaned.replace(regex, '').trim();
    
    // אם לא מצאנו, ננסה לחפש את הטקסט בכל מקום ולהסיר אותו
    if (cleaned === description) {
      // נסיר את הטקסט הראשון אם הוא מופיע בתוך תג p או div
      const pRegex = new RegExp(`(<p[^>]*>\\s*)${firstLineEscaped}[.\\s]*(</p>)`, 'i');
      cleaned = cleaned.replace(pRegex, '').trim();
      
      // אם עדיין לא מצאנו, נסיר את הטקסט הראשון פשוט
      if (cleaned === description) {
        const simpleRegex = new RegExp(`${firstLineEscaped}[.\\s]*`, 'i');
        cleaned = cleaned.replace(simpleRegex, '').trim();
      }
    }
    
    return cleaned || description;
  };

  // Use translated description
  const descriptionToUse = translatedDescription || product.descriptionHtml || product.description;
  const firstLine = extractFirstLine(descriptionToUse);
  const descriptionWithoutFirstLine = getDescriptionWithoutFirstLine(descriptionToUse);

  // Render CTA buttons component (reusable)
  const renderCTAs = (isMobile: boolean = false) => {
    const existingItem = items.find((i) => i.variantId === currentVariant?.id);
    const currentQuantity = existingItem?.quantity || 0;
    const isMaxStock = currentVariant?.quantityAvailable !== undefined && 
                       currentQuantity >= currentVariant.quantityAvailable;
    const tooltipText = isMaxStock ? `${t('products.outOfStock')} (${currentVariant?.quantityAvailable} ${t('products.units')})` : undefined;
    const isDisabled = !currentVariant?.availableForSale || isMaxStock || isAddingToCart;
    const button = (
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`w-full text-white ${isMobile ? 'py-3 px-6' : 'py-4 px-6'} text-sm tracking-luxury uppercase font-light transition-luxury flex items-center justify-center gap-2 ${
          isAddingToCart 
            ? 'bg-emerald-600 cursor-wait' 
            : 'bg-espresso hover:bg-espresso-light'
        } disabled:bg-sand disabled:text-stone disabled:cursor-not-allowed disabled:hover:bg-sand`}
      >
        {isAddingToCart ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {t('products.addedToCart')}
          </>
        ) : isMaxStock ? t('products.outOfStock') : t('products.addToCart')}
      </button>
    );
    const addToCartButton = tooltipText ? (
      <Tooltip content={tooltipText} position="top" disabled={isAddingToCart}>
        {button}
      </Tooltip>
    ) : button;

    return (
      <div className={`space-y-2 ${isMobile ? '' : 'md:space-y-3'}`}>
        {addToCartButton}
        <button 
          onClick={handleShareWhatsApp}
          className={`w-full border border-emerald-600 text-emerald-700 ${isMobile ? 'py-3 px-6' : 'py-4 px-6'} text-sm tracking-luxury uppercase font-light hover:bg-emerald-600 hover:text-cream transition-luxury flex items-center justify-center gap-2`}
        >
          <Share2 size={18} />
          {t('products.shareViaWhatsApp')}
        </button>
      </div>
    );
  };

  return (
    <>

      <main id="main-content" className="flex-grow max-w-[1400px] mx-auto px-4 pt-0 pb-16 md:py-20 w-full overflow-x-hidden" role="main">
        <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Left Side - Thumbnail Images (Desktop only) */}
          <div className="hidden md:block col-span-1 order-3">
            {filteredImages.length > 0 && (
              <div className="flex flex-col gap-2">
                {filteredImages.map(({ node }, index) => (
                  <button
                    key={node.url}
                    onClick={() => {
                      setSelectedImage(node.url);
                      setCurrentImageIndex(index);
                      const imageElement = imageRefs.current[node.url];
                      if (imageElement && scrollContainerRef.current) {
                        imageElement.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }
                    }}
                    className={`relative w-full aspect-[3/4] overflow-hidden border transition-luxury ${
                      selectedImage === node.url
                        ? 'border-espresso ring-2 ring-espresso ring-opacity-20 opacity-100'
                        : 'border-sand hover:border-stone opacity-50 hover:opacity-80'
                    }`}
                  >
                    <Image
                      src={node.url}
                      alt={node.altText || product.title}
                      fill
                      className="object-cover"
                      sizes="8vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center - Main Image (Scrollable on Desktop, Carousel on Mobile) */}
          <div className="col-span-12 md:col-span-7 order-1 md:order-2">
            <div className="md:sticky md:top-32">
              {/* Mobile - Swipeable Image Carousel */}
              <div className="md:hidden mb-1">
                <div
                  className="relative overflow-hidden"
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
                  onTouchEnd={() => {
                    const diff = touchStartX.current - touchEndX.current;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0 && currentImageIndex < filteredImages.length - 1) {
                        setCurrentImageIndex(prev => prev + 1);
                        setSelectedImage(filteredImages[currentImageIndex + 1]?.node.url);
                      } else if (diff < 0 && currentImageIndex > 0) {
                        setCurrentImageIndex(prev => prev - 1);
                        setSelectedImage(filteredImages[currentImageIndex - 1]?.node.url);
                      }
                    }
                  }}
                >
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(${currentImageIndex * 100}%)` }}
                  >
                    {filteredImages.map(({ node }, index) => (
                      <div
                        key={node.url}
                        className="relative bg-white w-full flex-shrink-0 cursor-pointer border border-sand/40"
                        style={{ aspectRatio: '3/4' }}
                        onClick={() => handleImageClick(index)}
                      >
                        <Image
                          src={node.url}
                          alt={`${product.title} - תמונה ${index + 1}`}
                          fill
                          className="object-contain"
                          priority={index === 0}
                          loading={index <= 1 ? 'eager' : 'lazy'}
                          sizes="100vw"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Dot indicators */}
                  {filteredImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {filteredImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrentImageIndex(i); setSelectedImage(filteredImages[i]?.node.url); }}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-espresso w-4' : 'bg-stone/40'}`}
                          aria-label={`תמונה ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Desktop - Scrollable images */}
              <div 
                ref={scrollContainerRef}
                className="hidden md:block overflow-y-auto scrollbar-hide"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                <div className="space-y-2" style={{ width: '100%' }}>
                  {filteredImages.map(({ node }, index) => (
                    <div
                      key={node.url}
                      ref={(el) => {
                        if (imageRefs.current[node.url] && imageRefs.current[node.url] !== el) {
                          delete imageRefs.current[node.url];
                        }
                        imageRefs.current[node.url] = el;
                      }}
                      className="relative w-full bg-white overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group border border-sand/40"
                      style={{ aspectRatio: '3/4' }}
                      onClick={() => handleImageClick(index)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="w-6 h-6 border-2 border-sand-dark border-t-espresso rounded-full animate-spin" />
                      </div>
                      <Image
                        src={node.url}
                        alt={node.altText || product.title}
                        fill
                        className="object-contain z-[1]"
                        priority={selectedImage === node.url}
                        sizes="60vw"
                      />
                      <div className="absolute top-4 left-4 bg-espresso/40 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[2]">
                        <Maximize2 size={20} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="col-span-12 md:col-span-4 order-2 md:order-1">
            <div className="md:sticky md:top-32">
              {/* Product Info - shared mobile & desktop */}
              <div className="text-right space-y-5 px-4 md:px-0 pt-4 md:pt-0">
                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-light font-display leading-tight text-espresso">
                    {product.title}
                  </h1>
                  {firstLine && (
                    <p className="text-xs md:text-sm font-light text-stone tracking-luxury mt-1 md:mt-2">
                      {firstLine}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <p className="text-xl md:text-2xl lg:text-3xl font-light text-espresso">
                    ₪{price}
                  </p>
                  <p className="text-xs font-light text-stone mt-1">{t('products.includingVAT')}</p>
                </div>

                {/* Color Selection */}
                {hasColors && (
                  <div>
                    <label className="block text-xs md:text-sm font-light mb-2 md:mb-3 tracking-luxury uppercase text-stone">
                      {t('products.color')}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map((color) => {
                        const isSelected = currentColor === color;
                        const variantsForColor = colorMap.get(color) || [];
                        const isAvailable = variantsForColor.some(v => v.availableForSale);
                        const colorHex = getColorHex(color);

                        return (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-luxury ${
                              isSelected
                                ? 'border-espresso ring-2 ring-espresso ring-opacity-30'
                                : isAvailable
                                ? 'border-sand-dark hover:border-espresso'
                                : 'border-sand opacity-60'
                            }`}
                            style={{ backgroundColor: colorHex }}
                            title={isAvailable ? color : `${color} - ${t('products.outOfStock')}`}
                            aria-label={isAvailable ? color : `${color} - ${t('products.outOfStock')}`}
                          >
                            {!isAvailable && (
                              <X
                                size={16}
                                className="absolute inset-0 m-auto text-espresso stroke-[3]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variants (if no colors) */}
                {product.variants.edges.length > 1 && !hasColors && (
                  <div>
                    <label className="block text-xs md:text-sm font-light mb-2 md:mb-3 tracking-luxury uppercase text-stone">
                      בחר גרסה
                    </label>
                    <select
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      className="w-full p-3 border border-sand bg-cream font-light text-sm focus:border-espresso focus:outline-none transition-luxury"
                    >
                      {product.variants.edges.map(({ node }) => (
                        <option key={node.id} value={node.id}>
                          {node.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-3" data-cta-section>
                  {renderCTAs(false)}
                </div>

                {/* Stock Status */}
                {currentVariant && (
                  <div className="pt-2">
                    {currentVariant.availableForSale ? (
                      <p className="text-sm font-light text-stone-dark">
                        {t('products.inStock')}
                        {currentVariant.quantityAvailable > 0 && (
                          <span className="text-stone"> • {currentVariant.quantityAvailable} {t('products.units')}</span>
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-light text-stone">{t('products.outOfStock')}</p>
                        <button className="text-xs font-light underline text-stone hover:text-espresso transition-colors">
                          {t('products.notifyWhenBack')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Details */}
                <div className="pt-8 space-y-6 border-t border-sand">
                  {descriptionWithoutFirstLine && (
                    <div
                      className="product-description text-sm font-light text-stone-dark leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: descriptionWithoutFirstLine }}
                    />
                  )}

                  <div>
                    <h3 className="text-sm font-light tracking-luxury uppercase mb-3 pb-3 border-b border-sand">{t('products.shippingAndReturns')}</h3>
                    <p className="text-sm font-light text-stone-dark mb-2">
                      {t('products.freeShippingOver')}
                    </p>
                    <div className="flex gap-4 text-xs">
                      <Link href="/shipping" className="underline text-stone hover:text-espresso">
                        {t('products.shipping')}
                      </Link>
                      <Link href="/returns" className="underline text-stone hover:text-espresso">
                        {t('products.returns')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 overflow-hidden">
            <div className="border-t border-sand pt-10 md:pt-14 mb-8 md:mb-10 px-4">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <h2 className="font-display text-xl md:text-2xl font-light text-espresso">
                  {t('products.related')}
                </h2>
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (relatedScrollRef.current) {
                        const cardWidth = relatedScrollRef.current.querySelector('.related-card')?.clientWidth || 300;
                        relatedScrollRef.current.scrollBy({ left: -(cardWidth + 16), behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 border border-sand rounded-full flex items-center justify-center text-stone hover:text-espresso hover:border-espresso transition-all duration-300"
                    aria-label="Previous products"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (relatedScrollRef.current) {
                        const cardWidth = relatedScrollRef.current.querySelector('.related-card')?.clientWidth || 300;
                        relatedScrollRef.current.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 border border-sand rounded-full flex items-center justify-center text-stone hover:text-espresso hover:border-espresso transition-all duration-300"
                    aria-label="Next products"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative px-4 md:px-8 max-w-[1400px] mx-auto pb-8">
              <div
                ref={relatedScrollRef}
                className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {relatedProducts.slice(0, 8).map((relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct.id}
                    relatedProduct={relatedProduct}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      {/* Floating Add to Cart - Mobile only */}
      {showFloatingCart && currentVariant?.availableForSale && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-cream border-t border-sand p-4 z-50 shadow-lg">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-lg font-light text-espresso">₪{price}</p>
              <p className="text-xs font-light text-stone">{product.title}</p>
            </div>
            {(() => {
              const existingItem = items.find((i) => i.variantId === currentVariant?.id);
              const currentQuantity = existingItem?.quantity || 0;
              const isMaxStock = currentVariant?.quantityAvailable !== undefined && 
                                 currentQuantity >= currentVariant.quantityAvailable;
              const tooltipText = isMaxStock ? `${t('products.outOfStock')} (${currentVariant?.quantityAvailable} ${t('products.units')})` : undefined;
              const isDisabled = !currentVariant?.availableForSale || isMaxStock || isAddingToCart;
              const button = (
                <button
                  onClick={handleAddToCart}
                  disabled={isDisabled}
                  className={`text-white py-3 px-8 text-sm tracking-luxury uppercase font-light transition-luxury flex-shrink-0 flex items-center justify-center gap-2 ${
                    isAddingToCart 
                      ? 'bg-emerald-600 cursor-wait' 
                      : 'bg-espresso hover:bg-espresso-light'
                  } disabled:bg-sand disabled:text-stone disabled:cursor-not-allowed disabled:hover:bg-sand`}
                >
                  {isAddingToCart ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      נוסף
                    </>
                  ) : isMaxStock ? 'אזל המלאי' : 'הוסף לעגלה'}
                </button>
              );
              return tooltipText ? (
                <Tooltip content={tooltipText} position="top" disabled={isAddingToCart}>
                  {button}
                </Tooltip>
              ) : button;
            })()}
          </div>
        </div>
      )}
      
      <Toast show={showToast} message="נוסף לעגלה" showViewCart={true} />
      <Toast show={showStockToast} message={stockMessage} showViewCart={false} type="warning" />
      
      {/* Image Zoom Modal */}
      {showZoomModal && (
        <ImageZoomModal
          images={filteredImages.map(({ node }) => ({
            url: node.url,
            altText: node.altText,
          }))}
          initialIndex={zoomImageIndex}
          onClose={() => setShowZoomModal(false)}
        />
      )}
    </>
  );
}

