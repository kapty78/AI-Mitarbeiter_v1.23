// Dies ist ein leeres Modul, das als Ersatz für onnxruntime-node dient
module.exports = {
  // Ein Dummy-Backend, das keine Operationen durchführt
  InferenceSession: class MockInferenceSession {
    constructor() {
      console.log('Mock InferenceSession erstellt');
    }
    
    async run() {
      console.log('Mock run wird aufgerufen');
      return { 
        output: new Float32Array(0) 
      };
    }
  },
  // Leerer Export für andere Funktionen
  env: {},
  backend: {
    initializeBackend: () => {
      console.log('Mock initializeBackend wird aufgerufen');
      return Promise.resolve();
    }
  }
}; 