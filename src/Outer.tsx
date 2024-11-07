import React, { useRef, useEffect, ReactNode } from 'react';

interface AppProps {
  children: ReactNode;
}

const Outer: React.FC<AppProps> = ({ children }) => {

  return (
    <main>
      {children}
    </main>
  );
};

export default Outer;
