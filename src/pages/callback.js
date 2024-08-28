// import React, { useEffect, useState } from 'react';

// const CallbackPage = () => {
//   const [flowId, setFlowId] = useState(null);
//   const [status, setStatus] = useState('Initializing...');

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const flowIdParam = params.get('flowId');
//     setFlowId(flowIdParam);

//     if (flowIdParam) {
//       fetch(`/api/callback?flowId=${flowIdParam}`)
//         .then(response => response.json())
//         .then(data => {
//           if (data.status === 'success') {
//             setStatus('Integration Activated');
//             setTimeout(() => window.close(), 2000);
//           } else {
//             setStatus('Failed to Activate Integration');
//           }
//         })
//         .catch(error => {
//           console.error('Error processing callback:', error);
//           setStatus('Failed to Activate Integration');
//         });
//     }
//   }, []);

//   return (
//     <div>
//       <h1>{status}</h1>
//     </div>
//   );
// };

// export default CallbackPage;

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const { flowId } = router.query;

    if (flowId) {
      // Send the flowId to your API
      fetch('/api/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flowId }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Flow processed:', data);
          // Close the window after processing
          window.close();
        })
        .catch(error => {
          console.error('Error processing flow:', error);
          // Optionally display an error message before closing
          window.close();
        });
    }
  }, [router.query]);

  return <div>Processing callback...</div>;
}
