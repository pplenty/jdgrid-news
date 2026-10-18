// ESLint flat config — `next lint`(Next 16 에서 제거) 대신 ESLint CLI 로 직접 실행.
// eslint-config-next 15 는 eslintrc 형식이라 FlatCompat 로 변환해 그대로 쓴다 (ADR-0010).

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'dist/**', 'coverage/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
];

export default eslintConfig;
