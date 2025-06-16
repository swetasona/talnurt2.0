import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';

export default function CandidateStatusPage() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    
    // Redirect to the candidate page
    router.replace(`/recruiter/employer/candidates/${id}`);
  }, [router, id, router.isReady]);

  return (
    <>
      <Head>
        <title>Redirecting...</title>
      </Head>
      <div className="flex justify-center items-center h-screen">
        <p>Redirecting to candidate page...</p>
      </div>
    </>
  );
} 