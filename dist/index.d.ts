import React, { ReactNode } from 'react';

interface CardProps {
    children: React.ReactNode;
    index: number;
}
declare const Card: React.FC<CardProps>;

interface AppProps {
    children: ReactNode;
}
declare const Outer: React.FC<AppProps>;

export { Card, Outer };
