import '@testing-library/jest-dom';

const originalConsoleError = console.error;
console.error = (...args) => {
  if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
          args[0].includes('not wrapped in act'))
  ) return;
  originalConsoleError(...args);
};