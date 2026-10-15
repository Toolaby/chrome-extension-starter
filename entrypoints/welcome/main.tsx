import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/styles.css';
import { brand, paintBrand } from '@/lib/brand';
import { App } from './app';

paintBrand(`Welcome to ${brand.name}`);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
