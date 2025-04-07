const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
    if (IS_DEV) {
      return 'com.jhk.linda.dev';
    }
  
    if (IS_PREVIEW) {
      return 'com.jhk.linda.preview';
    }
  
    return 'com.jhk.linda';
  };
  
  const getAppName = () => {
    if (IS_DEV) {
      return 'Linda (Dev)';
    }
  
    if (IS_PREVIEW) {
      return 'Linda (Preview)';
    }
  
    return 'Linda: Find your friends';
  };
  

export default ({ config }) => ({
    ...config,
  });
  