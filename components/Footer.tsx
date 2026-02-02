'use client';

import Link from 'next/link';
import { Instagram, Facebook, MessageCircle, Mail, Phone, Printer } from 'lucide-react';
import { ViewerCount } from './ViewerCount';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#fdfcfb] border-t border-gray-200 mt-8 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 md:gap-16 text-center">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl md:text-2xl font-light luxury-font mb-2 md:mb-4 text-[#1a1a1a]">
              {t('footer.brand')}
            </h3>
            <p className="text-xs md:text-sm font-light text-gray-600 leading-relaxed mb-3 md:mb-6">
              {t('footer.brandDesc')}
            </p>
            <div className="text-xs font-light text-[#c9a962] tracking-luxury mb-4">
              Renato Angi Venezia • Carlino Group
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <a 
                href="https://www.instagram.com/klumit_bags/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#E1306C] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/klomit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1877F2] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://wa.me/message/XORXP7SG55MHJ1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            </div>
            <div className="flex justify-center">
              <ViewerCount />
            </div>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              {t('footer.navigation')}
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <span className="text-sm font-light text-gray-600">
                  {t('footer.products')}
                </span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/products?tab=bags" className="text-xs font-light text-[#C19A6B] hover:text-[#a17d4f] transition-colors">
                      {t('header.bags')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?tab=belts" className="text-xs font-light text-[#C19A6B] hover:text-[#a17d4f] transition-colors">
                      {t('header.belts')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?tab=wallets" className="text-xs font-light text-[#C19A6B] hover:text-[#a17d4f] transition-colors">
                      {t('header.wallets')}
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="/cart" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.cart')}
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.myAccount')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              {t('footer.customerService')}
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/shipping" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.shipping')}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.returns')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  {t('footer.accessibility')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              {t('footer.contact')}
            </h4>
            
            {/* Mobile: Single line with icons and dividers */}
            <div className="md:hidden flex items-center justify-center gap-2 text-[10px] font-light text-gray-600 overflow-x-auto pb-2">
              <a href="mailto:klumitltd@gmail.com" className="flex items-center gap-1 hover:text-[#1a1a1a] transition-colors whitespace-nowrap">
                <Mail size={12} className="shrink-0" />
                <span className="hidden sm:inline">klumitltd@gmail.com</span>
                <span className="sm:hidden">Email</span>
              </a>
              <span className="text-gray-300">|</span>
              <a href="tel:+97235178502" className="flex items-center gap-1 hover:text-[#1a1a1a] transition-colors whitespace-nowrap">
                <Phone size={12} className="shrink-0" />
                <span>03-5178502</span>
              </a>
              <span className="text-gray-300">|</span>
              <a href="tel:+972542600177" className="flex items-center gap-1 hover:text-[#1a1a1a] transition-colors whitespace-nowrap">
                <Phone size={12} className="shrink-0" />
                <span>054-2600177</span>
              </a>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-gray-500 whitespace-nowrap">
                <Printer size={12} className="shrink-0" />
                <span>03-5106781</span>
              </span>
            </div>
            
            {/* Desktop: List view */}
            <ul className="hidden md:block space-y-2 md:space-y-3 text-xs md:text-sm font-light text-gray-600">
              <li>
                <a href="mailto:klumitltd@gmail.com" className="inline-flex items-center gap-2 hover:text-[#1a1a1a] transition-colors">
                  <Mail size={14} />
                  klumitltd@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+97235178502" className="inline-flex items-center gap-2 hover:text-[#1a1a1a] transition-colors">
                  <Phone size={14} />
                  03-5178502
                </a>
              </li>
              <li>
                <a href="tel:+972542600177" className="inline-flex items-center gap-2 hover:text-[#1a1a1a] transition-colors">
                  <Phone size={14} />
                  054-2600177
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-gray-500">
                <Printer size={14} />
                {t('footer.fax')} 03-5106781
              </li>
            </ul>
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
              <p className="text-xs font-light text-gray-500 leading-relaxed mb-2 md:mb-3">
                <span className="font-medium text-gray-600">{t('footer.address')}</span><br />
                {t('footer.addressDetails')}
              </p>
              <p className="text-xs font-light text-gray-500 leading-relaxed hidden md:block">
                {t('footer.hours')}<br />
                {t('footer.hoursDetails')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-6 md:mt-12 pt-4 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
            <p className="text-xs font-light text-gray-500 text-center md:text-right">
              &copy; {new Date().getFullYear()} {t('footer.copyright')} <span className="luxury-font text-[#1a1a1a]">{t('footer.brand')}</span>
            </p>
            <div className="flex gap-4 md:gap-6 text-xs font-light text-gray-500">
              <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">
                {t('footer.terms')}
              </Link>
              <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link href="/accessibility" className="hover:text-[#1a1a1a] transition-colors">
                {t('footer.accessibility')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

