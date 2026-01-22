
let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
const messageQueue = new Map<string, { resolve: (data: any) => void, reject: (err: any) => void }>();

const generateId = () => Math.random().toString(36).substring(2, 9);

export const initDB = async () => {
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    try {
      worker = new Worker(new URL('./dbWorker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        const { id, type, payload, error } = e.data;
        
        if (type === 'PERSIST') {
          // Handle persistence independently of request/response cycle
          try {
             // payload is Uint8Array
             const arr = Array.from(payload as Uint8Array);
             localStorage.setItem('syllabus_sqlite_db', JSON.stringify(arr));
          } catch (err) {
            console.error("Failed to persist DB from worker:", err);
          }
          return;
        }

        if (id && messageQueue.has(id)) {
          const { resolve: reqResolve, reject: reqReject } = messageQueue.get(id)!;
          messageQueue.delete(id);
          if (type === 'ERROR') reqReject(new Error(error));
          else reqResolve(payload);
        }
      };

      // Load data from localStorage
      const savedDb = localStorage.getItem('syllabus_sqlite_db');
      let data = null;
      if (savedDb) {
        try {
          data = new Uint8Array(JSON.parse(savedDb));
        } catch (e) {
          console.error("Corrupt local DB, resetting.");
        }
      }

      // Send INIT
      const id = generateId();
      messageQueue.set(id, { resolve: () => resolve(), reject });
      worker.postMessage({ id, type: 'INIT', payload: data });

    } catch (e) {
      reject(e);
      initPromise = null;
    }
  });

  return initPromise;
};

export const logCalculation = async (module: string, query: string, result: any) => {
  await initDB();
  if (!worker) return;
  
  return new Promise((resolve, reject) => {
    const id = generateId();
    messageQueue.set(id, { resolve, reject });
    worker!.postMessage({
      id,
      type: 'LOG',
      payload: { module, query, result: JSON.stringify(result) }
    });
  });
};

export const getLogs = async (moduleFilter?: string) => {
  await initDB();
  if (!worker) return [];

  return new Promise((resolve, reject) => {
    const id = generateId();
    messageQueue.set(id, { resolve, reject });
    worker!.postMessage({
      id,
      type: 'GET',
      payload: { module: moduleFilter }
    });
  });
};
