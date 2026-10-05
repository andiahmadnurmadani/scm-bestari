import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export const FaqAccordion: React.FC = () => {
  const { cms } = useCms();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs = cms.faqs && cms.faqs.length > 0 ? cms.faqs : [];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-[#FFF8F4] border-t border-[#c4c8bb]/25">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-xs sm:text-sm font-bold">
            <HelpCircle className="w-4 h-4 text-[#2C4219]" />
            <span>{cms.faqBadge}</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C4219] leading-tight tracking-tight">
            {cms.faqTitle}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#44483e] leading-relaxed">{cms.faqSubtitle}</p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border transition-all ${
                  isOpen ? 'border-[#2C4219]/30 shadow-md' : 'border-[#c4c8bb]/30 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  className="w-full py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#172C05] hover:bg-[#FFF8F4] transition-colors cursor-pointer rounded-2xl"
                >
                  <span className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-full bg-[#2C4219]/10 text-[#2C4219] text-sm font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#2C4219] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 -mt-1">
                    <p className="text-sm sm:text-base text-[#44483e] leading-relaxed pl-11.5">
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
