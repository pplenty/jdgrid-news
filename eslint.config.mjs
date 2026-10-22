// ESLint flat config — `next lint` 는 Next 16 에서 제거, ESLint CLI 로 직접 실행 (ADR-0010).
// eslint-config-next 16 부터 flat config 를 직접 내보내므로 FlatCompat 없이 그대로 쓴다.

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'dist/**', 'coverage/**', 'next-env.d.ts']),
]);
