'use client';

import React from 'react';

interface ProductDescriptionProps {
  description: string;
  productName: string;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ description, productName }) => {
  if (!description || description === '<p><br></p>') return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-bold tracking-[0.15em] uppercase text-black dark:text-white mb-8">
        About {productName}
      </h2>
      <div
        className="rich-text text-black dark:text-gray-200 max-w-4xl leading-relaxed text-base md:text-lg overflow-hidden break-words"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </section>
  );
};

export default ProductDescription;
