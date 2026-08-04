import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCms } from '../../context/CmsContext';

export const FaqAccordion: React.FC = () => {
  const { cms } = useCms();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs = cms.faqs && cms.faqs.length > 0 ? cms.faqs : [];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-6 sm:py-8 bg-[#FFF8F4] border-t border-[#c4c8bb]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#2C4219]" />
            <span>{cms.faqBadge}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#2C4219]">
            {cms.faqTitle}
          </h2>
          <p className="text-[11px] text-[#44483e] font-medium mt-1">
            {cms.faqSubtitle}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#c4c8bb]/30 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full py-2.5 px-3.5 text-left flex items-center justify-between gap-3 font-semibold text-xs sm:text-sm text-[#172C05] hover:bg-[#FFF8F4] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#2C4219]/10 text-[#2C4219] text-[10px] font-bold flex items-center justify-center shrink-0">
                      0{index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#2C4219] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3 pt-0.5 text-xs text-[#44483e] leading-relaxed border-t border-[#c4c8bb]/15 bg-[#FFF8F4]/50 animate-fadeIn">
                    <p className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/20 font-normal">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
