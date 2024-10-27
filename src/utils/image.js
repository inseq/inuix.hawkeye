export class ImageUtils {
  static getBase64FromImage(image) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to convert image to Base64:', error);
      return null;
    }
  }

  static async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static calculateInitialScale(imageWidth, viewportWidth) {
    const ratio = imageWidth / viewportWidth;
    if (ratio < 2) return 1.0;
    return Number((1 / Math.floor(ratio)).toFixed(2));
  }

  static createObjectURL(file) {
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Failed to create object URL:', error);
      return null;
    }
  }

  static revokeObjectURL(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}