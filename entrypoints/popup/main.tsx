import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/styles.css';
import { paintBrand } from '@/lib/brand';
import { App } from './app';

paintBrand();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
