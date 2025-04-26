import React from 'react';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-6">About Midnight Muse</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          Welcome to Midnight Muse, a space where ideas illuminate the darkness. We explore a variety of topics ranging from technology and lifestyle to health and personal growth.
        </p>
        <p>
          Our mission is to provide thoughtful, engaging, and well-researched content that sparks curiosity and encourages discussion. We believe in the power of sharing knowledge and experiences.
        </p>
        <p>
          The team behind Midnight Muse consists of passionate writers, designers, and thinkers dedicated to bringing you high-quality articles and insights.
        </p>
        <h2>Our Values</h2>
        <ul>
          <li>Curiosity: Always learning, always exploring.</li>
          <li>Quality: Striving for excellence in every piece of content.</li>
          <li>Community: Fostering a respectful and engaging environment for readers.</li>
          <li>Integrity: Providing honest and well-sourced information.</li>
        </ul>
        <p>
          Thank you for visiting. We hope you find inspiration and value during your time here.
        </p>
      </div>
    </div>
  );
}
