module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
      ['@babel/preset-env', {targets: {node: 'current'}}],
      ['@babel/preset-react', {runtime: 'automatic'}],
      '@babel/preset-typescript',
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            components: './src/components',
            buttons: './src/components/buttons',
          },
        },
      ],
    ],
  };
};
