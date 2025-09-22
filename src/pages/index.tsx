import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import DashboardOverview from '@/components/DashboardOverview';

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Personal Finance Mentor</title>
        <meta name="description" content="Your intelligent personal finance advisor - Developed by Raj" />
      </Head>
      <Layout>
        <DashboardOverview />
      </Layout>
    </>
  );
}