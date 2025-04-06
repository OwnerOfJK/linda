module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

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
