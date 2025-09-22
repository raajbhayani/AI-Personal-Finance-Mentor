import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="AI Personal Finance Mentor - Your intelligent financial advisor" />
        <meta name="keywords" content="finance, AI, personal finance, budgeting, investments" />
        <meta name="author" content="AI Personal Finance Mentor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}