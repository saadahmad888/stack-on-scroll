import React from 'react';
import './card.css';

interface CardProps {
  children: React.ReactNode; // This allows the Card to accept children
  index: number; // Prop to accept the index
}

const Card: React.FC<CardProps> = ({ children, index }) => {
  // Calculate the top offset based on the index
  const topOffset = `calc(25px * ${index})`; // Adjust the multiplier to control spacing

  return (
    <div className="cardContainer" style={{top: topOffset }}>
      {children} {/* Render the children inside the card */}
    </div>
  );
};

export default Card;
