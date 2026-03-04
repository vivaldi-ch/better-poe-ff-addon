const iconModules = import.meta.glob('./assets/*.png', { eager: true, query: '?url', import: 'default' });

export const availableIcons = Object.entries(iconModules).map(([path, url]) => {
  const name = path.split('/').pop()?.replace('.png', '') || '';
  return { name, url: url as string };
});
