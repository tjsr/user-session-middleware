import tjsrEslintConfig from '@tjsr/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    extends: [...tjsrEslintConfig],
    rules: {
      'max-len': ['warn', { code: 120 }],
      '@stylistic/js/comma-dangle': 'off',
    },
    files: ['**/*.ts'],
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.test.ts', '**/*.spec.test.ts', "**'*.spec.ts"],
    rules: {
      'max-len': 'off',
    },
  }
);
