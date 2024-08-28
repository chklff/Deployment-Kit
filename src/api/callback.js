// src/api/callback.js
// import prisma from '../utils/db.js';
// import { processFlow } from '../utils/makeApi.js';

// export default async function callbackHandler(req, res) {
//   const { flowId } = req.query;

//   try {
//     const flow = await prisma.flow.findUnique({ where: { flowId } });

//     if (!flow) {
//       return res.status(404).json({ error: 'Flow not found' });
//     }

//     const flowData = await processFlow(flow.flowId);

//     await prisma.flow.update({
//       where: { id: flow.id },
//       data: { status: 'complete' },
//     });

//     res.status(200).json({ status: 'Flow completed' });
//   } catch (error) {
//     console.error('Error in callbackHandler:', error);
//     res.status(500).json({ error: 'An error occurred while processing the flow' });
//   }
// }


import prisma from '../utils/db.js';
import { processFlow } from '../utils/makeApi.js';

export default async function callbackHandler(req, res) {
  if (req.method === 'POST') {
    const { flowId } = req.body;

    try {
      const flow = await prisma.flow.findUnique({ where: { flowId } });

      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      const flowData = await processFlow(flow.flowId);

      await prisma.flow.update({
        where: { id: flow.id },
        data: { status: 'complete' },
      });

      res.status(200).json({ status: 'Flow completed' });
    } catch (error) {
      console.error('Error in callbackHandler:', error);
      res.status(500).json({ error: 'An error occurred while processing the flow' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}