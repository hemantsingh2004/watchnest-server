// Import and register ts-node to handle TypeScript compilation
import 'ts-node/register';
import { register } from 'ts-node';

// Ensure ts-node is set up for ESM support
register({
  compilerOptions: {
    module: 'ESNext',  // Set to ESNext for ESM
    target: 'ESNext',  // Ensure compatibility with ESNext
    esModuleInterop: true,  // Enable interoperability with ES Modules
  },
});

// Now, import and run the application (app.ts)
import('./src/app.ts');
