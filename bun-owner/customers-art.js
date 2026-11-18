const CustomerArt = (() => {
  const urls = {};
  const rects = {"papa": [56, 8, 263, 350], "mama": [383, 14, 321, 344], "baby": [820, 167, 162, 193], "girl": [1135, 44, 249, 315], "friend": [80, 437, 215, 276], "rabbit": [433, 372, 223, 342], "cat": [778, 400, 250, 314], "bear": [1140, 400, 249, 314], "panda": [63, 754, 251, 309], "fox": [402, 742, 277, 321], "squirrel": [771, 754, 305, 310]};
  const image = new Image();
  const ready = new Promise(resolve => {
    image.addEventListener('load', () => {
      for (const [kind, rect] of Object.entries(rects)) {
        const canvas = document.createElement('canvas');
        canvas.width = rect[2]; canvas.height = rect[3];
        canvas.getContext('2d').drawImage(image, ...rect, 0, 0, rect[2], rect[3]);
        urls[kind] = canvas.toDataURL('image/png');
      }
      resolve();
    });
    image.addEventListener('error', () => resolve());
  });
  image.src = new URL('customers.webp', document.currentScript.src).href;

  return { urls, ready };
})();
