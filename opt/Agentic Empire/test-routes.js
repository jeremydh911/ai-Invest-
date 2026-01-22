#!/usr/bin/env node

// Direct test of routes module
try {
  const routes = require('./routes/file-routes');
  console.log('✅ Routes loaded');
  console.log('Routes type:', typeof routes);
  console.log('Has post:', typeof routes.post);
  console.log('Has get:', typeof routes.get);
  console.log('Has delete:', typeof routes.delete);
  
  // Check stack (Express router internals)
  if (routes.stack) {
    console.log('Stack length:', routes.stack.length);
    console.log('Routes:');
    routes.stack.forEach((r, i) => {
      if (r.route) {
        console.log(`  ${i}: ${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
      } else if (r.name === 'router') {
        console.log(`  ${i}: nested router`);
      }
    });
  }
  
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error(e.stack);
}
