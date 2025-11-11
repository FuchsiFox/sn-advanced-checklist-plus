module.exports = {
  webpack: {
    configure: (config) => {
      // Variante A: komplette Warnung ignorieren, wenn sie aus filesafe.js stammt
      config.ignoreWarnings = [
        (warning) =>
          typeof warning === 'object' &&
          warning.module &&
          /filesafe\.js$/.test((warning.module.resource || '')),
      ];

      // Variante B (alternativ): source-map-loader für filesafe.js ausschließen
      // const rule = config.module.rules.find(
      //   (r) => r.enforce === 'pre' && r.use && r.use.some((u) => (u.loader || '').includes('source-map-loader'))
      // );
      // if (rule) {
      //   rule.exclude = Array.isArray(rule.exclude)
      //     ? [...rule.exclude, /filesafe\.js$/]
      //     : [/filesafe\.js$/];
      // }

      return config;
    },
  },
};
